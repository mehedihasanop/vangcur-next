// Used by app/components/home/FAQ.js
// Converted from 32-javascript-all.js — DEFAULT_FAQS (lines ~1422-1433) and the
// admin-override / _parseSupabaseVal logic (lines ~191-201, ~407-417).

export const DEFAULT_FAQS = [
  { q: 'কী কী পেমেন্ট পদ্ধতি গ্রহণযোগ্য?', a: 'আমরা bKash এর মাধ্যমে ন্যূনতম ২০০ টাকা এডভান্স পেমেন্ট গ্রহণ করি (Send Money: 01816-365504)। বাকি টাকা ডেলিভারির সময় Cash on Delivery (COD) পরিশোধ করা যাবে।' },
  { q: 'ডেলিভারি কতদিনে হবে এবং চার্জ কত?', a: 'ঢাকা সিটি কর্পোরেশনের মধ্যে ১-৩ কার্যদিবস, চার্জ ৯০ টাকা। সারা বাংলাদেশে ২-৫ কার্যদিবস, চার্জ ১৩০ টাকা। Pathao Courier ব্যবহার করা হয়। অর্ডার কনফার্মের পর ২৪ ঘণ্টার মধ্যে কুরিয়ারে হস্তান্তর।' },
  { q: 'প্রোডাক্টে কি ওয়ারেন্টি আছে?', a: 'হ্যাঁ! সকল প্রোডাক্টে ন্যূনতম ১ সপ্তাহের রিপ্লেসমেন্ট ওয়ারেন্টি আছে। অনেক প্রোডাক্টে ৬ মাসের ওয়ারেন্টিও রয়েছে। ওয়ারেন্টি ক্লেইম করতে আনবক্সিং ভিডিও প্রমাণ বাধ্যতামূলক।' },
  { q: 'রিটার্ন ও রিফান্ড পলিসি কী?', a: 'ইনভয়েস তারিখ থেকে ৭ দিনের মধ্যে প্রোডাক্টে ফল্ট প্রমাণিত হলে রিটার্ন করা যাবে। আনবক্সিং ভিডিও প্রমাণ হিসেবে দিতে হবে। আমাদের নির্দেশনায় কুরিয়ারে পাঠালে নিজ খরচে রিপ্লেস করব।' },
  { q: 'অর্ডার ট্র্যাক করব কীভাবে?', a: 'অর্ডার কনফার্মের পর WhatsApp (01816-365504) বা ইমেইলে ট্র্যাকিং নম্বর পাঠানো হবে। অ্যাকাউন্টে লগইন করে "My Orders" থেকেও স্ট্যাটাস দেখা যাবে।' },
  { q: 'ঢাকার বাইরে কি শিপিং হয়?', a: 'হ্যাঁ! সারা বাংলাদেশে ডেলিভারি করা হয়। ঢাকার বাইরে চার্জ ১৩০ টাকা, ২-৫ কার্যদিবসের মধ্যে Pathao Courier এ ডেলিভারি।' },
  { q: 'প্রোডাক্ট কি অথেনটিক?', a: 'হ্যাঁ! Vangcur সম্পূর্ণ অথেনটিক প্রোডাক্ট বিক্রি করে। GearUP সহ বিভিন্ন ব্র্যান্ডের গ্যাজেট সরবরাহ করা হয় এবং প্রতিটিতে ওয়ারেন্টি দেওয়া হয়।' },
  { q: 'কাস্টমার সার্ভিস কখন পাওয়া যায়?', a: 'WhatsApp (01816-365504) এ সকাল ৯টা থেকে রাত ১০টা পর্যন্ত। ইমেইল: vangcurbd@gmail.com' },
];

// Legacy: admin custom-FAQ override in loadFAQs()/init — `_settings['vc_faqs']`
// overrides DEFAULT_FAQS only when it parses to a non-empty array whose first
// item has both `q` and `a` fields (line ~191-201).
export async function fetchFAQs(supabase) {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_faqs')
      .maybeSingle();
    if (error || !data) return DEFAULT_FAQS;

    const parsed = typeof data.setting_value === 'string'
      ? (() => { try { return JSON.parse(data.setting_value); } catch (e) { return null; } })()
      : data.setting_value;

    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].q && parsed[0].a) {
      return parsed;
    }
    return DEFAULT_FAQS;
  } catch (e) {
    return DEFAULT_FAQS;
  }
}
