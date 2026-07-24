// Shared between app/components/home/ProductGrid.js and ProductCard.js
// Converted from 32-javascript-all.js:
// - const PRODS (hardcoded defaults, legacy lines ~23-38)
// - applyProdOrder() (legacy lines ~52-68)
// - prodInCat() (legacy line ~3603)
// - GRID_COLS + _fetchCustomProds() custom_products mapping (legacy lines ~965-1054)
// - store-all-watch realtime INSERT/UPDATE/DELETE mapping for custom_products (legacy lines ~1179-1237)
// - getWishlist/saveWishlist/isWishlisted/toggleWish (legacy lines ~7059-7081, localStorage-only —
//   the Supabase cross-device sync half of toggleWish lives with account/login, not built yet)

export const DEFAULT_PRODS = [
  { id: 1, cat: 'rgb', cats: ['rgb'], name: 'GearUP NRGB50 5M RGB Neon Light with App & Remote Control',
    imgs: ['💡', '🌟', '✨'], price: 1490, old: 1800,
    specs: { 'দৈর্ঘ্য': '৫ মিটার', 'ধরন': 'Neon Flex', 'নিয়ন্ত্রণ': 'App + Remote', 'ভোল্টেজ': 'DC 12V / 220V', 'রং': '16 Million Color' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 20, rating: 4.5, discountColor: '',
    desc: 'GearUP NRGB50 প্রিমিয়াম মানের ৫ মিটার RGB নিয়ন লাইট। অ্যাপ ও রিমোট উভয়ে নিয়ন্ত্রণযোগ্য। ঘরের সাজসজ্জায় অসাধারণ আলোর পরিবেশ তৈরি করে।',
    _detailLoaded: false },
  { id: 4, cat: 'smartwatch', cats: ['smartwatch'], name: 'GearUP GT4 Pro Smartwatch AMOLED Display',
    imgs: ['⌚', '📱'], price: 2490, old: 3200,
    specs: { 'ডিসপ্লে': '1.96" AMOLED', 'ব্যাটারি': '300mAh', 'কল': 'হ্যাঁ', 'স্বাস্থ্য': 'HR + SpO2 + BP', 'ওয়াটার': 'IP68' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 18, rating: 4.5, discountColor: '',
    desc: 'প্রিমিয়াম AMOLED ডিসপ্লে সহ স্মার্টওয়াচ। হার্ট রেট, অক্সিজেন, ব্লাড প্রেশার মনিটরিং।',
    _detailLoaded: false },
  { id: 14, cat: 'powerbank', cats: ['powerbank'], name: 'GearUP PB20K 20000mAh Fast Charge Power Bank',
    imgs: ['🔋'], price: 1690, old: 2200,
    specs: { 'ক্যাপাসিটি': '20000mAh', 'আউটপুট': '22.5W PD', 'পোর্ট': 'USB-A + USB-C', 'ডিসপ্লে': 'LED Indicator', 'ওজন': '450g' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 20, rating: 4.5, discountColor: '',
    desc: 'বড় ক্যাপাসিটির ফাস্ট চার্জ পাওয়ার ব্যাংক। স্মার্টফোন ৪-৫ বার চার্জ।',
    _detailLoaded: false },
  { id: 24, cat: 'tws', cats: ['tws'], name: 'GearUP TWS ANC Pro Noise Cancelling Earbuds',
    imgs: ['🎧'], price: 1890, old: 2500,
    specs: { 'ড্রাইভার': '13mm Dynamic', 'ANC': 'Active Noise Cancelling', 'ব্যাটারি': '6+30h', 'সংযোগ': 'Bluetooth 5.3', 'পানি': 'IPX5' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 20, rating: 4.5, discountColor: '',
    desc: 'ANC ফিচার সহ প্রিমিয়াম TWS ইয়ারবাড। বাইরের শব্দ বন্ধ করে মিউজিক উপভোগ।',
    _detailLoaded: false },
  { id: 34, cat: 'headphone', cats: ['headphone'], name: 'GearUP HP80 Over-Ear ANC Headphone',
    imgs: ['🎵'], price: 2990, old: 3800,
    specs: { 'ড্রাইভার': '40mm', 'ANC': 'Hybrid ANC', 'ব্যাটারি': '30h', 'সংযোগ': 'BT5.3 + 3.5mm', 'ভাঁজ': 'Foldable' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 15, rating: 4.5, discountColor: '',
    desc: 'Hybrid ANC হেডফোন। ৩০ ঘণ্টার ব্যাটারি ব্যাকআপ।',
    _detailLoaded: false },
  { id: 44, cat: 'acrylic', cats: ['acrylic'], name: 'GearUP AL-Love Heart Acrylic LED Lamp',
    imgs: ['🪔', '❤️'], price: 790, old: 1100,
    specs: { 'ডিজাইন': 'Heart Shape', 'আলো': 'RGB 16 Colors', 'নিয়ন্ত্রণ': 'Touch + Remote', 'পাওয়ার': 'USB', 'সাইজ': '15cm' },
    warranty: '১ সপ্তাহ রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 30, rating: 4.5, discountColor: '',
    desc: 'হার্ট শেপের রোমান্টিক অ্যাক্রিলিক ল্যাম্প। উপহার হিসেবে আদর্শ।',
    _detailLoaded: false },
  { id: 54, cat: 'fan', cats: ['fan'], name: 'GearUP RF12 12-Inch Rechargeable Table Fan',
    imgs: ['💨'], price: 1990, old: 2600,
    specs: { 'সাইজ': '12 Inch', 'ব্যাটারি': '8000mAh', 'রানটাইম': '8–12 ঘণ্টা', 'স্পিড': '৩ স্তর', 'চার্জ': 'USB-C' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 0, rating: 4.5, discountColor: '',
    desc: 'লোডশেডিংয়ে আদর্শ রিচার্জেবল টেবিল ফ্যান।',
    _detailLoaded: false },
];

const DEFAULT_IDS = new Set([1, 4, 14, 24, 34, 44, 54]);

// Legacy: prodInCat(p, catId) — multi-category support (`cats` array) falls back to single `cat`
export function prodInCat(p, catId) {
  if (catId === 'all') return true;
  if (Array.isArray(p.cats) && p.cats.length) return p.cats.includes(catId);
  return p.cat === catId;
}

// Legacy: applyProdOrder(orderArr) — pure version (returns a new sorted array instead of mutating PRODS in place)
export function applyProdOrder(prods, orderArr) {
  let order = orderArr || null;
  if (typeof order === 'string' && (order.startsWith('[') || order.startsWith('{'))) {
    try { order = JSON.parse(order); } catch (e) { order = null; }
  }
  if (!Array.isArray(order) || !order.length) return prods;
  const orderMap = {};
  order.forEach((id, i) => { orderMap[id] = i; });
  return [...prods].sort((a, b) => {
    const ia = orderMap[a.id] !== undefined ? orderMap[a.id] : 99999;
    const ib = orderMap[b.id] !== undefined ? orderMap[b.id] : 99999;
    return ia - ib;
  });
}

function parseJsonish(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch (e) { return fallback; }
}

// Legacy: shared mapping used by _fetchCustomProds() and the INSERT/UPDATE realtime handlers
export function mapCustomProduct(p) {
  const specs = parseJsonish(p.specs, p.specs || {});
  let imgs = p.imgs;
  if (typeof imgs === 'string') imgs = parseJsonish(imgs, imgs ? [imgs] : ['📦']);
  if (!Array.isArray(imgs) || !imgs.length) imgs = ['📦'];
  return {
    id: p.id,
    cat: p.cat || 'rgb',
    cats: p.cats || [p.cat || 'rgb'],
    name: p.name || '',
    price: Number(p.price) || 0,
    old: Number(p.old) || Number(p.price) || 0,
    stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
    badge: p.badge || '',
    discountColor: (specs && specs._discount_color) || p.discountColor || '',
    warranty: p.warranty || '৭ দিন',
    rating: Number(p.rating) || 4.5,
    imgs,
    specs,
    desc: p.desc_text || p.desc || '',
    longDesc: p.long_desc || p.desc_text || p.desc || '',
    features: Array.isArray(p.features) ? p.features : [],
    faqs: Array.isArray(p.faqs) ? p.faqs : [],
    closing: p.closing || '',
    _detailLoaded: !!(p.long_desc || p.features || p.faqs),
  };
}

const GRID_COLS = 'id,cat,cats,name,price,old,stock,badge,warranty,rating,imgs,specs';

// Legacy: _fetchCustomProds() — retry x3, RLS errors abort early instead of retrying
export async function fetchCustomProducts(supabase) {
  let attempt = 0;
  const MAX_ATTEMPTS = 3;
  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    try {
      const { data: sbProds, error } = await supabase
        .from('custom_products')
        .select(GRID_COLS)
        .order('id', { ascending: true });

      if (error) {
        console.warn('[Vangcur] custom_products fetch error (attempt ' + attempt + '):', error.message, '| code:', error.code);
        if (error.code === '42501' || error.code === 'PGRST116' || error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('[Vangcur] ❌ RLS/Permission error — custom_products টেবিলে anon SELECT access নেই।');
          return [];
        }
        if (attempt < MAX_ATTEMPTS) { await new Promise((r) => setTimeout(r, 1200 * attempt)); continue; }
        return [];
      }
      if (!sbProds || !sbProds.length) return [];
      return sbProds.map(mapCustomProduct);
    } catch (e) {
      console.warn('[Vangcur] custom_products exception (attempt ' + attempt + '):', e);
      if (attempt < MAX_ATTEMPTS) { await new Promise((r) => setTimeout(r, 1200 * attempt)); }
    }
  }
  return [];
}

// Legacy: merges custom_products rows into PRODS (push new / patch existing) — pure version
export function mergeCustomProducts(defaults, customRows) {
  const list = [...defaults];
  customRows.forEach((mapped) => {
    const idx = list.findIndex((x) => String(x.id) === String(mapped.id));
    if (idx > -1) list[idx] = { ...list[idx], ...mapped };
    else list.push(mapped);
  });
  return list;
}

// Legacy: store-all-watch realtime channel, custom_products slice only
// (store_settings / wishlists slices belong to Categories/CatBar and the future
// account/wishlist components respectively — kept out of this subscription on purpose)
export function subscribeCustomProducts(supabase, { onInsert, onUpdate, onDelete }) {
  const channel = supabase
    .channel('products-grid-watch')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'custom_products' }, (payload) => {
      if (payload.new) onInsert(mapCustomProduct(payload.new));
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'custom_products' }, (payload) => {
      if (payload.new && payload.new.id !== undefined) onUpdate(mapCustomProduct(payload.new));
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'custom_products' }, (payload) => {
      if (payload.old && payload.old.id !== undefined) onDelete(payload.old.id);
    })
    .subscribe();
  return channel;
}

export function isDefaultProductId(id) {
  return DEFAULT_IDS.has(id);
}

// ── Wishlist (localStorage only — Supabase cross-device sync needs the login/account
//    component, not built yet; hooking that in later won't change this API) ──
export function getWishlist() {
  try { return JSON.parse(localStorage.getItem('vc_wish') || '[]'); } catch (e) { return []; }
}

export function saveWishlist(w) {
  try { localStorage.setItem('vc_wish', JSON.stringify(w)); } catch (e) {}
  window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: { wishlist: w } }));
}

export function isWishlisted(id) {
  return getWishlist().some((x) => String(x.id) === String(id));
}

// Legacy: toggleWish(id, btn) — DOM-mutation half removed, caller (ProductCard) owns its own UI state
export function toggleWish(prod) {
  let w = getWishlist();
  const already = isWishlisted(prod.id);
  if (already) {
    w = w.filter((x) => String(x.id) !== String(prod.id));
  } else {
    w.push({ id: prod.id, name: prod.name, emoji: prod.imgs[0], price: prod.price, cat: prod.cat });
  }
  saveWishlist(w);
  return !already; // returns new wishlisted state
}

// Cross-component event names (mirrors CATEGORY_FILTER_EVENT convention in categoryData.js).
// PRODUCT_OPEN / QUICK_ORDER / QUICK_CART / STOCK_NOTIFY have no listener yet — their
// overlays (19-product-full-page, 23-order-overlay, 20-cart-sidebar, 40-stock-notify-modal)
// are still ⏳ বাকি per the master prompt's progress table. ProductCard dispatches them now
// so wiring those overlays later is just "add a listener", not touching this file again.
export const WISHLIST_EVENT = 'vc:wishlistChange';
export const PRODUCT_OPEN_EVENT = 'vc:openProduct';
export const QUICK_ORDER_EVENT = 'vc:quickOrder';
export const QUICK_CART_EVENT = 'vc:quickCart';
export const STOCK_NOTIFY_EVENT = 'vc:stockNotify';
