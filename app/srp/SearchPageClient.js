'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { searchProducts, matchCategories } from '@/lib/searchData';
import { DEFAULT_CATEGORIES, fetchCategories, CATEGORY_FILTER_EVENT } from '@/lib/categoryData';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import {
  DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, subscribeCustomProducts,
} from '@/lib/productData';
import SRPProductCard from '@/app/components/search/SRPProductCard';
import BackToTop from '@/app/components/layout/BackToTop';

// Converted from 32-javascript-all.js:
// - srpHandleSearch() / srpHandleKey() / srpLiveSearch() / srpClearSearch() /
//   _srpUpdateClear() (lines ~3031-3163) — same debounced-live-search behavior,
//   now driving the /srp URL's ?q= param via router.replace() instead of
//   sessionStorage + history.replaceState('/srp') cosmetic-only URL trick
// - _renderSRP() matching engine (lines ~3342-3509) — matching logic lives in
//   lib/searchData.js, this component owns rendering
// - _srpBuildProdCard() -> reuses app/components/search/SRPProductCard.js as-is
//   (built for the earlier overlay attempt; the card itself has no
//   overlay-specific logic, so it carries over unchanged)
// - SRP card reveal IntersectionObserver (lines ~3482-3497)
//
// Deliberately NOT ported (this is a real page now, not an overlay, per owner):
// - openSRP()/closeSRP()/closeSRPToHome() open/close plumbing, lockBody/
//   unlockBody, SRP_OPEN_EVENT/SRP_CLOSE_EVENT, overlay.scrollTop resets — none
//   of it applies once this is its own route. Back navigation is a plain
//   <Link href="/">; leaving the page unmounts everything naturally, so there's
//   no need to manually reset activeCat etc. the way the overlay had to.
// - Site Navbar/Footer — intentionally excluded (owner wants the old overlay's
//   minimal header look: back button + search box, nothing else)
// - .srp-overlay / .srp-body's CSS (position:fixed/inset:0 + internal
//   overflow-y:auto scroll container) — that CSS is built for a screen-covering
//   overlay and would be wrong here (would trap scroll in a nested container).
//   This page uses normal document flow/window scrolling instead, so those two
//   classes are skipped; every other legacy class name (srp-header,
//   srp-query-wrap, srp-cats, prod-grid, prod-card, ...) is kept as-is.
// Markup source: 17-search-result-page.html (adapted to a standalone page)

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(initialQuery);
  const [resultsQuery, setResultsQuery] = useState(initialQuery);
  const [prods, setProds] = useState(DEFAULT_PRODS);
  const [cats, setCats] = useState(DEFAULT_CATEGORIES.filter((c) => c.id !== 'all'));

  const inputRef = useRef(null);
  const gridRef = useRef(null);
  const debounceRef = useRef(null);

  // Legacy: _fetchCustomProds() on load + store-all-watch realtime (own copy,
  // same pattern as ProductGrid.js — no shared product store exists yet)
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

  // Legacy: loadCustomCategories()
  useEffect(() => {
    fetchCategories(supabase).then((list) => {
      setCats(list.filter((c) => c.id !== 'all'));
    });
  }, []);

  const updateUrl = useCallback((q) => {
    const url = q ? `/srp?q=${encodeURIComponent(q)}` : '/srp';
    router.replace(url, { scroll: false });
  }, [router]);

  // Legacy: srpLiveSearch(val) — input updates instantly, result render + URL debounced 180ms
  const handleInput = (val) => {
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setResultsQuery(val);
      updateUrl(val);
    }, 180);
  };

  // Legacy: srpHandleKey(e) — Enter searches immediately + blurs
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(debounceRef.current);
      const q = e.target.value.trim();
      setResultsQuery(q);
      updateUrl(q);
      e.target.blur();
    }
  };

  // Legacy: srpHandleSearch(val) — Android keyboard search-button submit
  const handleSearchSubmit = (val) => {
    clearTimeout(debounceRef.current);
    const q = (val || '').trim();
    setResultsQuery(q);
    updateUrl(q);
    if (inputRef.current) inputRef.current.blur();
  };

  // Legacy: srpClearSearch()
  const handleClear = () => {
    setInputValue('');
    clearTimeout(debounceRef.current);
    setResultsQuery('');
    updateUrl('');
    if (inputRef.current) inputRef.current.focus();
  };

  // Legacy: closeSRPAndGoCat(catId) — navigate home, then filter by category.
  // ClientHome unmounts/remounts fresh on route change, so CatBar/Categories/
  // ProductGrid attach their CATEGORY_FILTER_EVENT listener on mount; the
  // delay gives that remount time to happen before the event fires (same
  // best-effort timing trick the legacy 80ms setTimeout used).
  const goToCategory = (catId) => {
    router.push('/');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(CATEGORY_FILTER_EVENT, { detail: { catId } }));
    }, 200);
  };

  const lower = resultsQuery.toLowerCase().trim();
  const results = lower ? searchProducts(prods, resultsQuery) : [];
  const catMatches = lower ? matchCategories(cats, resultsQuery) : [];

  // Legacy: SRP card reveal — IntersectionObserver + per-card transitionDelay stagger
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !window.IntersectionObserver) return undefined;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('vc-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -30px 0px', threshold: 0.08 });

    grid.querySelectorAll('.prod-card').forEach((card, i) => {
      card.classList.add('vc-reveal');
      card.style.transitionDelay = Math.min(i * 55, 300) + 'ms';
      obs.observe(card);
    });

    return () => obs.disconnect();
  }, [results]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F5F5F5)', display: 'flex', flexDirection: 'column' }}>
      <div className="srp-header" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <Link className="pp-back" href="/" aria-label="হোমে ফিরুন" title="হোমে ফিরুন" style={{ flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
            <path d="M9 21V12h6v9" />
          </svg>
        </Link>
        <div className="srp-query-wrap">
          <input
            ref={inputRef}
            type="search"
            className="srp-query-inp"
            placeholder="পুনরায় সার্চ করুন..."
            autoComplete="off"
            inputMode="search"
            value={inputValue}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onSearch={(e) => handleSearchSubmit(e.target.value)}
            autoFocus
          />
          <button
            className={'srp-clear' + (inputValue.length > 0 ? ' visible' : '')}
            onClick={handleClear}
          >✕</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: 16 }}>
        {!lower ? (
          <div className="srp-empty">
            <div className="srp-empty-icon">🔍</div>
            <p style={{ marginBottom: 18 }}>কিছু লিখে সার্চ করুন</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, color: 'var(--gray)', fontSize: 12, fontWeight: 600 }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border)', display: 'block' }} />
              অথবা
              <span style={{ flex: 1, height: 1, background: 'var(--border)', display: 'block' }} />
            </div>
            <Link
              href="/"
              style={{ background: '#1A1A1A', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
                <path d="M9 21V12h6v9" />
              </svg>
              ওয়েবসাইটের হোম পেইজে ফিরে যান
            </Link>
          </div>
        ) : (
          <>
            {catMatches.length > 0 && (
              <>
                <div className="srp-section-title">ক্যাটাগরি</div>
                <div className="srp-cats">
                  {catMatches.map((c) => {
                    const isSvg = typeof c.icon === 'string' && c.icon.trim().startsWith('<svg');
                    return (
                      <div key={c.id} className="srp-cat-chip" onClick={() => goToCategory(c.id)}>
                        {isSvg
                          ? <span className="srp-cat-chip-icon" dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(c.icon) }} />
                          : <span className="srp-cat-chip-icon">{c.icon || '📂'}</span>}
                        {c.name}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {results.length === 0 ? (
              <div className="srp-empty">
                <div className="srp-empty-icon">😕</div>
                <p>"<strong>{resultsQuery}</strong>" এর জন্য কোনো পণ্য পাওয়া যায়নি</p>
              </div>
            ) : (
              <>
                <div className="srp-info">{results.length}টি পণ্য পাওয়া গেছে</div>
                <div className="prod-grid" ref={gridRef}>
                  {results.map((p) => <SRPProductCard key={p.id} prod={p} />)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 16px 24px' }}>
                  <Link
                    href="/"
                    style={{ background: '#1A1A1A', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'inline-flex', alignItems: 'center', gap: 9, boxShadow: '0 4px 18px rgba(0,0,0,.15)', transition: 'all .25s cubic-bezier(.4,0,.2,1)', textDecoration: 'none' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#C1121F'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
                      <path d="M9 21V12h6v9" />
                    </svg>
                    ওয়েবসাইটের হোম পেইজে ফিরে যান
                  </Link>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* legacy's own srpFloatBtns — kept because this page has no site Navbar/Footer,
          so the site-wide FloatButtons.js (mounted only inside ClientHome) never renders here */}
      <div className="float-btns" style={{ display: 'flex' }}>
        <button className="f-btn fb-wa" onClick={() => window.open('https://wa.me/8801816365504', '_blank')}>
          <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </button>
        <button className="f-btn fb-msg" onClick={() => window.open('https://m.me/vangcurbdofficial', '_blank')}>
          <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.57.61.94 1.13.7l1.98-.87c.17-.08.36-.09.54-.04.9.25 1.87.38 2.89.38C17.64 21.4 22 17.27 22 11.7 22 6.13 17.64 2 12 2zm6.11 7.37l-2.96 4.7c-.47.74-1.47.93-2.17.41l-2.36-1.76c-.22-.16-.51-.16-.72 0l-3.18 2.41c-.42.32-.97-.16-.69-.62l2.96-4.7c.47-.74 1.47-.93 2.17-.41l2.36 1.76c.22.16.51.16.72 0l3.18-2.41c.43-.32.97.17.69.62z" /></svg>
        </button>
      </div>

      <BackToTop />
    </div>
  );
}
