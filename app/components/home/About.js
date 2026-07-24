'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Converted from 32-javascript-all.js — initVcGallery() "About Vangcur" half (lines ~6440-6451)
// and its DOMContentLoaded trigger (lines ~6703-6706).
// Markup source: 12-about.html
//
// NOTE on a legacy inconsistency (verified by grepping every `.from('store_settings')`
// call in 32-javascript-all.js): every other query in the whole file uses the real
// table columns `setting_key` / `setting_value` (e.g. lines 90, 916, 1259, 5594).
// The one Supabase call inside initVcGallery() (line 6449) is the sole exception —
// it queries `.select('value').eq('key','vc_about_desc')`, columns that don't exist
// on the table. That call would silently fail every time (caught by the empty
// catch block), so in production this text is only ever updated through the
// `_settings['vc_about_desc']` cache branch, which IS populated correctly at
// initial load (line 916 loads `setting_key`/`setting_value` into `_settings`).
// This component therefore queries the correct `setting_key`/`setting_value`
// columns directly, matching Categories.js/FAQ.js and how the app actually behaves,
// instead of reproducing the dead/buggy column names from the raw extraction.

const DEFAULT_ABOUT =
  'Vangcur (ভাঙচুর) — গ্যাজেট ও লাইফস্টাইল অ্যাক্সেসরিজের এক বিশ্বস্ত নাম। বাংলাদেশের প্রতিটি কোণে আমরা পৌঁছে দিচ্ছি সেরা মানের পণ্য, সাশ্রয়ী মূল্যে। আমাদের লক্ষ্য: শুধু পণ্য নয়, একটি নিরাপদ ও আনন্দময় শপিং অভিজ্ঞতা।';

function parseSupabaseVal(val) {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'string') return val;
  const t = val.trim();
  if (t.startsWith('[') || t.startsWith('{') || t.startsWith('"')) {
    try { return JSON.parse(t); } catch (e) { return val; }
  }
  return val;
}

export default function About() {
  const [desc, setDesc] = useState(DEFAULT_ABOUT);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'vc_about_desc')
          .maybeSingle();
        if (!cancelled && !error && data && data.setting_value) {
          const parsed = parseSupabaseVal(data.setting_value);
          if (typeof parsed === 'string' && parsed.trim()) setDesc(parsed);
        }
      } catch (e) {
        // fallback stays as DEFAULT_ABOUT, same as the legacy HTML default
      }
    })();

    // Realtime: admin panel can update vc_about_desc from store_settings
    const channel = supabase
      .channel('about-desc-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_about_desc' },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          const parsed = parseSupabaseVal(row.setting_value);
          if (typeof parsed === 'string' && parsed.trim()) setDesc(parsed);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="vc-about-sec" id="vcAboutSec">
      <div className="vc-about-inner">
        <div className="vc-about-badge">আমাদের সম্পর্কে</div>
        <h2 className="vc-about-title">Vangcur — <span>ভাঙচুর</span></h2>
        <p className="vc-about-desc" id="vcAboutDesc">{desc}</p>
      </div>
    </section>
  );
        }
