// Sends a partial/abandoned checkout attempt to the Google Apps Script Web App
// the site has always used for this — action 'addLead' appends a row to the
// "Leads" sheet. Per the owner this is a parallel, manual-follow-up-only log:
// it never reaches the admin panel, and it is NOT the mechanism that shows the
// recovery toast to a returning customer (that's lib/draftRecovery.js,
// localStorage-only). Two moments feed this, both wired from
// app/checkout/page.js:
//   - customer filled step 1 (name+phone+address) and left without finishing
//   - customer reached step 2 (payment step) and left without confirming
// The sheet's columns don't distinguish which of the two happened — both are
// just "here's what we know so far" — so a single call covers both; whichever
// fields are filled in at the moment the customer leaves get sent.

const GAS_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbyQOHCmm_HnucXSwAWej6K_UCsNxeiJlWljyH2nlmd_gcC1xmbcudzy30hUaQIrOqon/exec';

function itemsSummary(items) {
  if (!Array.isArray(items)) return '';
  return items.map((i) => `${i.name} x${i.qty}`).join(', ');
}

function itemsTotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
}

// leadId should be generated once per checkout attempt and kept in
// sessionStorage by the caller, so a refresh/re-trigger updates the same
// conceptual lead instead of appending a new row every time.
export function sendLead({ leadId, name, phone, dist, addr, email, items }) {
  if (typeof window === 'undefined') return;
  if (!phone) return; // nothing worth logging before at least a phone number

  const payload = {
    action: 'addLead',
    leadId: leadId || `LD-${Date.now()}`,
    date: new Date().toLocaleString('bn-BD'),
    name: name || '',
    phone: phone || '',
    dist: dist || '',
    addr: addr || '',
    email: email || '',
    items: itemsSummary(items),
    total: itemsTotal(items),
  };

  try {
    const body = JSON.stringify(payload);
    // sendBeacon so this still fires as the tab is closing/hidden — a normal
    // fetch can get cancelled mid-flight on unload. text/plain avoids a CORS
    // preflight against the Apps Script endpoint (same as the legacy site did).
    if (navigator.sendBeacon) {
      navigator.sendBeacon(GAS_ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
    } else {
      fetch(GAS_ENDPOINT, { method: 'POST', mode: 'no-cors', body });
    }
  } catch (e) {
    // best-effort only — never block or interrupt the customer over this
  }
}
