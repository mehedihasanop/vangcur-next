// Converted from 32-javascript-all.js: _tryShowBISToast()/dismissBISToast()/
// orderFromBISToast()/_orderFromBISToastSafe() (lines ~1800-1880),
// 41-back-in-stock-toast.html. Pure scanning/dismiss logic lives here so
// BackInStockToast.js (the component) stays presentation-only, matching the
// stockNotifyData.js/membershipData.js split used elsewhere.
//
// Legacy scanned the single always-in-memory `PRODS` global directly. There is no
// equivalent global here — product data is fetched per-page (ProductGrid.js owns its
// own DEFAULT_PRODS + custom_products fetch/merge) and this toast is mounted at the
// root layout tier (GlobalOverlays.js), reachable before any page-level product fetch
// has necessarily happened. So the component fetches its own copy the same way
// ProductGrid.js does (fetchCustomProducts + mergeCustomProducts, both already in
// lib/productData.js) rather than reading a shared global — see that component's
// header note.

// Scans every 'vc_sn_' localStorage key (written by lib/stockNotifyData.js's
// submitStockNotify()) against the given already-loaded product list, skipping any
// product already permanently dismissed via 'vc_bis_dismissed_'. Returns the first
// match — legacy also only ever shows one candidate at a time, first-match-wins by
// localStorage iteration order — or null if nothing currently qualifies.
export function findBackInStockCandidate(prods) {
  if (typeof window === 'undefined') return null;

  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('vc_sn_')) keys.push(k);
    }
  } catch (e) {
    return null;
  }
  if (!keys.length) return null;

  for (const key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      const pid = data.prodId;
      if (!pid) continue;
      if (localStorage.getItem('vc_bis_dismissed_' + pid)) continue;
      const prod = prods.find((p) => String(p.id) === String(pid));
      if (!prod || prod.stock <= 0) continue;

      const dateStr = data.ts
        ? new Date(data.ts).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })
        : '';
      return { prod, notifKey: key, dateStr };
    } catch (e) {
      continue;
    }
  }
  return null;
}

// permanent=false (✕ close button, legacy dismissBISToast(false)): just hides the
// toast for this page view — nothing written to localStorage, so it can reappear on
// a later page load. permanent=true ("এখন না" / "অর্ডার করুন", legacy
// dismissBISToast(true) and the duplicated inline logic in
// _orderFromBISToastSafe()): marks the product permanently dismissed and removes the
// original stock-notify request key so it drops out of AccountPage.js's subscribed
// list too, matching legacy exactly.
export function dismissBackInStock(prod, notifKey, permanent) {
  if (permanent && prod) {
    try {
      localStorage.setItem('vc_bis_dismissed_' + String(prod.id), '1');
    } catch (e) {}
  }
  if (permanent && notifKey) {
    try {
      localStorage.removeItem(notifKey);
    } catch (e) {}
  }
}
