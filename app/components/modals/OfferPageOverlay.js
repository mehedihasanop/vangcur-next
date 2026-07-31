'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchOfferConfig, hasActiveOffer } from '@/lib/offerData';
import {
  DEFAULT_PRODS, QUICK_ORDER_EVENT, fetchCustomProducts, mergeCustomProducts,
} from '@/lib/productData';
import { addToCart } from '@/lib/cartData';
import { showToast } from '@/lib/toast';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { OPEN_OFFER_PAGE_EVENT } from '@/lib/uiEvents';
import OfferModelContent from './OfferContent';

// Converted from 32-javascript-all.js:
// - openOfferPage() / closeOfferPage() (lines ~2215-2230)
// - the Escape-key branch for this overlay, scoped only to this component (legacy's
//   single global keydown listener that closed every overlay at once is NOT
//   reproduced — see BgConfirmPopup.js's header note for why; every modal here
//   wires its own scoped Escape handler instead)
// Markup source: 34-offer-page-overlay.html — .pp-overlay#offerPageOverlay >
// .offer-page-nav (.pp-back + title) + .offer-page-inner > #offerPageContent.
// model1/2/3 markup is shared with OfferPopup.js via ./OfferContent.js —
// _buildOfferHTML(cfg, forPage)'s forPage arg never changed the markup, only which
// overlay orderFn/cartFn closed first.
//
// Trigger: Footer.js's "📢 চলতি অফারসমূহ" button already dispatches
// OPEN_OFFER_PAGE_EVENT (see lib/uiEvents.js, which explicitly maps this event to
// this file) — this component is that event's listener.
//
// Unlike OfferPopup.js there's no cooldown and no auto-show timer — legacy rebuilds
// this fresh every time the button is opened, so config/products are refetched on
// every open rather than reused from a single mount-time fetch.
//
// Two distinct empty-states, matching legacy exactly:
// 1. No active offer at all (`!cfg || !cfg.active_model || active_model==='none'`)
//    -> the longer message with the "নতুন অফার পেতে আমাদের সাথেই থাকুন!" tagline.
// 2. cfg has some active_model but it isn't 'model1'/'model2'/'model3' (a corrupted-
//    config edge case — _buildOfferHTML() returns null in that case only, since
//    model1/2/3 each always return a truthy div even with missing sub-fields)
//    -> the shorter message, no tagline. Kept distinct rather than collapsed into
//    one message since legacy visibly renders different text for each.
//
// Legacy's `_pushPanel('offer-page')`/`_popPanel()` (mobile back-button stack) is
// intentionally not ported, per VANGCUR_MASTER_PROMPT.md's decision that every
// modal/drawer here uses lockBody()/unlockBody() only.

const KNOWN_MODELS = ['model1', 'model2', 'model3'];
const POST_CLOSE_ACTION_DELAY_MS = 150; // legacy: setTimeout(..., 120) before opening order/cart

export default function OfferPageOverlay() {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState(undefined); // undefined = loading, null = no active offer
  const [products, setProducts] = useState(DEFAULT_PRODS);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_OFFER_PAGE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_OFFER_PAGE_EVENT, onOpen);
  }, []);

  // Legacy rebuilds #offerPageContent fresh every openOfferPage() call, so this
  // refetches on every open rather than only once on mount.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setCfg(undefined);
    (async () => {
      const [offerCfg, customRows] = await Promise.all([
        fetchOfferConfig(supabase),
        fetchCustomProducts(supabase),
      ]);
      if (cancelled) return;
      if (customRows.length) setProducts(mergeCustomProducts(DEFAULT_PRODS, customRows));
      setCfg(hasActiveOffer(offerCfg) ? offerCfg : null);
    })();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (open) lockBody(); else unlockBody();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeydown = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
  }

  function runAfterClose(fn) {
    close();
    setTimeout(fn, POST_CLOSE_ACTION_DELAY_MS);
  }

  // Legacy model3 orderFn(forPage=true): closeOfferPage(); setTimeout(()=>{
  // orderItems=[...]; openOrder(false) }, 120). QuickOrderBridge.js (mounted in the
  // root layout) already listens for QUICK_ORDER_EVENT and routes to /checkout.
  function handleOrder(prod) {
    runAfterClose(() => {
      window.dispatchEvent(new CustomEvent(QUICK_ORDER_EVENT, { detail: { id: prod.id, qty: 1 } }));
    });
  }

  // Legacy model3 cartFn(forPage=true): closeOfferPage(); setTimeout(()=>{
  // addToCart(id,1); showToast(...) }, 120)
  function handleCart(prod) {
    runAfterClose(() => {
      const result = addToCart(products, prod.id, 1);
      if (result.ok) showToast('✅ কার্টে যোগ হয়েছে');
    });
  }

  const hasKnownModel = cfg && KNOWN_MODELS.includes(cfg.active_model);

  return (
    <div className={`pp-overlay${open ? ' show' : ''}`} id="offerPageOverlay">
      <nav className="offer-page-nav">
        <button className="pp-back" onClick={close} title="ফিরে যান">←</button>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>📢 চলতি অফারসমূহ</div>
          <div style={{ fontSize: 11, color: 'var(--gray)' }}>সর্বশেষ অফার ও ডিলস</div>
        </div>
      </nav>
      <div className="offer-page-inner">
        <div id="offerPageContent">
          {cfg === null && (
            <div className="offer-no-active">
              <div className="offer-no-icon">🏷️</div>
              আপাতত কোনো অফার সচল নেই।<br />নতুন অফার পেতে আমাদের সাথেই থাকুন!
            </div>
          )}
          {cfg && !hasKnownModel && (
            <div className="offer-no-active">
              <div className="offer-no-icon">🏷️</div>
              আপাতত কোনো অফার সচল নেই।
            </div>
          )}
          {cfg && hasKnownModel && (
            <div className="offer-page-card">
              <OfferModelContent
                cfg={cfg}
                products={products}
                onClose={close}
                onOrder={handleOrder}
                onCart={handleCart}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
