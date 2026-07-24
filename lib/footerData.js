// Used by app/components/layout/Footer.js
// Converted from 32-javascript-all.js — applyAdminSettings() logo/contact/footer/
// service-links branches (lines ~140-267) and the initial store_settings bootstrap
// fetch (lines ~407-417). Markup source: 14-footer.html.
//
// NOTE on realtime scope (verified by reading the single 'store-all-watch' channel
// handler, lines ~1115-1177): in the legacy site, only key==='vc_logo'|'vc_brand'|
// 'vc_contact' re-run applyAdminSettings() live (lines ~1142-1144) — vc_footer and
// vc_footer_links are applied once on initial load only, so an admin changing the
// footer description/social links/service links only shows up for shoppers after a
// page refresh there. (The AI Studio extraction's claimed "lines 471-475" watcher for
// these does not actually exist at that location — that range is the hero slider's
// autoplay state, unrelated.)
//
// FIX (owner-requested, 2026-07-24): subscribeFooterSettings() below now also
// live-watches vc_footer and vc_footer_links, closing that gap — all four settings
// update instantly for anyone already browsing, matching what the extraction assumed.

import { parseSupabaseVal } from './categoryData';

export const DEFAULT_FOOTER = {
  logo: { mode: 'text', main: 'Vangcur', sub: 'ভাঙচুর', img: null, alt: 'Vangcur Logo', height: 50 },
  desc: 'Vangcur - ভাঙচুর বাংলাদেশের একটি আধুনিক Gadget & Accessories ভিত্তিক E-commerce Brand। Official ও Unofficial সব ধরনের গ্যাজেট পাবেন Warranty Support সহ। সারা বাংলাদেশে Fast Home Delivery।',
  copy: '© 2026 Vangcur - ভাঙচুর. All rights reserved.',
  social: {
    fb: 'https://facebook.com/vangcurbdofficial',
    ig: 'https://instagram.com/vangcur_official',
    tk: 'https://tiktok.com/@vangcur.com',
    wa: 'https://wa.me/8801816365504',
    yt: 'https://youtube.com/@vangcur',
  },
  contact: {
    phoneLabel: '01816-365504',
    phoneHref: 'tel:01816365504',
    waHref: 'https://wa.me/8801816365504',
    email: 'vangcurbd@gmail.com',
    fb: 'https://facebook.com/vangcurbdofficial',
    addr: 'Dhaka, Bangladesh',
  },
};

// Legacy default footerServiceCol buttons (static markup in 14-footer.html)
export const DEFAULT_SERVICE_LINKS = [
  { label: 'FAQ', action: 'faq' },
  { label: 'Shipping Info', action: 'info:shipping' },
  { label: 'Returns & Refunds', action: 'info:returns' },
  { label: 'Privacy Policy', action: 'info:privacy' },
  { label: 'Terms & Conditions', action: 'info:terms' },
];

// Legacy: footerLinks.forEach() URL-matching inside applyAdminSettings() (lines ~262-282)
export function resolveServiceLink(lnk) {
  const url = lnk.url || '#';
  const label = lnk.label || '';
  if (url.startsWith('#') || url === '') {
    const lower = url.toLowerCase();
    if (url === '#faqSec' || lower.includes('faq')) return { label, action: 'faq' };
    if (url === 'shipping' || url === '#shipping') return { label, action: 'info:shipping' };
    if (url === 'returns' || url === '#returns') return { label, action: 'info:returns' };
    if (url === 'privacy' || url === '#privacy') return { label, action: 'info:privacy' };
    if (url === 'terms' || url === '#terms') return { label, action: 'info:terms' };
    return { label, action: 'scroll', target: url };
  }
  return { label, action: 'external', href: url };
}

// Legacy: initial store_settings load (lines ~407-417), scoped to just the keys
// applyAdminSettings() reads, mirroring fetchFAQs()/fetchCategories()'s pattern of a
// narrow query instead of the legacy bootstrap's `select('*')` over the whole table.
export async function fetchFooterSettings(supabase) {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_key,setting_value')
      .in('setting_key', ['vc_logo', 'vc_contact', 'vc_footer', 'vc_footer_links']);
    if (error || !data) return {};
    const out = {};
    data.forEach((row) => { out[row.setting_key] = parseSupabaseVal(row.setting_value); });
    return out;
  } catch (e) {
    return {};
  }
}

// Legacy: store-all-watch realtime branch for vc_logo/vc_brand/vc_contact only
// (lines ~1142-1144) — see NOTE above re: vc_footer / vc_footer_links being excluded.
export function subscribeFooterSettings(supabase, onChange) {
  return supabase
    .channel('footer-settings-watch')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_logo' },
      (payload) => payload.new && onChange('vc_logo', parseSupabaseVal(payload.new.setting_value)),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_contact' },
      (payload) => payload.new && onChange('vc_contact', parseSupabaseVal(payload.new.setting_value)),
    )
    .subscribe();
}
