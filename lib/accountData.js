// Shared by app/components/auth/AccountPage.js.
// Converted from 32-javascript-all.js:
// - updateCelestialPosition() (~295-350) -> computeCelestialState() below, DOM mutation
//   removed (AccountPage.js sets React state/refs from the return value instead)
// - fetchLocalWeather()/getWeather() (~310-345) -> fetchIsRaining() below
// - updateTimeDate()/_startAccClock() (~346-370) -> formatLiveTimeDate()/getGreeting()
//   (AccountPage.js runs its own setInterval and calls these each tick)
// - saveNameEdit() (~231-258) -> updateProfileName() below
// - renderMyOrders() (~410-450) -> fetchMyOrders() below (rendering itself is JSX in
//   AccountPage.js). mapSupabaseOrderRow() isn't defined anywhere in the extraction
//   (referenced but not shown) — orders table columns aren't nailed down since
//   23-order-overlay.html hasn't been built yet either, so this reads the columns the
//   legacy renderMyOrders() itself actually destructures (date, orderNum/id, customer,
//   items, status, total) and falls back to the exact same 'vc_orders' localStorage
//   shape mergeGuestOrdersToUser() in lib/authData.js already writes to.
// - _renderSNProfileSection()/_removeSNItem()/clearAllStockNotifications() (~370-395)
//   -> getStockNotifications()/removeStockNotification()/clearAllStockNotifications()
// - loadDraftDrawer()/deleteSingleDraft()/clearAllDrafts() (~1810-1895) -> fetchDrafts()/
//   deleteDraft()/deleteAllDrafts(). Nothing writes 'vc_abandoned_draft' or the
//   `abandoned_checkouts` table yet (38-abandoned-draft-recovery-toast.html /
//   23-order-overlay.html, both Priority 3/4, not built), so this will legitimately
//   return an empty list today — kept faithful/ready rather than stubbed out, since it's
//   pure localStorage+Supabase reads with no dependency on anything unbuilt.

// ── Weather → celestial state (pure math, legacy updateCelestialPosition) ──
const SCENERY_BY_STATE = {
  dawn: `<svg viewBox="0 0 400 65" preserveAspectRatio="none">
           <polygon points="40,65 52,22 64,65" fill="#431c2d" />
           <polygon points="50,65 60,12 70,65" fill="#341221" />
           <polygon points="315,65 330,16 345,65" fill="#431c2d" />
           <polygon points="328,65 340,6 352,65" fill="#341221" />
         </svg>`,
  morning: `<svg viewBox="0 0 400 65" preserveAspectRatio="none">
              <polygon points="45,65 60,18 75,65" fill="#1b4d24" />
              <polygon points="54,65 67,4 80,65" fill="#143f1f" />
              <rect x="285" y="39" width="30" height="22" fill="#5c4033" rx="2" />
              <polygon points="278,39 300,19 322,39" fill="#a0522d" />
           </svg>`,
  noon: `<svg viewBox="0 0 400 65" preserveAspectRatio="none">
           <path d="M 30,65 Q 35,16 45,65" stroke="#15803d" stroke-width="3" fill="none" />
           <path d="M 40,65 Q 48,10 56,65" stroke="#166534" stroke-width="2.6" fill="none" />
           <circle cx="48" cy="18" r="4.5" fill="#fef08a" />
           <path d="M 325,65 Q 332,20 342,65" stroke="#15803d" stroke-width="3" fill="none" />
           <circle cx="332" cy="27" r="4.5" fill="#fef08a" />
           <path d="M 334,65 Q 341,12 349,65" stroke="#166534" stroke-width="2.6" fill="none" />
         </svg>`,
  sunset: `<svg viewBox="0 0 400 65" preserveAspectRatio="none">
             <polygon points="40,65 52,22 64,65" fill="#65220c" />
             <polygon points="48,65 58,12 68,65" fill="#3f1403" />
             <polygon points="310,65 316,22 322,65" fill="#3f1403" />
             <line x1="316" y1="22" x2="296" y2="10" stroke="#3f1403" stroke-width="1.8" />
             <line x1="316" y1="22" x2="336" y2="34" stroke="#3f1403" stroke-width="1.8" />
             <line x1="316" y1="22" x2="296" y2="34" stroke="#3f1403" stroke-width="1.8" />
             <line x1="316" y1="22" x2="336" y2="10" stroke="#3f1403" stroke-width="1.8" />
             <circle cx="316" cy="22" r="3" fill="#ec5f13" />
           </svg>`,
  night: `<svg viewBox="0 0 400 65" preserveAspectRatio="none">
            <polygon points="20,65 50,26 80,65" fill="#0b170e" />
            <polygon points="295,65 330,20 365,65" fill="#0b170e" />
          </svg>`,
  rain: `<svg viewBox="0 0 400 65" preserveAspectRatio="none">
           <path d="M 50,65 Q 65,30 40,10" stroke="#121820" stroke-width="3" fill="none" stroke-linecap="round" />
           <path d="M 315,65 Q 330,30 305,10" stroke="#121820" stroke-width="3" fill="none" stroke-linecap="round" />
         </svg>`,
};

// Legacy: updateCelestialPosition(hour, isForceRain) — same math, minus the DOM writes.
// cardWidth defaults to 300 like the legacy `card.clientWidth||300` fallback.
export function computeCelestialState(hour, isForceRain, cardWidth) {
  const cardW = cardWidth || 300;
  const xMin = 14;
  const xMax = cardW - 58;
  const yMin = 24;
  const yMax = 114;
  const midX = (xMin + xMax) / 2;
  const factor = (yMax - yMin) / Math.pow(midX - xMin, 2);

  let state = 'noon';
  let posX = xMin;
  let posY = yMax;
  let celestial = 'sun';
  let birdsVisible = true;

  if (isForceRain) {
    state = 'rain';
    celestial = 'none';
    birdsVisible = false;
  } else if (hour >= 5 && hour < 19) {
    celestial = 'sun';
    birdsVisible = true;
    const dayProgress = (hour - 5) / 14;
    posX = xMax - dayProgress * (xMax - xMin);
    posY = yMin + factor * Math.pow(posX - midX, 2);
    if (hour >= 5 && hour < 7) state = 'dawn';
    else if (hour >= 7 && hour < 11) state = 'morning';
    else if (hour >= 11 && hour < 15) state = 'noon';
    else state = 'sunset';
  } else {
    celestial = 'moon';
    birdsVisible = false;
    let nightHour = hour - 19;
    if (nightHour < 0) nightHour += 24;
    const nightProgress = nightHour / 10;
    posX = xMax - nightProgress * (xMax - xMin);
    posY = yMin + factor * Math.pow(posX - midX, 2);
    state = 'night';
  }

  return { state, posX, posY, celestial, birdsVisible, sceneryHtml: SCENERY_BY_STATE[state] || '' };
}

const RAINY_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];

// Legacy: districtCoords lookup table (~40 BD districts) used to pick weather coordinates
const DISTRICT_COORDS = {
  'ঢাকা': { lat: 23.811, lon: 90.412 }, 'ঢাকা সিটি': { lat: 23.811, lon: 90.412 },
  'চট্টগ্রাম': { lat: 22.356, lon: 91.784 }, 'চট্টগ্রাম সিটি': { lat: 22.356, lon: 91.784 },
  'সিলেট': { lat: 24.897, lon: 91.872 }, 'খুলনা': { lat: 22.845, lon: 89.540 },
  'রাজশাহী': { lat: 24.374, lon: 88.601 }, 'ময়মনসিংহ': { lat: 24.746, lon: 90.407 },
  'বরিশাল': { lat: 22.701, lon: 90.353 }, 'রংপুর': { lat: 25.745, lon: 89.275 },
  'কুমিল্লা': { lat: 23.461, lon: 91.188 }, 'নারায়ণগঞ্জ': { lat: 23.623, lon: 90.500 },
  'গাজীপুর': { lat: 24.002, lon: 90.412 }, 'টাঙ্গাইল': { lat: 24.252, lon: 89.917 },
  'ফরিদপুর': { lat: 23.599, lon: 89.842 }, 'মাদারীপুর': { lat: 23.164, lon: 90.200 },
  'যশোর': { lat: 23.167, lon: 89.217 }, 'বগুড়া': { lat: 24.851, lon: 89.371 },
  'নোয়াখালী': { lat: 22.869, lon: 91.100 }, 'কক্সবাজার': { lat: 21.453, lon: 92.010 },
  'পটুয়াখালী': { lat: 22.357, lon: 90.330 }, 'ঝিনাইদহ': { lat: 23.100, lon: 89.153 },
  'নেত্রকোনা': { lat: 24.876, lon: 90.724 }, 'কিশোরগঞ্জ': { lat: 24.444, lon: 90.778 },
  'মুন্সিগঞ্জ': { lat: 23.552, lon: 90.531 }, 'শরীয়তপুর': { lat: 23.199, lon: 90.373 },
  'ফেনী': { lat: 23.023, lon: 91.398 }, 'ব্রাহ্মণবাড়িয়া': { lat: 23.960, lon: 91.111 },
  'চাঁদপুর': { lat: 23.234, lon: 90.669 }, 'লক্ষ্মীপুর': { lat: 22.942, lon: 90.841 },
  'নীলফামারী': { lat: 25.931, lon: 88.856 }, 'ঠাকুরগাঁও': { lat: 26.032, lon: 88.459 },
  'পঞ্চগড়': { lat: 26.338, lon: 88.558 }, 'দিনাজপুর': { lat: 25.627, lon: 88.636 },
  'জয়পুরহাট': { lat: 25.097, lon: 89.037 }, 'নওগাঁ': { lat: 24.802, lon: 88.938 },
  'চাঁপাইনবাবগঞ্জ': { lat: 24.597, lon: 88.281 }, 'নাটোর': { lat: 24.420, lon: 88.989 },
  'পাবনা': { lat: 24.006, lon: 89.246 }, 'সিরাজগঞ্জ': { lat: 24.454, lon: 89.699 },
  'কুষ্টিয়া': { lat: 23.901, lon: 89.121 }, 'মেহেরপুর': { lat: 23.759, lon: 88.632 },
  'চুয়াডাঙ্গা': { lat: 23.648, lon: 88.841 }, 'মাগুরা': { lat: 23.487, lon: 89.419 },
  'নড়াইল': { lat: 23.172, lon: 89.500 }, 'বাগেরহাট': { lat: 22.660, lon: 89.785 },
  'সাতক্ষীরা': { lat: 22.718, lon: 89.071 }, 'পিরোজপুর': { lat: 22.579, lon: 89.972 },
  'ঝালকাঠি': { lat: 22.643, lon: 90.197 }, 'বরগুনা': { lat: 22.152, lon: 90.122 },
  'ভোলা': { lat: 22.688, lon: 90.651 }, 'সুনামগঞ্জ': { lat: 24.881, lon: 91.395 },
  'হবিগঞ্জ': { lat: 24.375, lon: 91.415 }, 'মৌলভীবাজার': { lat: 24.483, lon: 91.777 },
  'খাগড়াছড়ি': { lat: 23.119, lon: 91.984 }, 'রাঙামাটি': { lat: 22.732, lon: 92.294 },
  'বান্দরবান': { lat: 22.190, lon: 92.218 }, 'শেরপুর': { lat: 25.018, lon: 90.017 },
  'জামালপুর': { lat: 24.934, lon: 89.944 }, 'গোপালগঞ্জ': { lat: 23.004, lon: 89.826 },
  'রাজবাড়ী': { lat: 23.757, lon: 89.644 }, 'মানিকগঞ্জ': { lat: 23.864, lon: 90.006 },
  'নরসিংদী': { lat: 23.921, lon: 90.716 }, 'গাজীপুর সিটি': { lat: 24.002, lon: 90.412 },
};

async function getWeatherCode(lat, lon) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const data = await res.json();
    const code = data.current_weather.weathercode;
    try { localStorage.setItem('vc_weather_cache', JSON.stringify({ code, lat, lon, ts: Date.now() })); } catch (e) {}
    return code;
  } catch (e) { return null; }
}

// Legacy: fetchLocalWeather() — 2-hour cache, then picks lat/lon from the user's most
// recent order district (localStorage first, Supabase `orders` as a second try), else
// defaults to Dhaka. Returns whether it's currently raining there.
export async function fetchIsRaining(supabase, currentUser) {
  try {
    const cached = localStorage.getItem('vc_weather_cache');
    if (cached) {
      try {
        const obj = JSON.parse(cached);
        if (obj.ts && Date.now() - obj.ts < 7200000) return RAINY_CODES.includes(obj.code);
      } catch (e) {}
    }
    let lat = 23.811, lon = 90.412;
    try {
      let userDistrict = null;
      const orders = JSON.parse(localStorage.getItem('vc_orders') || '[]');
      if (orders.length) {
        const latest = orders[orders.length - 1];
        userDistrict = latest.district || latest.customer_district || (latest.customer && latest.customer.district) || null;
      }
      if (!userDistrict && currentUser) {
        try {
          const { data } = await supabase.from('orders').select('customer_district').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(1);
          if (data && data.length && data[0].customer_district) userDistrict = data[0].customer_district;
        } catch (e2) {}
      }
      if (userDistrict) {
        const dn = userDistrict.trim();
        if (DISTRICT_COORDS[dn]) { lat = DISTRICT_COORDS[dn].lat; lon = DISTRICT_COORDS[dn].lon; }
        else {
          const found = Object.keys(DISTRICT_COORDS).find((k) => dn.includes(k) || k.includes(dn));
          if (found) { lat = DISTRICT_COORDS[found].lat; lon = DISTRICT_COORDS[found].lon; }
        }
      }
    } catch (e) {}
    const code = await getWeatherCode(lat, lon);
    return code !== null && RAINY_CODES.includes(code);
  } catch (e) { return false; }
}

// ── Live clock + greeting (legacy updateTimeDate) ──
export function formatLiveTimeDate(now) {
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12; hours = hours || 12;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${hours}:${minutes} ${ampm} - ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

export function getGreeting(user, now) {
  const name = (user && user.name) || 'User';
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return `Hi ${name}, Good Morning`;
  if (hour >= 12 && hour < 17) return `Hi ${name}, Good Afternoon`;
  if (hour >= 17 && hour < 21) return `Hi ${name}, Good Evening`;
  if (hour >= 21 || hour < 5) return `Hi ${name}, Good Night`;
  return `Hi ${name}, Good Day`;
}

// ── Orders (legacy renderMyOrders) ──
function mapOrderRow(o) {
  return {
    id: o.id,
    orderNum: o.order_num || o.orderNum || o.id,
    date: o.created_at || o.date,
    customer: o.customer || { name: o.customer_name || '' },
    items: o.items || [],
    status: o.status || 'pending',
    total: o.total || 0,
    userId: o.user_id,
    custEmail: o.customer_email,
  };
}

export async function fetchMyOrders(supabase, currentUser) {
  if (!currentUser) return [];
  try {
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (currentUser.id) q = q.eq('user_id', currentUser.id);
    const { data, error } = await q;
    if (!error && data && data.length) return data.map(mapOrderRow);
    throw new Error('no data');
  } catch (e) {
    try {
      const all = JSON.parse(localStorage.getItem('vc_orders') || '[]');
      return all.filter((o) => o.userId === currentUser?.id || o.custEmail === currentUser?.email);
    } catch (e2) { return []; }
  }
}

export function orderStats(orders) {
  const total = orders.length;
  const running = orders.filter((o) => ['pending', 'confirmed', 'shipped'].includes(o.status)).length;
  const completed = orders.filter((o) => ['confirmed', 'shipped', 'delivered'].includes(o.status)).length;
  return { total, running, completed };
}

// ── Name edit (legacy saveNameEdit) ──
export async function updateProfileName(supabase, currentUser, newName) {
  try { const { error } = await supabase.auth.updateUser({ data: { name: newName } }); if (error) throw error; } catch (e) { console.warn('[Vangcur] auth.updateUser:', e); }
  try { await supabase.from('profiles').upsert({ id: currentUser.id, name: newName, updated_at: new Date().toISOString() }); } catch (e) {}
  try {
    const { data: userOrders } = await supabase.from('orders').select('id,customer').eq('user_id', currentUser.id);
    if (userOrders && userOrders.length) {
      for (const ord of userOrders) {
        const updCustomer = { ...ord.customer, name: newName };
        await supabase.from('orders').update({ customer: updCustomer }).eq('id', ord.id);
      }
    }
  } catch (e) {}
}

// ── Stock notification list (legacy _renderSNProfileSection — nothing writes 'vc_sn_*'
//    yet since 40-stock-notify-modal.html isn't built, so this reads whatever future
//    writer produces without needing any change here) ──
export function getStockNotifications() {
  const items = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('vc_sn_')) {
        const d = JSON.parse(localStorage.getItem(k) || '{}');
        if (d.prodId) items.push({ ...d, key: k });
      }
    }
  } catch (e) {}
  return items;
}

export function removeStockNotification(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

export function clearAllStockNotifications() {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('vc_sn_')) toRemove.push(k); }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
}

// ── Abandoned draft recovery (legacy loadDraftDrawer — see file-header note: this is
//    genuinely empty today since nothing writes to either storage yet) ──
const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;

function getLocalDraft() {
  try {
    const raw = localStorage.getItem('vc_abandoned_draft');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export async function fetchDrafts(supabase, currentUser) {
  let drafts = [];
  if (currentUser) {
    try {
      const { data, error } = await supabase.from('abandoned_checkouts').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(3);
      if (!error && data && data.length) {
        drafts = data.map((row) => ({
          id: row.draft_id || `dr_sb_${row.id}`,
          _sbId: row.id,
          name: row.customer_name,
          phone: row.customer_phone,
          dist: row.customer_district,
          addr: row.customer_address,
          email: row.customer_email,
          items: row.items,
          ship: row.shipping,
          createdAt: new Date(row.created_at).getTime(),
        }));
      }
    } catch (e) {}
  }
  if (!drafts.length) {
    const local = getLocalDraft();
    if (local) drafts = [local];
  }
  return drafts.filter((d) => Date.now() - d.createdAt <= FIFTEEN_DAYS);
}

export async function deleteDraft(supabase, currentUser, draftId, sbId) {
  const local = getLocalDraft();
  if (local && local.id === draftId) { try { localStorage.removeItem('vc_abandoned_draft'); } catch (e) {} }
  if (currentUser) {
    try {
      if (sbId) await supabase.from('abandoned_checkouts').delete().eq('id', sbId);
      else await supabase.from('abandoned_checkouts').delete().eq('draft_id', draftId).eq('user_id', currentUser.id);
    } catch (e) {}
  }
}

export async function deleteAllDrafts(supabase, currentUser) {
  try { localStorage.removeItem('vc_abandoned_draft'); } catch (e) {}
  if (currentUser) { try { await supabase.from('abandoned_checkouts').delete().eq('user_id', currentUser.id); } catch (e) {} }
}
