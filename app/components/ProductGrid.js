'use client';

import { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

const BATCH_SIZE = 20;

function prodInCat(p, cat) {
  if (!cat || cat === 'all') return true;
  const cats = Array.isArray(p.category) ? p.category : [p.category];
  return cats.some(c => String(c).toLowerCase() === String(cat).toLowerCase());
}

export default function ProductGrid({ initialProducts, onQuickOrder, onAddToCart, onOpenModal }) {
  const [products] = useState(initialProducts || []);
  const [activeCat, setActiveCat] = useState('all');
  const [renderedCount, setRenderedCount] = useState(BATCH_SIZE);
  const [wishlist, setWishlist] = useState([]);
  const sentinelRef = useRef(null);

  // Load wishlist from localStorage
  useEffect(() => {
    try {
      const wl = JSON.parse(localStorage.getItem('vc_wishlist') || '[]');
      setWishlist(wl);
    } catch {}
  }, []);

  // Expose category setter globally
  useEffect(() => {
    window._setProductCat = (cat) => {
      setActiveCat(cat);
      setRenderedCount(BATCH_SIZE);
      // Update section title
      const el = document.getElementById('secTitle');
      if (el) {
        if (cat === 'all') el.innerHTML = 'সকল <span>প্রোডাক্ট</span>';
        else el.innerHTML = `<span>${cat}</span> সমূহ`;
      }
    };
    return () => { delete window._setProductCat; };
  }, []);

  // Filter + sort
  const filtered = products.filter(p => prodInCat(p, activeCat));
  const sorted = [...filtered].sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0));

  // Reset count on cat change
  useEffect(() => {
    setRenderedCount(BATCH_SIZE);
  }, [activeCat]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && renderedCount < sorted.length) {
        setRenderedCount(prev => Math.min(prev + BATCH_SIZE, sorted.length));
      }
    }, { rootMargin: '300px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [renderedCount, sorted.length]);

  function toggleWish(id) {
    setWishlist(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem('vc_wishlist', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const displayedProducts = sorted.slice(0, renderedCount);
  const hasMore = renderedCount < sorted.length;

  return (
    <div className="section" id="prodSec">
      <div className="sec-head">
        <h2 className="sec-title" id="secTitle">
          সকল <span>প্রোডাক্ট</span>
        </h2>
        <span id="prodCount" style={{ fontSize: 13, color: 'var(--gray)' }}>
          {sorted.length}টি প্রোডাক্ট
        </span>
      </div>

      {!sorted.length ? (
        <div className="empty-cat-msg">
          <div className="empty-icon">📦</div>
          <p>এই ক্যাটাগরিতে এখন কোনো পণ্য নেই</p>
          <button
            style={{ background: 'var(--dark)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            onClick={() => setActiveCat('all')}
          >
            সব পণ্য দেখুন
          </button>
        </div>
      ) : (
        <div className="prod-grid" id="prodGrid">
          {displayedProducts.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onOrder={onQuickOrder}
              onCart={onAddToCart}
              onOpenModal={onOpenModal}
              wishlisted={wishlist.includes(p.id)}
              onToggleWish={toggleWish}
            />
          ))}
        </div>
      )}

      <div
        ref={sentinelRef}
        id="prodSentinel"
        style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}
      >
        {hasMore && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--gray)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin .8s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            লোড হচ্ছে...
          </div>
        )}
        {!hasMore && activeCat !== 'all' && sorted.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '28px 16px 8px', textAlign: 'center', gridColumn: '1/-1' }}>
            <p style={{ fontSize: 13.5, color: 'var(--gray)', fontWeight: 500 }}>এই ক্যাটাগরিতে আর কোনো প্রোডাক্ট নেই</p>
            <button
              style={{ background: 'var(--dark)', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setActiveCat('all')}
            >
              সব প্রোডাক্ট দেখুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
