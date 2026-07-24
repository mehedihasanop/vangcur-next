'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Converted from 32-javascript-all.js:
// - initVcGallery() customer_reviews fetch half (lines ~6452-6470) — the vc_about_desc
//   half of this same function is already handled by About.js, so it is not repeated here.
// - _renderVcGallery() / _vcGUpdateLayout() (lines ~6503-6621) — 3-card
//   prev/active/next carousel. Legacy reordered persistent DOM nodes to the end of the
//   track on every slide; here the same visual result is achieved declaratively with
//   CSS `order`, so cards stay mounted (id-keyed) and the existing .vc-g-active/.vc-g-side
//   scale transition in globals.css still animates instead of replaying a fresh mount.
// - _vcGAttachEvents() / _vcGStartAuto() / _vcGAutoTick() / vcGallerySlide() / _vcGGoTo()
//   (lines ~6547-6588) — autoplay every 3200ms, paused on hover, and on touch-release
//   resumed once after a 2800ms delay before returning to the normal cadence.
// - _vcGCardClick() / _vcGAttachPanZoom() (lines ~6623-6669) — tap active card to zoom,
//   mouse/touch move pans the zoom origin.
// - _vcGHeart() (lines ~6672-6691) — one-time like per session + like_count Supabase update.
// Markup source: 13-customer-gallery.html
//
// Note: no opacity:0 / vc-visible reveal-gating exists for .vc-gallery-sec / .vc-g-card
// in globals.css (verified via grep), so no scroll-reveal IntersectionObserver is needed.
// Note: unlike the legacy DOMContentLoaded+800ms delay before initVcGallery(), this
// fetches immediately on mount, matching how every other converted component here
// (About.js, FAQ.js, ProductGrid.js) already fetches — the delay existed only to let
// above-the-fold legacy DOM settle first and has no equivalent need in React.

const AUTOPLAY_MS = 3200;
const TOUCH_RESUME_MS = 2800;

function getVisibleIndices(activeIdx, n) {
  if (n === 0) return [];
  if (n === 1) return [activeIdx];
  if (n === 2) return [(activeIdx + n - 1) % n, activeIdx];
  return [(activeIdx + n - 1) % n, activeIdx, (activeIdx + 1) % n];
}

export default function CustomerGallery() {
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomedId, setZoomedId] = useState(null);
  const [panOrigin, setPanOrigin] = useState('center center');
  const [beatId, setBeatId] = useState(null);

  const reviewsRef = useRef([]);
  const timerRef = useRef(null);
  const pausedRef = useRef(false);
  const activeWrapRef = useRef(null);

  useEffect(() => { reviewsRef.current = reviews; }, [reviews]);

  // Legacy: initVcGallery() customer_reviews half
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('customer_reviews')
          .select('id,image_url,like_count,created_at')
          .order('created_at', { ascending: false })
          .limit(30);
        if (!cancelled && !error && data && data.length > 0) {
          setReviews(data.map((r) => ({ ...r, liked: false })));
          setActiveIdx(0);
        }
      } catch (e) {
        // falls through to empty state, same as legacy _renderVcGallery([])
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Legacy: _vcGStartAuto() / _vcGGoTo() — (re)start the 3200ms autoplay interval.
  // Index-agnostic on purpose: reads reviewsRef/activeIdx via functional setState,
  // so it never needs to be recreated when activeIdx changes.
  const resetAutoplay = useCallback(() => {
    clearInterval(timerRef.current);
    if (!reviewsRef.current.length) return;
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      const n = reviewsRef.current.length;
      if (!n) return;
      setActiveIdx((cur) => (cur + 1) % n);
    }, AUTOPLAY_MS);
  }, []);

  // Start/restart autoplay once reviews are loaded
  useEffect(() => {
    resetAutoplay();
    return () => clearInterval(timerRef.current);
  }, [reviews.length, resetAutoplay]);

  // Legacy: _vcGGoTo(idx) — manual navigation always resets the autoplay timer
  const goTo = useCallback((idx) => {
    if (!reviewsRef.current.length) return;
    setActiveIdx(idx);
    resetAutoplay();
  }, [resetAutoplay]);

  const slide = (dir) => {
    const n = reviewsRef.current.length;
    if (!n) return;
    goTo((activeIdx + dir + n) % n);
  };

  // Legacy: _vcGAttachEvents() — hover pause/resume
  const handleMouseEnter = () => { pausedRef.current = true; };
  const handleMouseLeave = () => { pausedRef.current = false; };

  // Legacy: touchstart pauses immediately; touchend resumes after one 2800ms
  // delayed tick, then autoplay settles back into the normal 3200ms cadence
  const handleTouchStart = () => {
    pausedRef.current = true;
    clearInterval(timerRef.current);
  };
  const handleTouchEnd = () => {
    pausedRef.current = false;
    clearInterval(timerRef.current);
    timerRef.current = setTimeout(() => {
      const n = reviewsRef.current.length;
      if (!n) return;
      setActiveIdx((cur) => {
        const next = (cur + 1) % n;
        resetAutoplay();
        return next;
      });
    }, TOUCH_RESUME_MS);
  };

  // Legacy: _vcGCardClick() — side card taps navigate, active card tap toggles zoom
  const handleCardClick = (idx, review) => {
    if (idx !== activeIdx) {
      goTo(idx);
      return;
    }
    if (!review.image_url) return;
    setZoomedId((cur) => {
      if (cur === review.id) {
        pausedRef.current = false;
        setPanOrigin('center center');
        resetAutoplay();
        return null;
      }
      pausedRef.current = true;
      clearInterval(timerRef.current);
      return review.id;
    });
  };

  // Legacy: _vcGAttachPanZoom() — mouse/touch move pans the zoom transform-origin
  useEffect(() => {
    const wrap = activeWrapRef.current;
    if (!wrap || !zoomedId) return undefined;

    const pan = (clientX, clientY) => {
      const rect = wrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      setPanOrigin(`${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`);
    };
    const onMouseMove = (e) => pan(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        pan(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    wrap.addEventListener('mousemove', onMouseMove);
    wrap.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      wrap.removeEventListener('mousemove', onMouseMove);
      wrap.removeEventListener('touchmove', onTouchMove);
    };
  }, [zoomedId]);

  // Legacy: _vcGHeart() — one like per review per session + like_count Supabase update
  const handleHeart = (e, review) => {
    e.stopPropagation();
    if (review.liked) return;
    const newCount = (parseInt(review.like_count, 10) || 0) + 1;

    setReviews((prev) => prev.map((r) => (
      r.id === review.id ? { ...r, liked: true, like_count: newCount } : r
    )));
    setBeatId(review.id);
    setTimeout(() => setBeatId((cur) => (cur === review.id ? null : cur)), 400);

    if (review.id) {
      supabase
        .from('customer_reviews')
        .update({ like_count: newCount })
        .eq('id', review.id)
        .then(({ error }) => { if (error) console.warn('Like update failed:', error); })
        .catch((err) => console.warn('Like update failed:', err));
    }
  };

  const n = reviews.length;
  const visible = new Set(getVisibleIndices(activeIdx, n));

  if (loaded && n === 0) {
    return (
      <section className="vc-gallery-sec" id="vcGallerySec">
        <div className="vc-gallery-header">
          <div className="vc-gallery-badge">❤️ Customer Love</div>
          <h2 className="vc-gallery-title">Unboxing <span>গ্যালারি</span></h2>
          <p className="vc-gallery-sub">আমাদের কাস্টমারদের আনন্দময় মুহূর্ত</p>
        </div>
        <div className="vc-gallery-empty" id="vcGalleryEmpty">
          <p>এখনো কোনো রিভিউ নেই।</p>
        </div>
      </section>
    );
  }

  return (
    <section className="vc-gallery-sec" id="vcGallerySec">
      <div className="vc-gallery-header">
        <div className="vc-gallery-badge">❤️ Customer Love</div>
        <h2 className="vc-gallery-title">Unboxing <span>গ্যালারি</span></h2>
        <p className="vc-gallery-sub">আমাদের কাস্টমারদের আনন্দময় মুহূর্ত</p>
      </div>

      {n > 0 && (
        <div
          className="vc-gallery-stage"
          id="vcGalleryStage"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="vc-gallery-track-wrap">
            <div className="vc-gallery-track" id="vcGalleryTrack">
              {reviews.map((r, i) => {
                if (!visible.has(i)) return null;
                const isActive = i === activeIdx;
                const isZoomed = isActive && zoomedId === r.id;
                const order = getVisibleIndices(activeIdx, n).indexOf(i);
                const imgUrl = r.image_url && (r.image_url.startsWith('http') || r.image_url.startsWith('//'))
                  ? r.image_url : null;
                const likeCount = parseInt(r.like_count, 10) || 0;

                return (
                  <div
                    key={r.id}
                    className={`vc-g-card ${isActive ? 'vc-g-active' : 'vc-g-side'}`}
                    style={{ order }}
                    data-idx={i}
                    onClick={() => handleCardClick(i, r)}
                  >
                    <div
                      className="vc-g-img-wrap"
                      ref={isActive ? activeWrapRef : null}
                    >
                      {imgUrl ? (
                        <img
                          className={`vc-g-img${isZoomed ? ' vc-g-zoomed' : ''}`}
                          src={imgUrl}
                          alt={r.name || 'Review'}
                          loading="lazy"
                          draggable={false}
                          style={isZoomed ? { transformOrigin: panOrigin } : undefined}
                          onError={(e) => { e.currentTarget.style.opacity = '.3'; }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, background: '#222' }}>
                          📦
                        </div>
                      )}
                      <span className="vc-g-like-count">{likeCount > 0 ? likeCount : ''}</span>
                      <button
                        className={`vc-g-heart-btn${beatId === r.id ? ' vc-g-heart-liked' : ''}`}
                        onClick={(e) => handleHeart(e, r)}
                        aria-label="লাইক"
                      >
                        {r.liked ? '❤️' : '🤍'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button className="vc-g-arrow vc-g-prev" onClick={() => slide(-1)} aria-label="আগের">‹</button>
          <button className="vc-g-arrow vc-g-next" onClick={() => slide(1)} aria-label="পরের">›</button>
        </div>
      )}

      {n > 0 && (
        <div className="vc-gallery-dots" id="vcGalleryDots">
          {reviews.map((r, i) => (
            <button
              key={r.id}
              className={`vc-g-dot${i === activeIdx ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`রিভিউ ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
