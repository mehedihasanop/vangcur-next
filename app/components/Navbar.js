'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from './CartContext';

export default function Navbar({ wishCount = 0, onWishClick, onLoginClick, onTrackClick }) {
  const { totalItems, setCartOpen } = useCart();
  const cartCount = totalItems;
  const onCartClick = () => setCartOpen(true);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);
  const router = useRouter();

  const handleSearchInput = useCallback(async (value) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowDropdown(true);
        }
      } catch (e) {
        // silent fail
      }
    }, 280);
  }, []);

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
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
                      href={`/product/${p.id}`}
                      className="search-result-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      {p.image_url && (
                        <img src={p.image_url} alt={p.name} width={36} height={36} style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                        <div style={{ color: 'var(--red)', fontSize: 12 }}>৳{p.price?.toLocaleString()}</div>
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
                <span className="cart-dot" id="wishDot">{wishCount}</span>
              </button>

              <button className="nav-icon-btn" onClick={onCartClick}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                <span className="cart-dot" id="cartDot">{cartCount}</span>
              </button>

              <div id="navAuth">
                <button className="nav-login-btn" onClick={onLoginClick}>লগইন করুন</button>
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
                  href={`/product/${p.id}`}
                  className="search-result-item"
                  onClick={() => { setShowDropdown(false); setMobileSearchOpen(false); }}
                >
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name} width={36} height={36} style={{ objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                    <div style={{ color: 'var(--red)', fontSize: 12 }}>৳{p.price?.toLocaleString()}</div>
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
