'use client';

import { useRef, useCallback } from 'react';

const DEFAULT_ICONS = {
  all:'🛒', tws:'🎧', powerbank:'🔋', rgb:'💡', smartwatch:'⌚',
  acrylic:'🕯️', headphone:'🎧', fan:'💨', unique:'💎', crystalball:'🔮',
  waterbottle:'🍶', wifiups:'🎮', humidifier:'💧', keyboard:'⌨️',
  gimbal:'📸', light:'🪔', mouse:'🖱️', cable:'🔌', 'unique-tools':'🔧',
  hairdryer:'💇', toys:'🧸', alarmclock:'⏰', lamp:'💡', usbhub:'🔗',
  accessories:'🎒', powerstrip:'🔌', projector:'📽️', neckband:'🎶',
  kitchenaccessories:'🍳', offer:'🏷️', btspeaker:'🔊',
};

const DEFAULT_CATS = [
  {id:'tws',name:'TWS'},{id:'powerbank',name:'Power Bank'},{id:'rgb',name:'RGB Light'},
  {id:'smartwatch',name:'Smart Watch'},{id:'acrylic',name:'Acrylic Lamp'},{id:'headphone',name:'Headphone'},
  {id:'fan',name:'Rechargeable Fan'},{id:'unique',name:'Unique Collection'},{id:'crystalball',name:'Crystal Ball'},
  {id:'waterbottle',name:'Water Bottle'},{id:'wifiups',name:'Wifi UPS'},{id:'humidifier',name:'Humidifier'},
  {id:'keyboard',name:'Keyboard'},{id:'gimbal',name:'Gimbal'},{id:'light',name:'Light'},
  {id:'mouse',name:'Mouse'},{id:'cable',name:'Cable And Charges'},{id:'unique-tools',name:'Unique Tools'},
  {id:'hairdryer',name:'Hair Dryer'},{id:'toys',name:'Toys'},{id:'alarmclock',name:'Alarm Clock'},
  {id:'lamp',name:'Lamp'},{id:'usbhub',name:'USB HUB'},{id:'accessories',name:'Accessories'},
  {id:'powerstrip',name:'Power Strip'},{id:'projector',name:'Projector'},{id:'neckband',name:'Neckband'},
  {id:'kitchenaccessories',name:'Kitchen Accessories'},{id:'offer',name:'Offers'},{id:'btspeaker',name:'BT Speaker'},
];

export default function Categories({ initialCategories, activeCat = 'all', onCategoryClick }) {
  const cats = (initialCategories?.length) ? initialCategories.filter(c => c.id !== 'all') : DEFAULT_CATS;
  const viewportRef = useRef(null);

  const scrollBy = useCallback((dir) => {
    viewportRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  }, []);

  return (
    <div className="section">
      <div className="sec-head">
        <h2 className="sec-title">ক্যাটাগরি <span>সমূহ</span></h2>
      </div>
      <div className="cat-carousel-wrap">
        <button className="cat-carousel-arrow prev" onClick={() => scrollBy(-1)}>&#8249;</button>
        <div className="cat-cards-viewport" ref={viewportRef} id="catViewport">
          <div className="cat-cards" id="catCardsGrid">
            {cats.map(cat => (
              <div
                key={cat.id}
                className={`cat-card${activeCat === cat.id ? ' active' : ''}`}
                onClick={() => onCategoryClick?.(cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onCategoryClick?.(cat.id)}
              >
                <div className="cat-card-icon-wrap">
                  <span className="cat-card-icon">
                    {cat.icon || DEFAULT_ICONS[cat.id] || '📦'}
                  </span>
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
