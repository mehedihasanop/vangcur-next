// Converted from 32-javascript-all.js lines ~430-460 (39-membership-progress-modal.html).
// Pure data/markup helpers — no DOM access, so both AccountPage.js (avatar crown +
// stat-box tier chip) and MembershipModal.js (full tier list) can share them.
// completedCount is `stats.completed` from lib/accountData.js's orderStats() —
// legacy counted the same 'confirmed'/'shipped'/'delivered' order statuses.

export const MEMBERSHIP_TIERS = [
  { min: 0, max: 0, key: 'regular', bn: 'সাধারণ', en: 'Regular Member', crown: 'regular' },
  { min: 1, max: 2, key: 'silver', bn: 'সিলভার', en: 'Silver Member', crown: 'silver' },
  { min: 3, max: 4, key: 'gold', bn: 'গোল্ড', en: 'Gold Member', crown: 'gold' },
  { min: 5, max: 9, key: 'diamond', bn: 'ডায়মন্ড', en: 'Diamond Member', crown: 'diamond' },
  { min: 10, max: Infinity, key: 'legendary', bn: 'লিজেন্ডারি', en: 'Legendary Member', crown: 'legendary' },
];

export function getTier(completedCount) {
  return MEMBERSHIP_TIERS.find((t) => completedCount >= t.min && completedCount <= t.max) || MEMBERSHIP_TIERS[0];
}

const TIER_COLOR = {
  regular: 'color:#78350F',
  silver: 'color:#475569',
  gold: 'color:#92400E',
  diamond: 'color:#1E40AF',
  legendary: 'color:#78350F',
};

export function tierColorStyle(key) {
  return TIER_COLOR[key] || '';
}

export function crownSVG(type) {
  if (type === 'bronze' || type === 'regular') {
    return `<svg class="avatar-crown" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bronzeCrown" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#CD7F32"/><stop offset="50%" stop-color="#E8A060"/><stop offset="100%" stop-color="#A0522D"/></linearGradient></defs><polygon points="16,4 5,22 10,18 16,28 22,18 27,22" fill="url(#bronzeCrown)" stroke="#A0522D" stroke-width="1.2"/><circle cx="16" cy="4" r="2.5" fill="#F4C17A"/><circle cx="5" cy="22" r="2" fill="#CD7F32"/><circle cx="27" cy="22" r="2" fill="#CD7F32"/><polygon points="13,16 16,10 19,16" fill="rgba(255,255,255,0.25)"/></svg>`;
  }
  if (type === 'silver') {
    return `<svg class="avatar-crown" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="silverCrown" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#C8D6E2"/><stop offset="50%" stop-color="#E8EEF2"/><stop offset="100%" stop-color="#94A3B8"/></linearGradient></defs><polygon points="16,3 4,21 10,17 16,27 22,17 28,21" fill="url(#silverCrown)" stroke="#94A3B8" stroke-width="1.3"/><circle cx="16" cy="3" r="2.6" fill="#F1F5F9"/><circle cx="4" cy="21" r="2" fill="#CBD5E1"/><circle cx="28" cy="21" r="2" fill="#CBD5E1"/><polygon points="12,16 16,9 20,16" fill="rgba(255,255,255,0.35)"/><line x1="16" y1="10" x2="16" y2="27" stroke="rgba(255,255,255,0.2)" stroke-width="0.8"/></svg>`;
  }
  if (type === 'gold') {
    return `<svg class="avatar-crown" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="goldCrown" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FBBF24"/><stop offset="50%" stop-color="#FDE68A"/><stop offset="100%" stop-color="#D97706"/></linearGradient></defs><polygon points="16,2 3,21 10,16 16,27 22,16 29,21" fill="url(#goldCrown)" stroke="#D97706" stroke-width="1.3"/><circle cx="16" cy="2" r="2.8" fill="#FEF3C7"/><circle cx="3" cy="21" r="2.2" fill="#F59E0B"/><circle cx="29" cy="21" r="2.2" fill="#F59E0B"/><polygon points="12,15 16,7 20,15" fill="rgba(255,255,255,0.3)"/><circle cx="16" cy="15" r="1.5" fill="#FEF3C7" opacity="0.7"/></svg>`;
  }
  if (type === 'diamond') {
    return `<svg class="avatar-crown" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="diamondCrown" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#60A5FA"/><stop offset="40%" stop-color="#BFDBFE"/><stop offset="100%" stop-color="#2563EB"/></linearGradient></defs><polygon points="16,2 3,20 10,15 16,28 22,15 29,20" fill="url(#diamondCrown)" stroke="#3B82F6" stroke-width="1.3"/><polygon points="16,7 12,15 16,20 20,15" fill="#DBEAFE" opacity="0.8"/><polygon points="10,15 16,7 22,15 16,20" fill="rgba(255,255,255,0.25)"/><circle cx="16" cy="2" r="2.8" fill="#BAE6FD"/><circle cx="3" cy="20" r="2" fill="#60A5FA"/><circle cx="29" cy="20" r="2" fill="#60A5FA"/><circle cx="16" cy="14" r="1.8" fill="#EFF6FF" opacity="0.9"/></svg>`;
  }
  if (type === 'legendary') {
    return `<svg class="avatar-crown" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lgCrown" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F59E0B"/><stop offset="50%" stop-color="#EF4444"/><stop offset="100%" stop-color="#B45309"/></linearGradient><radialGradient id="lgGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FEF3C7" stop-opacity="0.8"/><stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/></radialGradient></defs><circle cx="16" cy="15" r="10" fill="url(#lgGlow)"/><polygon points="16,2 4,20 10,15 16,28 22,15 28,20" fill="url(#lgCrown)" stroke="#B45309" stroke-width="1.2"/><circle cx="16" cy="2" r="3" fill="#FCD34D"/><circle cx="4" cy="20" r="2.2" fill="#EF4444"/><circle cx="28" cy="20" r="2.2" fill="#EF4444"/><circle cx="16" cy="15" r="3" fill="#FEF3C7" opacity="0.8"/><polygon points="12,12 16,6 20,12 16,16" fill="rgba(255,255,255,0.3)"/></svg>`;
  }
  return '';
}

export function tierIconSVG(key) {
  const svgs = {
    regular: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><defs><linearGradient id="bronzeI" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#CD7F32"/><stop offset="100%" stop-color="#A0522D"/></linearGradient></defs><polygon points="16,4 5,22 10,18 16,28 22,18 27,22" fill="url(#bronzeI)" stroke="#A0522D" stroke-width="1.2"/><circle cx="16" cy="4" r="2.2" fill="#F4C17A"/><circle cx="5" cy="22" r="1.8" fill="#CD7F32"/><circle cx="27" cy="22" r="1.8" fill="#CD7F32"/></svg>`,
    silver: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><defs><linearGradient id="silverI" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#C8D6E2"/><stop offset="100%" stop-color="#94A3B8"/></linearGradient></defs><polygon points="16,3 4,21 10,17 16,27 22,17 28,21" fill="url(#silverI)" stroke="#94A3B8" stroke-width="1.3"/><circle cx="16" cy="3" r="2.2" fill="#F1F5F9"/><circle cx="4" cy="21" r="1.8" fill="#CBD5E1"/><circle cx="28" cy="21" r="1.8" fill="#CBD5E1"/></svg>`,
    gold: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><defs><linearGradient id="goldI" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#D97706"/></linearGradient></defs><polygon points="16,2 3,21 10,16 16,27 22,16 29,21" fill="url(#goldI)" stroke="#D97706" stroke-width="1.3"/><circle cx="16" cy="2" r="2.5" fill="#FEF3C7"/><circle cx="3" cy="21" r="2" fill="#F59E0B"/><circle cx="29" cy="21" r="2" fill="#F59E0B"/><circle cx="16" cy="14" r="1.5" fill="#FEF3C7" opacity="0.7"/></svg>`,
    diamond: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><defs><linearGradient id="diamondI" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#2563EB"/></linearGradient></defs><polygon points="16,2 3,20 10,15 16,28 22,15 29,20" fill="url(#diamondI)" stroke="#3B82F6" stroke-width="1.3"/><polygon points="16,7 12,15 16,20 20,15" fill="#DBEAFE" opacity="0.8"/><circle cx="16" cy="2" r="2.4" fill="#BAE6FD"/><circle cx="3" cy="20" r="1.8" fill="#60A5FA"/><circle cx="29" cy="20" r="1.8" fill="#60A5FA"/></svg>`,
    legendary: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><defs><linearGradient id="lgI" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F59E0B"/><stop offset="50%" stop-color="#EF4444"/><stop offset="100%" stop-color="#B45309"/></linearGradient></defs><polygon points="16,2 4,20 10,15 16,28 22,15 28,20" fill="url(#lgI)" stroke="#B45309" stroke-width="1.2"/><circle cx="16" cy="2" r="2.8" fill="#FCD34D"/><circle cx="4" cy="20" r="2" fill="#EF4444"/><circle cx="28" cy="20" r="2" fill="#EF4444"/><circle cx="16" cy="14" r="2.5" fill="#FEF3C7" opacity="0.8"/></svg>`,
  };
  return svgs[key] || svgs.regular;
}
