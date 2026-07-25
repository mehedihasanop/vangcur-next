// Converted from 32-javascript-all.js: showToast(m) (line ~6962)
// The #toast element itself already exists in app/ClientHome.js
// (`<div className="toast" id="toast"></div>`) — no component had a reason to
// drive it yet until now. Kept as a plain DOM helper (not React state) because
// that's exactly what the legacy function did, and every future component that
// needs a toast can just import this instead of re-deriving it.

export function showToast(message) {
  if (typeof document === 'undefined') return;
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(t._vcToastTimer);
  t._vcToastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
