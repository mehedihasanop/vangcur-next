'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function CustomerGallery({ initialReviews = [] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState({});
  const autoTimer = useRef(null);
  const startX = useRef(null);

  const startAuto = useCallback(() => {
    clearInterval(autoTimer.current);
    if (reviews.length <= 1) return;
    autoTimer.current = setInterval(() => {
      setIdx(prev => (prev + 1) % reviews.length);
    }, 3500);
  }, [reviews.length]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoTimer.current);
  }, [startAuto]);

  const goTo = (i) => {
    setIdx(i);
    startAuto();
  };

  const handleTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      goTo((idx + (diff > 0 ? 1 : -1) + reviews.length) % reviews.length);
    }
    startX.current = null;
  };

  const handleLike = async (e, i) => {
    e.stopPropagation();
    if (liked[i]) return;
    setLiked(prev => ({ ...prev, [i]: true }));
    setReviews(prev => prev.map((r, ri) =>
      ri === i ? { ...r, like_count: (parseInt(r.like_count) || 0) + 1 } : r
    ));
    try {
      const r = reviews[i];
      if (r.id) {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        await sb.from('customer_reviews').update({ like_count: (parseInt(r.like_count) || 0) + 1 }).eq('id', r.id);
      }
    } catch (e) { /* silent */ }
  };

  if (!reviews.length) return null;

  return (
    <section className="vc-gallery-sec" id="vcGallerySec">
      <div className="vc-gallery-header">
        <div className="vc-gallery-badge">❤️ Customer Love</div>
        <h2 className="vc-gallery-title">Unboxing <span>গ্যালারি</span></h2>
        <p className="vc-gallery-sub">আমাদের কাস্টমারদের আনন্দময় মুহূর্ত</p>
      </div>

      <div
        className="vc-gallery-stage"
        id="vcGalleryStage"
        onMouseEnter={() => clearInterval(autoTimer.current)}
        onMouseLeave={startAuto}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="vc-gallery-track-wrap">
          <div className="vc-gallery-track" id="vcGalleryTrack">
            {reviews.map((r, i) => {
              const imgUrl = r.image_url && (r.image_url.startsWith('http') || r.image_url.startsWith('//'))
                ? r.image_url : null;
              const likeCount = parseInt(r.like_count) || 0;
              const isActive = i === idx;
              return (
                <div
                  key={r.id || i}
                  className={`vc-g-card ${isActive ? 'vc-g-active' : 'vc-g-side'}`}
                  onClick={() => goTo(i)}
                >
                  <div className="vc-g-img-wrap">
                    {imgUrl ? (
                      <img
                        className="vc-g-img"
                        src={imgUrl}
                        alt={`Review ${i + 1}`}
                        loading="lazy"
                        draggable={false}
                        onError={e => { e.target.style.opacity = '.3'; }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, background: '#222' }}>📦</div>
                    )}
                    <span className="vc-g-like-count">{likeCount > 0 ? likeCount : ''}</span>
                    <button
                      className="vc-g-heart-btn"
                      onClick={e => handleLike(e, i)}
                      aria-label="লাইক"
                    >
                      {liked[i] ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <button className="vc-g-arrow vc-g-prev" onClick={() => goTo((idx - 1 + reviews.length) % reviews.length)} aria-label="আগের">‹</button>
        <button className="vc-g-arrow vc-g-next" onClick={() => goTo((idx + 1) % reviews.length)} aria-label="পরের">›</button>
      </div>

      <div className="vc-gallery-dots" id="vcGalleryDots">
        {reviews.map((_, i) => (
          <button
            key={i}
            className={`vc-g-dot${i === idx ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`রিভিউ ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
