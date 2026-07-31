'use client';

import { useEffect, useState } from 'react';
import { WISH_ADD_EVENT } from '@/lib/productData';
import { OPEN_WISHLIST_EVENT } from '@/lib/uiEvents';

// Converted from 32-javascript-all.js:
// - showFloatWish() (lines ~1217-1229) — 3-second auto-dismiss timer
// - toggleWish()'s showFloatWish() call, add-branch only (lines ~1205-1215) — now
//   lib/productData.js's toggleWish() dispatching WISH_ADD_EVENT for exactly the
//   same add-only condition (see that file's own comment)
// Markup source: 36-floating-wishlist-badge.html
//
// Route scope: same reasoning as FloatCartBadge.js (35) — legacy hid this while
// #srpOverlay was open, but /srp is now a real route with no wishlist affordance
// of its own, so hiding it there would remove the only way to reach the wishlist
// drawer from that page. Mounted globally (GlobalOverlays.js, every route) instead.
//
// Legacy set inline style.display + a one-off inline style.animation string for
// the fade-out, with its own 350ms cleanup timer to reset both afterward. Here,
// the whole 3-second show-then-hide sequence is just this component's own local
// `visible` state — mounting plays floatCartIn (CSS keyframe, unchanged name),
// unmounting after 3s replaces the fade-out+cleanup pair entirely (no lingering
// inline style to reset since there's nothing left in the DOM to hold it).

const AUTO_DISMISS_MS = 3000; // legacy: setTimeout(..., 3000) before starting the fade-out

export default function FloatWishBadge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer = null;
    const onAdd = () => {
      clearTimeout(hideTimer);
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    };
    window.addEventListener(WISH_ADD_EVENT, onAdd);
    return () => {
      window.removeEventListener(WISH_ADD_EVENT, onAdd);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="float-wish-btn"
      id="floatWishBtn"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
      style={{ display: 'block' }}
    >
      <div className="float-wish-inner">❤️</div>
    </div>
  );
}
