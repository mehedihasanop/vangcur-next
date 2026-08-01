'use client';

// Converted from 32-javascript-all.js openMembershipModal()/closeMembershipModal()
// (lines ~500-540, 39-membership-progress-modal.html). Self-contained like
// OfferPopup.js/OfferPageOverlay.js in GlobalOverlays.js: owns its own open/close
// state, listens for OPEN_MEMBERSHIP_EVENT itself instead of GlobalOverlays holding
// the isOpen state, since (unlike Cart/Wishlist) nothing else needs to read whether
// this modal is open.
//
// AccountPage.js's stat-box (openMembership()) dispatches OPEN_MEMBERSHIP_EVENT with
// detail: { completedCount: stats.completed } — stats.completed is lib/accountData.js's
// orderStats() count of 'confirmed'/'shipped'/'delivered' orders, matching legacy's
// membershipCardBtn.dataset.completed source (also a confirmed-order count via the
// Supabase `orders` table).

import { useEffect, useState } from 'react';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { OPEN_MEMBERSHIP_EVENT } from '@/lib/uiEvents';
import { MEMBERSHIP_TIERS, getTier, tierIconSVG } from '@/lib/membershipData';

const TIER_REQS = ['নতুন সদস্য', '১–২টি সম্পন্ন অর্ডার', '৩–৪টি সম্পন্ন অর্ডার', '৫–৯টি সম্পন্ন অর্ডার', '১০+ সম্পন্ন অর্ডার'];
const TIER_FULL_NAMES = ['সাধারণ সদস্য', 'সিলভার মেম্বার', 'গোল্ড মেম্বার', 'ডায়মন্ড মেম্বার', 'লিজেন্ডারি মেম্বার'];

export default function MembershipModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const onOpen = (e) => {
      setCompletedCount((e.detail && e.detail.completedCount) || 0);
      setIsOpen(true);
    };
    window.addEventListener(OPEN_MEMBERSHIP_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MEMBERSHIP_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (isOpen) lockBody(); else unlockBody();
    return () => { if (isOpen) unlockBody(); };
  }, [isOpen]);

  if (!isOpen) return null;

  const close = () => setIsOpen(false);

  const currentTier = getTier(completedCount);
  const currentIdx = MEMBERSHIP_TIERS.findIndex((t) => t.key === currentTier.key);
  const nextTier = MEMBERSHIP_TIERS[currentIdx + 1];
  let pct = 100;
  let progressTxt = 'সর্বোচ্চ র‍্যাংকে আছেন! 🎉';
  if (nextTier) {
    const needed = nextTier.min;
    pct = Math.min(100, Math.round((completedCount / needed) * 100));
    progressTxt = `${nextTier.en} পেতে আরো ${needed - completedCount}টি অর্ডার দরকার`;
  }

  return (
    <div
      id="membershipModal"
      className="show"
      onClick={(e) => { if (e.target === e.currentTarget || e.target.classList.contains('ms-backdrop')) close(); }}
    >
      <div className="ms-backdrop" />
      <div className="ms-sheet">
        <div className="ms-handle" />
        <div className="ms-title">🏆 মেম্বারশিপ প্রোগ্রেস</div>
        <div className="ms-sub">
          সম্পন্ন অর্ডার: {completedCount}টি • বর্তমান র‍্যাংক: {currentTier.en}
        </div>
        <div className="ms-progress-bar-wrap">
          <div className="ms-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="ms-progress-txt">{progressTxt}</div>

        <div id="msTierList">
          {MEMBERSHIP_TIERS.map((t, i) => {
            const isDone = completedCount > t.max;
            const isActive = t.key === currentTier.key;
            const isLegendary = t.key === 'legendary';
            let cls = 'ms-tier-row';
            if (isLegendary) cls += ' legendary';
            else if (isDone) cls += ' done';
            else if (isActive) cls += ' active-tier';
            else cls += ' locked';

            return (
              <div className={cls} key={t.key}>
                <div className="ms-tier-icon" dangerouslySetInnerHTML={{ __html: tierIconSVG(t.key) }} />
                <div className="ms-tier-info">
                  <div className="ms-tier-name">{isLegendary ? '✨ ' : ''}{TIER_FULL_NAMES[i]}</div>
                  <div className="ms-tier-req">{TIER_REQS[i]}</div>
                </div>
                {isDone ? (
                  <span className="ms-tier-check">✓</span>
                ) : isActive ? (
                  <span style={{ fontSize: 12, background: '#f59e0b', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontWeight: 700 }}>আপনি</span>
                ) : (
                  <span className="ms-tier-lock" title="লক">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
