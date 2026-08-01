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
import LoginModal from './components/auth/LoginModal';
import AccountPage from './components/auth/AccountPage';
import { getCart, cartCount, CART_EVENT } from '@/lib/cartData';
import { getWishlist, WISHLIST_EVENT } from '@/lib/productData';
import { AUTH_EVENT, getCurrentUser } from '@/lib/authData';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT } from '@/lib/uiEvents';

// পরের components তৈরি হলে এখানে import যোগ হবে:
// import SearchPage from './components/search/SearchPage';
// import ProductDetail from './components/product/ProductDetail';
// import OrderForm from './components/order/OrderForm';
// import PreConfirmLogin from './components/order/PreConfirmLogin';
// import WarrantyModal from './components/modals/WarrantyModal';
// import OfferPopup from './components/modals/OfferPopup';
// import MembershipModal from './components/modals/MembershipModal';
// RecoveryToast.js is built (2026-07-31) — mounted in GlobalOverlays.js instead,
// not here (needs to run on every route, not just the homepage).

export default function ClientHome() {
  // Bug fix (2026-07-31), updated: CartSidebar.js/WishlistDrawer.js are no longer
  // mounted here — see app/components/GlobalOverlays.js (mounted in the root layout
  // instead) for why: /product/[slug] and /srp need them too, not just this page.
  // Navbar here still needs live cartCount/wishCount badges (it's not rendered on
  // those other routes, so this tracking only needs to exist here), but "open the
  // drawer" is now a cross-tree event instead of local state.
  const [cartQty, setCartQty] = useState(0);
  const [wishQty, setWishQty] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Bug fix (2026-07-31, resolved): currentUser লাইভ ট্র্যাক করা — lib/authData.js-এর
  // AUTH_EVENT প্যাটার্ন, checkout/page.js যেভাবে ইমপারেটিভভাবে getCurrentUser() কল করে
  // তার বদলে এখানে reactive state দরকার যাতে Navbar লগইন/লগআউট হলেই re-render হয়।
  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const onAuthChange = (e) => setCurrentUser(e.detail?.user ?? getCurrentUser());
    window.addEventListener(AUTH_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_EVENT, onAuthChange);
  }, []);

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
        currentUser={currentUser}
        onLoginClick={() => setIsLoginOpen(true)}
        onAccountClick={() => setIsAccountOpen(true)}
      />
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
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <AccountPage
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentUser={currentUser}
        onAddAccount={() => setIsLoginOpen(true)}
      />
      {/* Overlays এখানে আসবে */}
    </>
  );
}
