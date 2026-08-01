'use client';

import { useEffect, useState } from 'react';
import { lockBody, unlockBody } from '@/lib/scrollLock';
import { SHOW_POST_ORDER_INFO_EVENT } from '@/lib/uiEvents';

// Converted from 32-javascript-all.js:
// - closePost() (lines ~1635-1645) — clears vc_pending_confirm, sets
//   vc_show_thank_you='1' so the navbar's thank-you animation fires after reload,
//   then hard-reloads to the current path (window.location.replace).
// - Shown from InvoiceModal.js's back-button handler default branch (lines
//   ~9626-9630) — reached here via SHOW_POST_ORDER_INFO_EVENT (see lib/uiEvents.js).
// - Global Escape-closes-this-overlay is one branch of the same shared "close every
//   open modal" fan-out documented in BgConfirmPopup.js/WaitingPage.js; not
//   reproduced site-wide here for the same reason — only a scoped listener for this
//   overlay is wired.
// Markup source: 27-post-order-info.html — real content verified against the full
// legacy index.html (lines ~3407-3428). Previous version of this file used a
// placeholder body; replaced below with the verbatim markup/copy.
//
// Note: .post-overlay/.post-box already exist in globals.css (verified via grep) with
// no opacity:0 / vc-visible reveal-gating — visibility is driven entirely by the
// .show class, same as legacy.

export default function PostOrderInfo() {
  const [open, setOpen] = useState(false);

  // Legacy: closePost() (lines ~1635-1645) — verbatim port
  const closePost = () => {
    setOpen(false);
    unlockBody();
    try { localStorage.removeItem('vc_pending_confirm'); } catch (e) { /* noop */ }
    try { localStorage.setItem('vc_show_thank_you', '1'); } catch (e) { /* noop */ }
    window.location.replace(window.location.pathname);
  };

  useEffect(() => {
    const onShow = () => { setOpen(true); lockBody(); };
    window.addEventListener(SHOW_POST_ORDER_INFO_EVENT, onShow);

    const onKeydown = (e) => { if (e.key === 'Escape') closePost(); };
    document.addEventListener('keydown', onKeydown);

    return () => {
      window.removeEventListener(SHOW_POST_ORDER_INFO_EVENT, onShow);
      document.removeEventListener('keydown', onKeydown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`post-overlay${open ? ' show' : ''}`} id="postOverlay">
      <div className="post-box">
        <h2 style={{ marginBottom: 18 }}>📦 প্রোডাক্ট পাওয়ার পর করণীয়</h2>
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <h3 style={{ marginTop: 0, color: '#92400E', fontSize: 14 }}>📹 আনবক্সিং ভিডিও করুন</h3>
          <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.85, color: '#78350F' }}>
            <li>প্রোডাক্ট পাওয়ার সাথে সাথে উপর থেকে একটানা আনবক্সিং ভিডিও করুন</li>
            <li>ভিডিওতে কোনো কাট বা পজ দেওয়া যাবে না</li>
            <li>কুরিয়ারে প্রোডাক্ট ভাঙলে বা ত্রুটি থাকলে এই ভিডিও দিয়ে ওয়ারেন্টি ক্লেইম করুন</li>
            <li>প্রোডাক্ট মিসিং বা ভুল গেলে সম্পূর্ণ দায়ভার আমাদের</li>
          </ul>
        </div>
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0, color: '#1E40AF', fontSize: 14 }}>⚠️ গুরুত্বপূর্ণ</h3>
          <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.85, color: '#1E40AF' }}>
            <li><strong>আনবক্সিং প্রমাণ ছাড়া কোনো ওয়ারেন্টি ক্লেইম গ্রহণযোগ্য নয়</strong></li>
            <li>৬ মাসের ওয়ারেন্টিযুক্ত প্রোডাক্টের বক্স ও কাগজপত্র সংরক্ষণ করুন</li>
            <li>সমস্যায় WhatsApp: <strong>01816-365504</strong></li>
          </ul>
        </div>
        <button
          onClick={closePost}
          style={{ width: '100%', background: 'var(--dark)', color: '#fff', border: 'none', padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 18, fontFamily: "'DM Sans',sans-serif" }}
        >
          বুঝেছি ✓
        </button>
      </div>
    </div>
  );
}
