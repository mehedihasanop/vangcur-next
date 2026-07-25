// Shared by app/components/search/SearchPage.js
// Converted from 32-javascript-all.js: _renderSRP() matching logic (lines ~3342-3431)
// — pure functions here, DOM/rendering stays in the component.

// Legacy: matchProd(p) closure inside _renderSRP — every query word must appear
// somewhere in the haystack, OR the whole query matches with spaces stripped
// (handles "rgblight" matching "RGB Light"), OR any word 3+ chars matches alone.
export function searchProducts(prods, query) {
  const lower = (query || '').toLowerCase().trim();
  if (!lower) return [];
  const words = lower.split(/\s+/).filter(Boolean);
  const compactQ = lower.replace(/\s+/g, '');

  function matchProd(p) {
    const hay = [
      p.name || '', p.nameBn || '', p.desc || '', p.cat || '', p.tags || '',
      Object.values(p.specs || {}).join(' '),
    ].join(' ').toLowerCase();
    if (words.every((w) => hay.includes(w))) return true;
    if (hay.replace(/\s+/g, '').includes(compactQ)) return true;
    if (words.some((w) => w.length >= 3 && hay.includes(w))) return true;
    return false;
  }

  return prods.filter(matchProd).sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0));
}

// Legacy: catMatches scoring inside _renderSRP (lines ~3415-3430) — startsWith
// scores highest (3), a word-prefix match on any name segment scores 2, a plain
// substring match (spaced or compact) scores 1. Top 5 kept, deduplicated by id
// upstream (categories list is already deduped by the caller).
export function matchCategories(cats, query, limit = 5) {
  const lower = (query || '').toLowerCase().trim();
  if (!lower) return [];
  const words = lower.split(/\s+/).filter(Boolean);
  const compactQ = lower.replace(/\s+/g, '');

  return cats
    .map((c) => {
      const name = (c.name || '').toLowerCase();
      const id = (c.id || '').toLowerCase();
      const haystackSpaced = `${name} ${id}`;
      const compactHay = haystackSpaced.replace(/\s+/g, '');
      let score = 0;
      if (name.startsWith(lower) || id.startsWith(lower)) score = 3;
      else if (words.some((w) => name.split(' ').some((part) => part.startsWith(w)))) score = 2;
      else if (haystackSpaced.includes(lower) || compactHay.includes(compactQ)) score = 1;
      else if (words.some((w) => w.length >= 1 && haystackSpaced.includes(w))) score = 1;
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
}
