'use client';

import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      className="back-to-top"
      id="backToTop"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title="উপরে যান"
    >
      <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="18" height="18">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
      <span>TOP</span>
    </button>
  );
}
