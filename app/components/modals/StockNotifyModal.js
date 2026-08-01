'use client';

// Converted from 32-javascript-all.js: openStockNotifyPopup(prodId, prodName)/
// closeStockNotifyPopup()/submitStockNotify() (lines ~1740-1795),
// 40-stock-notify-modal.html (id #stockNotifyModal, .sn-* classes — verified
// against globals.css, all present unchanged at line ~1571).
//
// Self-contained like MembershipModal.js/OfferPopup.js in GlobalOverlays.js: owns
// its own open/close state, listens for STOCK_NOTIFY_EVENT itself rather than
// GlobalOverlays holding isOpen — nothing else needs to read whether this modal is
// open. STOCK_NOTIFY_EVENT (lib/productData.js) is already dispatched with
// detail: { id, name } from three places — ProductCard.js, SRPProductCard.js, and
// ProductDetailClient.js's "স্টকে আসলে জানান" button — all previously firing into
// the void per lib/productData.js's own comment. Mounting this in GlobalOverlays.js
// (root layout tier) makes it reachable from all three at once, the same reasoning
// as everything else in that file.
//
// Submit side effects (Supabase insert, sheet webhook, localStorage write read back
// by AccountPage.js's subscribed-list section) live in lib/stockNotifyData.js so
// this component stays presentation-only.

import { useEffect, useState } from 'react';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import { getCurrentUser } from '@/lib/authData';
import { STOCK_NOTIFY_EVENT } from '@/lib/productData';
import { submitStockNotify } from '@/lib/stockNotifyData';

export default function StockNotifyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [prodId, setProdId] = useState(null);
  const [prodName, setProdName] = useState('প্রোডাক্ট');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onOpen = (e) => {
      const detail = e.detail || {};
      setProdId(detail.id ?? null);
      setProdName(detail.name || 'প্রোডাক্ট');
      setName('');
      setPhone('');
      setIsOpen(true);
    };
    window.addEventListener(STOCK_NOTIFY_EVENT, onOpen);
    return () => window.removeEventListener(STOCK_NOTIFY_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (isOpen) lockBody(); else unlockBody();
    return () => { if (isOpen) unlockBody(); };
  }, [isOpen]);

  if (!isOpen) return null;

  const close = () => setIsOpen(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const currentUser = getCurrentUser();
      const err = await submitStockNotify({
        prodId,
        prodName,
        name,
        phone,
        userId: currentUser?.id || null,
      });
      if (err) {
        showToast('❌ ' + err);
        return;
      }
      close();
      showToast('✅ স্টকে আসলে আপনাকে জানানো হবে!');
    } catch (e) {
      showToast('❌ সাবমিট করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="stockNotifyModal"
      className="show"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="sn-box">
        <div className="sn-icon">🔔</div>
        <div className="sn-title">স্টকে আসলে জানাবো</div>
        <div className="sn-sub">
          প্রোডাক্টটি স্টকে আসলে আমরা আপনাকে সরাসরি জানাবো।<br />
          <strong id="snProdNameLabel" style={{ color: '#1A1A1A' }}>{prodName}</strong>
        </div>
        <div className="fg2" style={{ marginBottom: 10 }}>
          <input
            className="sn-input"
            id="snName"
            placeholder="আপনার নাম"
            style={{ marginBottom: 8 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="sn-input"
            id="snPhone"
            placeholder="মোবাইল নম্বর (01XXXXXXXXX)"
            maxLength={11}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <div className="sn-btns">
          <button className="sn-btn-cancel" onClick={close}>বাতিল</button>
          <button className="sn-btn-submit" id="snSubmitBtn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'সাবমিট হচ্ছে...' : 'জমা দিন'}
          </button>
        </div>
      </div>
    </div>
  );
                                          }
