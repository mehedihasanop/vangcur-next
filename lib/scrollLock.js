// Direct port of the iOS-Safari body-scroll-lock fix used throughout
// 32-javascript-all.js (lines ~106-131). Kept as a tiny shared module rather than
// re-implemented per component, since every overlay/modal in the legacy site calls
// these same two functions.

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
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, scrollY);
  requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = ''; });
}
