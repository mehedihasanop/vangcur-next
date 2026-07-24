// Used by app/components/layout/FloatButtons.js
// Converted from 32-javascript-all.js — applyAdminSettings() vc_contact branch
// (lines ~150-165: WhatsApp/Messenger onclick URL overrides).
// Markup source: 16-float-buttons.html.
//
// Legacy default: WhatsApp button opens https://wa.me/8801816365504 (hardcoded in
// the static HTML) until vc_contact overrides it; Messenger has no static default,
// so it stays hidden until vc_contact.messenger is set.

import { parseSupabaseVal } from './categoryData';

export const DEFAULT_WA_LINK = 'https://wa.me/8801816365504';

export function computeWaLink(contact) {
  if (contact && contact.wa) {
    const num = '88' + contact.wa.replace(/^88/, '').replace(/\D/g, '');
    return `https://wa.me/${num}`;
  }
  return DEFAULT_WA_LINK;
}

export function computeMsgLink(contact) {
  return (contact && contact.messenger) || null;
}

// Legacy: initial store_settings load, scoped to just vc_contact (mirrors the
// narrow-query pattern used in footerData.js/categoryData.js instead of the
// legacy bootstrap's `select('*')`).
export async function fetchContactSettings(supabase) {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_contact')
      .maybeSingle();
    if (error || !data) return null;
    return parseSupabaseVal(data.setting_value);
  } catch (e) {
    return null;
  }
}

// Legacy: store-all-watch realtime branch for vc_contact (see footerData.js note
// on realtime scope — vc_contact is one of the keys that does re-apply live).
export function subscribeContactSettings(supabase, onChange) {
  return supabase
    .channel('float-btns-contact-watch')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_contact' },
      (payload) => payload.new && onChange(parseSupabaseVal(payload.new.setting_value)),
    )
    .subscribe();
}
