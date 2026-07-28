// Owner-requested (2026-07-27): register/reset-password forms should show a
// strength meter and refuse to submit a weak password. zxcvbn (the library Dropbox
// open-sourced) scores 0-4 based on real crack-time estimation, not just length/
// character-class counting, so it catches things like "Dhaka12345" that a naive
// regex-based checker would call "strong".

// Owner-requested (2026-07-27): register/reset-password forms should show a
// strength meter and refuse to submit a weak password. zxcvbn (the library Dropbox
// open-sourced) scores 0-4 based on real crack-time estimation, not just length/
// character-class counting, so it catches things like "Dhaka12345" that a naive
// regex-based checker would call "strong".
//
// PERF NOTE: zxcvbn's dictionary data is genuinely large (~800KB, confirmed by a
// build-size check before/after adding it) — too heavy to ship in every page's
// initial bundle just for two forms most visitors never open. Loaded via dynamic
// import() instead, so it's only fetched the moment someone actually focuses a
// password field on the register or reset-password form. checkPasswordStrength() is
// async because of this — callers (PasswordStrengthMeter.js, LoginModal.js's
// doRegister, ResetPasswordClient.js) all await it.

export const MIN_SCORE = 3; // 0-4 scale; 3 = "good", 4 = "very strong"

const LABELS = ['খুবই দুর্বল', 'দুর্বল', 'মোটামুটি', 'ভালো', 'শক্তিশালী'];
const COLORS = ['#DC2626', '#F59E0B', '#F59E0B', '#16A34A', '#15803D'];

let zxcvbnPromise = null;
function loadZxcvbn() {
  if (!zxcvbnPromise) zxcvbnPromise = import('zxcvbn').then((m) => m.default || m);
  return zxcvbnPromise;
}

export async function checkPasswordStrength(password) {
  const minLenOk = password.length >= 8;
  if (!password) return { score: 0, label: '', color: '#E5E7EB', ok: false, minLenOk: false };
  const zxcvbn = await loadZxcvbn();
  const result = zxcvbn(password);
  return {
    score: result.score,
    label: LABELS[result.score],
    color: COLORS[result.score],
    ok: minLenOk && result.score >= MIN_SCORE,
    minLenOk,
    warning: result.feedback?.warning || '',
  };
}

