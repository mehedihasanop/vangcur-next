'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { lockBody, unlockBody } from '@/lib/scrollLock';
import { showToast } from '@/lib/toast';
import { checkOrderStatus, fetchFullOrder, subscribeOrderRealtime } from '@/lib/orderStatus';
import {
  OPEN_WAIT_OVERLAY_EVENT, SHOW_BG_CONFIRM_EVENT, GENERATE_INVOICE_EVENT, OPEN_ORDER_FORM_EVENT,
} from '@/lib/uiEvents';

// Converted from 32-javascript-all.js:
// - Order-insert → open-overlay block (lines ~4990-5044) — reached here via the
//   OPEN_WAIT_OVERLAY_EVENT dispatched by the not-yet-built OrderForm.js (see
//   lib/uiEvents.js). detail: { orderId, orderNum, isGuest? }
// - Page-load restore from localStorage (lines ~5677-5701, 30-minute TTL)
// - checkOrderStatusFromSupabase() / handleOrderStatusUpdate() / startPolling()
//   (lines ~5108-5259) — see lib/orderStatus.js for the polling/realtime half.
// - visibilitychange pause/resume (lines ~5584-5590) — only the polling-pause slice
//   relevant to this component is reproduced; the same handler also refreshes
//   stock/categories/products in the legacy file, which is each of those
//   components' own concern, not this one's.
// - exitWaitAndBrowse() / copyOrderNum() / closeWait() / dlInvoice() (lines
//   ~5716-5794 & ~5794-5811)
// Markup source: 25-waiting-page.html
//
// VERIFIED BEHAVIOR NOTE (read before touching the "confirmed" flow):
// handleOrderStatusUpdate() always closes #waitOverlay and calls
// showBgConfirmPopup(order) for confirmed/shipped/delivered — it never switches to
// the #waitConfirmed panel inside this overlay. That panel (and its "কপি"/ইনভয়েস
// ডাউনলোড buttons) exists in the HTML but is dead code in the current logic; the
// real confirmation UI lives in a not-yet-built ConfirmPopup component, reached here
// via the SHOW_BG_CONFIRM_EVENT placeholder. #waitConfirmed is still rendered below
// for 1:1 markup fidelity, but nothing currently sets phase to 'confirmed'.
// Only #waitRejected is actually reachable through this component's own logic
// (cancelled/rejected statuses swap directly in-place, no popup).
//
// Also intentionally NOT reproduced: the legacy history.pushState({waitOverlay:true})
// back-button trap (line ~5048) and its popstate handler. That's one branch of a
// site-wide modal/back-button "panel stack" system spanning every overlay in the
// legacy app (~5565-5582), not something specific to this component — building a
// partial copy of it here would be worse than faking it before that shared
// navigation infra gets converted.
//
// Note: .wait-overlay / .wait-box / .status-track / .state-panel etc. have no
// opacity:0 / vc-visible reveal-gating in globals.css (verified via grep) — visibility
// is driven entirely by the .show class + inline display, same as legacy.

const RESTORE_TTL_MS = 30 * 60 * 1000;
const MAX_POLL_MS = 30 * 60 * 1000;
const POLL_INTERVAL_MS = 5000;

export default function WaitingPage() {
  const [phase, setPhase] = useState('closed'); // 'closed' | 'pending' | 'confirmed' | 'rejected'
  const [orderNum, setOrderNum] = useState('');
  const [isGuest, setIsGuest] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  const pendingIdRef = useRef(null);
  const orderNumRef = useRef('');
  const phaseRef = useRef('closed');
  const pollTimerRef = useRef(null);
  const pollStartRef = useRef(0);
  const unsubscribeRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const stopPolling = () => {
    clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
  };
  const stopRealtime = () => {
    if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; }
  };
  const clearPendingStorage = () => {
    sessionStorage.removeItem('vc_pending');
    try {
      localStorage.removeItem('vc_pending_ls');
      localStorage.removeItem('vc_pending_num_ls');
      localStorage.removeItem('vc_pending_ts');
    } catch (e) { /* noop */ }
  };
  const updateLocalOrderStatus = (orderId, status) => {
    try {
      const orders = JSON.parse(localStorage.getItem('vc_orders') || '[]');
      const o = orders.find((x) => x.id === orderId);
      if (o) { o.status = status; localStorage.setItem('vc_orders', JSON.stringify(orders)); }
    } catch (e) { /* noop */ }
  };

  // Legacy: handleOrderStatusUpdate() (lines ~5126-5201)
  const handleStatusUpdate = (status, orderId) => {
    const isProgress = ['confirmed', 'shipped', 'delivered'].includes(status);
    const isFinal = ['delivered', 'cancelled', 'rejected'].includes(status);

    if (isProgress) {
      updateLocalOrderStatus(orderId, status);
      stopPolling();
      clearPendingStorage();
      if (isFinal) { stopRealtime(); pendingIdRef.current = null; }

      (async () => {
        const rawOrder = await fetchFullOrder(supabase, orderId);
        if (phaseRef.current === 'pending') {
          setPhase('closed');
          unlockBody();
        }
        const order = rawOrder || {
          id: orderId,
          orderNum: orderNumRef.current || orderId,
          customer: { name: '', phone: '', district: '', address: '' },
          items: [],
          total: 0,
          shippingCost: 0,
          shipping: 'bd',
          date: new Date().toISOString(),
        };
        window.dispatchEvent(new CustomEvent(SHOW_BG_CONFIRM_EVENT, { detail: { order } }));
      })();
    } else if (status === 'cancelled' || status === 'rejected') {
      stopPolling();
      stopRealtime();
      clearPendingStorage();
      updateLocalOrderStatus(orderId, status);
      pendingIdRef.current = null;
      setPhase('rejected');
    }
  };

  // Legacy: startPolling() (lines ~5205-5259)
  const startPolling = (orderId) => {
    stopPolling();
    stopRealtime();
    pollStartRef.current = Date.now();
    unsubscribeRef.current = subscribeOrderRealtime(supabase, orderId, (status) => (
      handleStatusUpdate(status, pendingIdRef.current || orderId)
    ));
    pollTimerRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > MAX_POLL_MS) {
        stopPolling();
        stopRealtime();
        clearPendingStorage();
        pendingIdRef.current = null;
        setTimedOut(true);
        return;
      }
      const currentId = pendingIdRef.current || orderId;
      const status = await checkOrderStatus(supabase, currentId);
      if (status) handleStatusUpdate(status, currentId);
    }, POLL_INTERVAL_MS);
  };

  // Legacy: order-insert open block (lines ~5030-5044) + page-load restore (~5677-5701)
  const openWait = ({ orderId, orderNum: num, isGuest: guestFlag }) => {
    if (!orderId) return;
    pendingIdRef.current = orderId;
    orderNumRef.current = num || orderId;
    sessionStorage.setItem('vc_pending', orderId);
    sessionStorage.setItem('vc_pending_num', num || '');
    try {
      localStorage.setItem('vc_pending_ls', orderId);
      localStorage.setItem('vc_pending_num_ls', num || '');
      localStorage.setItem('vc_pending_ts', String(Date.now()));
    } catch (e) { /* noop */ }

    setOrderNum(num || orderId);
    setIsGuest(guestFlag !== undefined ? guestFlag : !localStorage.getItem('vc_user'));
    setTimedOut(false);
    setPhase('pending');
    lockBody();
    startPolling(orderId);
  };

  useEffect(() => {
    // Restore an in-progress wait across a page refresh (legacy: 30-min TTL)
    try {
      const lsId = localStorage.getItem('vc_pending_ls');
      const lsTs = parseInt(localStorage.getItem('vc_pending_ts') || '0', 10);
      if (lsId && Date.now() - lsTs < RESTORE_TTL_MS) {
        openWait({ orderId: lsId, orderNum: localStorage.getItem('vc_pending_num_ls') || '' });
      }
    } catch (e) { /* noop */ }

    const onOpen = (e) => openWait(e.detail || {});
    window.addEventListener(OPEN_WAIT_OVERLAY_EVENT, onOpen);

    // Legacy: visibilitychange (lines ~5584-5590) — pause polling while hidden, keep
    // the realtime channel alive, resume polling when the tab is visible again
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopPolling();
      } else if (document.visibilityState === 'visible' && pendingIdRef.current && !pollTimerRef.current) {
        startPolling(pendingIdRef.current);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Legacy: pagehide (lines ~5704-5715) — cleanup only; cart-clearing there is
    // the cart component's own concern, not reproduced here
    const onPageHide = () => { stopPolling(); stopRealtime(); };
    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.removeEventListener(OPEN_WAIT_OVERLAY_EVENT, onOpen);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      stopPolling();
      stopRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Legacy: copyOrderNum(elId) (lines ~5722-5734)
  const fallbackCopy = (text) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('✅ অর্ডার নম্বর কপি হয়েছে!');
    } catch (e) { /* noop */ }
  };
  const copyOrderNum = (text) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast('✅ অর্ডার নম্বর কপি হয়েছে!'))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  // Legacy: exitWaitAndBrowse() (lines ~5716-5721) — close overlay, keep polling
  const exitWaitAndBrowse = () => { setPhase('closed'); unlockBody(); };

  // Legacy: closeWait() (line ~5735) — close overlay AND stop tracking entirely
  const closeWait = () => {
    setPhase('closed');
    unlockBody();
    pendingIdRef.current = null;
    stopPolling();
    stopRealtime();
    clearPendingStorage();
  };

  // Legacy: dlInvoice() (lines ~5794-5811) — genInvoice() not yet converted, so this
  // dispatches a placeholder event instead of crash-calling an undefined function.
  // See the VERIFIED BEHAVIOR NOTE above: this button is currently unreachable since
  // nothing sets phase to 'confirmed'.
  const dlInvoice = () => {
    const targetId = pendingIdRef.current;
    if (targetId) {
      window.dispatchEvent(new CustomEvent(GENERATE_INVOICE_EVENT, { detail: { orderId: targetId } }));
    } else {
      showToast('❌ অর্ডার তথ্য পাওয়া যাচ্ছে না');
    }
    setPhase('closed');
    unlockBody();
  };

  // Legacy: Rejected panel's "আবার চেষ্টা করুন" → closeWait();openOrder(false)
  const retryOrder = () => {
    closeWait();
    window.dispatchEvent(new CustomEvent(OPEN_ORDER_FORM_EVENT, { detail: { warn: false } }));
  };

  return (
    <div className={`wait-overlay${phase !== 'closed' ? ' show' : ''}`} id="waitOverlay">
      <div className="wait-box">
        <div style={{ paddingBottom: 14, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, textAlign: 'center' }}>অর্ডার স্ট্যাটাস</div>
        </div>

        {/* ⏳ Pending State */}
        <div id="pendingState" style={{ display: phase === 'pending' ? 'block' : 'none' }}>
          <div className="pulse-radar">⏳</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>ধন্যবাদ!</h2>
          <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.7, marginBottom: 18, textAlign: 'center' }}>
            {timedOut ? (
              'অর্ডার যাচাই সময়সীমা শেষ। WhatsApp এ যোগাযোগ করুন: 01816-365504'
            ) : (
              <>আপনার অর্ডারটি পেন্ডিং অবস্থায় আছে। আপনার ২০০ টাকার পেমেন্ট আমরা যাচাই করছি। সাধারণত <strong>৫–১০ মিনিটের মধ্যে</strong> কনফার্মেশন পাবেন (সর্বোচ্চ ৩০ মিনিট)।</>
            )}
          </p>

          <div className="wait-order-num">
            অর্ডার নম্বর: <strong id="waitNum">{orderNum}</strong>
            <button onClick={() => copyOrderNum(orderNum)} title="কপি করুন">📋 কপি</button>
          </div>

          {isGuest && (
            <div id="guestOrderNotice" style={{ display: 'block', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '11px 14px', marginTop: 12, fontSize: 12.5, color: '#92400E', lineHeight: 1.7, textAlign: 'center' }}>
              ⚠️ আপনি এই মুহূর্তে <strong>আনলগইন</strong> অবস্থায় আছেন।<br />ভবিষ্যতে অর্ডার ট্র্যাক করতে ওয়েবসাইটের <strong>লগইন বাটন</strong>-এ ক্লিক করে লগইন করুন।
            </div>
          )}

          <div className="status-track">
            <div className="st-item">
              <div className="st-icon st-done">✓</div>
              <div className="st-text"><strong>অর্ডার রিসিভড</strong><span>সিস্টেমে সফলভাবে জমা হয়েছে</span></div>
            </div>
            <div className="st-item">
              <div className="st-icon st-cur">🔍</div>
              <div className="st-text"><strong>পেমেন্ট ভেরিফিকেশন</strong><span>বিকাশ ট্রানজেকশন যাচাই করা হচ্ছে</span></div>
            </div>
            <div className="st-item">
              <div className="st-icon st-pend">⭕</div>
              <div className="st-text"><strong>অর্ডার কনফার্ম</strong><span>পেমেন্ট সঠিক হলে কনফার্ম হবে</span></div>
            </div>
          </div>

          <div style={{ background: 'var(--light)', borderRadius: 12, padding: 12, marginBottom: 20, fontSize: 12, color: 'var(--gray)', textAlign: 'center', lineHeight: 1.7 }}>
            💡 আপনি চাইলে এখন ওয়েবসাইট ব্রাউজ করতে পারেন।<br />অর্ডার কনফার্ম হলে স্বয়ংক্রিয় নোটিফিকেশন দেখাবে।
          </div>

          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gray)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>আমাদের ফলো করুন</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <a className="soc-btn" href="https://facebook.com/vangcurbdofficial" target="_blank" rel="noopener noreferrer" style={{ background: '#1877F2' }} title="Facebook">
                <svg width="18" height="18" fill="#fff" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a className="soc-btn" href="https://instagram.com/vangcur_official" target="_blank" rel="noopener noreferrer" style={{ background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }} title="Instagram">
                <svg width="18" height="18" fill="#fff" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
              <a className="soc-btn" href="https://tiktok.com/@vangcur.com" target="_blank" rel="noopener noreferrer" style={{ background: '#000' }} title="TikTok">
                <svg width="18" height="18" fill="#fff" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" /></svg>
              </a>
              <a className="soc-btn" href="https://wa.me/8801816365504" target="_blank" rel="noopener noreferrer" style={{ background: '#25D366' }} title="WhatsApp">
                <svg width="18" height="18" fill="#fff" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </a>
              <a className="soc-btn" href="https://youtube.com/@vangcur" target="_blank" rel="noopener noreferrer" style={{ background: '#FF0000' }} title="YouTube">
                <svg width="18" height="18" fill="#fff" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            </div>
          </div>

          <button className="home-btn" onClick={exitWaitAndBrowse}>🏠 ওয়েবসাইটে ফিরে যান</button>
        </div>

        {/* 🎉 Confirmed State — see VERIFIED BEHAVIOR NOTE above: currently unreachable */}
        <div className="state-panel" id="waitConfirmed" style={{ display: phase === 'confirmed' ? 'block' : 'none', textAlign: 'center' }}>
          <div className="success-badge">🎉</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>অর্ডার কনফার্ম হয়েছে!</h2>
          <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 18 }}>আপনাদের পেমেন্ট যাচাই করা হয়েছে এবং অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে।</p>
          <p style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            অর্ডার নম্বর: <span id="confirmedNum" style={{ color: 'var(--dark)', fontWeight: 700 }}>{orderNum}</span>
            <button className="copy-btn" onClick={() => copyOrderNum(orderNum)}>📋 কপি</button>
          </p>
          <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 18 }}>🔍 অর্ডার ট্র্যাক করতে ওয়েবসাইটের &quot;অর্ডার ট্র্যাক&quot; অপশন ব্যবহার করুন।</p>
          <button onClick={dlInvoice} className="invoice-btn">⬇️ ইনভয়েস ডাউনলোড করুন (বাধ্যতামূলক)</button>
        </div>

        {/* ❌ Rejected State */}
        <div className="state-panel" id="waitRejected" style={{ display: phase === 'rejected' ? 'block' : 'none', textAlign: 'center' }}>
          <div className="error-badge">❌</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)', marginBottom: 10 }}>দুঃখিত!</h2>
          <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 20 }}>আপনার পেমেন্ট তথ্যটি সঠিক নয়। সঠিক তথ্য দিয়ে আবার চেষ্টা করুন অথবা সরাসরি WhatsApp-এ যোগাযোগ করুন।</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="https://wa.me/8801816365504" target="_blank" rel="noopener noreferrer" className="wa-btn">WhatsApp এ যোগাযোগ করুন</a>
            <button className="home-btn" onClick={retryOrder} style={{ width: '100%', marginTop: 10, background: 'none', border: '1.5px solid var(--border)' }}>আবার চেষ্টা করুন</button>
          </div>
        </div>
      </div>
    </div>
  );
}
