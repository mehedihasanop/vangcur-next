// Shared by app/components/cart/CartSidebar.js.
// Converted from 32-javascript-all.js:
// - `let cart=JSON.parse(...)` global state init (line ~100)
// - addToCart() stock-clamping half (lines ~1092-1111) — the showFloatCart()/
//   _triggerCartJiggle() DOM-effect half stays in the component (float-cart button
//   itself is a different, not-yet-built section — see CartSidebar.js note)
// - updateCartUI()/renderCartItems() data half (lines ~1113-1152) — markup lives in
//   CartSidebar.js, this file only computes total/count
// - _saveCartDebounced() (lines ~1146-1152)
// - updQty()/remItem() (lines ~1154-1160, 1162)
// - pagehide listener's cart-clearing half (lines ~1395-1402) — the poll/channel
//   cleanup half of that listener belongs to whichever component owns those,
//   not built yet, so isn't duplicated here

const CART_KEY = 'vc_cart';

export const CART_EVENT = 'vc:cartChange';
// Fired only on a successful addToCart (not on qty +/- or remove) — mirrors legacy
// _triggerCartJiggle(), which only ever runs from inside addToCart().
export const CART_ADD_EVENT = 'vc:cartAdd';
export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; }
}

function persist(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
}

export function saveCart(cart) {
  persist(cart);
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { cart } }));
}

// Legacy: _saveCartDebounced() — 300ms debounce, storage-write only (no CART_EVENT
// here; callers already know the new array and update their own state directly,
// exactly like updQty()/remItem() do below)
let _saveTimer = null;
function saveCartDebounced(cart) {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => persist(cart), 300);
}

export function cartCount(cart) {
  return cart.reduce((s, i) => s + i.qty, 0);
}

export function cartTotal(cart) {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

// Legacy: addToCart(id, qty) — needs the live product list for stock + display fields
// (name/price/image/cat), which this file doesn't fetch itself; caller passes it in.
export function addToCart(prods, id, qty) {
  const cart = getCart();
  const p = prods.find((x) => String(x.id) === String(id));
  if (!p) return { ok: false, cart };
  const currentQty = cart.find((x) => String(x.id) === String(id))?.qty || 0;
  const availableStock = p.stock - currentQty;
  if (availableStock <= 0) return { ok: false, reason: 'stock', cart };
  const addQty = Math.min(qty, availableStock);
  const ex = cart.find((x) => String(x.id) === String(id));
  if (ex) ex.qty += addQty;
  else cart.push({ id: p.id, name: p.name, emoji: p.imgs[0], price: p.price, qty: addQty, cat: p.cat });
  saveCart(cart);
  window.dispatchEvent(new CustomEvent(CART_ADD_EVENT));
  return { ok: true, cart };
}

// Legacy: updQty(id, d) — re-checks stock only when increasing (d>0)
export function updateQty(prods, id, delta) {
  let cart = getCart();
  const i = cart.find((x) => String(x.id) === String(id));
  if (i) {
    if (delta > 0) {
      const prod = prods.find((p) => String(p.id) === String(id));
      const maxStock = prod ? prod.stock : 9999;
      if (i.qty >= maxStock) return { ok: false, reason: 'stock', maxStock, cart };
    }
    i.qty += delta;
    if (i.qty <= 0) cart = cart.filter((x) => String(x.id) !== String(id));
  }
  saveCartDebounced(cart);
  return { ok: true, cart };
}

export function removeItem(id) {
  const cart = getCart().filter((x) => String(x.id) !== String(id));
  saveCartDebounced(cart);
  return cart;
}

// Legacy: pagehide listener — clears the cart on a real tab close/navigation-away,
// but NOT on a bfcache-eligible pagehide (e.persisted === true, e.g. back/forward
// or just switching tabs), matching legacy exactly.
export function clearCartOnRealPagehide() {
  const handler = (e) => {
    if (!e.persisted) persist([]);
  };
  window.addEventListener('pagehide', handler);
  return () => window.removeEventListener('pagehide', handler);
}
