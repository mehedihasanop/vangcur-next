'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

// Default cards shown when no admin override is set
const CARD_DEFAULTS = [
  {
    label: 'Neon Lights', catId: 'rgb', emoji: '💡',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg',
    bg: 'linear-gradient(155deg,#0d1b0d,#1a3a1a,#0d2d1a)'
  },
  {
    label: 'Mini Printer', catId: 'unique', emoji: '✨',
    img: 'https://res.cloudinary.com/dkjzledzw/image/upload/q_auto/f_auto/v1779535309/Enhancer-AI_UHD-Like_20260521_213052_0000_tq4ud1.png',
    bg: 'linear-gradient(155deg,#0a1a0a,#1a3d1a,#0a2a0a)'
  },
  {
    label: 'Water Bottle', catId: 'waterbottle', emoji: '🍶',
    img: 'https://res.cloudinary.com/dkjzledzw/image/upload/q_auto/f_auto/v1779535309/Enhancer-AI_UHD-water_bottle_20260521_204516_0000_uim3et.png',
    bg: 'linear-gradient(155deg,#001a3d,#00285c,#003d7a)'
  },
  {
    label: 'RC Plan', catId: 'toys', emoji: '🧸',
    img: 'https://res.cloudinary.com/dkjzledzw/image/upload/q_auto/f_auto/v1779535315/RC_20260522_213519_0000_swwxnc.png',
    bg: 'linear-gradient(155deg,#1a0a00,#3d1f00,#5c2d00)'
  },
  {
    label: 'G Lamp', catId: 'light', emoji: '🕯️',
    img: 'https://res.cloudinary.com/dkjzledzw/image/upload/q_auto/f_auto/v1779535331/Enhancer-AI_UHD-Atmospher_20260521_200857_0000_c7ihlv.png',
    bg: 'linear-gradient(155deg,#1a0010,#3d0030,#1a0040)'
  },
  {
    label: 'Humidifier', catId: 'humidifier', emoji: '💧',
    img: 'https://res.cloudinary.com/dkjzledzw/image/upload/q_auto/f_auto/v1779535308/Enhancer-AI_UHD-RC_20260522_230738_0000_uearqd.png',
    bg: 'linear-gradient(155deg,#001a1a,#003d3d,#005252)'
  },
  {
    label: 'FAN', catId: 'fan', emoji: '💨',
    img: 'https://res.cloudinary.com/dkjzledzw/image/upload/q_auto/f_auto/v1779535311/Enhancer-AI_UHD-RC_20260522_230104_0000_etqeuv.png',
    bg: 'linear-gradient(155deg,#001a1a,#003d3d,#005252)'
  },
  {
    label: 'Alarm Clock', catId: 'clock', emoji: '⏰',
    img: 'https://res.cloudinary.com/dkjzledzw/image/upload/q_auto/f_auto/v1779535309/Enhancer-AI_UHD-Like_20260521_213052_0000_tq4ud1.png',
    bg: 'linear-gradient(155deg,#0a0a1a,#1a1a3d,#0a0a2a)'
  },
];

export default function HeroDuoSlider({ initialCards, onCategoryClick }) {
  const [cards, setCards] = useState(initialCards?.length ? initialCards : CARD_DEFAULTS);
  const [idx, setIdx] = useState(0);
  const autoTimer = useRef(null);
  const trackRef = useRef(null);
  const startX = useRef(null);

  // Per-page: 2 on desktop, 2 on mobile
  const PER_PAGE = 2;
  const totalPages = Math.ceil(cards.length / PER_PAGE);

  const goTo = useCallback((page) => {
    const p = (page + totalPages) % totalPages;
    setIdx(p);
    resetAuto(p);
  }, [totalPages]);

  const resetAuto = useCallback((currentPage) => {
    clearInterval(autoTimer.current);
    autoTimer.current = setInterval(() => {
      setIdx(prev => (prev + 1) % totalPages);
    }, 3800);
  }, [totalPages]);

  useEffect(() => {
    resetAuto(0);
    return () => clearInterval(autoTimer.current);
  }, [cards, resetAuto]);

  // Touch/swipe
  const handleTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? idx + 1 : idx - 1);
    startX.current = null;
  };

  const visibleCards = cards.slice(idx * PER_PAGE, idx * PER_PAGE + PER_PAGE);
  // If we're near the end and don't have 2 cards, wrap around
  const displayCards = visibleCards.length < PER_PAGE
    ? [...visibleCards, ...cards.slice(0, PER_PAGE - visibleCards.length)]
    : visibleCards;

  return (
    <div className="cath-wrap" id="cathWrap">
      <div
        className="cath-hero-duo"
        id="cathHeroDuo"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="cath-duo-track" id="cathDuoTrack" ref={trackRef}>
          {displayCards.map((card, i) => (
            <div
              key={`${idx}-${i}`}
              className="cath-duo-card"
              style={{ background: card.bg || '#1a1a1a', cursor: 'pointer' }}
              onClick={() => onCategoryClick && onCategoryClick(card.catId)}
            >
              {card.img && (
                <div className="cath-duo-img-wrap">
                  <img
                    src={card.img}
                    alt={card.label || ''}
                    className="cath-duo-img"
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              )}
              <div className="cath-duo-text">
                {card.emoji && <span className="cath-duo-emoji">{card.emoji}</span>}
                <span className="cath-duo-label">{card.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide dots */}
      <div className="cath-duo-dots" id="cathDuoDots">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`cath-duo-dot${i === idx ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`স্লাইড ${i + 1}`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button className="cath-arrow-btn cath-prev" onClick={() => goTo(idx - 1)}>&#8249;</button>
      <button className="cath-arrow-btn cath-next" onClick={() => goTo(idx + 1)}>&#8250;</button>
    </div>
  );
}
