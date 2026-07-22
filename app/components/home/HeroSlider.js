'use client';
import Navbar from './components/layout/Navbar';
import HeroSlider from './components/home/HeroSlider';

export default function ClientHome() {
  return (
    <>
      <div className="toast" id="toast"></div>
      <Navbar />
      <HeroSlider />
    </>
  );
}
