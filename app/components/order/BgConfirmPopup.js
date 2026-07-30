'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { lockBody, unlockBody } from '@/lib/scrollLock';
import { showToast } from '@/lib/toast';
import { copyTextWithFallback } from '@/lib/clipboard';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { SHOW_BG_CONFIRM_EVENT, GENERATE_INVOICE_EVENT } from '@/lib/uiEvents';

// Converted from 32-javascript-all.js:
// - playConfirmSound() (lines ~5740-5764) — 4-tone Web Audio API "iPhone success chime"
// - showBgConfirmPopup() / closeBgConfirmPopup() / dlInvoiceFromPopup() (lines
//   ~5766-5791) — reached here via the SHOW_BG_CONFIRM_EVENT that WaitingPage.js
//   already dispatches when an order status flips to confirmed/shipped/delivered
//   (see lib/uiEvents.js). detail: { order } — order may be a raw Supabase `orders`
//   row (has order_num) or an already-mapped local order object, exactly like
//   legacy's `(order.order_num !== undefined) ? mapSupabaseOrderRow(order) : order`.
// - Persistent confirmation check on page load (lines ~7577-7608) — restores the
//   popup from localStorage across a refresh/new visit, matching the 1200ms delay
//   and the exact "always show unless explicitly cancelled/rejected" fail-open logic.
// Markup source: 26-background-confirm-popup.html
//
// NOT reproduced: the global ESC-key handler that also calls closeBgConfirmPopup()
// (line ~7512) is one branch of a site-wide "close every open modal on Escape"
// listener spanning ~10 not-yet-built modals (closePP/closeCart/closeOrder/...).
// Building a partial copy of that shared fan-out here would be misleading, so this
// component only wires its own scoped Escape-closes-this-popup listener instead —
// consistent with the same call in WaitingPage.js.
//
// Note: .modal-bg has no opacity:0 / vc-visible reveal-gating in globals.css
// (verified via grep) — visibility is driven entirely by the .show class, same as
// legacy.

const RESTORE_SHOW_DELAY_MS = 1200;

// Legacy: playConfirmSound() (lines ~5740-5764) — verbatim port
function playConfirmSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const notes = [
      { freq: 523.25, start: 0, dur: 0.18, gain: 0.5 },
      { freq: 659.25, start: 0.14, dur: 0.18, gain: 0.45 },
      { freq: 783.99, start: 0.26, dur: 0.22, gain: 0.4 },
      { freq: 1046.5, start: 0.36, dur: 0.38, gain: 0.55 },
    ];
    notes.forEach(({ freq, start, dur, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch (e) { /* noop, matches legacy try/catch — silently no-op if Web Audio unsupported/blocked */ }
}

export default function BgConfirmPopup() {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const orderRef = useRef(null);

  useEffect(() => { orderRef.current = order; }, [order]);

  // Legacy: showBgConfirmPopup(order) (lines ~5766-5775)
  const showPopup = useCallback((rawOrder) => {
    if (!rawOrder) return;
    const o = rawOrder.order_num !== undefined ? mapSupabaseOrderRow(rawOrder) : rawOrder;
    setOrder(o);
    setOpen(true);
    playConfirmSound();
    lockBody();
    try { localStorage.setItem('vc_pending_confirm', JSON.stringify(o)); } catch (e) { /* noop */ }
  }, []);

  // Legacy: closeBgConfirmPopup() (lines ~5776-5780)
  const closePopup = useCallback(() => {
    setOpen(false);
    unlockBody();
    setOrder(null);
  }, []);

  useEffect(() => {
    const onShow = (e) => showPopup(e.detail?.order);
    window.addEventListener(SHOW_BG_CONFIRM_EVENT, onShow);

    // Legacy: persistent confirmation check on page load (lines ~7577-7608)
    let cancelled = false;
    try {
      const pendingConfirm = localStorage.getItem('vc_pending_confirm');
      if (pendingConfirm) {
        const o = JSON.parse(pendingConfirm);
        (async () => {
          let shouldShow = true;
          try {
            const { data } = await supabase.from('orders').select('status').eq('id', o.id).single();
            if (data && ['cancelled', 'rejected'].includes(data.status)) {
              shouldShow = false;
              localStorage.removeItem('vc_pending_confirm');
            }
            // Any other status (confirmed/shipped/delivered/pending/missing row) —
            // fail open and show the popup, exactly like legacy's comments explain.
          } catch (e) {
            shouldShow = true; // network error — don't block the customer, per legacy
          }
          if (shouldShow && !cancelled) {
            setTimeout(() => { if (!cancelled) showPopup(o); }, RESTORE_SHOW_DELAY_MS);
          }
        })();
      }
    } catch (e) { /* noop */ }

    // Scoped Escape handler (see NOT-reproduced note above)
    const onKeydown = (e) => { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', onKeydown);

    return () => {
      cancelled = true;
      window.removeEventListener(SHOW_BG_CONFIRM_EVENT, onShow);
      document.removeEventListener('keydown', onKeydown);
    };
  }, [showPopup, closePopup]);

  // Legacy: dlInvoiceFromPopup() (lines ~5781-5791) — genInvoice() not yet converted,
  // so this dispatches a placeholder event with the full order attached instead of
  // crash-calling an undefined function.
  const dlInvoiceFromPopup = () => {
    const o = orderRef.current;
    if (o) {
      window.dispatchEvent(new CustomEvent(GENERATE_INVOICE_EVENT, { detail: { orderId: o.id, order: o } }));
      try { localStorage.removeItem('vc_pending_confirm'); } catch (e) { /* noop */ }
      closePopup();
    } else {
      showToast('⚠️ অর্ডার তথ্য পাওয়া যাচ্ছে না। পেজ রিলোড করে আবার চেষ্টা করুন।');
    }
  };

  const copyOrderNum = () => {
    const text = order?.orderNum || order?.id || '';
    copyTextWithFallback(text, () => showToast('✅ অর্ডার নম্বর কপি হয়েছে!'));
  };

  return (
    <div
      className={`modal-bg${open ? ' show' : ''}`}
      id="bgConfirmPopup"
      style={{ zIndex: 7000, alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ background: 'var(--white)', borderRadius: 22, maxWidth: 420, width: '92%', padding: '34px 28px', textAlign: 'center', animation: 'slideUp .3s ease', margin: 'auto' }}>
        <div style={{ width: 72, height: 72, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, margin: '0 auto 18px' }}>🎉</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>অর্ডার কনফার্ম হয়েছে!</h2>
        <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 6 }}>আপনার পেমেন্ট যাচাই হয়েছে এবং অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে।</p>
        <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#1A1A1A' }}>
          অর্ডার নম্বর: <span id="bgConfirmNum" style={{ color: '#10B981', fontSize: 15 }}>{order?.orderNum || order?.id || ''}</span>{' '}
          <button
            onClick={copyOrderNum}
            title="কপি করুন"
            style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 6, padding: '2px 7px', fontSize: 11, cursor: 'pointer' }}
          >
            📋
          </button>
        </p>
        <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 18 }}>🔍 অর্ডার ট্র্যাক করতে ওয়েবসাইটের &quot;অর্ডার ট্র্যাক&quot; অপশন ব্যবহার করুন।</p>
        <button
          onClick={dlInvoiceFromPopup}
          style={{ width: '100%', background: 'var(--dark)', color: '#fff', border: 'none', padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
        >
          ⬇️ ইনভয়েস ডাউনলোড করুন (বাধ্যতামূলক)
        </button>
      </div>
    </div>
  );
}
