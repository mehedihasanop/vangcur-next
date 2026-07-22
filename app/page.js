'use client';
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('./components/layout/Navbar'), { ssr: false });

export default function HomePage() {
  return (
    <>
      <div className="toast" id="toast"></div>
      <Navbar />
    </>
  );
}
