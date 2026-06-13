'use client';

import { useState } from 'react';
import Link from 'next/link';

function renderStars(rating) {
  const r = Math.max(0, Math.min(5, parseFloat(rating) || 4.5));
  const full = Math.floor(r);
  const partial = r - full;
  const empty = 5 - full - (partial > 0 ? 1 : 0);
  let html = '';
  for (let i = 0; i < full; i++) html += '<span style="color:#F59E0B">★</span>';
  if (partial > 0) {
    const pct = Math.round(partial * 100);
    html += `<span style="position:relative;display:inline-block;color:#E5E7EB">★<span style="position:absolute;left:0;top:0;width:${pct}%;overflow:hidden;color:#F59E0B">★</span></span>`;
  }
  for (let i = 0; i < empty; i++) html += '<span style="color:#E5E7EB">★</span>';
  return html;
}

export default function ProductCard({ product, onQuickOrder, onAddToCart, onOpenProduct }) {
  const p = product;
  const sold = p.stock <= 0;
  const imgs = Array.isArray(p.imgs) ? p.imgs : (p.image_url ? [p.image_url] : ['📦']);
  const mainImg = imgs[0];
  const discPct = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const discBgColor = p.discountColor === 'green' ? '#16A34A' : '#FF6B00';
  const reviewCount = Math.floor(((Number(p.id) || 1) * 37 + (p.stock || 0) * 13) % 80 + 20);

  return (
    <div className="prod-card">
      {/* Badge */}
      {sold ? (
        <div className="prod-badge badge-sold">Sold Out</div>
      ) : p.badge ? (
        <div className={`prod-badge badge-${p.badge.toLowerCase()}`}>{p.badge}</div>
      ) : null}

      {/* Discount badge */}
      {discPct >= 5 && !sold && (
        <div
          className="discount-badge"
          style={{ top: p.badge ? '32px' : '10px', background: discBgColor }}
        >
          {discPct}% ছাড়
        </div>
      )}

      {/* Image */}
      <div className="prod-img-wrap" style={{ position: 'relative' }}>
        <div
          className="prod-img"
          onClick={() => onOpenProduct && onOpenProduct(p.id)}
          style={{ overflow: 'hidden', cursor: 'pointer' }}
        >
          {mainImg && (mainImg.startsWith('http') || mainImg.startsWith('//')) ? (
            <img
              src={mainImg}
              alt={p.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
              loading="lazy"
            />
          ) : (
            <span style={{ fontSize: 52 }}>{mainImg || '📦'}</span>
          )}
        </div>
        <button
          className="wish-btn"
          title="Wishlist"
          onClick={() => {/* wishlist toggle — later */}}
        >
          🤍
        </button>
      </div>

      {/* Info */}
      <div className="prod-info">
        <div
          className="prod-name"
          onClick={() => onOpenProduct && onOpenProduct(p.id)}
          style={{ cursor: 'pointer' }}
        >
          {p.name}
        </div>
        {p.specs_short && (
          <div className="prod-spec">{p.specs_short}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5, fontSize: 11 }}>
          <span dangerouslySetInnerHTML={{ __html: renderStars(p.rating || 4.5) }} />
          <span style={{ color: 'var(--gray)' }}>
            {(p.rating || 4.5).toFixed(1)} ({reviewCount})
          </span>
        </div>
        <div className="prod-price-row">
          <span className="prod-price">৳{p.price?.toLocaleString()}</span>
          {p.old > p.price && (
            <span className="prod-old">৳{p.old?.toLocaleString()}</span>
          )}
        </div>
        <div className="prod-cta-row">
          {sold ? (
            <button
              className="prod-cta"
              style={{ width: '100%', background: '#F59E0B', color: '#fff', border: 'none' }}
            >
              🔔 স্টকে আসলে জানান
            </button>
          ) : (
            <>
              <button
                className="prod-cta"
                onClick={() => onQuickOrder && onQuickOrder(p.id)}
              >
                ⚡ অর্ডার করুন
              </button>
              <button
                className="prod-cart-icon-btn"
                onClick={() => onAddToCart && onAddToCart(p.id)}
                title="কার্টে যোগ করুন"
              >
                🛒
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
