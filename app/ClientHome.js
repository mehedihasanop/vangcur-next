'use client';

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
// import PostOrderInfo from './components/order/PostOrderInfo'; // ⚠️ ফাইল এখনো তৈরি হয়নি — build ভাঙছিল, সাময়িক কমেন্ট
import BackToTop from './components/layout/BackToTop';
import FloatButtons from './components/layout/FloatButtons';
import InfoOverlay from './components/modals/InfoOverlay';

// পরের components তৈরি হলে এখানে import যোগ হবে:
// import SearchPage from './components/search/SearchPage';
// import WishlistDrawer from './components/cart/WishlistDrawer';
// import ProductDetail from './components/product/ProductDetail';
// import CartDrawer from './components/cart/CartDrawer';
// import LoginModal from './components/auth/LoginModal';
// import AccountPage from './components/auth/AccountPage';
// import OrderForm from './components/order/OrderForm';
// import PreConfirmLogin from './components/order/PreConfirmLogin';
// import OrderTracking from './components/order/OrderTracking';
// import WarrantyModal from './components/modals/WarrantyModal';
// import OfferPopup from './components/modals/OfferPopup';
// import StockNotifyModal from './components/modals/StockNotifyModal';
// import MembershipModal from './components/modals/MembershipModal';
// import RecoveryToast from './components/modals/RecoveryToast';
// import BackInStockToast from './components/modals/BackInStockToast';

export default function ClientHome() {
  return (
    <>
      <div className="toast" id="toast"></div>
      <Navbar />
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
      {/* <PostOrderInfo /> — ⚠️ কম্পোনেন্ট এখনো তৈরি হয়নি, তৈরি হলে উপরের import ও এই লাইন আনকমেন্ট করুন */}
      <BackToTop />
      <FloatButtons />
      <InfoOverlay />
      {/* Overlays এখানে আসবে */}
    </>
  );
}
