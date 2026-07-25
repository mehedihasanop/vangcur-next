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
import { getWishlist, WISHLIST_EVENT } from '@/lib/productData';

// পরের components তৈরি হলে এখানে import যোগ হবে:
// import ProductDetail from './components/product/ProductDetail';
// import CartDrawer from './components/cart/CartDrawer';
// import LoginModal from './components/auth/LoginModal';
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

  // Legacy: updateWishDot() (32-javascript-all.js ~1230-1234) — reads getWishlist().length
  // on mount and whenever anything (ProductCard, SRPProductCard, this drawer) fires
  // WISHLIST_EVENT via saveWishlist().
  useEffect(() => {
    setWishCount(getWishlist().length);
    const handler = (e) => setWishCount((e.detail?.wishlist ?? getWishlist()).length);
    window.addEventListener(WISHLIST_EVENT, handler);
    return () => window.removeEventListener(WISHLIST_EVENT, handler);
  }, []);

  return (
    <>
      <div className="toast" id="toast"></div>
      <Navbar wishCount={wishCount} onWishClick={() => setIsWishlistOpen(true)} />
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
      {/* বাকি overlays এখানে আসবে */}
    </>
  );
}
