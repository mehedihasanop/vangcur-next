'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { DEFAULT_PRODS } from '@/lib/productData';
import {
  getCurrentUser, saveCurrentUser, checkOAuthCallback, mergeGuestOrdersToUser, signInWithGoogle,
} from '@/lib/authData';
import { showToast } from '@/lib/toast';
import LoginModal from '@/app/components/auth/LoginModal';
import PreConfirmLoginModal from '@/app/components/checkout/PreConfirmLoginModal';
import PolicyModal from '@/app/components/checkout/PolicyModal';
import {
  DISTRICTS,
  DEFAULT_SHIP_CFG,
  getShipOptions,
  shipPrice,
  validatePhone,
  validateAddress,
  validateEmail,
  validateTxnId,
  fetchBkashNumber,
  fetchShipConfig,
} from '@/lib/checkoutData';

// Converted from 32-javascript-all.js — section 23 (order-overlay), legacy lines ~4470-5090,
// 6737-6800 (terms checkbox), 6964-7020 (steps/QR/copy).
//
// ⚠️ স্থাপত্য সিদ্ধান্ত: legacy সাইটে এটা একটা modal/overlay ছিল (JS দিয়ে show/hide)।
// এখানে ইচ্ছাকৃতভাবে আলাদা route হিসেবে বানানো হয়েছে — /checkout।
//
// ⚠️ পরিধির বাইরে (আপাতত): legacy confirmOrder() সফল হলে সরাসরি "waiting page"
// (section 25, এখনো তৈরি হয়নি) দেখাত realtime approve/reject status সহ। যেহেতু সেটা
// এখনো নেই, অর্ডার সফল হলে এই পেজেই একটা সহজ "pending" কার্ড দেখানো হচ্ছে (অস্থায়ী)।
// section 25 বানানোর পর এটা প্রতিস্থাপন করতে হবে পূর্ণ realtime waiting-experience দিয়ে।
//
// 24-pre-confirm-login.html (guest-only pre-confirm login prompt) — integrated here:
// - handleConfirm() split into handleConfirmClick() (terms-check + guest-check, was
//   legacy's preConfirmCheck()) and submitOrderNow() (the actual insert, was confirmOrder()).
//   A logged-in user skips PreConfirmLoginModal entirely and goes straight to submitOrderNow().
// - preConfirmGoLogin()/preConfirmGoRegister() -> open <LoginModal orderMode initialMode=.../>,
//   whose onAuthSuccess prop is wired to submitOrderNow() (mirrors _pendingOrderAfterLogin).
// - preConfirmGoGoogle() -> saves vc_pending_order_data + vc_post_login_action, then
//   signInWithGoogle(supabase, '/checkout') so Google returns here (not the homepage).
//   Note: the existing vc_form_draft/vc_ship sessionStorage restore-on-mount above already
//   repopulates every field on that return trip; vc_pending_order_data is kept anyway as
//   the same explicit belt-and-suspenders transfer legacy used, in case sessionStorage
//   doesn't survive a given browser's OAuth redirect.
// - The mount effect below (resumePendingOrder) detects a post-Google-redirect return via
//   vc_post_login_action==='confirmOrder' and auto-resumes submitOrderNow() once signed in.

export default function CheckoutPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [cartWarnVisible, setCartWarnVisible] = useState(false);

  // Step 1 fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dist, setDist] = useState('');
  const [addr, setAddr] = useState('');
  const [email, setEmail] = useState('');
  const [selectedShip, setSelectedShip] = useState('');
  const [errors, setErrors] = useState({});

  // Step 2 fields
  const [txn, setTxn] = useState('');
  const [last4, setLast4] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [bkashNum, setBkashNum] = useState('01816365504');
  const [copyLabel, setCopyLabel] = useState('Copy');

  // Step 3
  const [termsChecked, setTermsChecked] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [shake, setShake] = useState(false);
  const [shipCfg, setShipCfg] = useState(DEFAULT_SHIP_CFG);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null); // { num, isGuest }
  const confirmLockRef = useRef(false);

  // 24-pre-confirm-login.html state
  const [showPreConfirm, setShowPreConfirm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginInitialMode, setLoginInitialMode] = useState('login');
  const submitOrderNowRef = useRef(null);

  // ── Mount: load cart, restore draft, fetch bkash/shipping config, lock scroll ──
  useEffect(() => {
    lockBody();
    try {
      const cart = JSON.parse(localStorage.getItem('vc_cart') || '[]');
      setCartItems(Array.isArray(cart) ? cart : []);
      setCartWarnVisible(!Array.isArray(cart) || cart.length === 0);
    } catch (e) {
      setCartWarnVisible(true);
    }
    try {
      const draft = JSON.parse(sessionStorage.getItem('vc_form_draft') || 'null');
      if (draft) {
        if (draft.name) setName(draft.name);
        if (draft.phone) setPhone(draft.phone);
        if (draft.dist) setDist(draft.dist);
        if (draft.addr) setAddr(draft.addr);
        if (draft.email) setEmail(draft.email);
        if (draft.txn) setTxn(draft.txn);
        if (draft.l4) setLast4(draft.l4);
      }
      const savedShip = sessionStorage.getItem('vc_ship');
      if (savedShip) setSelectedShip(savedShip);
    } catch (e) {
      // ignore
    }
    fetchBkashNumber(supabase).then(setBkashNum);
    fetchShipConfig(supabase).then(setShipCfg);
    return () => unlockBody();
  }, []);

  // Legacy: preConfirmGoGoogle()'s "return trip" half — detects arriving back at
  // /checkout after a Google redirect that was headed toward an order confirmation,
  // and resumes it automatically instead of leaving the person to click again.
  useEffect(() => {
    (async () => {
      let action = null;
      try { action = localStorage.getItem('vc_post_login_action'); } catch (e) {}
      if (action !== 'confirmOrder') return;

      const safeUser = await checkOAuthCallback(supabase);
      const user = safeUser || getCurrentUser();
      if (!user) return; // redirect landed here for some other reason — leave the flag alone

      if (safeUser) {
        saveCurrentUser(safeUser);
        await mergeGuestOrdersToUser(supabase, safeUser.email, safeUser.id);
      }
      try { localStorage.removeItem('vc_post_login_action'); } catch (e) {}

      let pending = null;
      try {
        const raw = localStorage.getItem('vc_pending_order_data');
        localStorage.removeItem('vc_pending_order_data');
        pending = raw ? JSON.parse(raw) : null;
      } catch (e) {}
      if (pending) {
        if (pending.name) setName(pending.name);
        if (pending.phone) setPhone(pending.phone);
        if (pending.dist) setDist(pending.dist);
        if (pending.addr) setAddr(pending.addr);
        if (pending.email !== undefined) setEmail(pending.email);
        if (pending.txn) setTxn(pending.txn);
        if (pending.l4) setLast4(pending.l4);
        if (pending.ship) setSelectedShip(pending.ship);
      }

      showToast('✅ লগইন সফল — অর্ডার সম্পন্ন হচ্ছে...');
      // submitOrderNow depends on several pieces of state set just above; a short delay
      // lets those re-renders settle before it reads them via the ref (avoids a stale closure).
      setTimeout(() => submitOrderNowRef.current && submitOrderNowRef.current(), 350);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist form draft on change (saveFormDraft) ──
  useEffect(() => {
    try {
      sessionStorage.setItem(
        'vc_form_draft',
        JSON.stringify({ name, phone, dist, addr, email, txn, l4: last4 })
      );
    } catch (e) {
      // ignore
    }
  }, [name, phone, dist, addr, email, txn, last4]);

  const shipOptions = getShipOptions(dist);

  const selectShip = (key) => {
    setSelectedShip(key);
    try {
      sessionStorage.setItem('vc_ship', key);
    } catch (e) {}
  };

  // ── goS2() validation ──
  const goToStep2 = () => {
    if (cartItems.length === 0) {
      setCartWarnVisible(true);
      return;
    }
    const nextErrors = {};
    if (!name.trim()) nextErrors.eN = 'নাম দিন';
    if (!validatePhone(phone.trim())) nextErrors.eP = 'দয়া করে সঠিক মোবাইল নম্বর দিন';
    if (!dist) nextErrors.eD = 'জেলা সিলেক্ট করুন';
    if (!validateAddress(addr.trim())) nextErrors.eA = 'দয়া করে বিস্তারিত ঠিকানা দিন (যেমন: রোড বা বাসা নম্বর)';
    if (email.trim() && !validateEmail(email.trim())) nextErrors.eEmail = 'সঠিক ইমেইল লিখুন (যেমন: name@gmail.com)';
    if (!selectedShip) nextErrors.eShip = 'শিপিং অপশন সিলেক্ট করুন';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setStep(2);
    }
  };

  // ── goS3() validation ──
  const goToStep3 = () => {
    const txnUpper = txn.trim().toUpperCase();
    const l4 = last4.trim();
    const nextErrors = {};
    if (!txnUpper && !l4) {
      nextErrors.eTxn = 'ট্রানজেকশন আইডি অবশ্যই ১০ ক্যারেক্টার হতে হবে';
      nextErrors.eL4 = 'Transaction ID অথবা শেষ ৪ ডিজিট দিন';
      setErrors((e) => ({ ...e, ...nextErrors }));
      return;
    }
    if (txnUpper) {
      if (!validateTxnId(txnUpper)) {
        setErrors((e) => ({ ...e, eTxn: 'দয়া করে সঠিক ১০ সংখ্যার বিকাশ ট্রানজেকশন আইডি দিন' }));
        return;
      }
      setTxn(txnUpper);
    }
    if (l4 && l4.length !== 4) {
      setErrors((e) => ({ ...e, eL4: 'Transaction ID অথবা শেষ ৪ ডিজিট দিন' }));
      return;
    }
    setErrors((e) => ({ ...e, eTxn: undefined, eL4: undefined }));
    setStep(3);
  };

  const goBack = (n) => setStep(n);

  const toggleTerms = () => {
    setTermsChecked((v) => !v);
    setTermsError(false);
  };

  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  // Legacy: policyAgreeAndConfirm() — 30-policy-modal.html bottom button. Same as
  // handleConfirmClick() but skips the terms-check branch (agreeing via this button
  // IS the terms check) and closes the modal first.
  const policyAgreeAndConfirm = () => {
    setTermsChecked(true);
    setPolicyModalOpen(false);
    if (!getCurrentUser()) {
      setShowPreConfirm(true);
      return;
    }
    submitOrderNow();
  };

  const copyBkash = async () => {
    const num = bkashNum.replace(/\D/g, '');
    try {
      await navigator.clipboard.writeText(num);
    } catch (e) {
      // ignore — clipboard may be unavailable
    }
    setCopyLabel('✅ কপি হয়েছে!');
    setTimeout(() => setCopyLabel('Copy'), 2000);
  };

  // ── Summary calculations (renderStep3Summary) ──
  const sc = shipPrice(selectedShip, shipCfg);
  const sub = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total = sub + sc;
  const balance = Math.max(0, total - 200);

  // Legacy: preConfirmCheck() — terms check, then either the guest prompt or straight through
  const handleConfirmClick = () => {
    if (!termsChecked) {
      setTermsError(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (!getCurrentUser()) {
      setShowPreConfirm(true);
      return;
    }
    submitOrderNow();
  };

  // ── confirmOrder() — rate limit, spam check, counter, insert ──
  const submitOrderNow = useCallback(async () => {
    if (confirmLockRef.current) return;
    confirmLockRef.current = true;
    setSubmitting(true);

    try {
      // S-10: rate limit (best-effort — RPC আগে থেকেই Supabase-এ থাকতে হবে)
      try {
        const rl = await supabase.rpc('check_and_set_rate_limit', { p_phone: phone.trim() });
        if (rl.data === false) {
          setSubmitting(false);
          confirmLockRef.current = false;
          alert('একটু অপেক্ষা করুন, তারপর আবার চেষ্টা করুন');
          return;
        }
      } catch (e) {
        const lastOrderTime = parseInt(localStorage.getItem('vc_last_order_time') || '0', 10);
        if (Date.now() - lastOrderTime < 30000) {
          setSubmitting(false);
          confirmLockRef.current = false;
          alert('একটু অপেক্ষা করুন, তারপর আবার চেষ্টা করুন');
          return;
        }
      }

      // Order counter — atomic RPC, timestamp fallback
      let num = '#VC-' + Date.now().toString(36).toUpperCase();
      try {
        const { data: counterData, error: counterErr } = await supabase.rpc('increment_order_counter');
        if (!counterErr && counterData) num = '#VC-' + counterData;
      } catch (e) {
        // fallback already set above
      }

      // S-5/S-6: verify prices against authoritative product list (ignore tampered cart prices)
      const verifiedItems = cartItems.map((i) => {
        const prod = DEFAULT_PRODS.find((p) => p.id === i.id);
        return prod ? { ...i, price: prod.price, name: prod.name, emoji: (prod.imgs || ['📦'])[0] } : i;
      });
      const vSub = verifiedItems.reduce((s, i) => s + i.price * i.qty, 0);
      const vTotal = vSub + sc;

      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || null;

      const { data: insData, error: insErr } = await supabase
        .from('orders')
        .insert({
          order_num: num,
          created_at: new Date().toISOString(),
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_district: dist,
          customer_address: addr.trim(),
          customer_email: email.trim() || '',
          items: verifiedItems,
          shipping: selectedShip,
          shipping_cost: sc,
          subtotal: vSub,
          total: vTotal,
          payment_txn: txn || '',
          payment_last4: last4 || '',
          status: 'pending',
          ...(currentUserId ? { user_id: currentUserId } : {}),
        })
        .select('id')
        .single();

      if (insErr) {
        console.error('[Order Insert] FAILED —', insErr);
        setSubmitting(false);
        confirmLockRef.current = false;
        alert('দুঃখিত, অর্ডার সেভ করা যায়নি। আবার চেষ্টা করুন।');
        return;
      }

      // সফল — cart খালি করো, draft মুছো, guest হলে guest orders এ রাখো
      localStorage.setItem('vc_cart', '[]');
      try {
        sessionStorage.removeItem('vc_form_draft');
        sessionStorage.setItem('vc_pending', insData.id);
        sessionStorage.setItem('vc_pending_num', num);
        localStorage.setItem('vc_last_order_time', String(Date.now()));
      } catch (e) {}
      if (!currentUserId) {
        try {
          const guestOrders = JSON.parse(localStorage.getItem('vc_guest_orders') || '[]');
          guestOrders.push({ id: insData.id, orderNum: num });
          localStorage.setItem('vc_guest_orders', JSON.stringify(guestOrders));
        } catch (e) {}
      }

      setOrderResult({ num, isGuest: !currentUserId });
      setSubmitting(false);
    } catch (e) {
      console.error('Order confirm failed:', e);
      setSubmitting(false);
      confirmLockRef.current = false;
      alert('দুঃখিত, একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  }, [phone, cartItems, sc, name, dist, addr, email, selectedShip, txn, last4]);

  useEffect(() => { submitOrderNowRef.current = submitOrderNow; }, [submitOrderNow]);

  // 24-pre-confirm-login.html action handlers
  const preConfirmSkip = () => {
    setShowPreConfirm(false);
    submitOrderNow();
  };
  const preConfirmGoLogin = () => {
    setShowPreConfirm(false);
    setLoginInitialMode('login');
    setShowLoginModal(true);
  };
  const preConfirmGoRegister = () => {
    setShowPreConfirm(false);
    setLoginInitialMode('register');
    setShowLoginModal(true);
  };
  const preConfirmGoGoogle = async () => {
    const pendingData = {
      items: cartItems, ship: selectedShip, name, phone, dist, addr, email, txn, l4: last4, savedAt: Date.now(),
    };
    try {
      localStorage.setItem('vc_pending_order_data', JSON.stringify(pendingData));
      localStorage.setItem('vc_post_login_action', 'confirmOrder');
    } catch (e) {}
    setShowPreConfirm(false);
    const { error } = await signInWithGoogle(supabase, '/checkout');
    if (error) {
      showToast('❌ Google লগইন ব্যর্থ হয়েছে');
      try {
        localStorage.removeItem('vc_pending_order_data');
        localStorage.removeItem('vc_post_login_action');
      } catch (e2) {}
    }
    // On success the page redirects away — nothing else to do here.
  };

  const closeCheckout = () => router.push('/');

  // ── অর্ডার সফল হওয়ার পর — অস্থায়ী inline "pending" কার্ড (section 25 তৈরি হলে replace হবে) ──
  if (orderResult) {
    return (
      <div className="order-overlay show">
        <div className="order-box" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
          <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>আপনার অর্ডার গ্রহণ করা হয়েছে</h2>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '18px' }}>
            অর্ডার নম্বর: <strong>{orderResult.num}</strong>
            <br />
            পেমেন্ট যাচাই করে শীঘ্রই কনফার্মেশন জানানো হবে।
          </p>
          {orderResult.isGuest && (
            <p style={{ fontSize: '12.5px', color: '#888', marginBottom: '18px' }}>
              আপনি গেস্ট হিসেবে অর্ডার করেছেন — অর্ডার ট্র্যাক করতে ফোন নম্বর মনে রাখুন।
            </p>
          )}
          <button className="btn-next" onClick={closeCheckout}>
            হোমে ফিরুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="order-overlay show" id="orderOverlay">
      <div className="order-box">
        <div
          className="order-top"
          style={{ borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <h2 style={{ fontSize: '17px' }}>অর্ডার করুন</h2>
          {step === 1 && (
            <button
              id="orderCloseBtn"
              onClick={closeCheckout}
              style={{ background: 'var(--light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '6px 13px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", color: 'var(--dark)' }}
            >
              ✕ বন্ধ করুন
            </button>
          )}
        </div>

        {/* Order items mini summary — step 1 & 2 তে দেখাবে */}
        {step !== 3 && cartItems.length > 0 && (
          <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '10px 24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '7px' }}>
              YOUR ORDER
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', color: '#1A1A1A' }}>
              {cartItems.map((i) => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{i.emoji || '📦'} {i.name} × {i.qty}</span>
                  <span>৳{(i.price * i.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, borderTop: '1px solid var(--border)', marginTop: '7px', paddingTop: '7px', display: 'flex', justifyContent: 'space-between', color: '#1A1A1A' }}>
              <span>Subtotal</span>
              <span>৳{sub.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="steps-bar">
          <div className={`o-step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
            <div className="o-step-num">1</div>
            <div>তথ্য</div>
          </div>
          <div className={`o-step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
            <div className="o-step-num">2</div>
            <div>পেমেন্ট</div>
          </div>
          <div className={`o-step ${step === 3 ? 'active' : ''}`}>
            <div className="o-step-num">3</div>
            <div>নিশ্চিত</div>
          </div>
        </div>
        <div className="o-progress-wrap">
          <div className="o-progress-bar">
            <div className="o-progress-fill" style={{ width: `${{ 1: 33, 2: 66, 3: 100 }[step]}%` }} />
          </div>
          <div className="o-progress-hint">
            {step === 3 ? '✅ প্রায় সম্পন্ন!' : step === 2 ? 'আর মাত্র ১ ধাপ!' : 'আর মাত্র ২ ধাপ!'}
          </div>
        </div>

        {/* ── Step 1 — গ্রাহকের তথ্য ── */}
        {step === 1 && (
          <div className="order-body">
            {cartWarnVisible && (
              <div className="cart-warn show">
                ⚠️ আপনার কার্ট খালি। অনুগ্রহ করে প্রথমে একটি প্রোডাক্ট কার্টে যোগ করুন অথবা প্রোডাক্টের পেজ থেকে
                &quot;এখনই অর্ডার করুন&quot; বাটনে ক্লিক করুন।
              </div>
            )}
            <div className="fg2">
              <label>পূর্ণ নাম *</label>
              <input className="fctrl" value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার পূর্ণ নাম" />
              {errors.eN && <div className="ferr show">{errors.eN}</div>}
            </div>
            <div className="fg2">
              <label>ফোন নম্বর * <span className="f-opt">(বাংলাদেশি নম্বর)</span></label>
              <input
                className="fctrl"
                value={phone}
                maxLength={11}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="01XXXXXXXXX"
              />
              {errors.eP && <div className="ferr show">{errors.eP}</div>}
            </div>
            <div className="fg2">
              <label>জেলা *</label>
              <select className="fctrl" value={dist} onChange={(e) => { setDist(e.target.value); }}>
                <option value="">জেলা সিলেক্ট করুন</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.eD && <div className="ferr show">{errors.eD}</div>}
            </div>
            <div className="fg2">
              <label>সম্পূর্ণ ডেলিভারি ঠিকানা *</label>
              <textarea
                className="fctrl"
                rows={3}
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder="গ্রাম/মহল্লা, রোড, বাসা নম্বর সহ বিস্তারিত লিখুন"
              />
              {errors.eA && <div className="ferr show">{errors.eA}</div>}
            </div>
            <div className="fg2">
              <label>ইমেইল <span className="f-opt">(ঐচ্ছিক — ইনভয়েস পাঠানো হবে)</span></label>
              <input className="fctrl" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@gmail.com" />
              {errors.eEmail && <div className="ferr show">{errors.eEmail}</div>}
            </div>
            <div className="fg2">
              <label>শিপিং *</label>
              <div className="ship-opts">
                {shipOptions.map((opt) => (
                  <label key={opt.key} className={`ship-opt ${selectedShip === opt.key ? 'selected' : ''}`} onClick={() => selectShip(opt.key)}>
                    <input type="radio" name="ship" checked={selectedShip === opt.key} readOnly />
                    <div>
                      <div className="ship-name">{opt.name}</div>
                      <div className="ship-sub">{opt.sub}</div>
                    </div>
                    <div className="ship-price">৳{shipPrice(opt.key, shipCfg)}</div>
                  </label>
                ))}
              </div>
              {errors.eShip && <div className="ferr show">{errors.eShip}</div>}
            </div>
            <div className="o-foot" style={{ border: 'none', padding: '14px 0 0' }}>
              <button className="btn-next" onClick={goToStep2}>পরবর্তী → পেমেন্ট</button>
            </div>
          </div>
        )}

        {/* ── Step 2 — bKash পেমেন্ট ── */}
        {step === 2 && (
          <div className="order-body">
            <div className="pay-card">
              <div className="pay-amount-badge">💳 এডভান্স পেমেন্ট <span>৳২০০</span></div>
              <p className="pay-desc">অর্ডার নিশ্চিত করতে নিচের bKash নম্বরে ২০০ টাকা Send Money করুন।</p>
              <div className="bkash-block">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div className="bkash-left">
                    <div style={{ background: 'rgba(255,255,255,0.4)', border: '1.5px solid rgba(255,255,255,0.6)', padding: '4px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://res.cloudinary.com/dkjzleczw/image/upload/v1785388318/bkash-logo-icon_beuxfl.png" alt="bKash" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
                    </div>
                    <div>
                      <div className="bkash-label">bKash Send Money</div>
                      <div className="bkash-number">{bkashNum}</div>
                    </div>
                  </div>
                  <button className="bkash-copy-btn" onClick={copyBkash} style={copyLabel !== 'Copy' ? { background: '#10B981' } : undefined}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                    {copyLabel}
                  </button>
                </div>
                <button className="qr-toggle-btn" onClick={() => setQrOpen((v) => !v)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /></svg>
                  <span className="qr-btn-text">{qrOpen ? 'QR কোড বন্ধ করুন' : 'QR কোড দিয়ে পেমেন্ট করুন'}</span>
                  <span className="qr-chev" style={qrOpen ? { transform: 'rotate(180deg)' } : undefined}>▾</span>
                </button>
                <div className={`qr-panel ${qrOpen ? 'open' : ''}`}>
                  <div className="qr-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://res.cloudinary.com/dkjzleczw/image/upload/v1785388318/bkash-payment-qr_zmr6dz.jpg" alt="bKash QR" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                    <div style={{ paddingTop: '2px' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1F6B3A', marginBottom: '8px' }}>বিকাশ অ্যাপ দিয়ে স্ক্যান করুন</div>
                      <div style={{ fontSize: '11.5px', color: '#374151', lineHeight: 1.9 }}>
                        ১. বিকাশ অ্যাপ খুলুন<br />২. QR স্ক্যান বাটনে ক্লিক করুন<br />৩. এই QR টি স্ক্যান করুন<br />৪. পরিমাণ ২০০ টাকা দিন<br />৫. পেমেন্ট সম্পন্ন করুন
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="pay-note">Personal নম্বরে Send Money করুন (Payment নয়)</p>
              <div className="pay-warn">⚠️ ভুল তথ্য দিলে পেমেন্ট যাচাই সম্ভব হবে না এবং অর্ডার বাতিল হবে।</div>
            </div>
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '13px', color: 'var(--dark)', marginBottom: '12px' }}>
              নিচের যেকোনো একটি দেওয়া বাধ্যতামূলক
            </div>
            <div className="fg2">
              <label>ট্রানজেকশন আইডি <span className="f-opt">(১০ ক্যারেক্টার, যেমন: 8N5O2A3BDE)</span></label>
              <input className="fctrl" value={txn} maxLength={10} onChange={(e) => setTxn(e.target.value)} placeholder="bKash Transaction ID" />
              {errors.eTxn && <div className="ferr show">{errors.eTxn}</div>}
            </div>
            <div className="or-div">অথবা</div>
            <div className="fg2">
              <label>Send Money করা bKash নম্বরের শেষ ৪ ডিজিট</label>
              <input className="fctrl" value={last4} maxLength={4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} placeholder="যেমন: 5504" />
              {errors.eL4 && <div className="ferr show">{errors.eL4}</div>}
            </div>
            <div className="o-foot" style={{ border: 'none', padding: '14px 0 0' }}>
              <button className="btn-back" onClick={() => goBack(1)}>← পেছনে</button>
              <button className="btn-next" onClick={goToStep3}>পরবর্তী → নিশ্চিত করুন</button>
            </div>
          </div>
        )}

        {/* ── Step 3 — Invoice, শিপিং লেবেল, শর্তাবলী, কনফার্ম ── */}
        {step === 3 && (
          <div className="order-body">
            <div className="invoice-receipt">
              <span className="receipt-title">📋 অর্ডার মেমো (Invoice)</span>
              <div>
                {cartItems.map((i) => (
                  <div key={i.id} className="sum-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {i.emoji || '📦'} {i.name.length > 28 ? i.name.slice(0, 28) + '...' : i.name} × {i.qty}
                    </span>
                    <span>৳{(i.price * i.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="receipt-item"><span>Subtotal</span><span>৳{sub.toLocaleString()}</span></div>
              <div className="receipt-item"><span>ডেলিভারি চার্জ (Shipping)</span><span>৳{sc}</span></div>
              <div className="receipt-divider" />
              <div className="receipt-item receipt-total"><span>সর্বমোট বিল (Total)</span><span>৳{total.toLocaleString()}</span></div>
              <div className="receipt-item receipt-row-paid"><span>✅ Paid (bKash Advance)</span><span>- ৳২০০</span></div>
              <div className="receipt-item receipt-row-balance"><span>বাকি বিল (Cash on Delivery)</span><span>৳{balance.toLocaleString()}</span></div>
            </div>

            <div className="shipping-parcel-label">
              <span className="parcel-title">📦 ডেলিভারি লেবেল (Shipping Label)</span>
              <div className="parcel-info-row"><div className="parcel-icon">👤</div><div>{name}</div></div>
              <div className="parcel-info-row"><div className="parcel-icon">📞</div><div>{phone}</div></div>
              <div className="parcel-info-row">
                <div className="parcel-icon">📍</div>
                <div>{dist && dist !== 'ঢাকা' ? `${dist}, ${addr}` : addr}</div>
              </div>
            </div>

            <div className={`terms-row ${shake ? 'shake' : ''}`} style={{ borderColor: termsError ? '#ef4444' : 'var(--border)' }} onClick={toggleTerms}>
              <div className="terms-cb" style={termsChecked ? { background: '#111', borderColor: '#111' } : undefined}>
                {termsChecked && <span style={{ color: '#fff', fontSize: '13px', fontWeight: 800, lineHeight: 1 }}>✓</span>}
              </div>
              <div className="terms-text">
                আমি ভাঙচুরের সকল{' '}
                <span
                  onClick={(e) => { e.stopPropagation(); setPolicyModalOpen(true); }}
                  style={{ color: 'var(--blue)', textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}
                >
                  নীতিমালা ও শর্তাবলী
                </span>{' '}
                পড়েছি এবং মেনে নিচ্ছি।
              </div>
            </div>
            {termsError && (
              <div className="ferr show" style={{ marginLeft: '14px', marginTop: '6px' }}>
                অর্ডার কনফার্ম করতে শর্তাবলী মেনে নেওয়া আবশ্যক
              </div>
            )}

            <div className="o-foot" style={{ border: 'none', padding: '14px 0 0' }}>
              <button className="btn-back" onClick={() => goBack(2)}>← পেছনে</button>
              <button className="btn-next" style={{ background: 'var(--dark)' }} onClick={handleConfirmClick} disabled={submitting}>
                {submitting ? '⏳ প্রক্রিয়া হচ্ছে...' : '✅ অর্ডার কনফার্ম করুন'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    <PreConfirmLoginModal
      isOpen={showPreConfirm}
      onClose={() => setShowPreConfirm(false)}
      onLogin={preConfirmGoLogin}
      onRegister={preConfirmGoRegister}
      onGoogle={preConfirmGoGoogle}
      onSkip={preConfirmSkip}
    />
    <LoginModal
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      orderMode
      initialMode={loginInitialMode}
      onAuthSuccess={() => submitOrderNow()}
      onBackFromOrder={() => setShowPreConfirm(true)}
    />
    <PolicyModal
      open={policyModalOpen}
      onClose={() => setPolicyModalOpen(false)}
      onAgreeAndConfirm={policyAgreeAndConfirm}
    />
    </>
  );
}
