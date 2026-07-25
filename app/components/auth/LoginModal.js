'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import { getWishlist, WISHLIST_EVENT } from '@/lib/productData';
import {
  AUTH_EVENT, getCurrentUser, saveCurrentUser, saveLinkedAccount,
  signInWithPassword, signUp, signInWithGoogle, checkOAuthCallback,
  syncWishlistFromSupabase, saveWishlistToSupabase, mergeGuestOrdersToUser,
} from '@/lib/authData';

// Converted from 32-javascript-all.js:
// - openLogin()/closeLogin() (~127-158) -> isOpen/onClose props, same pattern as
//   WishlistDrawer.js/CartSidebar.js. The browser-back "_pushPanel('login')/_closePanel"
//   integration those legacy calls also did isn't used by any other converted overlay
//   either (WishlistDrawer/CartSidebar skip it too) — kept out here for the same reason.
// - switchToRegister()/switchToLogin() (~144-158) -> `mode` state below
// - togglePassVis() (~114-125) -> `showLPass`/`showRPass` state
// - doLogin() (~160-205) / doRegister() (~207-250) — email-verification-required branch
//   (data.session is null) can't call showEmailVerifyPopup() (27-post-order-info.html
//   territory / a dedicated verify screen, not built) — shows a toast instead, same
//   information, until that screen exists.
// - loginWithGoogle() (~260-268) + handleOAuthCallback() IIFE (~270-310) -> signInWithGoogle()
//   call + a mount-effect calling checkOAuthCallback() (see lib/authData.js note)
// - openLoginForOrder()/openRegisterForOrder()/_updateLoginOrderMode()/_updateRegOrderMode()/
//   _closeLoginOrderMode() (~410-465) -> `orderMode` prop switches the same JSX branch
//   these DOM-mutated (hide Google/divider/note, show "← ফিরে যান") instead of building
//   nodes by hand. 23-order-overlay.html (OrderForm.js) isn't built yet — when it is, it
//   renders <LoginModal orderMode onAuthSuccess={...} onBackFromOrder={...} />; nothing
//   here needs to change.
// - _pendingOrderAfterLogin -> confirmOrder() resume (~197-200, ~243-246) is OrderForm's
//   concern once it exists; `onAuthSuccess` below is the hook it will use for that.
// Markup source: 21-login-modal.html

function ErrMsg({ text }) {
  return <div className="err-msg" style={{ textAlign: 'center', marginBottom: 4 }}>{text}</div>;
}

export default function LoginModal({ isOpen, onClose, orderMode = false, onAuthSuccess, onBackFromOrder }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [lEmail, setLEmail] = useState('');
  const [lPass, setLPass] = useState('');
  const [showLPass, setShowLPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [lErr, setLErr] = useState('');

  const [rName, setRName] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPass, setRPass] = useState('');
  const [showRPass, setShowRPass] = useState(false);
  const [rErr, setRErr] = useState('');

  const [googleLoading, setGoogleLoading] = useState(false);
  const oauthCheckedRef = useRef(false);

  // Legacy: openLogin()/closeLogin() -> lockBody()/unlockBody() (iOS scroll fix)
  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
  }, [isOpen]);

  // Reset to the right starting form whenever the modal (re)opens
  useEffect(() => {
    if (isOpen) {
      setMode(orderMode ? 'login' : 'login');
      setLErr(''); setRErr('');
    }
  }, [isOpen, orderMode]);

  // Legacy: handleOAuthCallback() IIFE — runs once; this component is always mounted
  // (hidden via isOpen), so it's ready in time to catch the post-Google-redirect session
  useEffect(() => {
    if (oauthCheckedRef.current) return;
    oauthCheckedRef.current = true;
    (async () => {
      const safeUser = await checkOAuthCallback(supabase);
      if (!safeUser) return;
      saveCurrentUser(safeUser);
      await mergeGuestOrdersToUser(supabase, safeUser.email, safeUser.id);
      await applyWishlistSync(safeUser.id);
      showToast('✅ Google দিয়ে লগইন সফল!');
    })();
  }, []);

  // Legacy: saveWishlist(w) pushes to Supabase "if(currentUser)" (lines ~7060-7063).
  // That currentUser check needs this file's auth state, so the push itself happens
  // here — lib/productData.js's saveWishlist() just keeps dispatching WISHLIST_EVENT
  // like it always did, and this listens for it whenever a user is signed in.
  useEffect(() => {
    const onWishChange = (e) => {
      const user = getCurrentUser();
      if (!user) return;
      const items = e.detail?.wishlist ?? getWishlist();
      saveWishlistToSupabase(supabase, user.id, items);
    };
    window.addEventListener(WISHLIST_EVENT, onWishChange);
    return () => window.removeEventListener(WISHLIST_EVENT, onWishChange);
  }, []);

  async function applyWishlistSync(userId) {
    const items = await syncWishlistFromSupabase(supabase, userId);
    if (items) {
      try { localStorage.setItem('vc_wish', JSON.stringify(items)); } catch (e) {}
      window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: { wishlist: items } }));
    } else {
      const local = getWishlist();
      if (local.length) saveWishlistToSupabase(supabase, userId, local);
    }
  }

  const switchToRegister = () => { setMode('register'); setRErr(''); };
  const switchToLogin = () => { setMode('login'); setLErr(''); };

  const finishAuthSuccess = async (safeUser, successMsg) => {
    saveCurrentUser(safeUser);
    await mergeGuestOrdersToUser(supabase, safeUser.email, safeUser.id);
    await applyWishlistSync(safeUser.id);
    showToast(successMsg);
    onClose();
    if (orderMode && onAuthSuccess) onAuthSuccess(safeUser);
  };

  // Legacy: doLogin() (~160-205)
  const doLogin = async () => {
    const em = lEmail.trim();
    const pw = lPass;
    if (!em && !pw) { setLErr('ইমেইল ও পাসওয়ার্ড দিন'); return; }
    if (!em) { setLErr('ইমেইল দিন'); return; }
    if (!pw) { setLErr('পাসওয়ার্ড দিন'); return; }
    setLErr('');

    const { data, error } = await signInWithPassword(supabase, em, pw);
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('invalid login')) {
        setLErr(!em.includes('@') || !em.includes('.') ? 'ইমেইল ঠিকানা ভুল' : 'ইমেইল বা পাসওয়ার্ড ভুল');
      } else if (msg.includes('email')) {
        setLErr('ইমেইল ঠিকানা ভুল');
      } else {
        setLErr('ইমেইল বা পাসওয়ার্ড ভুল');
      }
      return;
    }

    const safeUser = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || 'Customer',
      phone: data.user.user_metadata?.phone || '',
    };
    saveLinkedAccount(safeUser, data.session);
    await finishAuthSuccess(safeUser, '✅ লগইন সফল!');
  };

  // Legacy: doRegister() (~207-250)
  const doRegister = async () => {
    const nm = rName.trim();
    const ph = rPhone.trim();
    const em = rEmail.trim();
    const pw = rPass;
    if (!nm) { setRErr('নাম দিন'); return; }
    if (!ph || !/^01[3-9]\d{8}$/.test(ph)) { setRErr('সঠিক মোবাইল নম্বর দিন'); return; }
    if (!em) { setRErr('ইমেইল দিন'); return; }
    if (pw.length < 6) { setRErr('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে'); return; }
    setRErr('');

    const { data, error } = await signUp(supabase, { name: nm, phone: ph, email: em, password: pw });
    if (error) {
      setRErr(error.message?.includes('already registered') ? 'এই ইমেইল ইতিমধ্যে নিবন্ধিত' : 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে');
      return;
    }

    if (!data.session) {
      // Legacy: showEmailVerifyPopup() — that dedicated screen isn't built yet;
      // a toast carries the same information in the meantime.
      onClose();
      showToast('📧 ইমেইল ভেরিফাই করুন — একটি লিংক পাঠানো হয়েছে');
      return;
    }

    const safeUser = { id: data.user.id, email: data.user.email, name: nm, phone: ph, createdAt: new Date().toISOString() };
    await finishAuthSuccess(safeUser, '✅ অ্যাকাউন্ট তৈরি হয়েছে!');
  };

  // Legacy: loginWithGoogle() (~260-268)
  const loginWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle(supabase);
      if (error) { showToast('❌ Google লগইন ব্যর্থ হয়েছে'); setGoogleLoading(false); }
      // On success the page redirects away, so no need to reset loading state here.
    } catch (e) {
      showToast('❌ কিছু একটা সমস্যা হয়েছে');
      setGoogleLoading(false);
    }
  };

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  const showLoginTitle = orderMode ? 'লগইন করুন' : 'স্বাগতম 👋';
  const showLoginSub = 'আপনার অ্যাকাউন্টে প্রবেশ করুন';
  const title = mode === 'login' ? showLoginTitle : 'অ্যাকাউন্ট তৈরি করুন';
  const sub = mode === 'login' ? showLoginSub : 'নতুন অ্যাকাউন্ট খুলুন';

  const handleOrderBack = () => {
    onClose();
    if (onBackFromOrder) onBackFromOrder();
  };

  return (
    <div className={`modal-bg${isOpen ? ' show' : ''}`} id="loginModal" onClick={handleBackdropClick}>
      <div className="login-box">
        <div className="login-box-header">
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 14, right: 14, background: 'var(--light)', border: 'none', borderRadius: '50%', width: 34, height: 34, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)', zIndex: 10 }}
            title="বন্ধ করুন"
          >
            ✕
          </button>
          <div className="login-brand-logo">
            <div className="login-island">
              <div className="login-island-name">VangCur</div>
              <div className="login-island-bn">ভাঙচুর</div>
            </div>
          </div>
          <h2 id="loginModalTitle">{title}</h2>
          <p className="sub-txt" id="loginModalSub">{sub}</p>
        </div>

        <div className="login-box-body">
          {mode === 'login' ? (
            <div id="loginForm">
              <div className="fg">
                <label>ইমেইল</label>
                <input
                  className="finp no-icon" id="lEmail" type="email" placeholder="name@example.com"
                  autoComplete="email" value={lEmail} onChange={(e) => setLEmail(e.target.value)}
                />
              </div>
              <div className="fg">
                <label>পাসওয়ার্ড</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="finp no-icon" id="lPass" type={showLPass ? 'text' : 'password'}
                    placeholder="আপনার পাসওয়ার্ড দিন" autoComplete="current-password"
                    style={{ paddingRight: 44 }} value={lPass}
                    onChange={(e) => setLPass(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') doLogin(); }}
                  />
                  <button
                    type="button" id="lPassEye" title="পাসওয়ার্ড দেখুন"
                    onClick={() => setShowLPass((v) => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex', alignItems: 'center', fontSize: 18, opacity: showLPass ? 1 : 0.5 }}
                  >
                    👁
                  </button>
                </div>
              </div>
              <div className="login-remember-row">
                <label><input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> মনে রাখুন</label>
                <button className="login-forgot" onClick={() => showToast('পাসওয়ার্ড রিসেট সুবিধা শীঘ্রই আসছে')}>পাসওয়ার্ড ভুলে গেছেন?</button>
              </div>
              {lErr && <ErrMsg text={lErr} />}
              <button className="btn-login" onClick={doLogin}>লগইন করুন</button>

              {!orderMode && (
                <>
                  <div className="login-divider">অথবা</div>
                  <button className="btn-google" onClick={loginWithGoogle} disabled={googleLoading} style={{ opacity: googleLoading ? 0.7 : 1 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google দিয়ে লগইন করুন
                  </button>
                  <div className="login-note">অ্যাকাউন্ট নেই? <button onClick={switchToRegister}>রেজিস্ট্রেশন করুন</button></div>
                </>
              )}

              {orderMode && (
                <button
                  className="order-back-btn"
                  onClick={handleOrderBack}
                  style={{ width: '100%', background: 'none', border: '1.5px solid #E8EAED', borderRadius: 50, padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", color: '#888', marginTop: 10 }}
                >
                  ← ফিরে যান
                </button>
              )}
            </div>
          ) : (
            <div id="regForm">
              <div className="fg">
                <label>পূর্ণ নাম</label>
                <input className="finp no-icon" id="rName" placeholder="আপনার পূর্ণ নাম লিখুন" value={rName} onChange={(e) => setRName(e.target.value)} />
              </div>
              <div className="fg">
                <label>মোবাইল নম্বর</label>
                <input
                  className="finp no-icon" id="rPhone" type="tel" placeholder="01XXXXXXXXX" maxLength={11}
                  value={rPhone} onChange={(e) => setRPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="fg">
                <label>ইমেইল</label>
                <input className="finp no-icon" id="rEmail" type="email" placeholder="name@example.com" value={rEmail} onChange={(e) => setREmail(e.target.value)} />
              </div>
              <div className="fg">
                <label>পাসওয়ার্ড</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="finp no-icon" id="rPass" type={showRPass ? 'text' : 'password'}
                    placeholder="কমপক্ষে ৬ অক্ষর" style={{ paddingRight: 44 }}
                    value={rPass} onChange={(e) => setRPass(e.target.value)}
                  />
                  <button
                    type="button" id="rPassEye" title="পাসওয়ার্ড দেখুন"
                    onClick={() => setShowRPass((v) => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex', alignItems: 'center', fontSize: 18, opacity: showRPass ? 1 : 0.5 }}
                  >
                    👁
                  </button>
                </div>
              </div>
              {rErr && <ErrMsg text={rErr} />}
              <button className="btn-login" onClick={doRegister}>অ্যাকাউন্ট তৈরি করুন</button>

              {!orderMode && (
                <div className="login-note" style={{ marginTop: 16 }}>ইতিমধ্যে অ্যাকাউন্ট আছে? <button onClick={switchToLogin}>লগইন করুন</button></div>
              )}
              {orderMode && (
                <button
                  className="order-back-btn"
                  onClick={handleOrderBack}
                  style={{ width: '100%', background: 'none', border: '1.5px solid #E8EAED', borderRadius: 50, padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", color: '#888', marginTop: 10 }}
                >
                  ← ফিরে যান
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  }
