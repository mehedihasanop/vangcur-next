// Direct port of showToast() — 32-javascript-all.js line ~6962. Uses the static
// `<div className="toast" id="toast"></div>` already rendered once in ClientHome.js,
// exactly like the legacy site does, so no new Toast component/portal is needed.

export function showToast(message) {
  if (typeof document === 'undefined') return;
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}
