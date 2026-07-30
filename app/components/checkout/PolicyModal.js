'use client';

import { useEffect } from 'react';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';

// Converted from 32-javascript-all.js — 30-policy-modal.html (নীতিমালা ও শর্তাবলী)।
// Legacy: closePolicyModal() / policyAgreeAndConfirm() — reached from the checkout
// terms-row's "নীতিমালা ও শর্তাবলী" link (app/checkout/page.js, previously a TODO
// comment — now wired to open this component with real props instead of an event,
// since this modal only ever appears on /checkout, same reasoning as
// PreConfirmLoginModal.js). policyAgreeAndConfirm() ports the legacy behavior of
// setting terms-checked + closing + immediately continuing the confirm flow, done
// in the parent (see app/checkout/page.js's policyAgreeAndConfirm).
// Markup + full policy copy source: 30-policy-modal.html (verbatim content, not a
// placeholder — the owner supplied the actual file for this one).
//
// Note: .policy-modal-overlay/.policy-modal-card/etc. already exist in globals.css
// (verified via grep) with no opacity:0 / vc-visible reveal-gating — visibility is
// driven entirely by the .show class, same as legacy.

export default function PolicyModal({ open, onClose, onAgreeAndConfirm }) {
  useEffect(() => {
    if (open) lockBody(); else unlockBody();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeydown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={`policy-modal-overlay${open ? ' show' : ''}`}
      id="policyModalOverlay"
      onClick={handleBackdropClick}
    >
      <div className="policy-modal-card">
        <div className="policy-modal-head">
          <h3>📋 নীতিমালা ও শর্তাবলী</h3>
          <button className="policy-modal-close" onClick={onClose}>✕ বন্ধ করুন</button>
        </div>
        <div className="policy-modal-body">

          <div className="policy-section">
            <h3>📦 ১. অর্ডার সংক্রান্ত</h3>
            <ul>
              <li>অর্ডার সম্পন্ন করার আগে অনুগ্রহ করে নিশ্চিত করুন যে আপনার দেওয়া নাম, মোবাইল নম্বর, ডেলিভারি ঠিকানা, bKash ট্রানজেকশন আইডি বা বিকাশের শেষ ৪ ডিজিট সহ সকল তথ্য সঠিক।</li>
              <li>যেকোনো তথ্য ভুল দিলে <strong>Vangcur আপনার অর্ডারটি বাতিল করার সম্পূর্ণ অধিকার রাখে।</strong></li>
              <li>অর্ডার কনফার্ম হওয়ার ২৪ ঘণ্টার মধ্যে ডেলিভারি প্রক্রিয়া শুরু হবে।</li>
              <li>২৪–৪৮ ঘণ্টার মধ্যে কুরিয়ার সার্ভিস থেকে আপনার দেওয়া নম্বরে পার্সেলের ট্র্যাকিং লিংক পাঠানো হবে।</li>
            </ul>
          </div>

          <div className="policy-section">
            <h3>🚚 ২. ডেলিভারি সংক্রান্ত</h3>
            <p>Vangcur <strong>ক্লোজড বক্স ডেলিভারি</strong> পদ্ধতিতে প্রোডাক্ট পাঠায়। তাই —</p>
            <ul>
              <li>ডেলিভারিম্যানকে আগে <strong>অবশিষ্ট টাকা পরিশোধ করুন</strong>, তারপর পার্সেল বুঝে নিন।</li>
              <li>প্রোডাক্ট হাতে পাওয়ার পর পছন্দ না হলে ফেরত দেওয়ার <strong>কোনো সুযোগ নেই।</strong> অর্ডার করার আগেই প্রোডাক্টের বিবরণ ও ছবি ভালোভাবে দেখে নিন।</li>
            </ul>
          </div>

          <div className="policy-section">
            <h3>🎥 ৩. আনবক্সিং ভিডিও সংক্রান্ত (অবশ্যই করণীয়)</h3>
            <p>প্রোডাক্ট পাওয়ার পর খোলার সময় <strong>একটানা আনবক্সিং ভিডিও</strong> ধারণ করুন —</p>
            <ul>
              <li>পার্সেলের বাইরে থেকে শুরু করে প্রোডাক্টের ভেতরের সব পার্টস পর্যন্ত একটানা রেকর্ড করতে হবে।</li>
              <li>ভিডিওতে <strong>কোনো কাট বা পজ</strong> দেওয়া যাবে না।</li>
              <li>ইলেকট্রনিক প্রোডাক্টের ক্ষেত্রে ভিডিওতে প্রোডাক্টটি <strong>চালু করে দেখাতে হবে।</strong></li>
            </ul>
            <div className="policy-warn">⚠️ আনবক্সিং ভিডিও ছাড়া কোনো ওয়ারেন্টি ক্লেইম করা সম্ভব নয়।</div>
            <ul>
              <li>প্রোডাক্ট ভাঙা, ত্রুটিপূর্ণ, মিসিং বা ভুল পেলে এই আনবক্সিং ভিডিও দিয়ে ওয়ারেন্টি ক্লেইম করতে পারবেন।</li>
              <li>প্রোডাক্টে কোনো প্রকার সমস্যা হলে সম্পূর্ণ দায়ভার Vangcur কর্তৃপক্ষ বহন করবে এবং যত দ্রুত সম্ভব সমাধান দেওয়ার চেষ্টা করা হবে।</li>
            </ul>
          </div>

          <div className="policy-section">
            <h3>🛡️ ৪. ওয়ারেন্টি সংক্রান্ত</h3>
            <ul>
              <li>সাধারণ প্রোডাক্টে <strong>১ সপ্তাহের</strong> ওয়ারেন্টি থাকবে। নির্বাচিত প্রোডাক্টে ৬ মাস / ১ বছর / ২ বছর পর্যন্ত ওয়ারেন্টি থাকবে।</li>
              <li>ওয়ারেন্টির মেয়াদ শুরু হয় <strong>অর্ডার করার তারিখ থেকে।</strong></li>
              <li>ওয়ারেন্টি থাকাকালীন সময়ের মধ্যে প্রোডাক্টে সমস্যা হলে এবং ওয়ারেন্টি ক্লেইম করা হলে, Vangcur কর্তৃপক্ষ নিজ খরচে সেটি রিপ্লেস করে নতুন একটি প্রোডাক্ট আপনার ঠিকানায় পৌঁছে দেবে। 🤍</li>
              <li>ওয়ারেন্টি থাকাকালীন সময়ে অবশ্যই প্রোডাক্টের বক্স ও ইনভয়েস পেপার সযত্নে সংরক্ষণ করুন।</li>
            </ul>
            <p><strong>ওয়ারেন্টি ক্লেইম করতে যা লাগবে —</strong></p>
            <ul>
              <li>মূল প্রোডাক্টের বক্স <em>(ছেঁড়া বা ফাটা বক্স বা বক্সের গায়ে টেপ লাগানো থাকলে গ্রহণযোগ্য হবে না।)</em></li>
              <li>ইনভয়েস পেপার <em>(প্রোডাক্টের সাথে দেওয়া)</em></li>
              <li>আনবক্সিং ভিডিও</li>
            </ul>
          </div>

          <div className="policy-section">
            <h3>🔄 ৫. রিটার্ন ও রিফান্ড সংক্রান্ত</h3>
            <ul>
              <li><strong>পছন্দ না হওয়া বা মন পরিবর্তনের কারণে কোনো রিটার্ন নেই:</strong> Vangcur (ভাঙচুর) থেকে কেনাকাটার পর গ্রাহকের ব্যক্তিগত পছন্দ-অপছন্দ, মন পরিবর্তন (Change of mind) কিংবা প্রোডাক্টে কোনো জেনুইন সমস্যা ব্যতীত অন্য কোনো ইচ্ছাকৃত বা অযৌক্তিক কারণে প্রোডাক্ট রিটার্ন, এক্সচেঞ্জ কিংবা রিফান্ড করার কোনো সুযোগ নেই। কাস্টমারদের অনুরোধ করা হচ্ছে অর্ডার করার পূর্বেই প্রোডাক্টের বিবরণ, ছবি এবং কার্যকারিতা ওয়েবসাইট থেকে ভালোভাবে দেখে নেওয়ার জন্য।</li>
              <li><strong>রিপ্লেসমেন্ট সুবিধা (শুধুমাত্র জেনুইন সমস্যা বা ত্রুটির ক্ষেত্রে):</strong> ডেলিভারি পাওয়ার পর যদি প্রোডাক্টে কোনো আসল কারিগরি বা ম্যানুফ্যাকচারিং ত্রুটি (Manufacturing Defect), ট্রানজিট ড্যামেজ (ভাঙা বা নষ্ট প্রোডাক্ট) অথবা ভুল প্রোডাক্ট ডেলিভারি পাওয়া যায়, তবেই কেবল আমরা সেটি সম্পূর্ণ আমাদের নিজ দায়িত্বে এবং সম্পূর্ণ ফ্রিতে পরিবর্তন (Replacement) করে নতুন প্রোডাক্ট আপনার ঠিকানায় পাঠিয়ে দেব।</li>
              <li>রিপ্লেসমেন্ট ক্লেইম করার জন্য ৩ নম্বর পয়েন্ট অনুযায়ী একটানা ও আন-এডিটেড আনবক্সিং ভিডিও প্রমাণ হিসেবে দেওয়া বাধ্যতামূলক।</li>
            </ul>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--gray)', textAlign: 'center', paddingTop: 16, borderTop: '1px solid var(--border)', fontStyle: 'italic' }}>
            ⚠️ ভাঙচুর কর্তৃপক্ষ যেকোনো সময় এই নীতিমালা পরিবর্তন অথবা আপডেট করার অধিকার রাখে।
          </div>

          <button
            onClick={onAgreeAndConfirm}
            style={{ width: '100%', height: 50, background: '#111', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            ✅ ঠিক আছে, অর্ডার কনফার্ম করুন
          </button>

        </div>
      </div>
    </div>
  );
  }
