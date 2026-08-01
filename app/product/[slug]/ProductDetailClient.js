'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  DEFAULT_PRODS, prodInCat, fetchCustomProducts, mergeCustomProducts, subscribeCustomProducts,
  findProdBySlug, isWishlisted, toggleWish, WISHLIST_EVENT,
  QUICK_ORDER_EVENT, QUICK_CART_EVENT, STOCK_NOTIFY_EVENT,
} from '@/lib/productData';
import { fetchProductDetail } from '@/lib/productDetailData';
import { trackProductView } from '@/lib/visitorTracking';
import {
  DEFAULT_WA_LINK, DEFAULT_MSG_LINK, computeWaLink, computeMsgLink, fetchContactSettings, subscribeContactSettings,
} from '@/lib/floatButtonsData';
import { showToast } from '@/lib/toast';
import ProductCard from '@/app/components/home/ProductCard';
import WarrantyModal from '@/app/components/modals/WarrantyModal';

// Converted from 32-javascript-all.js — 19-product-full-page.html section:
// - fetchProdDetail()/openPP() (lines ~500-820) — split here into: PRODS loading
//   (same pattern as ProductGrid.js/SearchPageClient.js, no shared store yet),
//   product lookup by slug (findProdBySlug), and lazy detail-field fetch
//   (fetchProductDetail, lib/productDetailData.js) that fires once per product.
// - togglePpFaq()/ppScrollTo() (lines ~822-845) — openFaqIdx/activeTab state below
// - closePP()/closePPToHome() (lines ~847-1004) — NOT ported. Owner's decision:
//   this is a real route (app/product/[slug]/), so back navigation is the browser's
//   own history/back button (or the <Link href="/"> in the breadcrumb), and there's
//   no _panelStack/history.replaceState hack or pp-overlay to show/hide.
// - buildGallery/goImg/toggleZoom/galleryArrow/initGallerySwipe (lines ~867-915) —
//   curImgIdx/zoomed/transformOrigin state + onTouchStart/onTouchEnd below
// - chgQty/addCartFromPP/orderNow/waOrder/msgOrder (lines ~917-965, ~4181-4195) —
//   addCartFromPP/orderNow now dispatch QUICK_CART_EVENT/QUICK_ORDER_EVENT (same
//   events ProductCard/SRPProductCard/WishlistDrawer use) instead of directly
//   mutating a `cart` array — 20-cart-sidebar.html/23-order-overlay.html aren't
//   built yet, so this fires into the void the same way those components do.
//   waOrder/msgOrder reuse lib/floatButtonsData.js's computeWaLink/computeMsgLink
//   instead of re-deriving _getWaNum()/_getMsgUrl() — same vc_contact source.
// - openWarrantyModal() (lines ~260-300) -> app/components/modals/WarrantyModal.js
// - renderRelated() (lines ~1290-1325) -> reuses app/components/home/ProductCard.js
//   directly (identical prod-card markup + wishlist/cart/order behavior already
//   built there), instead of re-implementing a second copy of the card here.
// - 31-sticky-order-bar.html (verified 2026-07-31 against the official section
//   extraction): the sticky bar itself was already built here from an earlier pass
//   at 19-product-full-page.html, but had drifted from the extraction in 3 places,
//   now fixed — (1) scroll-show threshold was comparing tabsWrap's position against
//   plain 0 instead of legacy's `+70` (see the sticky-bar useEffect for why: .pp-nav
//   is a 56-70px sticky header, so the tabs were hidden behind it for ~70px of
//   scroll before the bar used to appear); (2) product name truncation was always
//   45 chars, legacy uses 25 on mobile (isMobileWidth state added); (3) button
//   order/label had drifted (Cart-then-Order instead of legacy's Order-then-Cart,
//   and the cart button was missing its "কার্ট" label).
// Markup source: 19-product-full-page.html extraction (this session)

// Legacy: getCardSpecs()-style quick-spec picker, but keeps up to 6 entries and
// the {k: v} shape ppQuickSpecs needs (vs. the joined string ProductCard uses).
function getQuickSpecs(specs) {
  const s = specs || {};
  const quickKeys = s._quick_keys;
  let entries = [];
  if (Array.isArray(quickKeys)) {
    quickKeys.forEach((k) => { if (s[k] !== undefined) entries.push([k, s[k]]); });
  } else {
    entries = Object.entries(s).filter(([k]) => !k.startsWith('_'));
  }
  return entries.slice(0, 6);
}

const EXCLUDE_FROM_TABLE = new Set(['Packaging Content', 'packaging_content']);

// Legacy: ppTechBody builder (lines ~795-808) — every non-quick, non-underscore,
// non-packaging spec entry, packaging content appended separately as its own row.
function getTechSpecRows(specs) {
  const s = specs || {};
  const quickKeys = s._quick_keys;
  const quickKeySet = Array.isArray(quickKeys) ? new Set(quickKeys) : new Set();
  let rows;
  if (Array.isArray(quickKeys)) {
    rows = Object.entries(s).filter(([k]) => !k.startsWith('_') && !quickKeySet.has(k) && !EXCLUDE_FROM_TABLE.has(k));
  } else {
    rows = Object.entries(s).filter(([k]) => !k.startsWith('_') && !EXCLUDE_FROM_TABLE.has(k));
  }
  const pkg = s['Packaging Content'] || s['packaging_content'] || '';
  return { rows, pkg };
}

// Legacy: ppFeaturesList builder (lines ~751-766) — "emoji **title** rest" or
// "emoji rest" or plain text, one <div class="pp-feature-item"> per entry.
function FeatureItem({ text }) {
  const boldMatch = text.match(/^(.*?)\*\*(.*?)\*\*(.*)$/);
  if (boldMatch) {
    const [, pre, title, rest] = boldMatch;
    return (
      <div className="pp-feature-item">
        <div className="pp-feature-icon">{pre.trim() || '✅'}</div>
        <div className="pp-feature-text"><strong>{title}</strong>{rest}</div>
      </div>
    );
  }
  const emojiMatch = text.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)/u);
  if (emojiMatch) {
    return (
      <div className="pp-feature-item">
        <div className="pp-feature-icon">{emojiMatch[1]}</div>
        <div className="pp-feature-text">{emojiMatch[2]}</div>
      </div>
    );
  }
  return (
    <div className="pp-feature-item">
      <div className="pp-feature-icon">✅</div>
      <div className="pp-feature-text">{text}</div>
    </div>
  );
}

function GalleryImg({ val, name, isThumb }) {
  const [broken, setBroken] = useState(false);
  const isUrl = typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
  if (isUrl && !broken) {
    return (
      <img
        src={val}
        alt={name || ''}
        loading="lazy"
        style={isThumb
          ? { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }
          : { width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        onError={() => setBroken(true)}
      />
    );
  }
  return <span style={{ fontSize: isThumb ? 24 : 90 }}>{val || '📦'}</span>;
}

const TABS = [
  { id: 'ppSecDesc', label: 'বিবরণ' },
  { id: 'ppSecFeatures', label: 'ফিচারস' },
  { id: 'ppSecSpecs', label: 'স্পেসিফিকেশন' },
  { id: 'ppSecFaq', label: 'প্রশ্নোত্তর' },
  { id: 'ppSecReviews', label: 'রিভিউ' },
];

export default function ProductDetailClient({ slug, initialId }) {
  const router = useRouter();

  // ── PRODS (own copy — no shared product store exists yet; same pattern as
  //    ProductGrid.js/SearchPageClient.js) ──
  const [prods, setProds] = useState(DEFAULT_PRODS);
  const [prodsLoaded, setProdsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCustomProducts(supabase).then((customRows) => {
      if (cancelled) return;
      if (customRows.length) setProds((prev) => mergeCustomProducts(prev, customRows));
      setProdsLoaded(true);
    });
    const channel = subscribeCustomProducts(supabase, {
      onInsert: (mapped) => setProds((prev) => (
        prev.find((x) => String(x.id) === String(mapped.id)) ? prev : [...prev, mapped]
      )),
      onUpdate: (mapped) => setProds((prev) => {
        const idx = prev.findIndex((x) => String(x.id) === String(mapped.id));
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...mapped };
        return next;
      }),
      onDelete: (id) => setProds((prev) => prev.filter((x) => String(x.id) !== String(id))),
    });
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  const baseProd = useMemo(
    () => findProdBySlug(prods, slug) || (initialId ? prods.find((x) => String(x.id) === String(initialId)) : null),
    [prods, slug, initialId],
  );

  // ✅ Product View Tracking — legacy openPP()-এর নতুন যোগ হওয়া page_views insert-এর
  // Next.js সমতুল্য। admin.html-এর Traffic Analytics পেজের "সর্বাধিক দেখা প্রোডাক্ট"
  // widget-টা এই ডাটার উপর নির্ভর করে।
  useEffect(() => {
    if (!baseProd) return;
    trackProductView(supabase, baseProd.id);
  }, [baseProd?.id]);

  // ── Lazy detail fields (long description, features, FAQs, closing, full specs) ──
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    if (!baseProd) return;
    if (baseProd._detailLoaded) { setDetail(null); return; } // grid fetch already brought full fields
    let cancelled = false;
    fetchProductDetail(supabase, baseProd.id).then((d) => { if (!cancelled) setDetail(d); });
    return () => { cancelled = true; };
  }, [baseProd?.id]);

  const prod = useMemo(() => (baseProd ? { ...baseProd, ...(detail || {}) } : null), [baseProd, detail]);

  // ── UI state ──
  const [qty, setQty] = useState(1);
  const [curImgIdx, setCurImgIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState('center center');
  const [activeTab, setActiveTab] = useState('ppSecDesc');
  const [openFaqIdx, setOpenFaqIdx] = useState(null);
  const [wished, setWished] = useState(false);
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [stickyShown, setStickyShown] = useState(false);
  // Bug fix (2026-07-31): legacy truncates the sticky bar's product name at 25
  // chars on mobile (window.innerWidth <= 600) vs 45 on desktop — this was hardcoded
  // to 45 always. CSS ellipsis (.pp-sticky-name{white-space:nowrap;overflow:hidden;
  // text-overflow:ellipsis}) masked the visual difference somewhat, but this makes
  // the JS-level truncation match legacy exactly.
  const [isMobileWidth, setIsMobileWidth] = useState(false);
  useEffect(() => {
    const check = () => setIsMobileWidth(window.innerWidth <= 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [waLink, setWaLink] = useState(DEFAULT_WA_LINK);
  // Same bug/fix as FloatButtons.js (2026-08-01): start from the default instead
  // of null, and don't skip the setter on a null contact — see that file's comment.
  const [msgLink, setMsgLink] = useState(DEFAULT_MSG_LINK);

  const touchRef = useRef({ x: 0, y: 0 });
  const tabsWrapRef = useRef(null);
  const sectionRefs = useRef({});
  const relatedGridRef = useRef(null);

  // Reset per-product UI state whenever the product actually changes (id changes)
  useEffect(() => {
    if (!prod) return;
    setQty(1);
    setCurImgIdx(0);
    setZoomed(false);
    setActiveTab('ppSecDesc');
    setOpenFaqIdx(null);
    setWished(isWishlisted(prod.id));
  }, [prod?.id]);

  useEffect(() => {
    const handler = () => { if (prod) setWished(isWishlisted(prod.id)); };
    window.addEventListener(WISHLIST_EVENT, handler);
    return () => window.removeEventListener(WISHLIST_EVENT, handler);
  }, [prod?.id]);

  // ── vc_contact (WhatsApp/Messenger numbers) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const contact = await fetchContactSettings(supabase);
      if (cancelled) return;
      setWaLink(computeWaLink(contact));
      setMsgLink(computeMsgLink(contact));
    })();
    const channel = subscribeContactSettings(supabase, (contact) => {
      setWaLink(computeWaLink(contact));
      setMsgLink(computeMsgLink(contact));
    });
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  // ── Sticky bottom bar — legacy compared tabsWrap's position against the
  //    overlay's own bounding rect (tabsRect.top <= overlayRect.top + 70); the
  //    page now scrolls with `window` instead of an overlay, so the equivalent is
  //    checking against the viewport top. Bug fix (2026-07-31, verified against
  //    31-sticky-order-bar.html's official extraction): this was comparing against
  //    plain `0` with no +70 offset — .pp-nav is `position: sticky; top: 0` (see
  //    globals.css), roughly 56-70px tall, so the tabs bar was already hidden
  //    behind it for ~70px of scroll before the sticky order bar appeared. Restored
  //    the same +70 legacy used. ──
  useEffect(() => {
    const handler = () => {
      const el = tabsWrapRef.current;
      if (!el) return;
      setStickyShown(el.getBoundingClientRect().top <= 70);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, [prod?.id]);

  // Legacy: related-products card reveal (renderRelated's _relRevealObs, lines ~1315-1325)
  useEffect(() => {
    const grid = relatedGridRef.current;
    if (!grid) return undefined;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !window.IntersectionObserver) return undefined;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('vc-visible'); obs.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -30px 0px', threshold: 0.08 });
    grid.querySelectorAll('.prod-card').forEach((card, i) => {
      card.classList.add('vc-reveal');
      card.style.transitionDelay = (i * 60) + 'ms';
      obs.observe(card);
    });
    return () => obs.disconnect();
  }, [prod?.id, prods]);

  // ── Actions ──
  const maxQty = prod ? (prod.stock > 0 ? Math.min(prod.stock, 99) : 99) : 99;

  const chgQty = (d) => setQty((q) => Math.max(1, Math.min(maxQty, q + d)));

  const addCartFromPP = () => {
    if (!prod || prod.stock <= 0) return;
    window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: prod.id, qty } }));
    showToast('✅ কার্টে যোগ হয়েছে');
  };

  const orderNow = () => {
    if (!prod || prod.stock <= 0) return;
    window.dispatchEvent(new CustomEvent(QUICK_ORDER_EVENT, { detail: { id: prod.id, qty } }));
  };

  const notifyStock = () => {
    if (!prod) return;
    window.dispatchEvent(new CustomEvent(STOCK_NOTIFY_EVENT, { detail: { id: prod.id, name: prod.name } }));
  };

  const toggleWishFromPP = () => { if (prod) setWished(toggleWish(prod)); };

  function buildOrderMsg() {
    const pageUrl = window.location.href.split('?')[0].split('#')[0];
    const productRef = `${pageUrl}#prod-${prod.id}`;
    return `হ্যালো Vangcur! অর্ডার করতে চাই:\n\n📦 ${prod.name}\n💰 ৳${prod.price.toLocaleString()}\n🔢 পরিমাণ: ${qty}\n🛡️ ওয়ারেন্টি: ${prod.warranty}\n\n🔗 পণ্য রেফ: ${productRef}\n\nবিস্তারিত জানান।`;
  }
  const waOrder = () => { if (prod) window.open(`${waLink}?text=${encodeURIComponent(buildOrderMsg())}`, '_blank'); };
  const msgOrder = () => { if (prod && msgLink) window.open(`${msgLink}?text=${encodeURIComponent(buildOrderMsg())}`, '_blank'); };

  // Legacy: galleryArrow/goImg/initGallerySwipe (lines ~867-902)
  const goImg = (i) => { setCurImgIdx(i); setZoomed(false); };
  const galleryArrow = (dir) => {
    if (!prod || !prod.imgs || prod.imgs.length <= 1) return;
    goImg((curImgIdx + dir + prod.imgs.length) % prod.imgs.length);
  };
  const handleGalleryTouchStart = (e) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleGalleryTouchEnd = (e) => {
    if (zoomed) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) galleryArrow(dx < 0 ? 1 : -1);
  };
  const toggleZoom = (e) => {
    if (!zoomed) {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
      const yPct = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);
      setTransformOrigin(`${xPct}% ${yPct}%`);
      setZoomed(true);
    } else {
      setZoomed(false);
      setTimeout(() => setTransformOrigin('center center'), 380);
    }
  };

  // Legacy: ppScrollTo(sectionId, tabBtn) (lines ~838-848)
  const scrollToSection = (id) => {
    setActiveTab(id);
    const section = sectionRefs.current[id];
    if (!section) return;
    const tabHeight = tabsWrapRef.current ? tabsWrapRef.current.offsetHeight : 50;
    const navHeight = 62;
    const top = section.getBoundingClientRect().top + window.scrollY - navHeight - tabHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const toggleFaq = (i) => setOpenFaqIdx((cur) => (cur === i ? null : i));

  // ── Loading / not-found ──
  if (!prod) {
    if (!prodsLoaded) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)', fontSize: 14 }}>
          লোড হচ্ছে...
        </div>
      );
    }
    return (
      <div className="empty-cat-msg" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div className="empty-icon">📦</div>
        <p>এই প্রোডাক্টটি খুঁজে পাওয়া যায়নি</p>
        <Link href="/" style={{ background: 'var(--dark)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          হোমে ফিরে যান
        </Link>
      </div>
    );
  }

  const sold = prod.stock <= 0;
  const imgs = prod.imgs && prod.imgs.length ? prod.imgs : ['📦'];
  const quickSpecs = getQuickSpecs(prod.specs);
  const { rows: techRows, pkg } = getTechSpecRows(prod.specs);
  const features = Array.isArray(prod.features) ? prod.features : [];
  const faqs = Array.isArray(prod.faqs) ? prod.faqs : [];
  const rating = prod.rating || 4.5;
  const related = prods
    .filter((p) => prodInCat(p, prod.cat) && p.id !== prod.id)
    .sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0))
    .slice(0, 4);
  const nameShort = prod.name.length > 32 ? prod.name.slice(0, 32) + '...' : prod.name;

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <div className="pp-nav">
        <button className="pp-back" onClick={() => router.back()} aria-label="ফিরে যান">‹</button>
        <div className="pp-bread">হোম / <span id="ppBread">{nameShort}</span></div>
      </div>

      <div className="pp-inner">
        <div className="pp-gallery">
          <div
            className={'pp-main-img' + (zoomed ? ' zoomed' : '')}
            onClick={toggleZoom}
            onTouchStart={handleGalleryTouchStart}
            onTouchEnd={handleGalleryTouchEnd}
          >
            <div className="zoom-inner" style={{ transformOrigin }}>
              <GalleryImg val={imgs[curImgIdx]} name={prod.name} isThumb={false} />
            </div>
          </div>
          {imgs.length > 1 && (
            <>
              <div className="pp-dots">
                {imgs.map((_, i) => (
                  <button key={i} className={'pp-dot' + (i === curImgIdx ? ' on' : '')} onClick={() => goImg(i)} />
                ))}
              </div>
              <div className="pp-thumbs">
                {imgs.map((im, i) => (
                  <div key={i} className={'pp-thumb' + (i === curImgIdx ? ' on' : '')} onClick={() => goImg(i)}>
                    <GalleryImg val={im} name={prod.name} isThumb />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <h1 className="pp-name">{prod.name}</h1>
          <div className="pp-price-row">
            <span className="pp-price">৳{prod.price.toLocaleString()}</span>
            <span className="pp-old">৳{prod.old.toLocaleString()}</span>
          </div>
          <div className="pp-warranty">
            🛡️ <span>{prod.warranty}</span>
            <button className="pp-warranty-help-btn" onClick={() => setWarrantyOpen(true)} title="ওয়ারেন্টি বিস্তারিত">?</button>
          </div>

          {quickSpecs.length > 0 && (
            <div className="pp-quick-specs">
              <div style={{ width: '100%', fontSize: 12, fontWeight: 700, color: 'var(--gray)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                স্পেসিফিকেশন এক নজরে
              </div>
              {quickSpecs.map(([k, v]) => (
                <div className="pp-qs-item" key={k}><span>{k}:</span>{v}</div>
              ))}
            </div>
          )}

          <div className="pp-qty-row">
            <span className="pp-qty-label">পরিমাণ:</span>
            <button className="pp-qty-btn" onClick={() => chgQty(-1)}>−</button>
            <span className="pp-qty-num">{qty}</span>
            <button className="pp-qty-btn" onClick={() => chgQty(1)} disabled={qty >= maxQty}>+</button>
            {qty > 1 && (
              <div style={{ background: 'var(--light)', border: '1.5px solid var(--border)', borderRadius: 9, padding: '5px 12px', fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
                মোট: ৳{(prod.price * qty).toLocaleString()}
              </div>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button
                onClick={toggleWishFromPP}
                title="Wishlist এ যোগ করুন"
                style={{ width: 40, height: 40, borderRadius: 10, background: wished ? '#FFF0F0' : 'var(--light)', border: '1.5px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
              >
                {wished ? '❤️' : '🤍'}
              </button>
              {!sold && (
                <button
                  onClick={waOrder}
                  title="WhatsApp এ অর্ডার করুন"
                  style={{ width: 40, height: 40, borderRadius: 10, background: '#25D366', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </button>
              )}
            </div>
          </div>

          <div className="pp-actions">
            {sold ? (
              <button className="pp-btn pp-btn-order" style={{ background: '#F59E0B', color: '#fff' }} onClick={notifyStock}>
                🔔 স্টকে আসলে আমাকে জানান
              </button>
            ) : (
              <>
                <button className="pp-btn pp-btn-order" onClick={orderNow}>⚡ এখনই অর্ডার করুন</button>
                <button className="pp-btn pp-btn-cart" onClick={addCartFromPP}>🛒 কার্টে যোগ করুন</button>
                {msgLink && (
                  <button className="pp-btn pp-btn-wa" style={{ background: '#0084FF' }} onClick={msgOrder}>
                    <svg width="17" height="17" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.57.61.94 1.13.7l1.98-.87c.17-.08.36-.09.54-.04.9.25 1.87.38 2.89.38C17.64 21.4 22 17.27 22 11.7 22 6.13 17.64 2 12 2zm6.11 7.37l-2.96 4.7c-.47.74-1.47.93-2.17.41l-2.36-1.76c-.22-.16-.51-.16-.72 0l-3.18 2.41c-.42.32-.97-.16-.69-.62l2.96-4.7c.47-.74 1.47-.93 2.17-.41l2.36 1.76c.22.16.51.16.72 0l3.18-2.41c.43-.32.97.17.69.62z" /></svg>
                    Messenger এ অর্ডার করুন
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="pp-tabs-wrap" ref={tabsWrapRef}>
        <div className="pp-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'pp-tab' + (activeTab === t.id ? ' on' : '')}
              onClick={() => scrollToSection(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pp-detail-wrap">
        <div className="pp-detail-section" id="ppSecDesc" ref={(el) => { sectionRefs.current.ppSecDesc = el; }}>
          <div className="pp-section-title">📝 প্রোডাক্টের <span>বিস্তারিত বিবরণ</span></div>
          <div style={{ fontSize: 14, lineHeight: 1.85, color: '#374151' }}>
            {(prod.longDesc || prod.desc) ? (
              (prod.longDesc || prod.desc).split('\n\n').map((p, i) => (
                <p key={i} style={{ marginBottom: 14 }}>
                  {p.split('\n').map((line, j) => (j === 0 ? line : [<br key={j} />, line]))}
                </p>
              ))
            ) : (
              <p style={{ color: 'var(--gray)' }}>এই প্রোডাক্টের বিস্তারিত বিবরণ শীঘ্রই যোগ করা হবে।</p>
            )}
          </div>
        </div>

        <div className="pp-detail-section" id="ppSecFeatures" ref={(el) => { sectionRefs.current.ppSecFeatures = el; }}>
          <div className="pp-section-title">⭐ প্রধান <span>ফিচারস</span></div>
          <div className="pp-features-list">
            {features.length ? features.map((f, i) => <FeatureItem key={i} text={f} />) : (
              <div style={{ color: 'var(--gray)', fontSize: 13 }}>এই প্রোডাক্টের features এখনো যোগ হয়নি।</div>
            )}
          </div>
        </div>

        <div className="pp-detail-section" id="ppSecSpecs" ref={(el) => { sectionRefs.current.ppSecSpecs = el; }}>
          <div className="pp-section-title">🔧 কারিগরি <span>স্পেসিফিকেশন</span></div>
          <div style={{ overflowX: 'auto' }}>
            <table className="pp-tech-table">
              <thead><tr><th>বিবরণ</th><th>তথ্য</th></tr></thead>
              <tbody>
                {techRows.length === 0 && !pkg ? (
                  <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--gray)', padding: 16 }}>স্পেসিফিকেশন শীঘ্রই যোগ করা হবে।</td></tr>
                ) : (
                  <>
                    {techRows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}
                    {pkg && (
                      <tr>
                        <td style={{ verticalAlign: 'top', fontWeight: 600 }}>Packaging Content</td>
                        <td style={{ verticalAlign: 'top' }}>
                          {pkg.split('\n').filter((l) => l.trim()).map((l, i) => (i === 0 ? l.trim() : [<br key={i} />, l.trim()]))}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pp-detail-section" id="ppSecFaq" ref={(el) => { sectionRefs.current.ppSecFaq = el; }}>
          <div className="pp-section-title">❓ কমন <span>প্রশ্নোত্তর (FAQ)</span></div>
          {faqs.length ? faqs.map((f, i) => (
            <div className={'pp-faq-item' + (openFaqIdx === i ? ' open' : '')} key={i}>
              <div className="pp-faq-q" onClick={() => toggleFaq(i)}>
                <span>{f.q}</span><span className="faq-icon">▼</span>
              </div>
              <div className="pp-faq-a">{f.a}</div>
            </div>
          )) : (
            <div style={{ color: 'var(--gray)', fontSize: 13 }}>কোনো FAQ নেই।</div>
          )}
        </div>

        <div className="pp-detail-section" id="ppSecReviews" style={{ paddingBottom: 0, padding: 0, border: 'none', margin: 0, minHeight: 0 }} ref={(el) => { sectionRefs.current.ppSecReviews = el; }}>
          <div className="pp-reviews-summary" style={{ marginBottom: 0 }}>
            <div>
              <div className="pp-rev-big-num">{rating.toFixed(1)}</div>
              <div className="pp-rev-stars">★★★★½</div>
              <div className="pp-rev-count">বেশিরভাগ কাস্টমার সন্তুষ্ট</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[[5, 65], [4, 22], [3, 8], [2, 3], [1, 2]].map(([star, pct]) => (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 20, textAlign: 'right' }}>{star}★</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: '#F59E0B', borderRadius: 3 }} />
                  </div>
                  <span style={{ color: 'var(--gray)' }}>{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="related-sec">
          <div className="related-title">একই ক্যাটাগরির <span>আরও পণ্য</span></div>
          <div className="related-grid" ref={relatedGridRef}>
            {related.map((p) => <ProductCard key={p.id} prod={p} isFirst={false} />)}
          </div>
        </div>
      )}

      <WarrantyModal isOpen={warrantyOpen} onClose={() => setWarrantyOpen(false)} warrantyText={prod.warranty} />

      <div className={'pp-sticky-bar' + (stickyShown ? ' show' : '')}>
        <div className="pp-sticky-inner">
          <div className="pp-sticky-name">
            {(() => {
              const maxLen = isMobileWidth ? 25 : 45;
              return prod.name.length > maxLen ? prod.name.slice(0, maxLen) + '...' : prod.name;
            })()}
          </div>
          <div className="pp-sticky-price">
            ৳{(prod.price * qty).toLocaleString()}
            {qty > 1 && <span className="pp-sticky-qty-badge">×{qty}</span>}
          </div>
          {sold ? (
            <button className="pp-btn pp-btn-order" style={{ width: 'auto', flexShrink: 0, background: '#F59E0B' }} onClick={notifyStock}>
              🔔 জানান
            </button>
          ) : (
            <>
              <button className="pp-btn pp-btn-order" style={{ width: 'auto', flexShrink: 0 }} onClick={orderNow}>⚡ অর্ডার করুন</button>
              <button className="pp-btn pp-btn-cart pp-sticky-cart-btn" style={{ width: 'auto', flexShrink: 0 }} onClick={addCartFromPP}>🛒 কার্ট</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
