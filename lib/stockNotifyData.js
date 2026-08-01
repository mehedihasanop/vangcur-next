// Converted from 32-javascript-all.js: submitStockNotify() (lines ~1762-1795),
// 40-stock-notify-modal.html. Kept as its own lib file (rather than inlined in the
// component) so StockNotifyModal.js stays presentation-only, matching the
// membershipData.js/warrantyData.js split used by MembershipModal.js/WarrantyModal.js.
//
// Three side effects on submit, same as legacy:
//   1. Supabase `stock_notifications` insert — the admin-facing record.
//   2. Google Apps Script sheet webhook (action: 'addStockRequest') — same GAS_ENDPOINT
//      lib/leadCapture.js already uses for 'addLead', just a different action string.
//      Fire-and-forget: a failed sheet write must never block the customer.
//   3. localStorage 'vc_sn_' + prodId — this is what lib/accountData.js's
//      getStockNotifications() reads to populate AccountPage.js's subscribed-list
//      section (its comment there said "nothing writes 'vc_sn_*' yet" — this is that
//      writer). Shape must match what getStockNotifications() expects: an object with
//      a `prodId` key, since it filters on `if (d.prodId) items.push(...)`.

import { supabase } from './supabaseClient';

const GAS_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbyQOHCmm_HnucXSwAWej6K_UCsNxeiJlWljyH2nlmd_gcC1xmbcudzy30hUaQIrOqon/exec';

const PHONE_RE = /^01[3-9]\d{8}$/;

export function isValidBdPhone(phone) {
  return PHONE_RE.test(phone);
}

// Returns null on success, or a Bengali error string (mirrors legacy's showToast
// calls, but as return values so the component owns how/where to display them).
export async function submitStockNotify({ prodId, prodName, name, phone, userId }) {
  const trimmedName = (name || '').trim();
  const trimmedPhone = (phone || '').trim();

  if (!trimmedName) return 'আপনার নাম দিন';
  if (!isValidBdPhone(trimmedPhone)) return 'সঠিক মোবাইল নম্বর দিন';

  const payload = {
    customer_name: trimmedName,
    customer_phone: trimmedPhone,
    product_id: String(prodId),
    product_name: prodName,
    user_id: userId || null,
  };

  try {
    if (supabase) await supabase.from('stock_notifications').insert(payload);
  } catch (e) {
    // best-effort — a failed admin-table insert shouldn't block the customer,
    // same tolerance as the sheet webhook below and cartData.js/checkoutData.js
  }

  try {
    fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'addStockRequest',
        productName: prodName,
        customerName: trimmedName,
        mobileNumber: trimmedPhone,
      }),
    }).catch(() => {});
  } catch (e) {}

  try {
    const key = 'vc_sn_' + String(prodId);
    localStorage.setItem(
      key,
      JSON.stringify({ name: trimmedName, phone: trimmedPhone, prodId: String(prodId), prodName, ts: Date.now() })
    );
  } catch (e) {}

  return null;
}
