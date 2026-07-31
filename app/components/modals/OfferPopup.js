'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { fetchOfferConfig, hasActiveOffer, canShowPopup, markPopupShown } from '@/lib/offerData';
import {
  DEFAULT_PRODS, QUICK_ORDER_EVENT, fetchCustomProducts, mergeCustomProducts,
} from '@/lib/productData';
import { addToCart } from '@/lib/cartData';
import { showToast } from '@/lib/toast';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { sanitizeHref } from '@/lib/sanitize';

// Converted from 32-javascript-all.js:
// - _getOfferCfg() / _buildOfferHTML() (lines ~2125-2185)
// - openOfferPopup() / closeOfferPopup() (lines ~2187-2212)
// - the load-time auto-popup queue with its 24-hour cooldown (lines ~2232-2250)
// Markup source: 33-offer-popup-modal.html — .modal-bg#offerPopupModal >
// .op-box#offerPopupBox > .op-close + #offerPopupContent. All op-m1/op-m2/op-m3
// classes verified present in app/globals.css (~line 1430-1467), unchanged.
//
// Scope note: `forPage`/openOfferPage() (34-offer-page-overlay.html, Priority 4 per
// VANGCUR_MASTER_PROMPT.md) is NOT built here — this component only covers the
// popup half (forPage=false). `_scheduleNotificationToasts()`, which legacy fires
// a few seconds after this popup closes, is a separate not-yet-converted
// notification-toast feature; it was only ever staggered after this popup to avoid
// two timers firing at once, not because it depends on this component, so it's
// left out entirely rather than guessed at.
//
// Legacy's `_pushPanel('offer-popup')`/`_popPanel()` (mobile back-button stack) is
// intentionally not ported, per VANGCUR_MASTER_PROMPT.md's decision that every
// modal/drawer here uses lockBody()/unlockBody() only.
//
// Route scope (owner should confirm): mounted in GlobalOverlays.js so it works on
// every route — avoiding the same homepage-only "pattern C" bug class the master
// prompt already found elsewhere — EXCEPT /checkout, where a marketing popup
// interrupting an in-progress order seems like a clear UX regression legacy never
// actually had to worry about (legacy's checkout was an overlay on top of the same
// single page, not a separate navigable route). That /checkout exclusion is this
// component's own judgment call, not something stated in the master prompt — flag
// it to the owner if a different behavior is wanted.

const AUTO_SHOW_DELAY_MS = 3000;       // legacy: window 'load' + setTimeout(fn, 3000)
const POST_CLOSE_ACTION_DELAY_MS = 150; // legacy: setTimeout(..., 120) before opening order/cart

export default function OfferPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState(null);
  const prodsRef = useRef(DEFAULT_PRODS);

  useEffect(() => {
    if (pathname === '/checkout') return undefined;
    let cancelled = false;
    let showTimer = null;

    (async () => {
      const [offerCfg, customRows] = await Promise.all([
        fetchOfferConfig(supabase),
        fetchCustomProducts(supabase),
      ]);
      if (cancelled) return;
      if (customRows.length) {
        prodsRef.current = mergeCustomProducts(DEFAULT_PRODS, customRows);
      }
      if (!hasActiveOffer(offerCfg)) return;

      showTimer = setTimeout(() => {
        if (cancelled) return;
        if (canShowPopup()) {
          setCfg(offerCfg);
          setOpen(true);
          markPopupShown();
        }
      }, AUTO_SHOW_DELAY_MS);
    })();

    return () => {
      cancelled = true;
      if (showTimer) clearTimeout(showTimer);
    };
    // Intentionally re-runs per pathname change (e.g. SPA nav into "/") the same
    // way legacy's single 'load' listener effectively could only ever fire once
    // per real page load — canShowPopup()'s 24h cooldown still gates the outcome.
  }, [pathname]);

  useEffect(() => {
    if (open) lockBody(); else unlockBody();
  }, [open]);

  function close() {
    setOpen(false);
  }

  function runAfterClose(fn) {
    close();
    setTimeout(fn, POST_CLOSE_ACTION_DELAY_MS);
  }

  // Legacy model3 orderFn: closeOfferPopup(); setTimeout(()=>{ orderItems=[...]; openOrder(false) }, 120)
  // QuickOrderBridge.js (mounted in the root layout) already listens for
  // QUICK_ORDER_EVENT and routes to /checkout, so this just reuses that instead of
  // re-implementing the order-overlay hand-off.
  function handleOrder(prod) {
    runAfterClose(() => {
      window.dispatchEvent(new CustomEvent(QUICK_ORDER_EVENT, { detail: { id: prod.id, qty: 1 } }));
    });
  }

  // Legacy model3 cartFn: closeOfferPopup(); setTimeout(()=>{ addToCart(id,1); showToast(...) }, 120)
  function handleCart(prod) {
    runAfterClose(() => {
      const result = addToCart(prodsRef.current, prod.id, 1);
      if (result.ok) showToast('✅ কার্টে যোগ হয়েছে');
    });
  }

  return (
    <div
      className={`modal-bg${open ? ' show' : ''}`}
      id="offerPopupModal"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="op-box" id="offerPopupBox">
        <button className="op-close" onClick={close} title="বন্ধ করুন">✕</button>
        <div id="offerPopupContent">
          {cfg && (
            <OfferModelContent
              cfg={cfg}
              products={prodsRef.current}
              onClose={close}
              onOrder={handleOrder}
              onCart={handleCart}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OfferModelContent({ cfg, products, onClose, onOrder, onCart }) {
  const model = cfg.active_model;

  if (model === 'model1') {
    const d = cfg.model1 || {};
    const btnUrl = sanitizeHref(d.btn_url || '#');
    const btnTarget = btnUrl.startsWith('http') ? '_blank' : '_self';
    return (
      <div className="op-m1">
        <div className="op-m1-gradient" />
        <div className="op-m1-title">{d.title || 'বিশেষ অফার!'}</div>
        <div className="op-m1-body">{d.body || ''}</div>
        <a className="op-m1-btn" href={btnUrl} target={btnTarget} rel="noopener" onClick={onClose}>
          {d.btn_text || 'অফার দেখুন'}
        </a>
      </div>
    );
  }

  if (model === 'model2') {
    const d = cfg.model2 || {};
    const imgUrl = d.img || '';
    const url = sanitizeHref(d.url || '#');
    const target = url.startsWith('http') ? '_blank' : '_self';
    if (!imgUrl) {
      return <div className="op-m1"><div className="op-m1-title">ব্যানার ইমেজ সেট করা হয়নি</div></div>;
    }
    return (
      <a href={url} target={target} rel="noopener" onClick={onClose} style={{ display: 'block' }}>
        <OfferBannerImg src={imgUrl} />
      </a>
    );
  }

  if (model === 'model3') {
    const d = cfg.model3 || {};
    const badge = d.badge_text || 'HOT DEAL';
    const prod = d.product_id ? products.find((x) => String(x.id) === String(d.product_id)) : null;

    if (!prod) {
      return (
        <div className="op-m3">
          <div className="op-m3-badge">{badge}</div>
          <div className="op-m1-body">প্রোডাক্ট পাওয়া যাচ্ছে না।</div>
        </div>
      );
    }

    const imgSrc = Array.isArray(prod.imgs) && prod.imgs.length && String(prod.imgs[0]).startsWith('http')
      ? prod.imgs[0]
      : null;

    return (
      <div className="op-m3">
        <div className="op-m3-badge">{badge}</div>
        <div className="op-m3-img-wrap">
          {imgSrc
            ? <OfferProductImg src={imgSrc} name={prod.name} />
            : <span style={{ fontSize: 60 }}>{(prod.imgs && prod.imgs[0]) || '📦'}</span>}
        </div>
        <div className="op-m3-name">{prod.name}</div>
        <div className="op-m3-prices">
          <span className="op-m3-price">৳{Number(prod.price).toLocaleString()}</span>
          {prod.old && prod.old > prod.price && (
            <span className="op-m3-old">৳{Number(prod.old).toLocaleString()}</span>
          )}
        </div>
        <div className="op-m3-btns">
          <button className="op-m3-btn-order" onClick={() => onOrder(prod)}>⚡ এখনই অর্ডার করুন</button>
          <button className="op-m3-btn-cart" onClick={() => onCart(prod)}>🛒 কার্ট</button>
        </div>
      </div>
    );
  }

  return null;
}

// Legacy: model2's <img onerror="this.style.display='none'">
function OfferBannerImg({ src }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    <img className="op-m2-img" src={src} alt="অফার ব্যানার" onError={() => setBroken(true)} />
  );
}

function OfferProductImg({ src, name }) {
  return (
    <img
      src={src}
      alt={name}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  );
}
