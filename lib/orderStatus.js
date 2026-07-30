// Used by app/components/order/WaitingPage.js
// Converted from 32-javascript-all.js: checkOrderStatusFromSupabase() (line ~5108)
// and the _subscribeOrderRealtime() closure + exponential-backoff retry logic that
// lived inside startPolling() (lines ~5205-5259).

const MAX_REALTIME_RETRY = 5;

export async function checkOrderStatus(supabase, orderId) {
  try {
    const { data } = await supabase.from('orders').select('id,status').eq('id', orderId).single();
    if (data) return data.status;
  } catch (e) { /* fall through to guest/local fallback, matches legacy */ }
  try {
    const orders = JSON.parse(localStorage.getItem('vc_orders') || '[]');
    const o = orders.find((x) => x.id === orderId);
    return o ? o.status : null;
  } catch (e) {
    return null;
  }
}

export async function fetchFullOrder(supabase, orderId) {
  try {
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (data) return data;
  } catch (e) { /* fall through */ }
  try {
    const orders = JSON.parse(localStorage.getItem('vc_orders') || '[]');
    return orders.find((x) => x.id === orderId) || null;
  } catch (e) {
    return null;
  }
}

// Subscribes to UPDATE events for one order row. On CHANNEL_ERROR/TIMED_OUT it
// retries with the same capped exponential backoff as legacy (2s,4s,8s,16s,30s...
// up to 5 attempts). Returns an unsubscribe() cleanup function.
export function subscribeOrderRealtime(supabase, orderId, onStatusUpdate) {
  let channel = null;
  let retryCount = 0;
  let retryTimer = null;
  let stopped = false;

  function connect() {
    if (stopped) return;
    if (channel) { supabase.removeChannel(channel); channel = null; }
    try {
      channel = supabase
        .channel('order-status-' + orderId + '-' + Date.now())
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'id=eq.' + orderId },
          (payload) => {
            if (payload.new && payload.new.status) {
              retryCount = 0;
              onStatusUpdate(payload.new.status);
            }
          },
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (retryCount < MAX_REALTIME_RETRY && !stopped) {
              retryCount += 1;
              const delay = Math.min(1000 * (2 ** retryCount), 30000);
              retryTimer = setTimeout(connect, delay);
            }
          } else if (status === 'SUBSCRIBED') {
            retryCount = 0;
          }
        });
    } catch (e) { /* noop, matches legacy try/catch */ }
  }

  connect();

  return function unsubscribe() {
    stopped = true;
    clearTimeout(retryTimer);
    if (channel) { supabase.removeChannel(channel); channel = null; }
  };
}
