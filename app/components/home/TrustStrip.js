'use client';

import { useEffect, useRef } from 'react';

// Converted from 32-javascript-all.js — Section C: "TRUST STRIP — scroll reveal with stagger"
// (legacy lines ~7822-7844). .t-item defaults to opacity:0 in globals.css and only
// becomes visible once '.vc-visible' is added — this effect replicates that exactly.

export default function TrustStrip() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revealItems = () => {
      const items = wrapRef.current
        ? wrapRef.current.querySelectorAll('.t-item')
        : [];
      items.forEach((el, i) => {
        setTimeout(() => el.classList.add('vc-visible'), i * 80);
      });
    };

    if (!prefersReduced && typeof window !== 'undefined' && window.IntersectionObserver) {
      const trustObs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            revealItems();
            trustObs.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      const tw = wrapRef.current && wrapRef.current.querySelector('.trust-strip');
      if (tw) trustObs.observe(tw);
      return () => trustObs.disconnect();
    }

    // Reduced motion বা পুরনো browser — সাথে সাথে দেখাও
    revealItems();
  }, []);

  return (
    <div className="trust-wrap" ref={wrapRef}>
      <div className="trust-strip">
        <div className="t-item">
          <div className="t-icon">🚚</div>
          <div>
            <div className="t-label">দ্রুত ডেলিভারি</div>
            <div className="t-sub">ঢাকা ১-৩ দিন</div>
          </div>
        </div>
        <div className="t-item">
          <div className="t-icon">🛡️</div>
          <div>
            <div className="t-label">ওয়ারেন্টি</div>
            <div className="t-sub">সকল প্রোডাক্টে</div>
          </div>
        </div>
        <div className="t-item">
          <div className="t-icon">✅</div>
          <div>
            <div className="t-label">অথেনটিক</div>
            <div className="t-sub">১০০% নিশ্চিত</div>
          </div>
        </div>
        <div className="t-item">
          <div className="t-icon">💬</div>
          <div>
            <div className="t-label">সাপোর্ট</div>
            <div className="t-sub" id="trustWaNum">
              WhatsApp: 01816-365504
            </div>
          </div>
        </div>
        <div className="t-item">
          <div className="t-icon">🔄</div>
          <div>
            <div className="t-label">রিটার্ন পলিসি</div>
            <div className="t-sub">৭ দিনের মধ্যে</div>
          </div>
        </div>
      </div>
    </div>
  );
    }
