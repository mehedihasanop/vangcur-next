'use client';

import { useEffect, useState } from 'react';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { OPEN_INFO_EVENT } from '@/lib/uiEvents';

// Converted from 32-javascript-all.js — 29-info-overlay.html + openInfo()'s INFO object.
// Content now filled from the owner's actual index.html (INFO.shipping/returns/privacy/terms,
// lines ~10256-10280) — verbatim, no invented text.

const TITLES = {
  shipping: 'Shipping Info',
  returns: 'Returns & Refunds',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
};

function ShippingContent() {
  return (
    <>
      <h3>ডেলিভারি চার্জ</h3>
      <p>ঢাকা সিটি কর্পোরেশন: ৯০ টাকা (Pathao Courier)</p>
      <p>সারা বাংলাদেশ: ১৩০ টাকা (Pathao Courier)</p>
      <h3>ডেলিভারি সময়</h3>
      <p>ঢাকার মধ্যে: ১-৩ কার্যদিবস | ঢাকার বাইরে: ২-৫ কার্যদিবস</p>
      <h3>ক্লোজড বক্স ডেলিভারি</h3>
      <p>সকল পার্সেল ক্লোজড বক্সে ডেলিভারি হবে। ডেলিভারির সময় আগে পেমেন্ট করতে হবে। সমস্যায় WhatsApp: 01816365504</p>
    </>
  );
}

function ReturnsContent() {
  return (
    <>
      <h3>১. পছন্দ না হওয়া বা মন পরিবর্তনের কারণে কোনো রিটার্ন নেই</h3>
      <p>Vangcur (ভাঙচুর) থেকে কেনাকাটার পর গ্রাহকের ব্যক্তিগত পছন্দ-অপছন্দ, মন পরিবর্তন (Change of mind) কিংবা প্রোডাক্টে কোনো জেনুইন সমস্যা ব্যতীত অন্য কোনো ইচ্ছাকৃত বা অযৌক্তিক কারণে প্রোডাক্ট রিটার্ন, এক্সচেঞ্জ কিংবা রিফান্ড করার কোনো সুযোগ নেই। কাস্টমারদের অনুরোধ করা হচ্ছে অর্ডার করার পূর্বেই প্রোডাক্টের বিবরণ, ছবি এবং কার্যকারিতা ওয়েবসাইট থেকে ভালোভাবে দেখে নেওয়ার জন্য।</p>

      <h3>২. রিপ্লেসমেন্ট সুবিধা (শুধুমাত্র জেনুইন সমস্যা বা ত্রুটির ক্ষেত্রে)</h3>
      <p>ডেলিভারি পাওয়ার পর যদি প্রোডাক্টে কোনো আসল কারিগরি বা ম্যানুফ্যাকচারিং ত্রুটি (Manufacturing Defect), ট্রানজিট ড্যামেজ (ভাঙা বা নষ্ট প্রোডাক্ট) অথবা ভুল প্রোডাক্ট ডেলিভারি পাওয়া যায়, তবেই কেবল আমরা সেটি সম্পূর্ণ নিজ দায়িত্বে এবং সম্পূর্ণ ফ্রিতে পরিবর্তন (Replacement) করে নতুন প্রোডাক্ট আপনার ঠিকানায় পাঠিয়ে দেব।</p>

      <h3>৩. রিপ্লেসমেন্ট ক্লেইম করার নিয়ম</h3>
      <p>Invoice Date থেকে <strong>৭ দিনের মধ্যে</strong> ত্রুটি (Fault) প্রমাণিত হলে রিপ্লেসমেন্ট বা এক্সচেঞ্জ রিকোয়েস্ট করতে পারবেন। প্রোডাক্টটি সুন্দরভাবে কার্টন বক্সে প্যাকেজিং করে কুরিয়ার করতে হবে। প্রোডাক্টের মূল বক্সের ওপর সরাসরি কোনো টেপ লাগানো যাবে না এবং প্রোডাক্টের সাথে থাকা অরিজিনাল এক্সেসরিজ ও বক্স অবশ্যই অক্ষত ও সযত্নে ফেরত পাঠাতে হবে।</p>

      <h3>৪. কোন কোন ক্ষেত্রে রিপ্লেসমেন্ট গ্রহণযোগ্য নয়?</h3>
      <ul>
        <li>❌ একটানা ও আন-এডিটেড আনবক্সিং ভিডিও প্রমাণ হিসেবে না থাকলে।</li>
        <li>❌ প্রোডাক্টে কোনো বাহ্যিক আঘাত (Physical Damage) বা ইউজার ড্যামেজ থাকলে।</li>
        <li>❌ মূল প্রোডাক্টের বক্স বা প্রয়োজনীয় এক্সেসরিজ হারিয়ে গেলে।</li>
        <li>❌ প্রোডাক্টটি ইতিমধ্যে ব্যবহার বা রিসেল করার অনুপযোগী করা হলে।</li>
      </ul>

      <h3>৫. ইস্যু ভেরিফিকেশন ও সময়সীমা</h3>
      <p>রিপ্লেসমেন্ট রিকোয়েস্ট পাওয়ার পর আমাদের কাস্টমার সাপোর্ট টিম ইস্যুটি যাচাই করবে। প্রোডাক্টটি আমাদের ঠিকানায় পৌঁছানোর পর সাধারণত ৫-১০ কার্যদিবসের মধ্যে সঠিক সমাধান বা নতুন প্রোডাক্ট রিপ্লেস করে দেওয়া হবে।</p>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <p>Vangcur আপনার ব্যক্তিগত তথ্যের নিরাপত্তাকে গুরুত্ব সহকারে বিবেচনা করে।</p>
      <h3>আমরা যেসব তথ্য সংগ্রহ করি</h3>
      <ul>
        <li>নাম</li>
        <li>ফোন নাম্বার</li>
        <li>ডেলিভারি ঠিকানা</li>
        <li>ইমেইল (Optional)</li>
        <li>Payment Related Information</li>
      </ul>
      <h3>তথ্য ব্যবহারের উদ্দেশ্য</h3>
      <ul>
        <li>অর্ডার প্রসেস করার জন্য</li>
        <li>ডেলিভারি সম্পন্ন করার জন্য</li>
        <li>Customer Support দেওয়ার জন্য</li>
        <li>Order Confirmation ও Updates পাঠানোর জন্য</li>
      </ul>
      <h3>তথ্য নিরাপত্তা</h3>
      <p>আপনার তথ্য কোনো Third Party-এর কাছে বিক্রি করা হয় না। শুধুমাত্র Courier ও প্রয়োজনীয় Service Provider-এর সাথে প্রয়োজন অনুযায়ী শেয়ার করা হতে পারে।</p>
      <h3>Payment Information</h3>
      <p>Vangcur সরাসরি কোনো Card বা Banking Password সংরক্ষণ করে না। Payment Gateway বা Mobile Banking Provider নিজস্ব নিরাপত্তা নীতিতে পরিচালিত হয়।</p>
      <h3>Cookies</h3>
      <p>Website Experience উন্নত করার জন্য Cookies ব্যবহার করা হতে পারে।</p>
      <h3>Policy Updates</h3>
      <p>যেকোনো সময় Privacy Policy পরিবর্তন বা আপডেট করার অধিকার Vangcur সংরক্ষণ করে।</p>
    </>
  );
}

// Real copy, ported from index.html's INFO.terms (lines ~10280).
function TermsContent() {
  return (
    <>
      <p>Vangcur - ভাঙচুর থেকে অর্ডার করার মাধ্যমে আপনি নিচের শর্তাবলীর সাথে সম্মতি প্রদান করছেন।</p>

      <h3>১. অর্ডার কনফার্মেশন</h3>
      <ul>
        <li>অর্ডার নিশ্চিত করতে ন্যূনতম <strong>২০০ টাকা এডভান্স পেমেন্ট</strong> বাধ্যতামূলক।</li>
        <li>সম্পূর্ণ COD ভিত্তিক অর্ডার গ্রহণ করা হয় না।</li>
        <li>Advance Payment করার পর উভয় পক্ষ অর্ডার সম্পন্ন করতে বাধ্য থাকবে।</li>
      </ul>

      <h3>২. ভুল তথ্য প্রদান</h3>
      <p>ভুল নাম, ফোন নম্বর, জেলা বা ঠিকানার কারণে ডেলিভারি সমস্যা বা অর্ডার বাতিল হলে Vangcur দায়ী থাকবে না। সঠিক ও সম্পূর্ণ তথ্য প্রদান করতে হবে।</p>

      <h3>৩. ডেলিভারি পলিসি</h3>
      <ul>
        <li>সকল পার্সেল <strong>Closed Box Delivery</strong> সিস্টেমে পাঠানো হয়।</li>
        <li>ডেলিভারির সময় আগে Payment Complete করে পার্সেল রিসিভ করতে হবে।</li>
        <li>Delivery Man-এর সামনে Product Open করে পছন্দ না হলে Return-এর সুযোগ নেই।</li>
      </ul>

      <h3>৪. আনবক্সিং ভিডিও বাধ্যতামূলক</h3>
      <ul>
        <li>Product হাতে পাওয়ার পর অবশ্যই <strong>Full Unboxing Video</strong> করতে হবে।</li>
        <li>ভিডিওতে কোনো Cut বা Pause গ্রহণযোগ্য নয়।</li>
        <li>ভিডিও ছাড়া Missing, Damaged, Wrong Product বা Warranty Claim গ্রহণ করা হবে না।</li>
      </ul>

      <h3>৫. Warranty ও Replacement</h3>
      <ul>
        <li>অধিকাংশ প্রোডাক্টে ন্যূনতম <strong>৭ দিনের Replacement Warranty</strong> প্রদান করা হয়।</li>
        <li>৬ মাস বা তার বেশি Warranty-র ক্ষেত্রে Product Box ও Warranty Papers সংরক্ষণ বাধ্যতামূলক।</li>
        <li>Physical Damage, Water Damage বা User Damage Warranty-র অন্তর্ভুক্ত নয়।</li>
      </ul>

      <h3>৬. রিটার্ন প্রসেস</h3>
      <ul>
        <li>Invoice Date থেকে ৭ দিনের মধ্যে Fault প্রমাণিত হলে Return Request করা যাবে।</li>
        <li>Product অবশ্যই Original Box, Accessories ও Proper Packaging সহ পাঠাতে হবে।</li>
      </ul>

      <h3>৭. প্রাইস ও স্টক</h3>
      <p>যেকোনো সময় Product Price, Stock ও Offer পরিবর্তন করার অধিকার Vangcur সংরক্ষণ করে। Limited Stock-এর ক্ষেত্রে আগে Confirm করা Order Priority পাবে।</p>

      <h3>৮. Fraud Prevention</h3>
      <p>Fake Order, Fraud Activity বা Suspicious Behaviour শনাক্ত হলে Vangcur যেকোনো Order Cancel করার অধিকার রাখে।</p>
    </>
  );
}

const CONTENT = {
  shipping: ShippingContent,
  returns: ReturnsContent,
  privacy: PrivacyContent,
  terms: TermsContent,
};

export default function InfoOverlay() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(null);

  const close = () => {
    setOpen(false);
    unlockBody();
  };

  useEffect(() => {
    const onOpen = (e) => {
      setType(e.detail?.type || null);
      setOpen(true);
      lockBody();
    };
    window.addEventListener(OPEN_INFO_EVENT, onOpen);

    const onKeydown = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKeydown);

    return () => {
      window.removeEventListener(OPEN_INFO_EVENT, onOpen);
      document.removeEventListener('keydown', onKeydown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Content = type ? CONTENT[type] : null;

  return (
    <div
      className={`info-overlay${open ? ' show' : ''}`}
      id="infoOverlay"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="info-box">
        <button className="info-close" onClick={close}>✕ বন্ধ করুন</button>
        <div id="infoContent">
          {type && <h2>{TITLES[type]}</h2>}
          {Content && <Content />}
        </div>
      </div>
    </div>
  );
}
