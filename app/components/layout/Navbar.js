'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CART_ADD_EVENT } from '@/lib/cartData';
import {
  DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, productHref,
} from '@/lib/productData';
import { searchProducts } from '@/lib/searchData';

// Bug fix (2026-07-31): the live search-as-you-type dropdown used to call
// fetch('/api/search?q=...') — no such route exists anywhere in this repo (verified:
// no app/api directory at all), so every keystroke 404'd and was swallowed by the
// catch block, silently. The dropdown never showed a single result. Pressing Enter
// (-> /srp, a real page with its own Supabase-backed product fetch) always worked
// fine, so this went unnoticed. Replaced with the same client-side searchProducts()
// lib/searchData.js already exports (used by /srp itself), fed by the same
// DEFAULT_PRODS+custom_products fetch-once pattern CartSidebar.js/WishlistDrawer.js
// use — no server route needed, matches how the rest of the product list already
// works in this app. Also fixed while in here: results were rendered assuming a
// `p.image_url` field that doesn't exist on this app's product shape (it's
// `p.imgs[0]`, emoji-or-URL, same as every other product thumbnail in the app) and
// linked to `/product/${p.id}` instead of the real productHref() slug.
//
// Bug fix #2 (2026-08-01): that same fix still didn't actually show anything, for a
// second, unrelated reason — globals.css's `.search-dropdown{...display:none}` rule
// only gets overridden by a separate `.search-dropdown.show{display:block}` rule
// (verified by grep), but the dropdown <div> here only ever had className=
// "search-dropdown" — never "show" — so it stayed display:none even while correctly
// mounted in the DOM with real results inside it. Also, the items themselves were
// rendered with a `search-result-item` class that doesn't exist anywhere in
// globals.css (grepped: zero matches) and a hand-rolled SearchThumb with inline
// styles instead of the real `.sd-emoji` class — so even once visible, they'd have
// rendered with no padding/hover/sizing at all. Both dropdowns below now use the
// actual legacy classes (.sd-header/.sd-item/.sd-emoji/.sd-info/.sd-name/.sd-meta/
// .sd-price/.sd-footer/.search-highlight), all verified present in globals.css, plus
// the "সব দেখুন" header link and footer button legacy's showSearchDropdown() has
// (32-javascript-all.js reference upload, lines ~6324-6520) — item highlighting
// included, category suggestions intentionally left out to keep this fix scoped.

function SearchThumb({ imgVal }) {
  const isUrl = typeof imgVal === 'string' && (imgVal.startsWith('http://') || imgVal.startsWith('https://'));
  return (
    <div className="sd-emoji">
      {isUrl
        ? <img src={imgVal} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
        : <span style={{ fontSize: 24 }}>{imgVal || '📦'}</span>}
    </div>
  );
}

// Legacy: highlight(text, q) (32-javascript-all.js's showSearchDropdown, reference
// upload ~6371-6380) — wraps the first matching substring in .search-highlight,
// truncating long text around the match instead of always from the start.
function highlightMatch(text, q) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text.length > 45 ? text.slice(0, 45) + '...' : text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  const truncBefore = before.length > 20 ? '...' + before.slice(-20) : before;
  const truncAfter = after.length > 25 ? after.slice(0, 25) + '...' : after;
  return (
    <>{truncBefore}<span className="search-highlight">{match}</span>{truncAfter}</>
  );
}

export default function Navbar({ cartCount = 0, wishCount = 0, onCartClick, onWishClick, onLoginClick, onTrackClick, currentUser, onAccountClick }) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);
  const cartBtnRef = useRef(null);
  const prodsRef = useRef(DEFAULT_PRODS);
  const router = useRouter();

  // Fetch product list once, for the search dropdown only (see note above)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const customRows = await fetchCustomProducts(supabase);
      if (!cancelled && customRows.length) {
        prodsRef.current = mergeCustomProducts(DEFAULT_PRODS, customRows);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Legacy: _triggerCartJiggle()'s `#cartDot` closest-button half (32-javascript-all.js
  // ~1108-1111) — the other half (#floatCartBtn) now lives in
  // app/components/cart/FloatCartBadge.js (35-floating-cart-badge.html, 2026-07-31),
  // mirroring this exact ref+classList+reflow technique.
  useEffect(() => {
    const onCartAdd = () => {
      const btn = cartBtnRef.current;
      if (!btn) return;
      btn.classList.remove('cart-jiggle');
      void btn.offsetWidth;
      btn.classList.add('cart-jiggle');
      clearTimeout(btn._jiggleTimer);
      btn._jiggleTimer = setTimeout(() => btn.classList.remove('cart-jiggle'), 750);
    };
    window.addEventListener(CART_ADD_EVENT, onCartAdd);
    return () => window.removeEventListener(CART_ADD_EVENT, onCartAdd);
  }, []);

  const handleSearchInput = useCallback((value) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const results = searchProducts(prodsRef.current, value).slice(0, 6);
      setSearchResults(results);
      setShowDropdown(true);
    }, 280);
  }, []);

  // Legacy: viewAllSearch(q) -> openSRP(q) (32-javascript-all.js ~2978-2990) —
  // /srp is a real page here (owner's decision), so this is a real navigation
  const goToSrp = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setShowDropdown(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(`/srp?q=${encodeURIComponent(q)}`);
  };

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) goToSrp();
  };

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <nav>
        <div className="nav-inner" style={{ position: 'relative' }}>
          <div className="nav-original-content" id="navContent">
            <Link className="logo" href="/">
              <div>
                <div className="logo-mark">Vangcur</div>
                <div className="logo-sub">ভাঙচুর</div>
              </div>
            </Link>

            {/* Desktop Search */}
            <div className="nav-search" onClick={e => e.stopPropagation()}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="search"
                placeholder="প্রোডাক্ট খুঁজুন..."
                value={searchQuery}
                onChange={e => handleSearchInput(e.target.value)}
                onKeyDown={handleSearchKey}
                onFocus={() => searchQuery && setShowDropdown(true)}
                autoComplete="off"
                name="product-search"
                style={{ cursor: 'text' }}
              />
              {showDropdown && (
                <div className="search-dropdown show" id="desktopSearchDropdown">
                  {searchResults.length === 0 ? (
                    <div className="sd-empty">🔍 "<strong>{searchQuery}</strong>" এর জন্য কোনো পণ্য পাওয়া যায়নি</div>
                  ) : (
                    <>
                      <div className="sd-header">
                        <span>{searchResults.length}টি পণ্য পাওয়া গেছে</span>
                        <a className="sd-view-all" onClick={() => goToSrp()}>সব দেখুন →</a>
                      </div>
                      {searchResults.map(p => (
                        <Link
                          key={p.id}
                          href={productHref(p)}
                          className="sd-item"
                          onClick={() => setShowDropdown(false)}
                        >
                          <SearchThumb imgVal={(p.imgs || [])[0]} />
                          <div className="sd-info">
                            <div className="sd-name">{highlightMatch(p.name, searchQuery)}</div>
                            <div className="sd-meta">{p.cat}{p.stock <= 0 && <> · <span style={{ color: 'var(--red)' }}>স্টক শেষ</span></>}</div>
                          </div>
                          <div className="sd-price">৳{Number(p.price).toLocaleString()}</div>
                        </Link>
                      ))}
                      <div className="sd-footer">
                        <button className="sd-view-all-btn" onClick={() => goToSrp()}>
                          🔍 &quot;{searchQuery}&quot; এর সব ফলাফল দেখুন
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Nav Actions */}
            <div className="nav-actions">
              <button className="nav-icon-btn" onClick={onWishClick} title="Wishlist">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                <span className={`cart-dot${wishCount > 0 ? ' on' : ''}`} id="wishDot">{wishCount}</span>
              </button>

              <button className="nav-icon-btn" ref={cartBtnRef} onClick={onCartClick}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                <span className="cart-dot" id="cartDot">{cartCount}</span>
              </button>

              <div id="navAuth">
                {currentUser ? (
                  <button className="nav-user-btn" onClick={onAccountClick}>
                    <div className="u-avatar">
                      {(currentUser.name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    {currentUser.name || 'আমার অ্যাকাউন্ট'}
                  </button>
                ) : (
                  <button className="nav-login-btn" onClick={onLoginClick}>লগইন করুন</button>
                )}
              </div>

              <button className="nav-icon-btn" onClick={onTrackClick} title="অর্ডার ট্র্যাক করুন" style={{ position: 'relative' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 17H7A5 5 0 017 7h2"/><path d="M15 7h2a5 5 0 010 10h-2"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>

              <button className="nav-search-icon" onClick={() => setMobileSearchOpen(v => !v)} title="Search">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search Bar */}
      {/* BUG FIX (2026-08-01): globals.css only reveals this with a `.show` class
          (`.mobile-search-bar.show{display:block}`) — this used to add `.open`
          instead, which globals.css has no rule for, so the bar (and its input)
          stayed permanently display:none no matter what state the button toggled. */}
      <div className={`mobile-search-bar${mobileSearchOpen ? ' show' : ''}`} id="mobileSearchBar">
        <div className="mobile-search-wrap" onClick={e => e.stopPropagation()}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="search"
            placeholder="প্রোডাক্ট খুঁজুন..."
            value={searchQuery}
            onChange={e => handleSearchInput(e.target.value)}
            onKeyDown={handleSearchKey}
            id="mobileSearchInput"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              className="mobile-search-clear"
              onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }}
              title="মুছুন"
            >✕</button>
          )}
          {showDropdown && (
            <div className="search-dropdown show" id="mobileSearchDropdown">
              {searchResults.length === 0 ? (
                <div className="sd-empty">🔍 "<strong>{searchQuery}</strong>" এর জন্য কোনো পণ্য পাওয়া যায়নি</div>
              ) : (
                <>
                  <div className="sd-header">
                    <span>{searchResults.length}টি পণ্য পাওয়া গেছে</span>
                    <a className="sd-view-all" onClick={() => goToSrp()}>সব দেখুন →</a>
                  </div>
                  {searchResults.map(p => (
                    <Link
                      key={p.id}
                      href={productHref(p)}
                      className="sd-item"
                      onClick={() => { setShowDropdown(false); setMobileSearchOpen(false); }}
                    >
                      <SearchThumb imgVal={(p.imgs || [])[0]} />
                      <div className="sd-info">
                        <div className="sd-name">{highlightMatch(p.name, searchQuery)}</div>
                        <div className="sd-meta">{p.cat}{p.stock <= 0 && <> · <span style={{ color: 'var(--red)' }}>স্টক শেষ</span></>}</div>
                      </div>
                      <div className="sd-price">৳{Number(p.price).toLocaleString()}</div>
                    </Link>
                  ))}
                  <div className="sd-footer">
                    <button className="sd-view-all-btn" onClick={() => goToSrp()}>
                      🔍 &quot;{searchQuery}&quot; এর সব ফলাফল দেখুন
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
                                        }
