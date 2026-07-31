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

function SearchThumb({ imgVal }) {
  const isUrl = typeof imgVal === 'string' && imgVal.startsWith('http');
  if (isUrl) {
    return <img src={imgVal} alt="" width={36} height={36} style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />;
  }
  return (
    <span style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'var(--light)', borderRadius: 6, flexShrink: 0 }}>
      {imgVal || '📦'}
    </span>
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
  // ~1108-1111) — the other half (#floatCartBtn) belongs to a floating cart button
  // that isn't part of any section built yet, so it's skipped; see CartSidebar.js note.
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
  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.trim();
      setShowDropdown(false);
      setMobileSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      router.push(`/srp?q=${encodeURIComponent(q)}`);
    }
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
              {showDropdown && searchResults.length > 0 && (
                <div className="search-dropdown" id="desktopSearchDropdown">
                  {searchResults.map(p => (
                    <Link
                      key={p.id}
                      href={productHref(p)}
                      className="search-result-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <SearchThumb imgVal={(p.imgs || [])[0]} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                        <div style={{ color: 'var(--red)', fontSize: 12 }}>৳{Number(p.price).toLocaleString()}</div>
                      </div>
                    </Link>
                  ))}
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
      <div className={`mobile-search-bar${mobileSearchOpen ? ' open' : ''}`} id="mobileSearchBar">
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
          {showDropdown && searchResults.length > 0 && (
            <div className="search-dropdown" id="mobileSearchDropdown">
              {searchResults.map(p => (
                <Link
                  key={p.id}
                  href={productHref(p)}
                  className="search-result-item"
                  onClick={() => { setShowDropdown(false); setMobileSearchOpen(false); }}
                >
                  <SearchThumb imgVal={(p.imgs || [])[0]} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                    <div style={{ color: 'var(--red)', fontSize: 12 }}>৳{Number(p.price).toLocaleString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
                                        }
