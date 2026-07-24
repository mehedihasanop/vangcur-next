'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_CATEGORIES, fetchCategories, makeCatSlug, CATEGORY_FILTER_EVENT } from '@/lib/categoryData';

// Converted from 32-javascript-all.js:
// - getCatPerPage / getCatItems / updateCatCarousel / catCarouselSlide (lines ~7515-7575)
// - loadCustomCategories() grid-rendering half (lines ~7626-7697)
// - touch swipe support (lines ~7895-7912 in the extraction)
// - "D. CATEGORY CARDS — scroll reveal with stagger" IntersectionObserver (lines ~7852-7860)
// Markup source: 09-categories.html

function getCatPerPage() {
  if (typeof window === 'undefined') return 8;
  return window.innerWidth <= 768 ? 4 : 8;
}

function getCatCols() {
  if (typeof window === 'undefined') return 4;
  if (window.innerWidth <= 768) return 2;
  if (window.innerWidth <= 1024) return 3;
  return 4;
}

export default function Categories() {
  const [cats, setCats] = useState(DEFAULT_CATEGORIES);
  const [catPage, setCatPage] = useState(0);
  const [activeId, setActiveId] = useState('all');

  const viewportRef = useRef(null);
  const gridRef = useRef(null);
  const prevBtnRef = useRef(null);
  const nextBtnRef = useRef(null);
  const catPageRef = useRef(0); // avoids stale closures in event handlers
  const touchRef = useRef({ x: 0, y: 0 });
  const revealedRef = useRef(false);

  useEffect(() => { catPageRef.current = catPage; }, [catPage]);

  const maxPage = Math.max(0, Math.ceil(cats.length / getCatPerPage()) - 1);

  const clampPage = useCallback((p) => Math.max(0, Math.min(p, maxPage)), [maxPage]);

  // Legacy: updateCatCarousel() — recompute grid column count on resize
  const applyGridCols = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.style.gridTemplateColumns = `repeat(${getCatCols()},1fr)`;
    }
  }, []);

  useEffect(() => {
    applyGridCols();
    const onResize = () => {
      applyGridCols();
      setCatPage((p) => clampPage(p));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [applyGridCols, clampPage]);

  // Legacy: catCarouselSlide(dir, btn)
  const slide = (dir, btnRef) => {
    setCatPage((p) => {
      let next = p + dir;
      if (next > maxPage) next = 0;
      if (next < 0) next = maxPage;
      return next;
    });
    const btn = btnRef && btnRef.current;
    if (btn) {
      btn.classList.add('clicked');
      clearTimeout(btn._resetTimer);
      btn._resetTimer = setTimeout(() => btn.classList.remove('clicked'), 500);
    }
  };

  // Legacy: touch swipe support on #catViewport
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onTouchStart = (e) => {
      touchRef.current.x = e.touches[0].clientX;
      touchRef.current.y = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      const dy = e.changedTouches[0].clientY - touchRef.current.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) slide(dx < 0 ? 1 : -1, null);
    };
    vp.addEventListener('touchstart', onTouchStart, { passive: true });
    vp.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchend', onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPage]);

  // Fetch categories from Supabase (vc_categories setting), fall back to defaults
  useEffect(() => {
    let cancelled = false;
    fetchCategories(supabase).then((list) => {
      if (!cancelled) setCats(list);
    });

    // Realtime: store_settings row for vc_categories can change from the admin panel
    const channel = supabase
      .channel('categories-carousel-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_categories' },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          const parsed = typeof row.setting_value === 'string'
            ? (() => { try { return JSON.parse(row.setting_value); } catch (e) { return row.setting_value; } })()
            : row.setting_value;
          if (Array.isArray(parsed) && parsed.length) setCats(parsed);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Reset to page 0 whenever the category list itself changes (legacy: catPage=0 in loadCustomCategories)
  useEffect(() => {
    setCatPage(0);
    revealedRef.current = false;
  }, [cats]);

  // Legacy: "D. CATEGORY CARDS — scroll reveal with stagger" IntersectionObserver
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revealCards = () => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll('.cat-card');
      cards.forEach((el, i) => {
        el.classList.add('vc-reveal');
        setTimeout(() => el.classList.add('vc-visible'), i * 40);
      });
    };

    if (revealedRef.current) return;

    if (!prefersReduced && typeof window !== 'undefined' && window.IntersectionObserver) {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            revealCards();
            revealedRef.current = true;
            obs.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      if (viewportRef.current) obs.observe(viewportRef.current);
      return () => obs.disconnect();
    }
    revealCards();
    revealedRef.current = true;
  }, [cats]);

  // Legacy: filterCat(cat, btn) — the routing/scroll/broadcast half.
  // Product-list filtering itself lives in ProductGrid (not built yet); this
  // dispatches a shared event so ProductGrid/CatBar can react once present.
  const handleSelect = (catId) => {
    setActiveId(catId);
    try {
      const url = catId === 'all' ? '/' : '/category/' + makeCatSlug(catId);
      window.history.replaceState({ vcStack: [], homeCurrent: true, vcCat: catId }, '', url);
    } catch (e) {}
    window.dispatchEvent(new CustomEvent(CATEGORY_FILTER_EVENT, { detail: { catId } }));
    document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Keep highlighting in sync if another category UI (hidden CatBar, hero duo cards) fires first
  useEffect(() => {
    const onExternal = (e) => setActiveId(e.detail?.catId || 'all');
    window.addEventListener(CATEGORY_FILTER_EVENT, onExternal);
    window.addEventListener('vc:cathCategoryClick', onExternal);
    return () => {
      window.removeEventListener(CATEGORY_FILTER_EVENT, onExternal);
      window.removeEventListener('vc:cathCategoryClick', onExternal);
    };
  }, []);

  const perPage = getCatPerPage();
  const pageCount = maxPage + 1;

  return (
    <div className="section">
      <div className="sec-head">
        <h2 className="sec-title">ক্যাটাগরি <span>সমূহ</span></h2>
      </div>
      <div className="cat-carousel-wrap">
        <button
          ref={prevBtnRef}
          className="cat-carousel-arrow prev"
          id="catPrevBtn"
          onClick={() => slide(-1, prevBtnRef)}
        >
          &#8249;
        </button>
        <div className="cat-cards-viewport" id="catViewport" ref={viewportRef}>
          <div className="cat-cards" id="catCardsGrid" ref={gridRef}>
            {cats.map((cat, i) => {
              const start = catPage * perPage;
              const visible = i >= start && i < start + perPage;
              const isSvg = typeof cat.icon === 'string' && cat.icon.trim().startsWith('<svg');
              return (
                <div
                  key={cat.id}
                  className="cat-card"
                  style={{ display: visible ? '' : 'none' }}
                  onClick={() => handleSelect(cat.id)}
                >
                  <div className="cat-card-icon-wrap">
                    {isSvg ? (
                      <span dangerouslySetInnerHTML={{ __html: cat.icon }} />
                    ) : (
                      cat.icon || '📦'
                    )}
                  </div>
                  <div className="cat-card-name">{cat.name}</div>
                </div>
              );
            })}
          </div>
        </div>
        <button
          ref={nextBtnRef}
          className="cat-carousel-arrow next"
          id="catNextBtn"
          onClick={() => slide(1, nextBtnRef)}
        >
          &#8250;
        </button>
      </div>
      <div id="catDots" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
        {Array.from({ length: pageCount }).map((_, p) => (
          <div
            key={p}
            className={'cat-dot' + (p === catPage ? ' active' : '')}
            onClick={() => setCatPage(p)}
          />
        ))}
      </div>
    </div>
  );
}
