'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// ============ NEW CATEGORY HERO SLIDER — converted from 32-javascript-all.js ============
// Mirrors: initDuoSlider / buildDuoInfiniteTrack / duoStep / duoSetPosition /
// startDuoAuto / loadCathCardData / renderDuoCardsHtml (legacy lines ~460-680, ~7228-7470)

const DUO_TOTAL = 13;
const AUTOPLAY_MS = 3500;
const HOVER_AUTOPLAY_MS = 7000;
const GAP = 12;

// Default card objects (13টি) — Supabase-এ row না থাকলে বা ছোট হলে এগুলো ব্যবহার হয়।
// Legacy _CATH_CARD_DEFAULTS থেকে হুবহু কপি করা — কোনো পরিবর্তন নেই।
const CATH_CARD_DEFAULTS = [
  {
    label: 'Neon Lights',
    catId: 'rgb',
    emoji: '💡',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg',
    bg: 'linear-gradient(155deg,#0d1b0d,#1a3a1a,#0d2d1a)',
  },
  {
    label: 'Mini Printer',
    catId: 'unique',
    emoji: '✨',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535309/Enhancer-AI_UHD-Like_20260521_213052_0000_tq4ud1.png',
    bg: 'linear-gradient(155deg,#0a1a0a,#1a3d1a,#0a2a0a)',
  },
  {
    label: 'Water Bottle',
    catId: 'waterbottle',
    emoji: '🍶',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535309/Enhancer-AI_UHD-water_bottle_20260521_204516_0000_uim3et.png',
    bg: 'linear-gradient(155deg,#001a3d,#00285c,#003d7a)',
  },
  {
    label: 'RC Plan',
    catId: 'toys',
    emoji: '🧸',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535315/RC_20260522_213519_0000_swwxnc.png',
    bg: 'linear-gradient(155deg,#1a0a00,#3d1f00,#5c2d00)',
  },
  {
    label: 'G Lamp',
    catId: 'light',
    emoji: '🕯️',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535331/Enhancer-AI_UHD-Atmospher_20260521_200857_0000_c7ihlv.png',
    bg: 'linear-gradient(155deg,#1a0010,#3d0030,#1a0040)',
  },
  {
    label: 'Humidifier',
    catId: 'humidifier',
    emoji: '💧',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535308/Enhancer-AI_UHD-RC_20260522_230738_0000_uearqd.png',
    bg: 'linear-gradient(155deg,#001a1a,#003d3d,#005252)',
  },
  {
    label: 'FAN',
    catId: 'fan',
    emoji: '💨',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535311/Enhancer-AI_UHD-RC_20260522_230104_0000_etqeuv.png',
    bg: 'linear-gradient(155deg,#001a1a,#003d3d,#005252)',
  },
  {
    label: 'Alarm Clock',
    catId: 'alarmclock',
    emoji: '⏰',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535315/Enhancer-Ultra_HD-alarm_20260521_193333_0000_o7l1t1.png',
    bg: 'linear-gradient(155deg,#0a0a2a,#1a1a5c,#0a0a3d)',
  },
  {
    label: 'Moon Lamp',
    catId: 'light',
    emoji: '🕯️',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535314/Enhancer-Ultra_HD-Untitled_design_20260521_184307_0000_oqwt8c.png',
    bg: 'linear-gradient(155deg,#1a1a0a,#3d3d00,#2a2a00)',
  },
  {
    label: 'Crystal Ball',
    catId: 'crystalball',
    emoji: '🔮',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535320/Enhancer-Ultra_HD-Zone_20260521_192104_0000_bwnsxc.png',
    bg: 'linear-gradient(155deg,#0a0a2a,#1a1a5c,#0a0a3d)',
  },
  {
    label: 'TWS',
    catId: 'tws',
    emoji: '🎧',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535323/quality_restoration_20260522065341115_eh8yle.png',
    bg: 'linear-gradient(155deg,#1a0020,#3d0050,#2d0070)',
  },
  {
    label: 'Power Bank',
    catId: 'powerbank',
    emoji: '🔋',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535311/Enhancer-AI_UHD-Power_20260523_104015_0000_aa9euv.png',
    bg: 'linear-gradient(155deg,#1a0a00,#3d1f00,#5c2d00)',
  },
  {
    label: 'Headphone',
    catId: 'headphone',
    emoji: '🎧',
    img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535317/Enhancer-Ultra_HD-Untitled_design_20260523_080608_0000_offzxw.png',
    bg: 'linear-gradient(155deg,#00101a,#001f3d,#003366)',
  },
];

// Legacy dead markup indices (0-7) kept only for structural fidelity —
// confirmed unused by any function in 32-javascript-all.js.
const LEGACY_HIDDEN_INDICES = [0, 1, 2, 3, 4, 5, 6, 7];

function optimizeCloudinaryUrl(url) {
  if (!url) return url;
  if (!url.includes('res.cloudinary.com')) return url;
  if (url.includes('/w_')) return url;
  return url.replace(/\/q_auto\/f_auto\//, '/w_600,q_auto,f_auto/');
}

function parseSupabaseVal(val) {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'string') return val;
  const t = val.trim();
  if (t.startsWith('[') || t.startsWith('{') || t.startsWith('"')) {
    try {
      return JSON.parse(t);
    } catch (e) {
      return val;
    }
  }
  return val;
}

function padCards(arr) {
  const padded = Array.isArray(arr) ? arr.slice() : [];
  while (padded.length < DUO_TOTAL) {
    const idx = padded.length;
    padded.push(CATH_CARD_DEFAULTS[idx] || CATH_CARD_DEFAULTS[0]);
  }
  return padded.slice(0, DUO_TOTAL);
}

function getDuoPerPage() {
  if (typeof window === 'undefined') return 2;
  return window.innerWidth >= 769 ? 6 : 2;
}

export default function HeroSlider({ onCategoryClick }) {
  const [cards, setCards] = useState(CATH_CARD_DEFAULTS);

  const wrapRef = useRef(null);
  const trackRef = useRef(null);

  const duoIdxRef = useRef(DUO_TOTAL);
  const autoTimerRef = useRef(null);
  const pausedRef = useRef(false);
  const infiniteJumpRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0 });
  const touchRef = useRef({ startX: 0, startY: 0 });
  const resizeTimerRef = useRef(null);

  // ── Position the track (mirrors duoSetPosition) ──
  const setPosition = useCallback((animate) => {
    const track = trackRef.current;
    const wrap = wrapRef.current;
    if (!track || !wrap) return;

    const allCards = track.querySelectorAll('.cath-card');
    const perPage = getDuoPerPage();

    let wrapWidth = wrap.getBoundingClientRect().width;
    if (!wrapWidth || wrapWidth < 10) {
      const cathWrap = document.getElementById('cathWrap');
      const cathPad = cathWrap
        ? parseFloat(getComputedStyle(cathWrap).paddingLeft) + parseFloat(getComputedStyle(cathWrap).paddingRight)
        : 28;
      wrapWidth = window.innerWidth - cathPad;
    }
    if (!wrapWidth || wrapWidth < 50) {
      setTimeout(() => setPosition(animate), 150);
      return;
    }

    const cardWidth = Math.floor((wrapWidth - GAP * (perPage - 1)) / perPage);
    if (!cardWidth || cardWidth < 10) return;

    allCards.forEach((c) => {
      c.style.width = cardWidth + 'px';
      c.style.minWidth = cardWidth + 'px';
      c.style.flexShrink = '0';
    });

    const offset = duoIdxRef.current * (cardWidth + GAP);
    track.style.transition = animate ? 'transform .42s cubic-bezier(.4,0,.2,1)' : 'none';
    track.style.transform = `translateX(-${offset}px)`;
  }, []);

  const startAuto = useCallback(() => {
    clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      if (!pausedRef.current) duoStep(1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, AUTOPLAY_MS);
  }, []);

  const duoStep = useCallback(
    (dir) => {
      const perPage = getDuoPerPage();
      duoIdxRef.current += dir * perPage;
      setPosition(true);
    },
    [setPosition]
  );

  // Arrow buttons (compatibility shim for legacy duoSlide(dir))
  const duoSlide = (dir) => duoStep(dir);

  // ── Mount: attach listeners, initial position, autoplay ──
  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    requestAnimationFrame(() => requestAnimationFrame(() => setPosition(false)));
    startAuto();

    // Touch (mobile)
    const onTouchStart = (e) => {
      touchRef.current.startX = e.touches[0].clientX;
      touchRef.current.startY = e.touches[0].clientY;
      pausedRef.current = true;
      clearInterval(autoTimerRef.current);
    };
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchRef.current.startX;
      const dy = e.changedTouches[0].clientY - touchRef.current.startY;
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
        duoStep(dx < 0 ? 1 : -1);
      }
      pausedRef.current = false;
      clearTimeout(autoTimerRef.current);
      setTimeout(() => startAuto(), 2000);
    };
    const onTouchCancel = () => {
      pausedRef.current = false;
      startAuto();
    };

    // Desktop hover — slow autoplay
    const onMouseEnter = () => {
      if (window.innerWidth >= 769) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = setInterval(() => {
          if (!pausedRef.current) duoStep(1);
        }, HOVER_AUTOPLAY_MS);
      }
    };
    const onMouseLeaveAuto = () => {
      if (window.innerWidth >= 769) startAuto();
    };

    // Desktop drag
    const onMouseDown = (e) => {
      if (window.innerWidth < 769) return;
      dragRef.current.startX = e.clientX;
      dragRef.current.active = true;
      clearInterval(autoTimerRef.current);
    };
    const onMouseUp = (e) => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      const dx = e.clientX - dragRef.current.startX;
      if (Math.abs(dx) > 40) duoStep(dx < 0 ? 1 : -1);
      setTimeout(() => startAuto(), 1500);
    };
    const onMouseLeaveDrag = () => {
      if (dragRef.current.active) {
        dragRef.current.active = false;
        startAuto();
      }
    };

    // Infinite loop snap
    const onTransitionEnd = () => {
      if (infiniteJumpRef.current) return;
      if (duoIdxRef.current >= DUO_TOTAL * 2) {
        infiniteJumpRef.current = true;
        duoIdxRef.current -= DUO_TOTAL;
        setPosition(false);
        infiniteJumpRef.current = false;
      } else if (duoIdxRef.current < DUO_TOTAL) {
        infiniteJumpRef.current = true;
        duoIdxRef.current += DUO_TOTAL;
        setPosition(false);
        infiniteJumpRef.current = false;
      }
    };

    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.addEventListener('touchend', onTouchEnd, { passive: true });
    wrap.addEventListener('touchcancel', onTouchCancel, { passive: true });
    wrap.addEventListener('mouseenter', onMouseEnter);
    wrap.addEventListener('mouseleave', onMouseLeaveAuto);
    wrap.addEventListener('mousedown', onMouseDown);
    wrap.addEventListener('mouseup', onMouseUp);
    wrap.addEventListener('mouseleave', onMouseLeaveDrag);
    track.addEventListener('transitionend', onTransitionEnd);

    const onResize = () => {
      clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        duoIdxRef.current = DUO_TOTAL;
        requestAnimationFrame(() => requestAnimationFrame(() => setPosition(false)));
      }, 200);
    };
    window.addEventListener('resize', onResize);

    return () => {
      clearInterval(autoTimerRef.current);
      clearTimeout(resizeTimerRef.current);
      wrap.removeEventListener('touchstart', onTouchStart);
      wrap.removeEventListener('touchend', onTouchEnd);
      wrap.removeEventListener('touchcancel', onTouchCancel);
      wrap.removeEventListener('mouseenter', onMouseEnter);
      wrap.removeEventListener('mouseleave', onMouseLeaveAuto);
      wrap.removeEventListener('mousedown', onMouseDown);
      wrap.removeEventListener('mouseup', onMouseUp);
      wrap.removeEventListener('mouseleave', onMouseLeaveDrag);
      track.removeEventListener('transitionend', onTransitionEnd);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load cards: localStorage cache first (no-flash), then Supabase ──
  useEffect(() => {
    try {
      const cached = localStorage.getItem('vc_cath_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
          setCards(padCards(parsed));
        }
      }
    } catch (e) {
      // silent fail — defaults already showing
    }

    const fetchCards = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'vc_cath_cards')
          .maybeSingle();
        if (error || !data) return;
        const parsedVal = parseSupabaseVal(data.setting_value);
        if (Array.isArray(parsedVal) && parsedVal.length) {
          const padded = padCards(parsedVal);
          setCards(padded);
          try {
            localStorage.setItem('vc_cath_cache', JSON.stringify(padded));
          } catch (e) {
            // ignore quota errors
          }
        }
      } catch (e) {
        console.warn('Hero card fetch failed:', e);
      }
    };

    fetchCards();

    // Re-sync when the tab becomes visible again (mirrors legacy visibilitychange refresh)
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchCards();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Reposition after card data updates (widths/labels may differ)
  useEffect(() => {
    requestAnimationFrame(() => setPosition(false));
  }, [cards, setPosition]);

  const goCategory = (catId) => {
    if (typeof onCategoryClick === 'function') {
      onCategoryClick(catId);
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vc:cathCategoryClick', { detail: { catId } }));
    }
    document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tripled = [...cards, ...cards, ...cards];

  return (
    <div className="cath-wrap" id="cathWrap">
      {/* Hidden legacy track — kept for structural fidelity, unused by any active logic */}
      <div className="cath-viewport" id="cathViewport" style={{ display: 'none' }}>
        <div className="cath-track" id="cathTrack">
          {LEGACY_HIDDEN_INDICES.map((i) => (
            <div className="cath-card" id={`cathCard-${i}`} style={{ display: 'none' }} key={i}>
              <div className="cath-line1" id={`cath-line1-${i}`} />
              <div className="cath-line2" id={`cath-line2-${i}`} />
              <span className="cath-cat-label" id={`cath-label-${i}`} />
              <div className="cath-emoji-bg" id={`cathImg-${i}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Visible: sliding infinite hero (2 on mobile, 6 on desktop) */}
      <div className="cath-hero-duo" id="cathHeroDuo" ref={wrapRef}>
        <div id="duoLoader" style={{ display: 'none' }} />
        <div className="cath-duo-track" id="cathDuoTrack" ref={trackRef}>
          {tripled.map((card, i) => {
            const bg = card.bg || 'linear-gradient(155deg,#111,#222)';
            const catId = card.catId || 'all';
            const label = card.label || '';
            const isEager = i % DUO_TOTAL < 2;
            let media = null;
            if (card.img && card.img.length > 0) {
              media = (
                <img
                  className="cath-bg-img"
                  src={optimizeCloudinaryUrl(card.img)}
                  alt={label}
                  loading={isEager ? 'eager' : 'lazy'}
                  fetchPriority={isEager ? 'high' : undefined}
                  decoding="async"
                />
              );
            } else if (card.emoji && card.emoji.trim().startsWith('<svg')) {
              media = (
                <div
                  className="cath-emoji-bg"
                  style={{ fontSize: 0 }}
                  dangerouslySetInnerHTML={{
                    __html: card.emoji.replace(
                      /<svg/,
                      '<svg style="width:80px;height:80px;filter:drop-shadow(0 4px 20px rgba(0,0,0,.6))"'
                    ),
                  }}
                />
              );
            } else if (card.emoji) {
              media = <div className="cath-emoji-bg">{card.emoji}</div>;
            }
            return (
              <div
                className="cath-card"
                key={`${catId}-${i}`}
                style={{ background: bg, cursor: 'pointer' }}
                onClick={() => goCategory(catId)}
              >
                {media}
                <div className="cath-overlay" />
                <div className="cath-content">
                  <span className="cath-cat-label">
                    {label} <span className="cath-arrow">→</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide dots — kept for markup fidelity; legacy JS never populates these */}
      <div className="cath-duo-dots" id="cathDuoDots" />

      {/* Desktop arrows (hidden on mobile via CSS) */}
      <button className="cath-arrow-btn cath-prev" id="cathDuoPrev" onClick={() => duoSlide(-1)}>
        &#8249;
      </button>
      <button className="cath-arrow-btn cath-next" id="cathDuoNext" onClick={() => duoSlide(1)}>
        &#8250;
      </button>

      {/* Hidden legacy dots container */}
      <div className="cath-dots" id="cathDots" style={{ display: 'none' }} />
    </div>
  );
    }
