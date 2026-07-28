// Used by app/product/[slug]/ProductDetailClient.js (client-side) and
// app/product/[slug]/page.js's generateMetadata (server-side, via getSupabaseServerClient()).
// Converted from 32-javascript-all.js:
// - window.fetchProdDetail(id) (lines ~500-530) — same single-row query + shape.
//   The `window._prodDetailCache` / `PRODS[idx] = {...}` mutation half is dropped:
//   this is a route now (owner's decision, see page.js), so every visit is a fresh
//   mount and there's no long-lived PRODS array to patch in place — the caller just
//   holds the merged product in its own component state instead.

function parseJsonish(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch (e) { return fallback; }
}

import { logWarn } from './logger';

export async function fetchProductDetail(supabase, id) {
  try {
    const { data, error } = await supabase
      .from('custom_products')
      .select('id,desc_text,long_desc,features,faqs,closing,specs')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      desc: data.desc_text || data.long_desc || '',
      longDesc: data.long_desc || data.desc_text || '',
      features: Array.isArray(data.features) ? data.features : parseJsonish(data.features, []),
      faqs: Array.isArray(data.faqs) ? data.faqs : parseJsonish(data.faqs, []),
      closing: data.closing || '',
      specs: parseJsonish(data.specs, data.specs || {}),
    };
  } catch (e) {
    logWarn('[Vangcur] fetchProductDetail failed:', e);
    return null;
  }
}
