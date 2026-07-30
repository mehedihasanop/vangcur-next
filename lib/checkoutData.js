// Converted from 32-javascript-all.js — order-overlay (section 23) সহায়ক ফাংশন/ডেটা।
// legacy line refs: DISTRICTS (line 70), buildShipOpts (4499-4517), _getBkashNum (4177-4180),
// validation logic from goS2()/goS3() (4546-4680)

// ৬৪ জেলার লিস্ট — হুবহু legacy অর্ডার থেকে
export const DISTRICTS = [
  'ঢাকা','চট্টগ্রাম','রাজশাহী','খুলনা','বরিশাল','সিলেট','রংপুর','ময়মনসিংহ','কুমিল্লা','ফেনী',
  'নোয়াখালী','লক্ষ্মীপুর','চাঁদপুর','ব্রাহ্মণবাড়িয়া','কিশোরগঞ্জ','নরসিংদী','নারায়ণগঞ্জ','মুন্সীগঞ্জ',
  'মানিকগঞ্জ','গাজীপুর','টাঙ্গাইল','ফরিদপুর','মাদারীপুর','শরীয়তপুর','রাজবাড়ী','গোপালগঞ্জ','বগুড়া',
  'নওগাঁ','নাটোর','পাবনা','সিরাজগঞ্জ','জয়পুরহাট','চাঁপাইনবাবগঞ্জ','যশোর','সাতক্ষীরা','মেহেরপুর',
  'নড়াইল','চুয়াডাঙ্গা','কুষ্টিয়া','মাগুরা','ঝিনাইদহ','বাগেরহাট','পিরোজপুর','ঝালকাঠি','পটুয়াখালী',
  'বরগুনা','ভোলা','সুনামগঞ্জ','হবিগঞ্জ','মৌলভীবাজার','নেত্রকোনা','জামালপুর','শেরপুর','গাইবান্ধা',
  'নীলফামারী','লালমনিরহাট','কুড়িগ্রাম','ঠাকুরগাঁও','পঞ্চগড়','দিনাজপুর','কক্সবাজার','বান্দরবান',
  'রাঙ্গামাটি','খাগড়াছড়ি',
];

export const DEFAULT_SHIP_CFG = { dhaka: 90, out: 130, bd: 130 };

// buildShipOpts() লজিক — জেলা অনুযায়ী কোন কোন শিপিং অপশন দেখাতে হবে
export function getShipOptions(dist) {
  const isDhaka = dist === 'ঢাকা';
  if (isDhaka) {
    return [
      { key: 'dhaka', name: 'ঢাকা সিটি কর্পোরেশনের আওতাধীন', sub: 'Pathao Courier · Home Delivery 1-2 Days' },
      { key: 'outside', name: 'ঢাকা সিটি কর্পোরেশনের বাইরে', sub: 'Pathao Courier · Home Delivery 1-3 Days' },
    ];
  } else if (dist) {
    return [{ key: 'bangladesh', name: 'সারা বাংলাদেশ', sub: 'Pathao Courier · Home Delivery 2-4 Days' }];
  }
  // জেলা এখনো সিলেক্ট না করলে দুটো ডিফল্ট অপশন (dhaka/bangladesh) — legacy 'else' branch
  return [
    { key: 'dhaka', name: 'ঢাকা সিটি কর্পোরেশনের আওতাধীন', sub: 'Pathao Courier · Home Delivery 1-2 Days' },
    { key: 'bangladesh', name: 'সারা বাংলাদেশ', sub: 'Pathao Courier · Home Delivery 2-4 Days' },
  ];
}

export function shipPrice(shipKey, shipCfg = DEFAULT_SHIP_CFG) {
  if (shipKey === 'dhaka') return shipCfg.dhaka;
  if (shipKey === 'outside') return shipCfg.out;
  return shipCfg.bd; // 'bangladesh'
}

// goS2() ভ্যালিডেশন — নাম/ফোন/জেলা/ঠিকানা/ইমেইল
export function validatePhone(ph) {
  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!phoneRegex.test(ph)) return false;
  const last8 = ph.slice(3);
  const allSame = last8.split('').every((c) => c === last8[0]);
  const isSeq = last8 === '12345678' || last8 === '87654321';
  return !(allSame || isSeq);
}

export function validateAddress(addr) {
  return addr.length >= 8 && /\s/.test(addr) && !/(.)\1{4,}/.test(addr);
}

export function validateEmail(em) {
  if (!em) return true; // ঐচ্ছিক
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em);
}

// goS3() ভ্যালিডেশন — bKash Transaction ID
export function validateTxnId(txn) {
  const txnRegex = /^[A-Z0-9]{10}$/;
  const hasLetter = /[A-Z]/.test(txn);
  const hasDigit = /[0-9]/.test(txn);
  const allSame = /^(.)\1{9}$/.test(txn);
  return txnRegex.test(txn) && hasLetter && hasDigit && !allSame;
}

// _getBkashNum() — store_settings থেকে vc_contact.bk / vc_contact.phone
export async function fetchBkashNumber(supabase) {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_contact')
      .maybeSingle();
    if (error || !data) return '01816365504';
    const val = typeof data.setting_value === 'string' ? JSON.parse(data.setting_value) : data.setting_value;
    return (val && (val.bk || val.phone)) || '01816365504';
  } catch (e) {
    return '01816365504';
  }
}

// renderStep3Summary() এর shipping config — store_settings থেকে vc_shipping
export async function fetchShipConfig(supabase) {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_shipping')
      .maybeSingle();
    if (error || !data) return DEFAULT_SHIP_CFG;
    const val = typeof data.setting_value === 'string' ? JSON.parse(data.setting_value) : data.setting_value;
    return val || DEFAULT_SHIP_CFG;
  } catch (e) {
    return DEFAULT_SHIP_CFG;
  }
}
