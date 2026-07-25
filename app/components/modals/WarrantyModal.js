'use client';

import { useEffect, useMemo } from 'react';
import { getWarrantyModalContent } from '@/lib/warrantyData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';

// Converted from 32-javascript-all.js: openWarrantyModal(warrantyText)/closeWarrantyModal()
// (lines ~260-300, ~302-306). The regex-matching itself lives in lib/warrantyData.js;
// this component just renders whatever it returns.
//
// This is technically 42-warranty-explainer-modal.html's job (still ⏳ per the master
// prompt table), but ProductDetail.js's "?" warranty button needs it to do anything at
// all, so it's built now as its own reusable component instead of inlined — the same
// way WishlistDrawer.js needed isWishlisted/toggleWish before 18-wishlist-overlay.html's
// own turn came up. Nothing else currently imports it; when 42's turn comes up in the
// progress table, this file already satisfies it.
// Markup source: 42-warranty-explainer-modal.html section (id #warrantyModal, .wm-* classes)
// — verified against globals.css, all present (line ~488-500), unchanged.

export default function WarrantyModal({ isOpen, onClose, warrantyText }) {
  const content = useMemo(() => getWarrantyModalContent(warrantyText), [warrantyText]);

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
  }, [isOpen]);

  return (
    <div id="warrantyModal" className={isOpen ? 'show' : ''}>
      <div className="wm-backdrop" onClick={onClose} />
      <div className="wm-sheet">
        <div className="wm-handle" />
        <div className="wm-badge">🛡️ ওয়ারেন্টি তথ্য</div>
        <div className="wm-title">{content.title}</div>
        <div className="wm-body">{content.body}</div>
        <ul className="wm-rules">
          {content.rules.map((r, i) => (
            <li key={i}>
              <span className="wm-rule-num">{i + 1}</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <button className="wm-close-btn" onClick={onClose}>বুঝেছি</button>
      </div>
    </div>
  );
}
