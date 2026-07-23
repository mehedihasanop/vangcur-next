'use client';
import dynamic from 'next/dynamic';

// Layout
import Navbar from './components/layout/Navbar';

// Home sections — একটা একটা করে তৈরি হবে, কিন্তু import এখনই দেওয়া আছে
const HeroSlider = dynamic(() => import('./components/home/HeroSlider'), { ssr: false });
const TrustStrip = dynamic(() => import('./components/home/TrustStrip'), { ssr: false });
const Categories = dynamic(() => import('./components/home/Categories'), { ssr: false });
const ProductGrid = dynamic(() => import('./components/home/ProductGrid'), { ssr: false });
const FAQ = dynamic(() => import('./components/home/FAQ'), { ssr: false });
const About = dynamic(() => import('./components/home/About'), { ssr: false });
const CustomerGallery = dynamic(() => import('./components/home/CustomerGallery'), { ssr: false });
const Footer = dynamic(() => import('./components/layout/Footer'), { ssr: false });
const BackToTop = dynamic(() => import('./components/layout/BackToTop'), { ssr: false });
const FloatButtons = dynamic(() => import('./components/layout/FloatButtons'), { ssr: false });

// Overlays
const SearchPage = dynamic(() => import('./components/search/SearchPage'), { ssr: false });
const WishlistDrawer = dynamic(() => import('./components/cart/WishlistDrawer'), { ssr: false });
const ProductDetail = dynamic(() => import('./components/product/ProductDetail'), { ssr: false });
const CartDrawer = dynamic(() => import('./components/cart/CartDrawer'), { ssr: false });
const LoginModal = dynamic(() => import('./components/auth/LoginModal'), { ssr: false });
const AccountPage = dynamic(() => import('./components/auth/AccountPage'), { ssr: false });

// Order
const OrderForm = dynamic(() => import('./components/order/OrderForm'), { ssr: false });
const PreConfirmLogin = dynamic(() => import('./components/order/PreConfirmLogin'), { ssr: false });
const WaitingPage = dynamic(() => import('./components/order/WaitingPage'), { ssr: false });
const ConfirmPopup = dynamic(() => import('./components/order/ConfirmPopup'), { ssr: false });
const PostOrderInfo = dynamic(() => import('./components/order/PostOrderInfo'), { ssr: false });
const OrderTracking = dynamic(() => import('./components/order/OrderTracking'), { ssr: false });

// Modals
const PolicyModal = dynamic(() => import('./components/modals/PolicyModal'), { ssr: false });
const WarrantyModal = dynamic(() => import('./components/modals/WarrantyModal'), { ssr: false });
const OfferPopup = dynamic(() => import('./components/modals/OfferPopup'), { ssr: false });
const StockNotifyModal = dynamic(() => import('./components/modals/StockNotifyModal'), { ssr: false });
const MembershipModal = dynamic(() => import('./components/modals/MembershipModal'), { ssr: false });
const RecoveryToast = dynamic(() => import('./components/modals/RecoveryToast'), { ssr: false });
const BackInStockToast = dynamic(() => import('./components/modals/BackInStockToast'), { ssr: false });

export default function ClientHome() {
  return (
    <>
      <div className="toast" id="toast"></div>

      {/* Layout */}
      <Navbar />

      {/* Home */}
      <HeroSlider />
      <TrustStrip />
      <Categories />
      <ProductGrid />
      <FAQ />
      <About />
      <CustomerGallery />
      <Footer />
      <BackToTop />
      <FloatButtons />

      {/* Overlays */}
      <SearchPage />
      <WishlistDrawer />
      <ProductDetail />
      <CartDrawer />
      <LoginModal />
      <AccountPage />

      {/* Order */}
      <OrderForm />
      <PreConfirmLogin />
      <WaitingPage />
      <ConfirmPopup />
      <PostOrderInfo />
      <OrderTracking />

      {/* Modals */}
      <PolicyModal />
      <WarrantyModal />
      <OfferPopup />
      <StockNotifyModal />
      <MembershipModal />
      <RecoveryToast />
      <BackInStockToast />
    </>
  );
        }
