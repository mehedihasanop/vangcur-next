'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_ICONS = {
  all: '🛒', tws: '🎧', powerbank: '🔋', rgb: '💡', smartwatch: '⌚',
  acrylic: '🕯️', headphone: '🎧', fan: '💨', unique: '💎', crystalball: '🔮',
  waterbottle: '🍶', wifiups: '🎮', humidifier: '💧', keyboard: '⌨️',
  gimbal: '📸', light: '🪔', mouse: '🖱️', cable: '🔌', 'unique-tools': '🔧',
  hairdryer: '💇', toys: '🧸', alarmclock: '⏰', lamp: '💡', usbhub: '🔗',
  accessories: '🎒', powerstrip: '🔌', projector: '📽️', neckband: '🎶',
  kitchenaccessories: '🍳', offer: '🏷️', btspeaker: '🔊',
};

const DEFAULT_CATS = [
  { id: 'tws', name: 'TWS' }, { id: 'powerbank', name: 'Power Bank' },
  { id: 'rgb', name: 'RGB Light' }, { id: 'smartwatch', name: 'Smart Watch' },
  { id: 'acrylic', name: 'Acrylic Lamp' }, { id: 'headphone', name: 'Headphone' },
  { id: 'fan', name: 'Rechargeable Fan' }, { id: 'unique', name: 'Unique Collection' },
  { id: 'crystalball', name: 'Crystal Ball' }, { id: 'waterbottle', name: 'Water Bottle' },
  { id: 'humidifier', name: 'Humidifier' }, { id: 'toys', name: 'Toys' },
  { id: 'alarmclock', name: 'Alarm Clock' }, { id: 'light', name: 'Light' },
  { id: 'btspeaker', name: 'BT Speaker' }, { id: 'projector', name: 'Projector' },
  { id: 'mouse', name: 'Mouse' }, { id: 'keyboard', name: 'Keyboard' },
  { id: 'gimbal', name: 'Gimbal' }, { id: 'cable', name: 'Cable And Charges' },
  { id: 'hairdryer', name: 'Hair Dryer' }, { id: 'usbhub', name: 'USB HUB' },
  { id: 'powerstrip', name: 'Power Strip' }, { id: 'neckband', name: 'Neckband' },
  { id: 'accessories', name: 'Accessories' }, { id: 'kitchenaccessories', name: 'Kitchen Accessories' },
  { id: 'unique-tools', name: 'Unique Tools' }, { id: 'wifiups', name: 'Wifi UPS' },
  { id: 'lamp', name: 'Lamp' },
];

function getCatPerPage() {
  if (typeof window === 'undefined') return 8;
  if (window.innerWidth <= 480) return 8;
  if (window.innerWidth <= 768) return 8;
  if (window.innerWidth <= 1024) return 12;
  return 16;
}

export default function Categories({ initialCategories, onCategoryClick }) {
  const [activeCatState, setActiveCatState] = useState('all');
  const [catPage, setCatPage] = useState(0);
  const [perPage, setPerPage] = useState(8);
  const viewportRef = useRef(null);

  const cats = (initialCategories && initialCategories.length > 0)
    ? initialCategories.filter(c => c.id !== 'all')
    : DEFAULT_CATS;

  useEffect(() => {
    setPerPage(getCatPerPage());
    const onResize = () => setPerPage(getCatPerPage());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Touch swipe
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    let sx = 0, sy = 0;
    const onStart = (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) slide(dx < 0 ? 1 : -1);
    };
    vp.addEventListener('touchstart', onStart, { passive: true });
    vp.addEventListener('touchend', onEnd, { passive: true });
    return () => { vp.removeEventListener('touchstart', onStart); vp.removeEventListener('touchend', onEnd); };
  }, [catPage, cats.length, perPage]);

  const maxPage = Math.max(0, Math.ceil(cats.length / perPage) - 1);

  function slide(dir) {
    setCatPage(p => {
      let next = p + dir;
      if (next > maxPage) next = 0;
      if (next < 0) next = maxPage;
      return next;
    });
  }

  function handleCatClick(catId) {
    setActiveCatState(catId);
    if (typeof window !== 'undefined' && window._setProductCat) {
      window._setProductCat(catId);
    }
    if (onCategoryClick) onCategoryClick(catId);
    setTimeout(() => {
      const el = document.getElementById('prodSec');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  const pages = maxPage + 1;

  return (
    <div className="section">
      <div className="sec-head">
        <h2 className="sec-title">ক্যাটাগরি <span>সমূহ</span></h2>
      </div>
      <div className="cat-carousel-wrap">
        <button className="cat-carousel-arrow prev" onClick={() => slide(-1)}>&#8249;</button>
        <div className="cat-cards-viewport" ref={viewportRef}>
          <div className="cat-cards">
            {cats.map((cat, i) => {
              const start = catPage * perPage;
              const visible = i >= start && i < start + perPage;
              return (
                <div
                  key={cat.id}
                  className={`cat-card${activeCatState === cat.id ? ' active' : ''}`}
                  style={{ display: visible ? '' : 'none' }}
                  onClick={() => handleCatClick(cat.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleCatClick(cat.id)}
                >
                  <div className="cat-card-icon-wrap">
                    {cat.icon && cat.icon.startsWith('<svg') ? (
                      <span className="cat-card-icon" dangerouslySetInnerHTML={{ __html: cat.icon }} />
                    ) : (
                      <span className="cat-card-icon">{cat.icon || DEFAULT_ICONS[cat.id] || '📦'}</span>
                    )}
                  </div>
                  <div className="cat-card-name">{cat.name}</div>
                </div>
              );
            })}
          </div>
        </div>
        <button className="cat-carousel-arrow next" onClick={() => slide(1)}>&#8250;</button>
      </div>
      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
        {Array.from({ length: pages }).map((_, p) => (
          <div
            key={p}
            className={`cat-dot${p === catPage ? ' active' : ''}`}
            onClick={() => setCatPage(p)}
          />
        ))}
      </div>
    </div>
  );
}
