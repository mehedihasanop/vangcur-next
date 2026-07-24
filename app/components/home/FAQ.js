'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_FAQS, fetchFAQs } from '@/lib/faqData';

// Converted from 32-javascript-all.js:
// - DEFAULT_FAQS + FAQS global state (lines ~1422-1433)
// - renderFAQ() (lines ~1434-1438)
// - togFAQ(i, el) accordion toggle — only one item open at a time (lines ~1439-1443)
// - Admin custom-FAQ override on load (lines ~191-201)
// - Realtime watcher for the 'vc_faqs' store_settings row (lines ~476-483)
// Markup source: 11-faq.html
//
// Note: unlike TrustStrip/Categories, .faq-sec/.faq-item have no opacity:0 / vc-visible
// reveal-gating in globals.css, so no IntersectionObserver reveal effect is needed here
// (verified via grep in globals.css).

export default function FAQ() {
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [openIndex, setOpenIndex] = useState(null);

  // Legacy: initial load — DEFAULT_FAQS, then _settings['vc_faqs'] override if valid
  useEffect(() => {
    let cancelled = false;
    fetchFAQs(supabase).then((list) => {
      if (!cancelled) setFaqs(list);
    });

    // Legacy: realtime watcher for key==='vc_faqs' (lines ~476-483)
    const channel = supabase
      .channel('faq-store-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_faqs' },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          const parsed = typeof row.setting_value === 'string'
            ? (() => { try { return JSON.parse(row.setting_value); } catch (e) { return null; } })()
            : row.setting_value;
          if (Array.isArray(parsed) && parsed.length) setFaqs(parsed);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Reset open accordion item whenever the FAQ list itself changes
  useEffect(() => {
    setOpenIndex(null);
  }, [faqs]);

  // Legacy: togFAQ(i, el) — close all, then open the clicked one only if it wasn't already open
  const toggleFAQ = (i) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <div className="faq-sec" id="faqSec">
      <div className="faq-head">
        <h2>যা জানতে চান</h2>
        <p>Vangcur থেকে কেনাকাটা সম্পর্কে সকল প্রশ্নের উত্তর</p>
      </div>
      <div className="faq-grid" id="faqGrid">
        {faqs.map((f, i) => (
          <div className="faq-item" key={i}>
            <div className="faq-q" onClick={() => toggleFAQ(i)}>
              <span>{f.q}</span>
              <span className={`faq-arr${openIndex === i ? ' open' : ''}`} id={`farr${i}`}>▼</span>
            </div>
            <div className={`faq-a${openIndex === i ? ' open' : ''}`} id={`fa${i}`}>
              {f.a}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
