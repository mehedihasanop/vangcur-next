// Shared by app/components/modals/OfferPopup.js.
// Converted from 32-javascript-all.js:
// - _getOfferCfg() (lines ~2125-2127) — reads _settings['vc_offer_popup']
// - the load-time auto-popup queue's 24-hour cooldown check (lines ~2232-2250)
//
// The store_settings fetch here follows the identical shape as
// categoryData.js's fetchCategories() (same table, same parseSupabaseVal JSON
// handling for the setting_value column), reused directly rather than duplicated.

import { parseSupabaseVal } from './categoryData';
import { logWarn } from './logger';

const LAST_POPUP_KEY = 'vc_last_popup_time';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Legacy: _getOfferCfg() returns _settings['vc_offer_popup'] or null. Unlike
// fetchCategories(), a missing/empty row here is a legitimate "no offer configured"
// state rather than a fallback-to-defaults case, so this returns null, not a default.
export async function fetchOfferConfig(supabase) {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_offer_popup')
      .maybeSingle();
    if (error || !data) return null;
    const parsed = parseSupabaseVal(data.setting_value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    logWarn('Offer popup config fetch failed:', e);
    return null;
  }
}

// Legacy: `if(!cfg || !cfg.active_model || cfg.active_model==='none') return null;`
// — this exact guard is repeated identically in _buildOfferHTML() and both of its
// callers (openOfferPopup(), the load-time queue), so it's pulled out once here.
export function hasActiveOffer(cfg) {
  return !!(cfg && cfg.active_model && cfg.active_model !== 'none');
}

// Legacy: the load-time queue's cooldown check —
// `const last=localStorage.getItem('vc_last_popup_time'); const allowed = !last || (Date.now()-Number(last) >= 24h)`
export function canShowPopup() {
  try {
    const last = localStorage.getItem(LAST_POPUP_KEY);
    return !last || (Date.now() - Number(last) >= TWENTY_FOUR_HOURS_MS);
  } catch (e) {
    return true;
  }
}

// Legacy: `localStorage.setItem('vc_last_popup_time', String(Date.now()))` inside
// openOfferPopup() — set only when the popup is actually shown, not on every load.
export function markPopupShown() {
  try { localStorage.setItem(LAST_POPUP_KEY, String(Date.now())); } catch (e) { /* noop */ }
}
