'use client';

function renderStars(rating) {
  const r = parseFloat(rating) || 4.5;
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (r >= i) stars += '★';
    else if (r >= i - 0.5) stars += '★';
    else stars += '☆';
  }
  return stars;
}

function fakeReviewCount(id, stock) {
  return (Math.floor((Number(id) || 1) * 37 + (stock || 0) * 13) % 80) + 20;
}

export default function ProductCard({ product, onOrder, onCart, onOpenModal, wishlisted, onToggleWish }) {
  const p = product;
  const sold = p.stock <= 0;
  const bc = p.badge ? `badge-${p.badge.toLowerCase()}` : '';
  const discPct = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const discBgColor = p.discountColor === 'green' ? '#16A34A' : '#FF6B00';
  const badgeTop = p.badge ? '32px' : '10px';

  const imgs = p.imgs || ['📦'];
  const firstImg = imgs[0] || '📦';
  const isUrl = typeof firstImg === 'string' && (firstImg.startsWith('http') || firstImg.startsWith('/'));

  const specs = p.specs_short || p.specs || '';
  const specShort = specs ? specs.split(/[\n;]/)[0] : '';

  const rating = parseFloat(p.rating) || 4.5;
  const reviewCount = fakeReviewCount(p.id, p.stock);

  return (
    <div className="prod-card">
      {/* Badge */}
      {sold
        ? <div className="prod-badge badge-sold">Sold Out</div>
        : p.badge ? <div className={`prod-badge ${bc}`}>{p.badge}</div> : null
      }
      {/* Discount badge */}
      {discPct >= 5 && !sold && (
        <div className="discount-badge" style={{ top: badgeTop, background: discBgColor }}>
          {discPct}% ছাড়
        </div>
      )}

      {/* Image */}
      <div className="prod-img-wrap" style={{ position: 'relative' }}>
        <div className="prod-img" onClick={() => onOpenModal && onOpenModal(p)} style={{ overflow: 'hidden' }}>
          {isUrl
            ? <img src={firstImg} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} onError={e => { e.target.outerHTML = '<span style="font-size:48px">📦</span>'; }} />
            : <span style={{ fontSize: '52px' }}>{firstImg}</span>
          }
        </div>
        {/* Wishlist button */}
        <button
          className={`wish-btn${wishlisted ? ' wishlisted' : ''}`}
          onClick={() => onToggleWish && onToggleWish(p.id)}
          title="Wishlist"
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Info */}
      <div className="prod-info">
        <div className="prod-name" onClick={() => onOpenModal && onOpenModal(p)}>{p.name}</div>
        {specShort ? <div className="prod-spec">{specShort}</div> : <div className="prod-spec" />}
        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px', fontSize: '11px' }}>
          <span style={{ color: '#F59E0B' }}>{renderStars(rating)}</span>
          <span style={{ color: 'var(--gray)' }}>{rating.toFixed(1)} ({reviewCount})</span>
        </div>
        {/* Price */}
        <div className="prod-price-row">
          <span className="prod-price">৳{p.price.toLocaleString()}</span>
          {p.old > p.price && <span className="prod-old">৳{p.old.toLocaleString()}</span>}
        </div>
        {/* CTA */}
        <div className="prod-cta-row">
          {sold ? (
            <button className="prod-cta" style={{ width: '100%', background: '#F59E0B', color: '#fff', border: 'none' }}>
              🔔 স্টকে আসলে জানান
            </button>
          ) : (
            <>
              <button className="prod-cta" onClick={() => onOrder && onOrder(p)}>⚡ অর্ডার করুন</button>
              <button className="prod-cart-icon-btn" onClick={() => onCart && onCart(p)} title="কার্টে যোগ করুন">🛒</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
