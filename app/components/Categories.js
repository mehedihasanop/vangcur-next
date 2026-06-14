'use client';

import { useState, useRef, useCallback } from 'react';

// Default category icons — same as legacy
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
];

export default function Categories({ initialCategories, onCategoryClick }) {
  const [activeCatState, setActiveCatState] = useState('all');
  const cats = (initialCategories && initialCategories.length > 0)
    ? initialCategories.filter(c => c.id !== 'all')
    : DEFAULT_CATS;

  const viewportRef = useRef(null);

  function handleCatClick(catId) {
    setActiveCatState(catId);
    // Bridge to ProductGrid
    if (typeof window !== 'undefined' && window._setProductCat) {
      window._setProductCat(catId);
    }
    if (onCategoryClick) onCategoryClick(catId);
    // Scroll to products
    setTimeout(() => {
      const el = document.getElementById('prodSec');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  const scrollBy = useCallback((dir) => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
  }, []);

  return (
    <div className="section">
      <div className="sec-head">
        <h2 className="sec-title">ক্যাটাগরি <span>সমূহ</span></h2>
      </div>
      <div className="cat-carousel-wrap">
        <button className="cat-carousel-arrow prev" onClick={() => scrollBy(-1)}>&#8249;</button>
        <div className="cat-cards-viewport" ref={viewportRef}>
          <div className="cat-cards">
            {cats.map(cat => (
              <div
                key={cat.id}
                className={`cat-card${activeCatState === cat.id ? ' active' : ''}`}
                onClick={() => handleCatClick(cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleCatClick(cat.id)}
              >
                <div className="cat-card-icon-wrap">
                  {cat.icon && cat.icon.startsWith('<svg') ? (
                    <span
                      className="cat-card-icon"
                      dangerouslySetInnerHTML={{ __html: cat.icon }}
                    />
                  ) : (
                    <span className="cat-card-icon">
                      {cat.icon || DEFAULT_ICONS[cat.id] || '📦'}
                    </span>
                  )}
                </div>
                <div className="cat-card-name">{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
        <button className="cat-carousel-arrow next" onClick={() => scrollBy(1)}>&#8250;</button>
      </div>
    </div>
  );
}
