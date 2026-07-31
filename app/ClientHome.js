'use client';

import { useEffect, useState } from 'react';
import Navbar from './components/layout/Navbar';
import HeroSlider from './components/home/HeroSlider';
import TrustStrip from './components/home/TrustStrip';
import Categories from './components/home/Categories';
import CatBar from './components/home/CatBar';

import ProductGrid from './components/home/ProductGrid';
import FAQ from './components/home/FAQ';
import About from './components/home/About';
import CustomerGallery from './components/home/CustomerGallery';
import Footer from './components/layout/Footer';
import WaitingPage from './components/order/WaitingPage';
import BgConfirmPopup from './components/order/BgConfirmPopup';
import PostOrderInfo from './components/order/PostOrderInfo';
import BackToTop from './components/layout/BackToTop';
import FloatButtons from './components/layout/FloatButtons';
import InfoOverlay from './components/modals/InfoOverlay';
import OrderTracking from './components/order/OrderTracking';
import { getCart, cartCount, CART_EVENT } from '@/lib/cartData';
import { getWishlist, WISHLIST_EVENT } from '@/lib/productData';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT } from '@/lib/uiEvents';

// পরের components তৈরি হলে এখানে import যোগ হবে:
// import SearchPage from './components/search/SearchPage';
// import ProductDetail from './components/product/ProductDetail';
// import LoginModal from './components/auth/LoginModal';
// import AccountPage from './components/auth/AccountPage';
// import OrderForm from './components/order/OrderForm';
// import PreConfirmLogin from './components/order/PreConfirmLogin';
// import WarrantyModal from './components/modals/WarrantyModal';
// import OfferPopup from './components/modals/OfferPopup';
// import StockNotifyModal from './components/modals/StockNotifyModal';
// import MembershipModal from './components/modals/MembershipModal';
// import RecoveryToast from './components/modals/RecoveryToast';
// import BackInStockToast from './components/modals/BackInStockToast';

export default function ClientHome() {
  // Bug fix (2026-07-31), updated: CartSidebar.js/WishlistDrawer.js are no longer
  // mounted here — see app/components/GlobalOverlays.js (mounted in the root layout
  // instead) for why: /product/[slug] and /srp need them too, not just this page.
  // Navbar here still needs live cartCount/wishCount badges (it's not rendered on
  // those other routes, so this tracking only needs to exist here), but "open the
  // drawer" is now a cross-tree event instead of local state.
  const [cartQty, setCartQty] = useState(0);
  const [wishQty, setWishQty] = useState(0);

  useEffect(() => {
    setCartQty(cartCount(getCart()));
    const onCartChange = (e) => setCartQty(cartCount(e.detail?.cart ?? getCart()));
    window.addEventListener(CART_EVENT, onCartChange);
    return () => window.removeEventListener(CART_EVENT, onCartChange);
  }, []);

  useEffect(() => {
    setWishQty(getWishlist().length);
    const onWishChange = (e) => setWishQty((e.detail?.wishlist ?? getWishlist()).length);
    window.addEventListener(WISHLIST_EVENT, onWishChange);
    return () => window.removeEventListener(WISHLIST_EVENT, onWishChange);
  }, []);

  return (
    <>
      <Navbar
        cartCount={cartQty}
        onCartClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
        wishCount={wishQty}
        onWishClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
        onTrackClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
      />
      {/* Bug fix (2026-07-31): onTrackClick was never passed, so Navbar's own
          ট্র্যাক-অর্ডার icon button did nothing (Footer.js's separate "ট্র্যাক অর্ডার"
          link already dispatched OPEN_TRACK_ORDER_EVENT correctly and still does —
          only the Navbar icon was dead). Now both trigger the same event.
          NOT fixed here — bigger than a one-line wiring fix, flagged in
          VANGCUR_MASTER_PROMPT.md as the top follow-up instead: onLoginClick,
          onAccountClick, and currentUser are still never passed to Navbar on the
          homepage, because LoginModal.js/AccountPage.js aren't mounted in
          ClientHome.js at all yet (only reachable today from /checkout). So on the
          homepage right now: "লগইন করুন" does nothing, and the navbar can never show
          a signed-in user's name/avatar even if they're logged in (e.g. via
          /checkout) — it always renders the logged-out button. */}
      <HeroSlider />
      <TrustStrip />
      <CatBar />
      <Categories />
      <ProductGrid />
      <FAQ />
      <About />
      <CustomerGallery />
      <Footer />
      <WaitingPage />
      <BgConfirmPopup />
      <PostOrderInfo />
      {/* Bug fix (2026-07-31): this was commented out claiming "ফাইল এখনো তৈরি হয়নি"
          (file doesn't exist yet) — stale, the file has existed and been complete
          this whole time (see its own header comment). Nothing dispatches
          SHOW_POST_ORDER_INFO_EVENT yet (that's InvoiceModal.js's job, not built),
          so this won't visibly do anything until that's built — but it's correct to
          have it mounted and ready now rather than leave a working file disconnected. */}
      <BackToTop />
      <FloatButtons />
      <InfoOverlay />
      <OrderTracking />
      {/* Overlays এখানে আসবে */}
    </>
  );
}
