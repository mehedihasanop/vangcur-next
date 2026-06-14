// সার্ভার-সাইড Supabase ক্লায়েন্ট (Server Components / route handlers এর জন্য)
// ব্যবহার: প্রোডাক্ট লিস্ট, প্রোডাক্ট ডিটেইল, রিভিউ — পাবলিক ডেটা fetch করার সময়
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = pr ocess.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
