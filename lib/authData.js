// Shared by app/components/auth/LoginModal.js (and later 22-account-page.html /
// 23-order-overlay.html, which reuse these same exports rather than reimplementing them).
// Converted from 32-javascript-all.js:
// - currentUser global + 'vc_user' localStorage persistence (line ~100)
// - updateNavAuth() (lines ~105-112) — Navbar.js now renders straight off a `currentUser`
//   prop instead of mutating #navAuth's innerHTML; ClientHome owns the state and listens
//   for AUTH_EVENT below to know when it changes
// - _getLinkedAccounts/_saveLinkedAccounts/_saveLinkedAccount/switchToAccount
//   (lines ~2040-2078) — kept together here since they're all auth-session actions;
//   app/components/auth/AccountPage.js's switcher panel just calls getLinkedAccounts()/
//   switchToAccount() and renders the list.
// - doLogin() (~160-205) / doRegister() (~207-250) / loginWithGoogle()+handleOAuthCallback()
//   (~260-310) — the Supabase calls are extracted as pure functions here; LoginModal.js
//   owns the form state/validation/UI and calls these.
// - syncWishlistFromSupabase()/saveWishlistToSupabase() (~7034-7056) — cross-device
//   wishlist sync. This is exactly the piece lib/productData.js's saveWishlist() and
//   WishlistDrawer.js's comments flagged as "needs currentUser from login, not built yet".
//   Rather than importing this file into lib/productData.js (which would need to import
//   back for getWishlist — circular), LoginModal.js itself listens for WISHLIST_EVENT
//   and calls saveWishlistToSupabase() when a user is signed in. Same result, no cycle.
// - mergeGuestOrdersToUser() (~6373-6401) — the localStorage half is fully live today;
//   the `.from('orders').update(...)` half simply has nothing to do until
//   23-order-overlay.html (Priority 3) starts writing 'vc_guest_orders'.

import { logWarn } from './logger';

export const AUTH_EVENT = 'vc:authChange';

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('vc_user') || 'null'); } catch (e) { return null; }
}

export function saveCurrentUser(user) {
  try {
    if (user) localStorage.setItem('vc_user', JSON.stringify(user));
    else localStorage.removeItem('vc_user');
  } catch (e) {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { user } }));
  }
}

export async function logout(supabase) {
  try { await supabase.auth.signOut(); } catch (e) {}
  saveCurrentUser(null);
}

// ── Linked accounts — multi-account switcher storage, used by app/components/auth/AccountPage.js ──
export function getLinkedAccounts() {
  try { return JSON.parse(localStorage.getItem('vc_linked_accounts') || '[]'); } catch (e) { return []; }
}
function saveLinkedAccounts(list) {
  try { localStorage.setItem('vc_linked_accounts', JSON.stringify(list)); } catch (e) {}
}
export function saveLinkedAccount(user, session) {
  if (!user || !user.email) return;
  const initials = (user.name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const accounts = getLinkedAccounts().filter((a) => a.email !== user.email);
  accounts.unshift({
    email: user.email,
    name: user.name || 'Customer',
    initials,
    access_token: (session && session.access_token) || '',
    refresh_token: (session && session.refresh_token) || '',
  });
  saveLinkedAccounts(accounts.slice(0, 5)); // legacy: keep max 5
}

// Legacy: switchToAccount(email) (~2060-2078) — swaps the active Supabase session to a
// previously-linked account using its cached refresh token
export async function switchToAccount(supabase, email) {
  const accounts = getLinkedAccounts();
  const acct = accounts.find((a) => a.email === email);
  if (!acct || !acct.refresh_token) return { error: 'expired' };
  try {
    const { data, error } = await supabase.auth.setSession({ access_token: acct.access_token, refresh_token: acct.refresh_token });
    if (error || !data.session) return { error: 'expired' };
    const u = data.session.user;
    const safeUser = { id: u.id, email: u.email, name: u.user_metadata?.name || acct.name || 'Customer', phone: u.user_metadata?.phone || '' };
    saveCurrentUser(safeUser);
    saveLinkedAccount(safeUser, data.session);
    return { user: safeUser };
  } catch (e) { return { error: 'failed' }; }
}

// ── Password reset (owner-requested, 2026-07-27) ──
// Two-step flow: requestPasswordReset() emails a recovery link; the link lands on
// /reset-password (a dedicated route, not a modal — the user arrives from an email
// in a fresh tab/session, so a modal over a "logged out" homepage doesn't make sense),
// which then calls updatePassword() once Supabase has established the recovery session.
//
// Security notes:
// - redirectTo uses window.location.origin (same pattern LoginModal.js's Google OAuth
//   already uses) rather than anything derived from a request header — that's what
//   actually matters for "password reset poisoning" (the redirectTo is the real
//   browser's own origin, not attacker-suppliable). The actual defense against a
//   malicious redirectTo is Supabase's own Redirect URL allow-list (Dashboard →
//   Authentication → URL Configuration) — only origins listed there are ever honored,
//   regardless of what a script passes in.
// - requestPasswordReset() never reveals whether the email exists — Supabase's
//   resetPasswordForEmail() itself doesn't error on an unknown email, and the caller
//   (LoginModal.js) shows the same "check your email" message either way.
export async function requestPasswordReset(supabase, email) {
  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  } catch (e) { logWarn('[Vangcur] requestPasswordReset:', e); }
  return true; // always "succeeds" from the caller's perspective — see note above
}

export async function updatePassword(supabase, newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error };
}


export async function signInWithPassword(supabase, email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(supabase, { name, phone, email, password }) {
  return supabase.auth.signUp({ email, password, options: { data: { name, phone } } });
}

// path lets a caller land back somewhere other than the homepage after the Google
// redirect — checkout/page.js's preConfirmGoGoogle() passes '/checkout' so the
// pending-order resume effect there runs on return, instead of on ClientHome.
export async function signInWithGoogle(supabase, path = '') {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vangcur.netlify.app';
  const redirectTo = origin + path;
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  return { error };
}

// Legacy: handleOAuthCallback() ran as an IIFE the moment the script loaded. Here
// LoginModal.js calls this once from its own mount effect instead — it's always
// mounted in ClientHome (same as WishlistDrawer/CartSidebar), just hidden via isOpen,
// so it's present in time to catch the post-redirect session just like the legacy IIFE was.
export async function checkOAuthCallback(supabase) {
  const { data, error } = await supabase.auth.getSession();
  const session = data && data.session;
  if (error || !session) return null;
  if (session.user && session.user.is_anonymous) return null;
  const u = session.user;
  const safeUser = {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'Customer'),
    phone: u.user_metadata?.phone || '',
    avatar: u.user_metadata?.avatar_url || '',
    provider: u.app_metadata?.provider || 'google',
  };
  const existing = getCurrentUser();
  if (existing && existing.id === safeUser.id) return null; // already applied, nothing new
  saveLinkedAccount(safeUser, session);
  if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  return safeUser;
}

// ── Cross-device wishlist sync (needs currentUser, so it lives here rather than
//    lib/productData.js — see the file-header note above) ──
export async function syncWishlistFromSupabase(supabase, userId) {
  try {
    const { data } = await supabase.from('wishlists').select('items').eq('user_id', userId).single();
    return (data && data.items) || null;
  } catch (e) { return null; }
}

export async function saveWishlistToSupabase(supabase, userId, items) {
  try {
    await supabase.from('wishlists').upsert({ user_id: userId, items }, { onConflict: 'user_id' });
  } catch (e) { logWarn('[Vangcur] wishlist Supabase sync failed:', e); }
}

// ── Guest → account order merge ──
export async function mergeGuestOrdersToUser(supabase, userEmail, userId) {
  try {
    const guestOrders = JSON.parse(localStorage.getItem('vc_guest_orders') || '[]');
    if (!guestOrders.length) return;
    const tagged = guestOrders.map((o) => ({ ...o, userId, userEmail, mergedFromGuest: true }));
    const mainOrders = JSON.parse(localStorage.getItem('vc_orders') || '[]');
    const existingIds = new Set(mainOrders.map((o) => o.id));
    const newOnes = tagged.filter((o) => !existingIds.has(o.id));
    if (newOnes.length) {
      localStorage.setItem('vc_orders', JSON.stringify([...mainOrders, ...newOnes]));
      localStorage.removeItem('vc_guest_orders');
    }
    const orderNums = guestOrders.map((o) => o.orderNum).filter(Boolean);
    if (orderNums.length) {
      const { error } = await supabase.from('orders').update({ user_id: userId, customer_email: userEmail }).in('order_num', orderNums);
      if (error) logWarn('[Vangcur] guest order merge error:', error);
    }
  } catch (e) { logWarn('[Vangcur] mergeGuestOrdersToUser exception:', e); }
                                            }
