'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { getCurrentUser } from '@/lib/authData';
import { fetchMyOrders } from '@/lib/accountData';
import { OPEN_TRACK_ORDER_EVENT, GENERATE_INVOICE_EVENT } from '@/lib/uiEvents';

// Converted from 32-javascript-all.js:
// - openTrackOrder()/closeTrackOrder() (lines ~1680-1745) — guest-vs-logged-in branch,
//   guest single-order lookup (vc_pending_confirm / vc_orders scan) + live status refresh
//   from Supabase, logged-in input row shown + loadMyOrdersForTracking() kicked off.
// - trackModalOpenLogin() (lines ~1680-ish, called by the "সাইন-ইন করুন" button legacy
//   rendered for guests with no order) — see note below on how this is wired here.
// - loadMyOrdersForTracking()/doTrackOrder()/renderTrackResults() (lines ~1748-1820).
// - trackInput input-clear-on-empty + global Escape handler (lines ~1822-1835).
// Markup source: 28-order-tracking-modal.html.
//
// Architecture notes:
// - Opened via OPEN_TRACK_ORDER_EVENT — already dispatched today by Footer.js's
//   "ট্র্যাক অর্ডার" button (lib/uiEvents.js).
// - Legacy's guest-with-no-order state actually rendered a plain message with no
//   button (verified against 28-order-tracking-modal.html + the extraction — there is
//   no "সাইন-ইন করুন" button in that branch, trackModalOpenLogin() is unused dead code
//   in the legacy file). Reproduced faithfully as a message-only state; nothing to wire
//   to a login/account event for that path, so OPEN_ACCOUNT_EVENT isn't imported here.
// - dlInvoiceById(id,'track') -> dispatches GENERATE_INVOICE_EVENT the same way
//   BgConfirmPopup.js/WaitingPage.js already do, with an added `ctx: 'track'` field
//   (documented in lib/uiEvents.js) so InvoiceModal.js's back-button can tell this
//   apart from a fresh post-checkout invoice once it exists.
// - _pushPanel('track')/_popPanel() (mobile browser-back panel stack) intentionally
//   skipped, same simplification already made in LoginModal.js/CartSidebar.js/
//   AccountPage.js/WishlistDrawer.js.
// - Escape here only closes this modal (scoped listener), not the legacy's global
//   "close every open overlay" fan-out — same approach PostOrderInfo.js already took,
//   for the same reason (that fan-out isn't reproduced site-wide anywhere yet).
// - Logged-in order fetch reuses fetchMyOrders() from lib/accountData.js (the exact
//   same Supabase-then-localStorage-fallback query loadMyOrdersForTracking()/
//   doTrackOrder() both used in legacy) instead of duplicating that query here.
// - Verified via grep in app/globals.css: .modal-bg / .fctrl / .product-row /
//   .product-name / .product-qty-price / .status-pill have no opacity:0 /
//   .vc-visible / .vc-reveal / .vc-card-in reveal-gating — visibility here is driven
//   purely by .modal-bg.show, same as legacy. (.invoice-btn class exists in globals.css
//   too, but the legacy template literal never applies it to this button — inline
//   styles only — so inline styles are used below to match, not the class.)

const STATUS_LABEL = { pending: '⏳ পেন্ডিং', confirmed: '✅ কনফার্ম', shipped: '🚚 শিপড', delivered: '📦 ডেলিভার্ড', cancelled: '❌ বাতিল', rejected: '❌ বাতিল' };
const STATUS_COLOR = { pending: '#F59E0B', confirmed: '#10B981', shipped: '#3B82F6', delivered: '#10B981', cancelled: '#E63946', rejected: '#E63946' };

// Legacy: emojiHtml(val, 36, 'square') — generic "emoji text or image URL" thumbnail,
// same generic behavior AccountPage.js's local ItemThumb already ports.
function ItemThumb({ value }) {
  if (typeof value === 'string' && value.startsWith('http')) {
    return (
      <img
        src={value}
        alt=""
        style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 7, border: '1px solid #e5e7eb', flexShrink: 0 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <span style={{ fontSize: 20, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--light)', borderRadius: 7, flexShrink: 0 }}>
      {value || '📦'}
    </span>
  );
}

function OrderCard({ order }) {
  const st = order.status || 'pending';
  return (
    <div style={{ border: '1.5px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ background: 'var(--dark)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{order.orderNum || order.id || ''}</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, background: STATUS_COLOR[st] || '#888', color: '#fff', padding: '4px 12px', borderRadius: 20 }}>
          {STATUS_LABEL[st] || st}
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 10 }}>
          📅 {new Date(order.date || Date.now()).toLocaleDateString('en-GB')} &nbsp;|&nbsp; 👤 {order.customer?.name || ''}
        </div>
        <div style={{ marginBottom: 12 }}>
          {(order.items || []).map((it, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #F3F4F6' }}>
              <ItemThumb value={it.emoji || '📦'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{it.name || ''}</div>
                <div style={{ fontSize: 11.5, color: '#6B7280' }}>× {it.qty} — ৳{((it.price || 0) * it.qty).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>মোট: ৳{(order.total || 0).toLocaleString()}</div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent(GENERATE_INVOICE_EVENT, { detail: { orderId: order.id, order, ctx: 'track' } }))}
            style={{ background: 'var(--dark)', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
          >
            📄 ইনভয়েস
          </button>
        </div>
      </div>
    </div>
  );
}

// Legacy: guestOrder lookup inside openTrackOrder() (~1690-1697)
function findGuestOrder() {
  try {
    const raw = localStorage.getItem('vc_pending_confirm');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.userId && !parsed.user_id) return parsed;
    }
  } catch (e) { /* noop, matches legacy */ }
  try {
    const all = JSON.parse(localStorage.getItem('vc_orders') || '[]');
    const guestOrders = all.filter((o) => !o.userId && !o.user_id);
    if (guestOrders.length) return guestOrders[guestOrders.length - 1];
  } catch (e) { /* noop, matches legacy */ }
  return null;
}

export default function OrderTracking() {
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null); // null | {kind:'loading'|'guest-empty'|'guest-order'|'orders', ...}
  const inputRef = useRef(null);

  const close = () => {
    setOpen((wasOpen) => {
      if (!wasOpen) return wasOpen;
      unlockBody();
      setResult(null);
      setQuery('');
      return false;
    });
  };

  const loadMyOrders = async (user) => {
    setResult({ kind: 'loading', label: '⏳ আপনার অর্ডার লোড হচ্ছে...' });
    const found = await fetchMyOrders(supabase, user);
    setResult({ kind: 'orders', list: found, isSearch: false });
  };

  const doSearch = async () => {
    if (!currentUser) return;
    const q = (query || '').trim().toLowerCase();
    if (!q) { loadMyOrders(currentUser); return; }
    setResult({ kind: 'loading', label: '🔍 খোঁজা হচ্ছে...' });
    const all = await fetchMyOrders(supabase, currentUser);
    const qPhone = q.replace(/\D/g, '');
    const cleanQ = q.replace('#', '').toUpperCase().trim();
    const found = all.filter((o) => {
      const num = (o.orderNum || '').toUpperCase();
      const phone = (o.customer?.phone || '').replace(/\D/g, '');
      return num.includes(cleanQ) || (qPhone.length >= 5 && phone.includes(qPhone));
    });
    setResult({ kind: 'orders', list: found, isSearch: true });
  };

  const openModal = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setQuery('');
    setOpen(true);
    lockBody();

    if (!user) {
      const guestOrder = findGuestOrder();
      if (!guestOrder) {
        setResult({ kind: 'guest-empty' });
        return;
      }
      setResult({ kind: 'loading', label: '⏳ স্ট্যাটাস চেক হচ্ছে...' });
      (async () => {
        if (guestOrder.id) {
          try {
            const { data, error } = await supabase.from('orders').select('id,status,updated_at').eq('id', guestOrder.id).single();
            if (!error && data && data.status && guestOrder.status !== data.status) {
              guestOrder.status = data.status;
              try {
                const ords = JSON.parse(localStorage.getItem('vc_orders') || '[]');
                const o = ords.find((x) => x.id === guestOrder.id);
                if (o) { o.status = data.status; localStorage.setItem('vc_orders', JSON.stringify(ords)); }
                const pc = localStorage.getItem('vc_pending_confirm');
                if (pc) {
                  const pco = JSON.parse(pc);
                  if (pco.id === guestOrder.id) { pco.status = data.status; localStorage.setItem('vc_pending_confirm', JSON.stringify(pco)); }
                }
              } catch (e) { /* noop, matches legacy */ }
            }
          } catch (e) { /* noop, matches legacy */ }
        }
        setResult({ kind: 'guest-order', order: guestOrder });
      })();
    } else {
      loadMyOrders(user);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  useEffect(() => {
    const onOpen = () => openModal();
    window.addEventListener(OPEN_TRACK_ORDER_EVENT, onOpen);
    const onKeydown = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKeydown);
    return () => {
      window.removeEventListener(OPEN_TRACK_ORDER_EVENT, onOpen);
      document.removeEventListener('keydown', onKeydown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    // Legacy: trackInput 'input' listener (~1822-1830) — clears the panel outright on
    // empty, does not reload the full order list.
    if (!val.trim()) setResult(null);
  };

  const renderResult = () => {
    if (!result) return null;
    if (result.kind === 'loading') {
      return <p style={{ color: 'var(--gray)', fontSize: 13, textAlign: 'center' }}>{result.label}</p>;
    }
    if (result.kind === 'guest-empty') {
      return (
        <div style={{ textAlign: 'center', padding: '24px 10px', fontFamily: "'Hind Siliguri','DM Sans',sans-serif" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 8 }}>অর্ডার করলে সেটি এখানে দেখা যাবে</div>
          <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 20 }}>এই ডিভাইসে এখন পর্যন্ত কোনো অর্ডারের তথ্য নেই অর্থাৎ আপনি এখনো কোনো অর্ডার করেননি।</div>
        </div>
      );
    }
    if (result.kind === 'guest-order') {
      return <OrderCard order={result.order} />;
    }
    if (result.kind === 'orders') {
      const { list, isSearch } = result;
      if (!list.length) {
        return isSearch ? (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--gray)', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>😔</div>
            <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>কোনো অর্ডার পাওয়া যায়নি</div>
            <div style={{ fontSize: 12, lineHeight: 1.7 }}>দেওয়া নম্বরটি ভুল হতে পারে।<br />সঠিক অর্ডার নম্বর বা ফোন নম্বর দিন।</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--gray)', fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
            <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>এখনো কোনো অর্ডার নেই</div>
            <div style={{ fontSize: 12, lineHeight: 1.7 }}>অর্ডার করলে এখানে দেখাবে।</div>
          </div>
        );
      }
      return (
        <>
          {!isSearch && (
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', letterSpacing: '.3px', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              📋 এখন পর্যন্ত আপনার করা অর্ডার সমূহ
            </div>
          )}
          {list.map((o) => <OrderCard key={o.id} order={o} />)}
        </>
      );
    }
    return null;
  };

  return (
    <div className={`modal-bg${open ? ' show' : ''}`} id="trackOrderModal" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div style={{ background: 'var(--white)', borderRadius: 22, maxWidth: 480, width: '100%', padding: '32px 28px', animation: 'slideUp .3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>🔍 অর্ডার ট্র্যাক করুন</h2>
          <button onClick={close} style={{ background: 'var(--light)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>✕</button>
        </div>
        {currentUser && (
          <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 18, lineHeight: 1.7 }}>আপনার অর্ডার নম্বর বা ফোন নম্বর দিয়ে অর্ডার খুঁজুন।</p>
        )}
        {currentUser && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              ref={inputRef}
              id="trackInput"
              className="fctrl"
              placeholder="অর্ডার নম্বর (যেমন: #VC-...) অথবা ফোন নম্বর"
              style={{ flex: 1, padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 16, fontFamily: "'DM Sans','Hind Siliguri',sans-serif" }}
              value={query}
              onChange={onQueryChange}
              onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
            />
            <button
              onClick={doSearch}
              style={{ background: 'var(--dark)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}
            >
              খুঁজুন
            </button>
          </div>
        )}
        <div id="trackResult">{renderResult()}</div>
      </div>
    </div>
  );
}
