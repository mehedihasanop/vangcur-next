// Security hardening pass (owner-requested review, 2026-07-27): every catch-block
// console.warn/console.error across lib/*.js printed raw Supabase error objects,
// including table names and Postgres error codes (e.g. "custom_products টেবিলে anon
// SELECT access নেই" or `error.code`). Anyone with DevTools open (F12) could read
// these and learn the backend schema — not an exploit by itself, but free
// reconnaissance a real attacker would want. This file is the single place every
// call site now routes through; logs still show up normally in local development
// (`npm run dev`), just not in the production build anyone visiting the live site sees.

const isDev = process.env.NODE_ENV !== 'production';

export function logWarn(...args) {
  if (isDev) console.warn(...args);
}

export function logError(...args) {
  if (isDev) console.error(...args);
}
