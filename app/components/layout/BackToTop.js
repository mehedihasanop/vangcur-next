'use client';

import { useEffect, useRef } from 'react';
import { SRP_OPEN_EVENT, SRP_CLOSE_EVENT } from '@/lib/uiEvents';

// Converted from 32-javascript-all.js:
// - Main window scroll listener & visibility toggle (lines ~1471-1488)
// - SRP modal scroll override / reset (lines ~675-685, ~622-628) — 17-search-
//   result-page.html isn't converted yet (Priority 2), so this listens for the
//   SRP_OPEN_EVENT/SRP_CLOSE_EVENT custom events (see lib/uiEvents.js) instead of
//   the legacy openSRP()/closeSRP() calling into this button directly. The future
//   SearchPage component should dispatch:
//     window.dispatchEvent(new CustomEvent(SRP_OPEN_EVENT, { detail: { bodyEl } }))
//     window.dispatchEvent(new CustomEvent(SRP_CLOSE_EVENT))
// Markup source: 15-back-to-top.html
//
// Note: .back-to-top has no opacity:0 / vc-visible reveal-gating in globals.css
// (verified via grep — it uses its own .show toggle, unrelated to the scroll-
// reveal system), so no IntersectionObserver reveal logic is needed here.

export default function BackToTop() {
  const btnRef = useRef(null);
  const srpBodyRef = useRef(null); // set while an SRP modal is open

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    let wasShown = false;

    const applyShownStyles = () => {
      btn.style.background = 'var(--dark)';
      btn.style.transform = '';
      btn.style.boxShadow = '0 4px 18px rgba(0,0,0,.25)';
    };

    const onWindowScroll = () => {
      if (srpBodyRef.current) return; // SRP mode owns visibility while open
      const show = window.scrollY > 400;
      if (show && !wasShown) {
        applyShownStyles();
        btn.classList.add('show');
      } else if (!show && wasShown) {
        btn.classList.remove('show');
      }
      wasShown = show;
    };

    const onSrpScroll = () => {
      const bodyEl = srpBodyRef.current;
      if (!bodyEl) return;
      if (bodyEl.scrollTop > 300) {
        btn.classList.add('show');
        btn.style.zIndex = '1199';
      } else {
        btn.classList.remove('show');
      }
    };

    const onSrpOpen = (e) => {
      const bodyEl = e.detail && e.detail.bodyEl;
      if (!bodyEl) return;
      srpBodyRef.current = bodyEl;
      bodyEl.addEventListener('scroll', onSrpScroll, { passive: true });
      onSrpScroll();
    };

    const onSrpClose = () => {
      const bodyEl = srpBodyRef.current;
      if (bodyEl) bodyEl.removeEventListener('scroll', onSrpScroll);
      srpBodyRef.current = null;
      btn.classList.remove('show');
    };

    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.addEventListener(SRP_OPEN_EVENT, onSrpOpen);
    window.addEventListener(SRP_CLOSE_EVENT, onSrpClose);

    return () => {
      window.removeEventListener('scroll', onWindowScroll);
      window.removeEventListener(SRP_OPEN_EVENT, onSrpOpen);
      window.removeEventListener(SRP_CLOSE_EVENT, onSrpClose);
      const bodyEl = srpBodyRef.current;
      if (bodyEl) bodyEl.removeEventListener('scroll', onSrpScroll);
    };
  }, []);

  const handleClick = (e) => {
    const bodyEl = srpBodyRef.current;
    if (bodyEl) {
      bodyEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    e.currentTarget.blur();
  };

  return (
    <button ref={btnRef} className="back-to-top" id="backToTop" onClick={handleClick} title="উপরে যান">
      <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <polyline points="18 15 12 9 6 15" />
      </svg>
      <span>TOP</span>
    </button>
  );
}
