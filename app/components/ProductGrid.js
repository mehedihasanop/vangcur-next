'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from './ProductCard';

const BATCH_SIZE = 20;

export default function ProductGrid({ initialProducts, activeCat = 'all', onProductOpen, onQuickOrder, onAddToCart }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [activeCatState, setActiveCatState] = useState(activeCat);
  const [displayed, setDisplayed] = useState([]);
  const [renderedCount, setRenderedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);

  // Filter products by category
  const filtered = activeCatState === 'all'
    ? products
    : products.filter(p => {
        const cats = Array.isArray(p.category) ? p.category : [p.category];
        return cats.some(c => String(c).toLowerCase() === activeCatState.toLowerCase());
      });

  // Sort: sold-out last
  const sorted = [...filtered].sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0));

  // Reset when category changes
  useEffect(() => {
    setRenderedCount(BATCH_SIZE);
  }, [activeCatState, products]);

  // Expose category setter to parent via window (simple bridge)
  useEffect(() => {
    window._setProductCat = (cat) => setActiveCatState(cat);
    return () => { delete window._setProductCat; };
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && renderedCount < sorted.length && !loading) {
        setRenderedCount(prev => Math.min(prev + BATCH_SIZE, sorted.length));
      }
    }, { rootMargin: '200px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sorted.length, renderedCount, loading]);

  const displayedProducts = sorted.slice(0, renderedCount);
  const hasMore = renderedCount < sorted.length;

  if (!sorted.length) {
    return (
      <div className="section" id="prodSec">
        <div className="sec-head">
          <h2 className="sec-title" id="secTitle">সকল <span>প্রোডাক্ট</span></h2>
        </div>
        <div className="empty-cat-msg">
          <div className="empty-icon">📦</div>
          <p>এই ক্যাটাগরিতে এখন কোনো পণ্য নেই</p>
          <button
            style={{ background: 'var(--dark)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            onClick={() => setActiveCatState('all')}
          >
            সব পণ্য দেখুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section" id="prodSec">
      <div className="sec-head">
        <h2 className="sec-title" id="secTitle">
          {activeCatState === 'all' ? <>সকল <span>প্রোডাক্ট</span></> : <span>{activeCatState}</span>}
        </h2>
        <span id="prodCount" style={{ fontSize: 13, color: 'var(--gray)' }}>
          {sorted.length}টি প্রোডাক্ট
        </span>
      </div>
      <div className="prod-grid" id="prodGrid">
        {displayedProducts.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            onOpenProduct={onProductOpen}
            onQuickOrder={onQuickOrder}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
      <div
        id="prodSentinel"
        ref={sentinelRef}
        style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}
      >
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--gray)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin .8s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            লোড হচ্ছে...
          </div>
        )}
        {!loading && !hasMore && activeCatState !== 'all' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '28px 16px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: 13.5, color: 'var(--gray)', fontWeight: 500 }}>এই ক্যাটাগরিতে আর কোনো প্রোডাক্ট নেই</p>
            <button
              style={{ background: 'var(--dark)', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setActiveCatState('all')}
            >
              সব প্রোডাক্ট দেখুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
