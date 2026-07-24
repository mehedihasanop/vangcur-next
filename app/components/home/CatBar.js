'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_CATEGORIES, fetchCategories, makeCatSlug, CATEGORY_FILTER_EVENT } from '@/lib/categoryData';

// Converted from 06-cat-bar-hidden.html + 32-javascript-all.js.
// NOTE: this bar is `display:none` in the legacy site too — verified via
// globals.css (.cat-bar has no responsive override that ever shows it) and
// via grep across 32-javascript-all.js: `.cat-pill` elements are still read
// in several places (e.g. `document.querySelector('.cat-pill.active')` to
// recover "which category is currently active" during SRP/URL restoration,
// and `updateCatPillCounts()` keeps a per-category product count on them).
// It is not visual UI — it's an invisible state tracker — so it is kept,
// not dropped, pending ProductGrid (PRODS/prodInCat) for the counts.
export default function CatBar() {
  const [cats, setCats] = useState(DEFAULT_CATEGORIES);
  const [activeId, setActiveId] = useState('all');

  useEffect(() => {
    let cancelled = false;
    fetchCategories(supabase).then((list) => {
      if (!cancelled) setCats(list);
    });

    const channel = supabase
      .channel('catbar-watch')
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

  // Legacy: filterCat() clears every `.cat-pill.active` and re-applies it to the matching one
  const handleSelect = (catId) => {
    setActiveId(catId);
    try {
      const url = catId === 'all' ? '/' : '/category/' + makeCatSlug(catId);
      window.history.replaceState({ vcStack: [], homeCurrent: true, vcCat: catId }, '', url);
    } catch (e) {}
    window.dispatchEvent(new CustomEvent(CATEGORY_FILTER_EVENT, { detail: { catId } }));
  };

  // Stay in sync when the visible Categories carousel (or hero duo cards) select a category first
  useEffect(() => {
    const onExternal = (e) => setActiveId(e.detail?.catId || 'all');
    window.addEventListener(CATEGORY_FILTER_EVENT, onExternal);
    window.addEventListener('vc:cathCategoryClick', onExternal);
    return () => {
      window.removeEventListener(CATEGORY_FILTER_EVENT, onExternal);
      window.removeEventListener('vc:cathCategoryClick', onExternal);
    };
  }, []);

  return (
    <div className="cat-bar" style={{ display: 'none' }}>
      <div className="cat-inner">
        {cats.map((cat) => (
          <button
            key={cat.id}
            className={'cat-pill' + (cat.id === activeId ? ' active' : '')}
            data-cat={cat.id}
            onClick={() => handleSelect(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
