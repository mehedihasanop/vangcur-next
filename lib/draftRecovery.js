// Converted for 38-abandoned-draft-recovery-toast.html.
//
// The extracted section 38 only covered the *reading*/display side (getDraft,
// the eligibility/timing checks, dismiss/continue handlers) — the *saving* side
// was never captured in any of the 42 legacy sections. Per the owner, that's
// because it never existed in the newer (Supabase-era) code at all: the
// recovery-toast save step lived somewhere in 32-javascript-all.js outside any
// numbered section, or was simply undocumented by the time of extraction.
//
// Per the owner, the *original* (pre-Supabase) system worked like this:
// - Step-1 drop-offs and step-2 abandons were logged to a Google Sheet for
//   manual follow-up only — never surfaced in the admin panel. That's
//   lib/leadCapture.js, wired up separately in app/checkout/page.js.
// - The toast shown to a *returning* customer was always a separate, purely
//   client-side mechanism, independent of that sheet. This file is that
//   mechanism, reimplemented fresh: localStorage only, matching the shape and
//   timing rules (15-day expiry, next-day-only reappearance, per-draft dismiss
//   memory) the extracted toast-reading code already expects.

const DRAFT_KEY = 'vc_abandoned_draft';

export function getDraft() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  } catch (e) {
    return null;
  }
}

// Called from app/checkout/page.js whenever the form has enough to be worth
// recovering later (phone + at least one cart item). Keeps the original id/
// createdAt across repeated calls so the 15-day/next-day rules below anchor to
// when the customer *first* started this attempt, not their latest keystroke.
export function saveDraft({ name, phone, dist, addr, email, items, ship }) {
  if (typeof window === 'undefined') return;
  if (!phone || !Array.isArray(items) || items.length === 0) return;
  try {
    const existing = getDraft();
    const id = existing?.id || `dr_${Date.now()}`;
    const createdAt = existing?.createdAt || Date.now();
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ id, name, phone, dist, addr, email, items, ship, createdAt })
    );
  } catch (e) {
    // ignore — best effort
  }
}

export function clearDraft() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    // ignore
  }
}

// _showToastIfEligible()'s timing/expiry rules (32-javascript-all.js
// ~1777-1830), minus the DOM writes — those live in RecoveryToast.js. Returns
// the draft if it should be shown right now, else null.
export function eligibleDraft() {
  const draft = getDraft();
  if (!draft) return null;

  const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;
  if (Date.now() - draft.createdAt > FIFTEEN_DAYS) {
    clearDraft();
    return null;
  }

  const createdHour = new Date(draft.createdAt).getHours();
  const nextDay = new Date(draft.createdAt);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setSeconds(0);
  nextDay.setMinutes(0);
  nextDay.setHours(createdHour < 18 ? 1 : 13);
  if (Date.now() < nextDay.getTime()) return null;

  try {
    if (localStorage.getItem(`vc_popup_dismissed_${draft.id}`)) return null;
  } catch (e) {
    // ignore
  }

  return draft;
}

// isUserDismiss=false (the ✕ close button, legacy dismissRecoveryToast() with
// no argument): just hide it for this visit — legacy stored nothing in that
// branch either, so it can resurface next time eligibleDraft() passes.
// isUserDismiss=true ("এখন নয়"): legacy either deleted the draft (guest) or
// set a per-id dismissed flag (logged-in, so other devices via Supabase stayed
// in sync). This project has no Supabase draft table to keep in sync, so both
// cases collapse into one: delete the draft entirely — "not now" means stop
// suggesting this one.
export function dismissDraft(draftId, isUserDismiss) {
  if (typeof window === 'undefined' || !isUserDismiss) return;
  clearDraft();
}
