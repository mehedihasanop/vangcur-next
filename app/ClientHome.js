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
import BackToTop from './components/layout/BackToTop';
import FloatButtons from './components/layout/FloatButtons';
import WishlistDrawer from './components/cart/WishlistDrawer';
import CartSidebar from './components/cart/CartSidebar';
import LoginModal from './components/auth/LoginModal';
import { getWishlist, WISHLIST_EVENT } from '@/lib/productData';
import { getCart, cartCount as sumCartCount, CART_EVENT } from '@/lib/cartData';
import { getCurrentUser, AUTH_EVENT } from '@/lib/authData';
import { OPEN_ACCOUNT_EVENT } from '@/lib/uiEvents';

// পরের components তৈরি হলে এখানে import যোগ হবে:
// import ProductDetail from './components/product/ProductDetail';
// import AccountPage from './components/auth/AccountPage';
// import OrderForm from './components/order/OrderForm';
// import PreConfirmLogin from './components/order/PreConfirmLogin';
// import WaitingPage from './components/order/WaitingPage';
// import ConfirmPopup from './components/order/ConfirmPopup';
// import PostOrderInfo from './components/order/PostOrderInfo';
// import OrderTracking from './components/order/OrderTracking';
// import PolicyModal from './components/modals/PolicyModal';
// import WarrantyModal from './components/modals/WarrantyModal';
// import OfferPopup from './components/modals/OfferPopup';
// import StockNotifyModal from './components/modals/StockNotifyModal';
// import MembershipModal from './components/modals/MembershipModal';
// import RecoveryToast from './components/modals/RecoveryToast';
// import BackInStockToast from './components/modals/BackInStockToast';

export default function ClientHome() {
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [wishCount, setWishCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Legacy: updateNavAuth() reacted to `currentUser` changing (login/register/OAuth/logout).
  // Read once on mount (hydration-safe since it's inside an effect) + stay in sync via AUTH_EVENT.
  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const handler = (e) => setCurrentUser(e.detail?.user ?? getCurrentUser());
    window.addEventListener(AUTH_EVENT, handler);
    return () => window.removeEventListener(AUTH_EVENT, handler);
  }, []);

  // Legacy: updateWishDot() (32-javascript-all.js ~1230-1234) — reads getWishlist().length
  // on mount and whenever anything (ProductCard, SRPProductCard, this drawer) fires
  // WISHLIST_EVENT via saveWishlist().
  useEffect(() => {
    setWishCount(getWishlist().length);
    const handler = (e) => setWishCount((e.detail?.wishlist ?? getWishlist()).length);
    window.addEventListener(WISHLIST_EVENT, handler);
    return () => window.removeEventListener(WISHLIST_EVENT, handler);
  }, []);

  // Legacy: updateCartUI()'s #cartDot half (32-javascript-all.js ~1113-1116)
  useEffect(() => {
    setCartItemCount(sumCartCount(getCart()));
    const handler = (e) => setCartItemCount(sumCartCount(e.detail?.cart ?? getCart()));
    window.addEventListener(CART_EVENT, handler);
    return () => window.removeEventListener(CART_EVENT, handler);
  }, []);

  return (
    <>
      <div className="toast" id="toast"></div>
      <Navbar
        wishCount={wishCount} onWishClick={() => setIsWishlistOpen(true)}
        cartCount={cartItemCount} onCartClick={() => setIsCartOpen(true)}
        currentUser={currentUser}
        onLoginClick={() => setIsLoginOpen(true)}
        onAccountClick={() => window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT))}
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
      <BackToTop />
      <FloatButtons />
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      {/* বাকি overlays এখানে আসবে */}
    </>
  );
}
