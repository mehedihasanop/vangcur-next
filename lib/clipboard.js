// Small shared helper: legacy copyOrderNum() (32-javascript-all.js lines ~5722-5734)
// used the clipboard API with a textarea fallback in a couple of places
// (WaitingPage.js already has its own inline copy of this logic; new components can
// use this instead of duplicating it again).

export function copyTextWithFallback(text, onDone) {
  if (!text) return;
  const fallback = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      onDone?.();
    } catch (e) { /* noop */ }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => onDone?.()).catch(fallback);
  } else {
    fallback();
  }
}
