'use client';

import { useEffect } from 'react';

// Direct port of 37-pwa-service-worker.html — registers /sw.js (public/sw.js,
// see that file's own header note) after the page finishes loading, same as
// the legacy inline <script> did. No markup — this is registration logic only.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('Vangcur SW registered'))
        .catch((err) => console.log('SW failed:', err));
    };
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }
  }, []);

  return null;
}
