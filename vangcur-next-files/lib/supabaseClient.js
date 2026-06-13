// ব্রাউজার-সাইড Supabase ক্লায়েন্ট
// ব্যবহার: Client Component-এ (কার্ট, লগইন, অ্যাডমিন, রিয়েল-টাইম আপডেট ইত্যাদি)
'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
