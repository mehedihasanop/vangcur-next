'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const CARD_DEFAULTS = [
  { label:'Neon Lights', catId:'rgb', emoji:'💡', img:'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg', bg:'linear-gradient(155deg,#0d1b0d,#1a3a1a,#0d2d1a)' },
  { label:'Mini Printer', catId:'unique', emoji:'✨', img:'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535309/Enhancer-AI_UHD-Like_20260521_213052_0000_tq4ud1.png', bg:'linear-gradient(155deg,#0a1a0a,#1a3d1a,#0a2a0a)' },
  { label:'Water Bottle', catId:'waterbottle', emoji:'🍶', img:'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535309/Enhancer-AI_UHD-water_bottle_20260521_204516_0000_uim3et.png', bg:'linear-gradient(155deg,#001a3d,#00285c,#003d7a)' },
  { label:'RC Plan', catId:'toys', emoji:'🧸', img:'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535315/RC_20260522_213519_0000_swwxnc.png', bg:'linear-gradient(155deg,#1a0a00,#3d1f00,#5c2d00)' },
  { label:'G Lamp', catId:'light', emoji:'🕯️', img:'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535331/Enhancer-AI_UHD-Atmospher_20260521_200857_0000_c7ihlv.png', bg:'linear-gradient(155deg,#1a0010,#3d0030,#1a0040)' },
  { label:'Humidifier', catId:'humidifier', emoji:'💧', img:'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535308/Enhancer-AI_UHD-RC_20260522_230738_0000_uearqd.png', bg:'linear-gradient(155deg,#001a1a,#003d3d,#005252)' },
  { label:'FAN', catId:'fan', emoji:'💨', img:'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535311/Enhancer-AI_UHD-RC_20260522_230104_0000_etqeuv.png', bg:'linear-gradient(155deg,#001a1a,#003d3d,#005252)' },
  { label:'Alarm Clock', catId:'alarmclock', emoji:'⏰', img:'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535315/Enhancer-Ultra_HD-alarm_20260521_193333_0000_o7l1t1.png', bg:'linear-gradient(155deg,#0a0a2a,#1a1a5c,#0a0a3d)' },
  { label:'Moon Lamp', catId:'light', emoji:'🕯️', img:'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535314/Enhancer-Ultra_HD-Untitled_design_20260521_184307_0000_oqwt8c.png', bg:'linear-gradient(155deg,#1a1a0a,#3d3d00,#2a2a00)' },
  { label:'Crystal Ball', catId:'crystalball', emoji:'🔮', img:'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535320/Enhancer-Ultra_HD-Zone_20260521_192104_0000_bwnsxc.png', bg:'linear-gradient(155deg,#0a0a2a,#1a1a5c,#0a0a3d)' },
];

export default function HeroDuoSlider({ initialCards, onCategoryClick }) {
  const cards = (initialCards?.length ? initialCards : CARD_DEFAULTS);
  const total = cards.length;

  const [page, setPage] = useState(0); // 0-based page index
  const [isDesktop, setIsDesktop] = useState(false);
  const trackRef = useRef(null);
  const wrapRef = useRef(null);
  const autoRef = useRef(null);
  const touchStartX = useRef(null);

  const perPage = isDesktop ? 6 : 2;
  const totalPages = Math.ceil(total / perPage);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 769);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const goTo = useCallback((p) => {
    const next = ((p % totalPages) + totalPages) % totalPages;
    setPage(next);
  }, [totalPages]);

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setPage(prev => (prev + 1) % totalPages);
    }, 3800);
  }, [totalPages]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  const slide = (dir) => {
    goTo(page + dir);
    clearInterval(autoRef.current);
    setTimeout(startAuto, 2000);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 36) slide(dx > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  // Which cards to show on current page
  const startIdx = page * perPage;
  const visibleCards = [];
  for (let i = 0; i < perPage; i++) {
    visibleCards.push(cards[(startIdx + i) % total]);
  }

  return (
    <div className="cath-wrap" id="cathWrap">
      <div
        className="cath-hero-duo"
        id="cathHeroDuo"
        ref={wrapRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="cath-duo-track"
          id="cathDuoTrack"
          ref={trackRef}
          style={{ transform: 'none', transition: 'none' }}
        >
          {visibleCards.map((card, i) => (
            <div
              key={`${page}-${i}`}
              className="cath-card vc-card-in"
              style={{ background: card.bg || '#111' }}
              onClick={() => onCategoryClick?.(card.catId)}
            >
              {card.img ? (
                <img
                  className="cath-bg-img"
                  src={card.img}
                  alt={card.label || ''}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
              ) : (
                <div className="cath-emoji-bg">{card.emoji}</div>
              )}
              <div className="cath-overlay"></div>
              <div className="cath-content">
                <span className="cath-cat-label">
                  {card.label} <span className="cath-arrow">→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="cath-duo-dots" id="cathDuoDots" style={{ display: 'flex' }}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`cath-duo-dot${i === page ? ' active' : ''}`}
            onClick={() => { goTo(i); clearInterval(autoRef.current); setTimeout(startAuto, 2000); }}
          />
        ))}
      </div>

      <button className="cath-arrow-btn cath-prev" onClick={() => slide(-1)}>&#8249;</button>
      <button className="cath-arrow-btn cath-next" onClick={() => slide(1)}>&#8250;</button>
    </div>
  );
}
