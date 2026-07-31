'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { eligibleDraft, dismissDraft } from '@/lib/draftRecovery';

// Converted from 38-abandoned-draft-recovery-toast.html + its matched JS
// (32-javascript-all.js: triggerDraftRecoveryToast/_showToastIfEligible
// ~1760-1830, dismiss/continue handlers ~1898-1930, scheduler ~2245-2255).
// See lib/draftRecovery.js's header for why this is localStorage-only (no
// Supabase 'abandoned_checkouts' table) — per the owner that table was never
// part of the actual recovery mechanism to begin with.
//
// continueRecoveryOrder(): legacy repopulated the order-overlay's own DOM
// fields directly, since it was a same-page overlay. /checkout is now its own
// route, so instead this hands the draft off through the exact sessionStorage
// keys app/checkout/page.js already restores on mount — vc_quick_order_items
// for the cart (same key QuickOrderBridge.js uses) and vc_form_draft/vc_ship
// for the rest — then navigates there. No changes needed to checkout/page.js's
// existing restore effect.
export default function RecoveryToast() {
  const [draft, setDraft] = useState(null);
  const [closing, setClosing] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/checkout') return; // legacy: never show mid-order
    const timer = setTimeout(() => {
      const d = eligibleDraft();
      if (d) setDraft(d);
    }, 4000); // legacy: _scheduleNotificationToasts delay
    return () => clearTimeout(timer);
  }, [pathname]);

  const close = useCallback(
    (isUserDismiss) => {
      setClosing(true);
      setTimeout(() => {
        setClosing(false);
        if (draft) dismissDraft(draft.id, isUserDismiss);
        setDraft(null);
      }, 320); // matches .dismissing animation duration
    },
    [draft]
  );

  const continueOrder = () => {
    if (!draft) return;
    try {
      sessionStorage.setItem('vc_quick_order_items', JSON.stringify(draft.items || []));
      sessionStorage.setItem(
        'vc_form_draft',
        JSON.stringify({ name: draft.name, phone: draft.phone, dist: draft.dist, addr: draft.addr, email: draft.email })
      );
      if (draft.ship) sessionStorage.setItem('vc_ship', draft.ship);
    } catch (e) {
      // ignore
    }
    setDraft(null);
    router.push('/checkout');
  };

  if (!draft) return null;

  const items = Array.isArray(draft.items) ? draft.items : [];
  const firstItem = items[0] || null;
  const total = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
  const imgVal = firstItem && (firstItem.imgs || [firstItem.emoji || '📦'])[0];
  const isUrl = typeof imgVal === 'string' && imgVal.startsWith('http');

  return (
    <div className={`recovery-toast active${closing ? ' dismissing' : ''}`} id="recoveryToast">
      <button className="toast-close-btn" onClick={() => close(false)}>✕</button>
      <div className="toast-title" id="tTitle">পেন্ডিং অর্ডারটি সম্পন্ন করুন 🛒</div>
      <div className="toast-desc" id="tDesc">
        আপনি সম্প্রতি একটি প্রোডাক্ট অর্ডার করতে চেয়েছিলেন। মাত্র ২ ধাপ বাকি!
      </div>
      <div className="toast-prod-box">
        <div className="toast-thumb" id="tThumb">
          {isUrl ? (
            <img
              src={imgVal}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            imgVal || '📦'
          )}
        </div>
        <div className="toast-pname" id="tPname">{firstItem?.name || 'প্রোডাক্ট'}</div>
        <div className="toast-pprice" id="tPprice">৳{total.toLocaleString()}</div>
      </div>
      <div className="toast-actions">
        <button className="toast-btn dismiss" onClick={() => close(true)}>এখন নয়</button>
        <button className="toast-btn continue" onClick={continueOrder}>হ্যাঁ, চালিয়ে যান</button>
      </div>
    </div>
  );
}
