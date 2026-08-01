'use client';

// Converted from 32-javascript-all.js: _tryShowBISToast()/dismissBISToast()/
// orderFromBISToast()/_orderFromBISToastSafe()/_scheduleNotificationToasts()
// (lines ~1800-1880, ~2245-2255), 41-back-in-stock-toast.html (id #bisToast,
// .bis-* classes — verified against globals.css, all present unchanged at
// line ~1571+, right after 40's block).
//
// Self-contained like RecoveryToast.js: owns its own visibility state, runs its own
// delayed check rather than being told to open by an event. Scanning/dismiss logic
// lives in lib/backInStockData.js (component stays presentation-only, same split as
// StockNotifyModal.js/lib/stockNotifyData.js). Product-list fetch reasoning is in
// that lib file's header note.
//
// Mutual exclusivity with RecoveryToast.js — see lib/notificationQueue.js's header
// for why a shared coordinator module exists instead of one merged component.
//
// openPP(prod.id) (legacy's in-page overlay navigation) -> router.push(productHref(prod)),
// the same real-route replacement every other component uses (ProductCard.js, etc.)
// per VANGCUR_MASTER_PROMPT.md's 19-product-full-page.html decision.

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, productHref } from '@/lib/productData';
import { findBackInStockCandidate, dismissBackInStock } from '@/lib/backInStockData';
import { reportBisDecision, claimSlot } from '@/lib/notificationQueue';

const SCHEDULE_DELAY_MS = 4000; // legacy: _scheduleNotificationToasts delay, matches RecoveryToast.js

export default function BackInStockToast() {
  const [candidate, setCandidate] = useState(null); // { prod, notifKey, dateStr }
  const [closing, setClosing] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/checkout') return; // legacy: orderOverlay-open guard

    let cancelled = false;

    const delayPromise = new Promise((resolve) => setTimeout(resolve, SCHEDULE_DELAY_MS));
    const prodsPromise = fetchCustomProducts(supabase)
      .then((rows) => mergeCustomProducts(DEFAULT_PRODS, rows))
      .catch(() => DEFAULT_PRODS);

    Promise.all([delayPromise, prodsPromise]).then(([, prods]) => {
      if (cancelled) return;
      const found = findBackInStockCandidate(prods);
      if (found && claimSlot('bis')) {
        setCandidate(found);
        reportBisDecision(true);
      } else {
        reportBisDecision(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const close = (permanent) => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      if (candidate) dismissBackInStock(candidate.prod, candidate.notifKey, permanent);
      setCandidate(null);
    }, 320); // matches .dismissing animation duration
  };

  const handleOrder = () => {
    if (!candidate) return;
    const { prod } = candidate;
    close(true);
    setTimeout(() => router.push(productHref(prod)), 200); // legacy: setTimeout(()=>openPP(prod.id),200)
  };

  if (!candidate) return null;

  const { prod, dateStr } = candidate;
  const imgVal = (prod.imgs || ['📦'])[0];
  const isUrl = typeof imgVal === 'string' && imgVal.startsWith('http');

  return (
    <div className={`bis-toast active${closing ? ' dismissing' : ''}`} id="bisToast">
      <div className="bis-header">
        <div className="bis-title-txt">
          🎉 স্টকে ফিরে এসেছে! আপনি <span id="bisMsgDate">{dateStr}</span> তারিখে একটি প্রোডাক্ট দেখতে চেয়েছিলেন, সেটি
          পুনরায় স্টকে এসেছে! দ্রুত অর্ডার করতে পারেন।
        </div>
        <button className="bis-close" onClick={() => close(false)}>✕</button>
      </div>
      <div className="bis-prod-row">
        <div className="bis-thumb" id="bisThumb">
          {isUrl ? (
            <img
              src={imgVal}
              alt=""
              onError={(e) => {
                e.currentTarget.parentElement.textContent = '📦';
              }}
            />
          ) : (
            imgVal || '📦'
          )}
        </div>
        <div className="bis-prod-info">
          <div className="bis-prod-name" id="bisProdName">{prod.name}</div>
          <div className="bis-prod-price" id="bisProdPrice">৳{Number(prod.price || 0).toLocaleString()}</div>
        </div>
      </div>
      <div className="bis-actions">
        <button className="bis-btn-dismiss" onClick={() => close(true)}>এখন না</button>
        <button className="bis-btn-order" onClick={handleOrder}>অর্ডার করুন</button>
      </div>
    </div>
  );
                }
