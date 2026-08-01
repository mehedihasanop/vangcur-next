// Legacy's _scheduleNotificationToasts(delayMs) (32-javascript-all.js ~2245-2255) was
// a single function: after the delay, it called _tryShowBISToast() and only fired
// triggerDraftRecoveryToast() if that returned false — the two toasts were always
// mutually exclusive, back-in-stock taking priority.
//
// Here those two toasts are separate self-scheduling components (BackInStockToast.js,
// RecoveryToast.js — mirroring how every other GlobalOverlays.js entry owns its own
// open/close state) rather than one merged component, so each is independently
// editable/testable like the rest of the file. That split loses the single-function
// ordering guarantee, so this module restores it: BackInStockToast decides first
// (it needs its own async product-list fetch to know whether it has anything to show)
// and reports that decision here; RecoveryToast waits for that report before checking
// its own eligibility.
//
// A max wait is included so a slow/failed product fetch in BackInStockToast can never
// permanently block the recovery toast from ever showing.

let claimed = null; // null | 'bis' | 'recovery'
let bisDecided = false;
let waiters = [];

function resolveWaiters() {
  waiters.forEach((fn) => fn());
  waiters = [];
}

// Called by BackInStockToast once it knows (after its product fetch + the legacy
// delay both resolve) whether it found a candidate to show.
export function reportBisDecision(didShow) {
  bisDecided = true;
  if (didShow) claimed = 'bis';
  resolveWaiters();
}

// Called by RecoveryToast before checking eligibility. Resolves as soon as
// BackInStockToast has reported its decision, or after MAX_WAIT_MS regardless —
// whichever comes first.
const MAX_WAIT_MS = 3000;

export function waitForBisDecision() {
  if (bisDecided) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, MAX_WAIT_MS);
    waiters.push(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

export function isSlotTaken() {
  return claimed !== null;
}

export function claimSlot(id) {
  if (claimed) return false;
  claimed = id;
  return true;
}
