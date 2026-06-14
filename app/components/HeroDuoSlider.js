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
  const cards = initialCards?.length ? initialCards : CARD_DEFAULTS;
  const total = cards.length;

  // infinite clone: head + real + tail
  const allCards = [...cards, ...cards, ...cards];
  const [idx, setIdx] = useState(total); // start at real section
  const [animated, setAnimated] = useState(false);
  const trackRef = useRef(null);
  const wrapRef = useRef(null);
  const autoRef = useRef(null);
  const jumpRef = useRef(false);
  const touchStartX = useRef(null);

  const getPerPage = useCallback(() => {
    if (typeof window === 'undefined') return 2;
    return window.innerWidth >= 769 ? 6 : 2;
  }, []);

  const setPosition = useCallback((animate) => {
    const track = trackRef.current;
    const wrap = wrapRef.current;
    if (!track || !wrap) return;
    const perPage = getPerPage();
    const gap = 12;
    const wrapW = wrap.getBoundingClientRect().width || wrap.clientWidth;
    const cardW = (wrapW - gap * (perPage - 1)) / perPage;
    const offset = -(idx * (cardW + gap));
    track.style.transition = animate ? 'transform .42s cubic-bezier(.4,0,.2,1)' : 'none';
    track.style.transform = `translateX(${offset}px)`;
  }, [idx, getPerPage]);

  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setIdx(prev => prev + getPerPage());
      setAnimated(true);
    }, 3800);
  }, [getPerPage]);

  useEffect(() => {
    setPosition(animated);
  }, [idx, animated, setPosition]);

  // handle infinite loop jump after transition
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onEnd = () => {
      if (jumpRef.current) return;
      const perPage = getPerPage();
      if (idx >= total * 2) {
        jumpRef.current = true;
        setIdx(i => i - total);
        setAnimated(false);
        jumpRef.current = false;
      } else if (idx < total) {
        jumpRef.current = true;
        setIdx(i => i + total);
        setAnimated(false);
        jumpRef.current = false;
      }
    };
    track.addEventListener('transitionend', onEnd);
    return () => track.removeEventListener('transitionend', onEnd);
  }, [idx, total, getPerPage]);

  useEffect(() => {
    startAuto();
    return () => clearInterval(autoRef.current);
  }, [startAuto]);

  const slide = (dir) => {
    setIdx(prev => prev + dir * getPerPage());
    setAnimated(true);
    clearInterval(autoRef.current);
    setTimeout(() => startAuto(), 2000);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    clearInterval(autoRef.current);
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 36) slide(dx > 0 ? 1 : -1);
    touchStartX.current = null;
    setTimeout(() => startAuto(), 2000);
  };

  // dot index (which real card is first visible)
  const dotIdx = ((idx - total) % total + total) % total;
  const dotCount = Math.ceil(total / getPerPage());

  return (
    <div className="cath-wrap" id="cathWrap">
      <div
        className="cath-hero-duo"
        id="cathHeroDuo"
        ref={wrapRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="cath-duo-track" id="cathDuoTrack" ref={trackRef}>
          {allCards.map((card, i) => (
            <div
              key={i}
              className="cath-card"
              style={{ background: card.bg || '#111' }}
              onClick={() => onCategoryClick && onCategoryClick(card.catId)}
            >
              {card.img ? (
                <img
                  className="cath-bg-img"
                  src={card.img}
                  alt={card.label || ''}
                  loading={i < 4 ? 'eager' : 'lazy'}
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
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            className={`cath-duo-dot${i === dotIdx ? ' active' : ''}`}
            onClick={() => { setIdx(total + i); setAnimated(true); }}
          />
        ))}
      </div>

      {/* Arrows */}
      <button className="cath-arrow-btn cath-prev" id="cathDuoPrev" onClick={() => slide(-1)}>&#8249;</button>
      <button className="cath-arrow-btn cath-next" id="cathDuoNext" onClick={() => slide(1)}>&#8250;</button>
    </div>
  );
}
