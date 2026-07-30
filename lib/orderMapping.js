// Converted from 32-javascript-all.js: mapSupabaseOrderRow() (line ~5827). Shared
// because both WaitingPage.js's fetchFullOrder() and BgConfirmPopup.js need to turn a
// raw `orders` table row (snake_case columns) into the app's camelCase order shape.

export function mapSupabaseOrderRow(row) {
  let items = [];
  try {
    items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []);
  } catch (e) { /* noop */ }
  return {
    id: row.id,
    orderNum: row.order_num || row.orderNum || '',
    date: row.created_at || row.date || new Date().toISOString(),
    status: row.status || 'pending',
    total: row.total || 0,
    subtotal: row.subtotal || 0,
    shippingCost: row.shipping_cost || row.shippingCost || 0,
    shipping: row.shipping || 'bd',
    advancePaid: row.advance_paid || row.advancePaid || 200,
    items,
    customer: row.customer || {
      name: row.customer_name || '',
      phone: row.customer_phone || '',
      district: row.customer_district || '',
      address: row.customer_address || '',
    },
    payment: row.payment || { txnId: row.payment_txn || '', last4: row.payment_last4 || '' },
  };
}
