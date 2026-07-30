'use client';

// ✅ Visitor & Product View Tracking
// Next.js port of legacy index.html's DOMContentLoaded visitor-tracking block
// (page_views table), plus the new per-product-view tracking added to the
// legacy openPP() function.
//
// visitor_id: localStorage-based anonymous id, shared across all routes.
// - trackDailyVisit(): one row per visitor per calendar day (page_views: {visitor_id})
//   -> drives the "আজকের ভিজিটর" stat card + traffic trend chart in admin.html
// - trackProductView(): one row every time a product detail page is opened
//   (page_views: {visitor_id, product_id}) -> drives "সর্বাধিক দেখা প্রোডাক্ট"
//   in the admin Traffic Analytics page
//
// ⚠️ Requires a `product_id` column on the Supabase `page_views` table:
//   ALTER TABLE page_views ADD COLUMN IF NOT EXISTS product_id text;

const VISITOR_KEY = 'vc_visitor_id';
const LAST_VISIT_KEY = 'vc_last_visit_date';

function getVisitorId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = 'vis_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

// প্রতিদিন একবার (প্রথম ভিজিটে) ইউনিক ভিজিটর লগ করে — legacy visitor-tracking এর হুবহু আচরণ
export function trackDailyVisit(supabase) {
  try {
    const visitorId = getVisitorId();
    if (!visitorId || !supabase) return;
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    if (lastVisit !== todayStr) {
      supabase.from('page_views').insert({ visitor_id: visitorId }).then(({ error }) => {
        if (!error) localStorage.setItem(LAST_VISIT_KEY, todayStr);
      }).catch(() => {});
    }
  } catch (_e) { /* silent — analytics never blocks the UI */ }
}

// প্রোডাক্ট ডিটেইল পেজ খোলার প্রতিবার (throttle ছাড়া) লগ করে
export function trackProductView(supabase, productId) {
  try {
    const visitorId = getVisitorId();
    if (!visitorId || !supabase || productId == null) return;
    supabase.from('page_views').insert({ visitor_id: visitorId, product_id: productId }).catch(() => {});
  } catch (_e) { /* silent — analytics never blocks the UI */ }
}
