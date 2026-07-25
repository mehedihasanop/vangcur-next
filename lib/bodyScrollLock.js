// Converted from 32-javascript-all.js: lockBody()/unlockBody() (lines ~106-132)
// "iOS Safari Body Scroll Fix" — plain overflow:hidden alone doesn't work on iOS
// Safari, so this pins the body with position:fixed at the current scroll offset
// and restores it (instantly, not smooth) on unlock.
//
// Shared by any full-screen overlay component (SearchPage now; ProductDetail,
// CartDrawer, LoginModal etc. later per VANGCUR_MASTER_PROMPT.md Priority 2/3).
// Module-level _bodyScrollY mirrors the legacy single global — safe because only
// one overlay is ever locked at a time in this app.

let _bodyScrollY = 0;

export function lockBody() {
  if (typeof document === 'undefined') return;
  if (document.body.dataset.locked) return;
  _bodyScrollY = window.scrollY;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${_bodyScrollY}px`;
  document.body.style.width = '100%';
  document.body.dataset.locked = '1';
}

export function unlockBody() {
  if (typeof document === 'undefined') return;
  if (!document.body.dataset.locked) return;
  const scrollY = _bodyScrollY || parseInt(document.body.style.top || '0', 10) * -1;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  delete document.body.dataset.locked;
  // Instant scroll restore — smooth animation would look broken here
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, scrollY);
  requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = ''; });
}
