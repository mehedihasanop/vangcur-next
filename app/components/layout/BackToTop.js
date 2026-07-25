'use client';

import { useEffect, useRef } from 'react';

// Converted from 32-javascript-all.js: main window scroll listener & visibility
// toggle (lines ~1471-1488). Markup source: 15-back-to-top.html
//
// Reused on both the home page (ClientHome.js) and the /srp search page
// (app/srp/SearchPageClient.js) — both are plain documents with normal window
// scrolling, so one simple window-scroll listener covers both.
//
// Previously had an SRP-modal-scroll mode (bodyEl.scrollTop tracking + an
// SRP_OPEN_EVENT/SRP_CLOSE_EVENT pair in lib/uiEvents.js) from when the search
// page was going to be a fixed-position overlay with its own internal scroll
// container. The owner decided /srp should be a real page instead, so that
// mode no longer applies to anything and was removed; SRP_OPEN_EVENT/
// SRP_CLOSE_EVENT stay in uiEvents.js only in case a future overlay (not
// search) wants that pattern.
//
// Note: .back-to-top has no opacity:0 / vc-visible reveal-gating in globals.css
// (verified via grep — it uses its own .show toggle, unrelated to the scroll-
// reveal system), so no IntersectionObserver reveal logic is needed here.

export default function BackToTop() {
  const btnRef = useRef(null);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return undefined;

    let wasShown = false;
    const onWindowScroll = () => {
      const show = window.scrollY > 400;
      if (show && !wasShown) {
        btn.style.background = 'var(--dark)';
        btn.style.transform = '';
        btn.style.boxShadow = '0 4px 18px rgba(0,0,0,.25)';
        btn.classList.add('show');
      } else if (!show && wasShown) {
        btn.classList.remove('show');
      }
      wasShown = show;
    };

    window.addEventListener('scroll', onWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', onWindowScroll);
  }, []);

  const handleClick = (e) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
