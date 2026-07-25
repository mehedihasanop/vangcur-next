'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { searchProducts, matchCategories } from '@/lib/searchData';
import { DEFAULT_CATEGORIES, fetchCategories, CATEGORY_FILTER_EVENT } from '@/lib/categoryData';
import {
  DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, subscribeCustomProducts,
} from '@/lib/productData';
import { SRP_OPEN_EVENT, SRP_CLOSE_EVENT, SRP_TRIGGER_EVENT } from '@/lib/uiEvents';
import SRPProductCard from './SRPProductCard';

// Converted from 32-javascript-all.js:
// - openSRP() / closeSRP() / closeSRPToHome() / closeSRPAndGoCat() (lines ~2997-3138)
// - srpHandleSearch() / srpHandleKey() / srpLiveSearch() / srpClearSearch() /
//   _srpUpdateClear() (lines ~3031-3163)
// - _renderSRP() matching engine (lines ~3342-3509) — matching itself now lives
//   in lib/searchData.js, this component owns the DOM/render side
// - _srpScrollHandler() (lines ~3225-3235) — reimplemented via SRP_OPEN_EVENT's
//   {bodyEl} detail, which BackToTop.js already listens for (see lib/uiEvents.js)
// - SRP card reveal IntersectionObserver (lines ~3482-3497)
// Markup source: 17-search-result-page.html
//
// Not converted here (out of scope for this section, no equivalent infra exists
// yet elsewhere in the Next.js app either):
// - The legacy `_panelStack` / `_backButtonTriggered` cross-overlay history stack
//   (used so the phone/browser back button closes whichever overlay is on top).
//   closeSRP() here always resets straight to '/' via history.replaceState,
//   same as closeSRPToHome() — once a real panel-stack exists (needed by
//   ProductDetail/CartDrawer/LoginModal too) this can be revisited.
// - sessionStorage-based "restore SRP on page refresh" (openSRP() call gated on
//   a saved query, referenced elsewhere in 32-javascript-all.js ~line 724) —
//   this component still writes vc_srp_query so that future piece can read it,
//   it just doesn't self-trigger on mount.

const SRP_ICON_FALLBACK = {
  tws: '🎧', powerbank: '🔋', rgb: '💡', smartwatch: '⌚', acrylic: '🕯️', headphone: '🎧',
  fan: '💨', unique: '✨', crystalball: '🔮', waterbottle: '💧', wifiups: '📡', humidifier: '💨',
  keyboard: '⌨️', gimbal: '📷', light: '💡', mouse: '🖱️', cable: '🔌', 'unique-tools': '🔧',
  hairdryer: '💇', toys: '🧸', alarmclock: '⏰', lamp: '💡', usbhub: '🔗', accessories: '🎒',
  powerstrip: '🔌', projector: '📽️', neckband: '🎵', kitchenaccessories: '🍳', offer: '🏷️', btspeaker: '🔊',
};

function CatIcon({ icon, id }) {
  const val = icon || SRP_ICON_FALLBACK[id] || '📂';
  const isSvg = typeof val === 'string' && val.trim().startsWith('<svg');
  return isSvg
    ? <span className="srp-cat-chip-icon" dangerouslySetInnerHTML={{ __html: val }} />
    : <span className="srp-cat-chip-icon">{val}</span>;
}

export default function SearchPage() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [resultsQuery, setResultsQuery] = useState('');
  const [prods, setProds] = useState(DEFAULT_PRODS);
  const [cats, setCats] = useState(DEFAULT_CATEGORIES.filter((c) => c.id !== 'all'));

  const inputRef = useRef(null);
  const bodyRef = useRef(null);
  const overlayRef = useRef(null);
  const debounceRef = useRef(null);
  const gridRef = useRef(null);

  // Legacy: _fetchCustomProds() on load + store-all-watch realtime (same as ProductGrid.js —
  // SRP keeps its own copy since there's no shared product store yet)
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

  // Legacy: loadCustomCategories() — vc_categories setting, falls back to defaults
  useEffect(() => {
    fetchCategories(supabase).then((list) => {
      setCats(list.filter((c) => c.id !== 'all'));
    });
  }, []);

  const resetToAllCategory = () => {
    window.dispatchEvent(new CustomEvent(CATEGORY_FILTER_EVENT, { detail: { catId: 'all' } }));
  };

  // Legacy: closeSRP(skipHomeScroll) / closeSRPToHome() — merged since this app has
  // no cross-overlay history stack yet (see file-top comment); both fully reset.
  const performClose = useCallback((scrollHome) => {
    setOpen(false);
    unlockBody();
    window.dispatchEvent(new CustomEvent(SRP_CLOSE_EVENT));
    try { sessionStorage.removeItem('vc_srp_query'); } catch (e) {}
    setQuery('');
    setResultsQuery('');
    resetToAllCategory();
    try { history.replaceState({ vcStack: [], homeCurrent: true }, '', '/'); } catch (e) {}
    if (scrollHome) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const closeSRPToHome = useCallback(() => performClose(true), [performClose]);
  const closeSRP = useCallback((skipHomeScroll) => performClose(!skipHomeScroll), [performClose]);

  const closeSRPAndGoCat = useCallback((catId) => {
    closeSRP(true);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(CATEGORY_FILTER_EVENT, { detail: { catId } }));
    }, 80);
  }, [closeSRP]);

  // Legacy: openSRP(q) — triggered by Navbar's Enter-key search / "সব ফলাফল দেখুন"
  useEffect(() => {
    const onTrigger = (e) => {
      const q = (e.detail && e.detail.query) || '';
      setQuery(q);
      setResultsQuery(q);
      clearTimeout(debounceRef.current);
      setOpen(true);
      lockBody();
      try {
        sessionStorage.setItem('vc_srp_query', q);
        history.replaceState({ vcStack: [], srpActive: true, srpQuery: q }, '', '/srp');
      } catch (err) {}
    };
    window.addEventListener(SRP_TRIGGER_EVENT, onTrigger);
    return () => window.removeEventListener(SRP_TRIGGER_EVENT, onTrigger);
  }, []);

  // On open: reset scroll to top and notify BackToTop.js which container to watch
  useEffect(() => {
    if (!open) return;
    if (overlayRef.current) overlayRef.current.scrollTop = 0;
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    window.dispatchEvent(new CustomEvent(SRP_OPEN_EVENT, { detail: { bodyEl: bodyRef.current } }));
  }, [open]);

  // Legacy: srpLiveSearch(val) — updates input instantly, debounces the result render 180ms
  const handleInput = (val) => {
    setQuery(val);
    try {
      sessionStorage.setItem('vc_srp_query', val);
      history.replaceState({ vcStack: [], srpActive: true, srpQuery: val }, '', '/srp');
    } catch (e) {}
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setResultsQuery(val), 180);
  };

  // Legacy: srpHandleKey(e) — Enter searches immediately + blurs, Escape closes
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(debounceRef.current);
      setResultsQuery(e.target.value.trim());
      e.target.blur();
    } else if (e.key === 'Escape') {
      closeSRP();
    }
  };

  // Legacy: srpHandleSearch(val) — Android keyboard search-button submit
  const handleSearchSubmit = (val) => {
    clearTimeout(debounceRef.current);
    setResultsQuery((val || '').trim());
    if (inputRef.current) inputRef.current.blur();
  };

  // Legacy: srpClearSearch()
  const handleClear = () => {
    setQuery('');
    clearTimeout(debounceRef.current);
    setResultsQuery('');
    if (inputRef.current) inputRef.current.focus();
  };

  const lower = resultsQuery.toLowerCase().trim();
  const results = lower ? searchProducts(prods, resultsQuery) : [];
  const catMatches = lower ? matchCategories(cats, resultsQuery) : [];

  // Legacy: SRP card reveal — _srpRevealObs IntersectionObserver + per-card
  // transitionDelay stagger (lines ~3483-3497), re-run whenever the result set changes
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

  if (!open) return null;

  return (
    <div className="srp-overlay show" id="srpOverlay" ref={overlayRef}>
      <div className="srp-header">
        <button className="pp-back" onClick={closeSRPToHome} aria-label="হোমে ফিরুন" title="হোমে ফিরুন" style={{ flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
            <path d="M9 21V12h6v9" />
          </svg>
        </button>
        <div className="srp-query-wrap">
          <input
            ref={inputRef}
            type="search"
            className="srp-query-inp"
            id="srpQueryInp"
            placeholder="পুনরায় সার্চ করুন..."
            autoComplete="off"
            inputMode="search"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onSearch={(e) => handleSearchSubmit(e.target.value)}
            autoFocus
          />
          <button
            className={'srp-clear' + (query.length > 0 ? ' visible' : '')}
            id="srpClear"
            onClick={handleClear}
          >✕</button>
        </div>
      </div>

      <div className="srp-body" id="srpBody" ref={bodyRef}>
        {!lower ? (
          <div className="srp-empty">
            <div className="srp-empty-icon">🔍</div>
            <p style={{ marginBottom: 18 }}>কিছু লিখে সার্চ করুন</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, color: 'var(--gray)', fontSize: 12, fontWeight: 600 }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border)', display: 'block' }} />
              অথবা
              <span style={{ flex: 1, height: 1, background: 'var(--border)', display: 'block' }} />
            </div>
            <button
              style={{ background: '#1A1A1A', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'inline-flex', alignItems: 'center', gap: 8 }}
              id="srpHomeBtn"
              onClick={closeSRPToHome}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
                <path d="M9 21V12h6v9" />
              </svg>
              ওয়েবসাইটের হোম পেইজে ফিরে যান
            </button>
          </div>
        ) : (
          <>
            {catMatches.length > 0 && (
              <>
                <div className="srp-section-title">ক্যাটাগরি</div>
                <div className="srp-cats">
                  {catMatches.map((c) => (
                    <div key={c.id} className="srp-cat-chip" onClick={() => closeSRPAndGoCat(c.id)}>
                      <CatIcon icon={c.icon} id={c.id} />
                      {c.name}
                    </div>
                  ))}
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
                  <button
                    id="srpBottomHomeBtn"
                    onClick={closeSRPToHome}
                    style={{ background: '#1A1A1A', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'inline-flex', alignItems: 'center', gap: 9, boxShadow: '0 4px 18px rgba(0,0,0,.15)', transition: 'all .25s cubic-bezier(.4,0,.2,1)' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#C1121F'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
                      <path d="M9 21V12h6v9" />
                    </svg>
                    ওয়েবসাইটের হোম পেইজে ফিরে যান
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* SRP-এর ভেতরে float buttons — z-index conflict নেই, সব scroll position এ কাজ করে */}
      <div className="float-btns" id="srpFloatBtns" style={{ display: 'flex', zIndex: 1250 }}>
        <button className="f-btn fb-wa" onClick={() => window.open('https://wa.me/8801816365504', '_blank')}>
          <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </button>
        <button className="f-btn fb-msg" onClick={() => window.open('https://m.me/vangcurbdofficial', '_blank')}>
          <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.57.61.94 1.13.7l1.98-.87c.17-.08.36-.09.54-.04.9.25 1.87.38 2.89.38C17.64 21.4 22 17.27 22 11.7 22 6.13 17.64 2 12 2zm6.11 7.37l-2.96 4.7c-.47.74-1.47.93-2.17.41l-2.36-1.76c-.22-.16-.51-.16-.72 0l-3.18 2.41c-.42.32-.97-.16-.69-.62l2.96-4.7c.47-.74 1.47-.93 2.17-.41l2.36 1.76c.22.16.51.16.72 0l3.18-2.41c.43-.32.97.17.69.62z" /></svg>
        </button>
      </div>
    </div>
  );
}
