'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CATEGORY_FILTER_EVENT } from '@/lib/categoryData';
import {
  DEFAULT_PRODS, prodInCat, fetchCustomProducts, mergeCustomProducts,
  subscribeCustomProducts,
} from '@/lib/productData';
import ProductCard from './ProductCard';

// Converted from 32-javascript-all.js:
// - Global state + constants PRODS_PER_PAGE / PRODS_AUTO_THRESHOLD (legacy lines ~802-809)
// - _appendNextBatch() / _loadMoreClick() (legacy lines ~879-962)
// - _setupProdObserver() IntersectionObserver (legacy lines ~965-976, name collision with the
//   Supabase-fetch helper of the same file region — this refers to the sentinel-scroll one)
// - renderProds() (legacy lines ~981-1033) — sold-out-last sort, count text, empty state,
//   category-end "সব প্রোডাক্ট দেখুন" button
// - Custom products Supabase fetch (legacy) + store-all-watch realtime custom_products slice
// - Scroll-reveal MutationObserver + IntersectionObserver (legacy lines ~2012-2051)
// Markup source: 10-products.html

const PRODS_PER_PAGE = 20;
const PRODS_AUTO_THRESHOLD = 2; // 2 auto batches (40 products) পরে "আরো দেখুন" বাটন

export default function ProductGrid() {
  const [prods, setProds] = useState(DEFAULT_PRODS);
  const [activeCat, setActiveCat] = useState('all');
  const [renderedCount, setRenderedCount] = useState(0);
  const [showLoadMoreBtn, setShowLoadMoreBtn] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const gridRef = useRef(null);
  const sentinelRef = useRef(null);
  const batchCountRef = useRef(0);
  const loadMorePausedRef = useRef(false);
  const renderedCountRef = useRef(0);
  const listRef = useRef([]);

  // Legacy: renderProds() sorts sold-out items to the end before slicing into batches
  const list = useMemo(() => {
    const filtered = activeCat === 'all' ? prods : prods.filter((p) => prodInCat(p, activeCat));
    return [...filtered].sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0));
  }, [prods, activeCat]);

  useEffect(() => { listRef.current = list; }, [list]);
  useEffect(() => { renderedCountRef.current = renderedCount; }, [renderedCount]);

  // Legacy: appendNextBatch — grows renderedCount by PRODS_PER_PAGE, pausing every
  // PRODS_AUTO_THRESHOLD batches to show the manual "Load More" button
  const appendNextBatch = useCallback(() => {
    const currentList = listRef.current;
    const cur = renderedCountRef.current;
    if (cur >= currentList.length) return;
    const nextCount = Math.min(cur + PRODS_PER_PAGE, currentList.length);
    batchCountRef.current += 1;
    renderedCountRef.current = nextCount;
    setRenderedCount(nextCount);

    if (nextCount >= currentList.length) {
      loadMorePausedRef.current = false;
      setShowLoadMoreBtn(false);
      setShowSpinner(false);
    } else if (batchCountRef.current % PRODS_AUTO_THRESHOLD === 0) {
      loadMorePausedRef.current = true;
      setShowLoadMoreBtn(true);
      setShowSpinner(false);
    } else {
      loadMorePausedRef.current = false;
      setShowLoadMoreBtn(false);
      setShowSpinner(true);
    }
  }, []);

  // Legacy: renderProds() — every time the filtered/sorted list itself changes
  // (category switch or product data change), pagination restarts from batch 1
  useEffect(() => {
    batchCountRef.current = 0;
    loadMorePausedRef.current = false;
    renderedCountRef.current = 0;
    setShowLoadMoreBtn(false);
    setShowSpinner(false);
    setRenderedCount(0);
    // Kick off the first batch on next tick so listRef/renderedCountRef are settled
    const t = setTimeout(() => appendNextBatch(), 0);
    return () => clearTimeout(t);
  }, [list, appendNextBatch]);

  // Legacy: _setupProdObserver() — sentinel-based infinite scroll, rootMargin 300px
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && renderedCountRef.current < listRef.current.length && !loadMorePausedRef.current) {
        appendNextBatch();
      }
    }, { rootMargin: '300px' });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [appendNextBatch]);

  const handleLoadMoreClick = () => {
    setShowLoadMoreBtn(false);
    batchCountRef.current = 0;
    loadMorePausedRef.current = false;
    appendNextBatch();
  };

  // Legacy: "D. PRODUCT CARDS — scroll reveal" — newly appended cards get .vc-reveal,
  // then IntersectionObserver adds .vc-visible once they scroll into view
  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !window.IntersectionObserver) return undefined;

    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('vc-visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });

    const gridObs = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.classList && node.classList.contains('prod-card')) {
            node.classList.add('vc-reveal');
            revealObs.observe(node);
          }
        });
      });
    });

    if (gridRef.current) gridObs.observe(gridRef.current, { childList: true });
    return () => { gridObs.disconnect(); revealObs.disconnect(); };
  }, []);

  // Category filter — stay in sync with Categories/CatBar via the shared window event
  useEffect(() => {
    const onFilter = (e) => setActiveCat(e.detail?.catId || 'all');
    window.addEventListener(CATEGORY_FILTER_EVENT, onFilter);
    return () => window.removeEventListener(CATEGORY_FILTER_EVENT, onFilter);
  }, []);

  // Legacy: _fetchCustomProds() on load + store-all-watch realtime (custom_products slice)
  useEffect(() => {
    let cancelled = false;
    fetchCustomProducts(supabase).then((customRows) => {
      if (cancelled || !customRows.length) return;
      setProds((prev) => mergeCustomProducts(prev, customRows));
    });

    const channel = subscribeCustomProducts(supabase, {
      onInsert: (mapped) => setProds((prev) => (
        prev.find((x) => String(x.id) === String(mapped.id)) ? prev : [...prev, mapped]
      )),
      onUpdate: (mapped) => setProds((prev) => {
        const idx = prev.findIndex((x) => String(x.id) === String(mapped.id));
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...mapped };
        return next;
      }),
      onDelete: (id) => setProds((prev) => prev.filter((x) => String(x.id) !== String(id))),
    });

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  // Legacy: catEndBtn — "এই ক্যাটাগরিতে আর কোনো প্রোডাক্ট নেই" → "ওয়েবসাইটের সকল প্রোডাক্ট দেখুন"
  const handleShowAll = () => {
    setActiveCat('all');
    window.dispatchEvent(new CustomEvent(CATEGORY_FILTER_EVENT, { detail: { catId: 'all' } }));
    try { window.history.replaceState({ vcStack: [], homeCurrent: true }, '', '/'); } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleItems = list.slice(0, renderedCount);
  const isDone = renderedCount >= list.length;
  const showCategoryEndBtn = isDone && activeCat !== 'all' && list.length > 0;

  return (
    <div className="section" id="prodSec">
      <div className="sec-head">
        <h2 className="sec-title" id="secTitle">সকল <span>প্রোডাক্ট</span></h2>
        <span id="prodCount" style={{ fontSize: 13, color: 'var(--gray)' }}>
          {list.length}টি প্রোডাক্ট
        </span>
      </div>

      {list.length === 0 ? (
        <div className="empty-cat-msg">
          <div className="empty-icon">📦</div>
          <p>এই ক্যাটাগরিতে এখন কোনো পণ্য নেই</p>
          <button
            onClick={handleShowAll}
            style={{ background: 'var(--dark)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            সব পণ্য দেখুন
          </button>
        </div>
      ) : (
        <div className="prod-grid" id="prodGrid" ref={gridRef}>
          {visibleItems.map((p, i) => (
            <ProductCard key={p.id} prod={p} isFirst={i === 0} />
          ))}
          {showCategoryEndBtn && (
            <div
              id="catEndBtn"
              style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '28px 16px 8px', textAlign: 'center' }}
            >
              <p style={{ fontSize: 13.5, color: 'var(--gray)', fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>
                এই ক্যাটাগরিতে আর কোনো প্রোডাক্ট নেই
              </p>
              <button
                id="catEndBtnInner"
                onClick={handleShowAll}
                style={{ background: 'var(--dark)', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,.13)' }}
              >
                ওয়েবসাইটের সকল প্রোডাক্ট দেখুন
              </button>
            </div>
          )}
        </div>
      )}

      {/* Infinite Scroll Sentinel */}
      <div id="prodSentinel" ref={sentinelRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
        {showSpinner && (
          <div id="prodLoadingSpinner" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--gray)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin .8s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            লোড হচ্ছে...
          </div>
        )}
        {showLoadMoreBtn && (
          <button
            id="loadMoreBtn"
            onClick={handleLoadMoreClick}
            style={{ background: 'var(--dark)', color: '#fff', border: 'none', padding: '13px 32px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,.13)' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            আরো প্রোডাক্ট দেখুন
          </button>
        )}
      </div>
    </div>
  );
    }
