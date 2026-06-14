// app/page.js — হোমপেজ (Server Component + ISR)
import { getProducts, getStoreSettings, getCustomerReviews } from '../lib/data';
import Navbar from './components/Navbar';
import HomeClient from './components/HomeClient';
import TrustStrip from './components/TrustStrip';
import HeroDuoSlider from './components/HeroDuoSlider';
import Categories from './components/Categories';
import FAQ from './components/FAQ';
import About from './components/About';
import CustomerGallery from './components/CustomerGallery';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import FloatButtons from './components/FloatButtons';

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, settings, reviews] = await Promise.all([
    getProducts(),
    getStoreSettings(),
    getCustomerReviews(30),
  ]);

  const heroCards = settings['vc_cath_cards'] || null;
  const categories = settings['vc_categories'] || null;
  const faqs = settings['vc_faqs'] || null;
  const aboutDesc = settings['vc_about_desc'] || null;
  const contact = settings['vc_contact'] || {};
  const waNumber = contact.phone || '01816-365504';

  return (
    <>
      <Navbar />
      <HeroDuoSlider initialCards={heroCards} />
      <TrustStrip waNumber={waNumber} />
      <Categories initialCategories={categories} />
      {/* HomeClient handles ProductGrid + ProductModal — gets all products */}
      <HomeClient initialProducts={products} />
      <FAQ faqs={faqs} />
      <About description={aboutDesc} />
      <CustomerGallery initialReviews={reviews} />
      <Footer settings={settings} />
      <BackToTop />
      <FloatButtons />
    </>
  );
}
