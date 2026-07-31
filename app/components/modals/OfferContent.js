'use client';

import { useState } from 'react';
import { sanitizeHref } from '@/lib/sanitize';

// Shared by app/components/modals/OfferPopup.js (33-offer-popup-modal.html) and
// app/components/modals/OfferPageOverlay.js (34-offer-page-overlay.html).
// Converted from 32-javascript-all.js: _buildOfferHTML(cfg, forPage) (lines ~2125-2185).
// forPage only ever changed _buildOfferHTML()'s orderFn/cartFn wiring (which overlay
// to close first) — the markup itself is identical for popup vs page, so it's pulled
// out once here instead of duplicated. Both callers pass their own onOrder/onCart
// that already know which overlay to close before acting.

export default function OfferModelContent({ cfg, products, onClose, onOrder, onCart }) {
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
