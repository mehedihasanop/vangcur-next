'use client';

// Converted from 32-javascript-all.js: genInvoice()/showInvoiceModal()/dlInvoice()/
// dlInvoiceById()/dlInvoiceFromPopup() (lines ~9329-9636). Markup source: the inline
// HTML string genInvoice() used to build (no numbered section file exists for this —
// legacy handled it as a window.open() target with an inline modal fallback, not a
// standalone .html section like 01-42). This is the last piece GENERATE_INVOICE_EVENT
// dispatchers (BgConfirmPopup.js, WaitingPage.js, OrderTracking.js) were waiting on.
//
// Deliberate divergence from legacy: legacy built a full HTML string (with its own
// <style> block), regex-extracted the <body> back out, and injected it into a plain
// DOM div — a workaround for genInvoice() also needing to work as a window.open()
// target (blocked on mobile, per its own "✅ FIX" comment) before falling back to the
// inline modal. Since the inline modal is the *only* path used here, this renders the
// invoice directly as JSX instead of building+parsing a string — same visual output
// (CSS ported verbatim to globals.css, see the "INVOICE PAGE" block), no functional
// change. PNG download now runs html2canvas against a React ref instead of a
// document.querySelector.
//
// Self-contained like OfferPopup.js/MembershipModal.js: owns its own open/close
// state, listens for GENERATE_INVOICE_EVENT itself. detail: { orderId, order?, ctx? }
// — order is used directly (normalized through mapSupabaseOrderRow, which already
// tolerates both snake_case Supabase rows and camelCase objects) when the caller
// already has it in hand; otherwise this fetches by orderId itself, exactly like
// legacy's dlInvoiceById() (Supabase first, vc_orders localStorage fallback).

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import {
  GENERATE_INVOICE_EVENT, OPEN_ACCOUNT_EVENT, OPEN_TRACK_ORDER_EVENT, SHOW_POST_ORDER_INFO_EVENT,
} from '@/lib/uiEvents';
import { DEFAULT_FOOTER } from '@/lib/footerData';

function emojiOrImg(val) {
  const isUrl = typeof val === 'string' && val.startsWith('http');
  if (isUrl) return <img src={val} alt="" style={{ width: 26, height: 26, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />;
  return <span style={{ fontSize: 18, width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{val || '📦'}</span>;
}

export default function InvoiceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [contact, setContact] = useState(DEFAULT_FOOTER.contact);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef(null);

  useEffect(() => {
    const onGenerate = (e) => {
      const detail = e.detail || {};
      (async () => {
        let o = detail.order ? mapSupabaseOrderRow(detail.order) : null;
        if (!o && detail.orderId) {
          try {
            const { data } = await supabase.from('orders').select('*').eq('id', detail.orderId).single();
            if (data) o = mapSupabaseOrderRow(data);
          } catch (err) { /* fall through to localStorage */ }
          if (!o) {
            try {
              const orders = JSON.parse(localStorage.getItem('vc_orders') || '[]');
              const found = orders.find((x) => x.id === detail.orderId);
              if (found) o = mapSupabaseOrderRow(found);
            } catch (err) { /* noop */ }
          }
        }
        if (!o) { showToast('❌ অর্ডার তথ্য পাওয়া যাচ্ছে না'); return; }
        setOrder(o);
        setCtx(detail.ctx || null);
        setIsOpen(true);
      })();
    };
    window.addEventListener(GENERATE_INVOICE_EVENT, onGenerate);
    return () => window.removeEventListener(GENERATE_INVOICE_EVENT, onGenerate);
  }, []);

  // Legacy: _settings['vc_contact'] read at genInvoice() render time (admin-editable
  // phone/email/address shown in the invoice footer note).
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const { data } = await supabase.from('store_settings').select('setting_value').eq('setting_key', 'vc_contact').single();
        const raw = data && data.setting_value ? (typeof data.setting_value === 'string' ? JSON.parse(data.setting_value) : data.setting_value) : null;
        if (raw) {
          setContact({
            phoneLabel: raw.phone || DEFAULT_FOOTER.contact.phoneLabel,
            email: raw.email || DEFAULT_FOOTER.contact.email,
            addr: raw.addr || DEFAULT_FOOTER.contact.addr,
          });
        }
      } catch (err) { /* keep defaults */ }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) lockBody(); else unlockBody();
    return () => { if (isOpen) unlockBody(); };
  }, [isOpen]);

  const downloadPNG = async () => {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
      });
      const link = document.createElement('a');
      link.download = `Vangcur_Invoice_${(order?.orderNum || '').replace('#', '')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      try { localStorage.removeItem('vc_pending_confirm'); } catch (err) { /* noop */ }
    } catch (err) {
      alert('ডাউনলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setDownloading(false);
    }
  };

  // Legacy: auto-download 800ms after the modal opens ("✅ Auto-download").
  useEffect(() => {
    if (!isOpen) return undefined;
    const t = setTimeout(() => { downloadPNG(); }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Legacy: invBackBtn onclick's callerCtx branch (lines ~9608-9631). _pushPanel/
  // _popPanel (browser-back history stack) intentionally not ported — see
  // VANGCUR_MASTER_PROMPT.md's architecture-decisions note, matches every other
  // converted overlay in this codebase.
  const close = () => {
    setIsOpen(false);
    try { localStorage.removeItem('vc_pending_confirm'); } catch (err) { /* noop */ }
    if (ctx === 'acc') {
      window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT));
    } else if (ctx === 'track') {
      window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT));
    } else {
      window.dispatchEvent(new CustomEvent(SHOW_POST_ORDER_INFO_EVENT));
    }
  };

  if (!isOpen || !order) return null;

  const ds = order.date ? new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const advancePaid = order.advancePaid || 200;
  const balanceDue = Math.max(0, (order.total || 0) - advancePaid);
  const dueMsg = balanceDue > 0
    ? `Hey! Please hand ৳${balanceDue.toLocaleString()} to the delivery man when you receive your package — that's your remaining balance (COD). Once you've got it home, make sure to record a continuous unboxing video from the top (no cuts or pauses). This video is mandatory for any warranty claim. Enjoy your order! 🎉`
    : `Great news — you've already paid in full! Once you receive your package, make sure to record a continuous unboxing video from the top (no cuts or pauses). This video is mandatory for any warranty claim. Enjoy your order! 🎉`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#f4f6fa', display: 'flex', flexDirection: 'column', overflow: 'hidden', overscrollBehavior: 'contain',
    }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', padding: '12px 16px', flexShrink: 0,
      }}
      >
        <button
          onClick={close}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.12)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans','Hind Siliguri',sans-serif" }}
        >
          ← ফিরে যান
        </button>
        <button
          onClick={downloadPNG}
          disabled={downloading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#E63946', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: downloading ? 'default' : 'pointer', opacity: downloading ? 0.6 : 1, fontFamily: "'DM Sans','Hind Siliguri',sans-serif" }}
        >
          {downloading ? '⏳ তৈরি হচ্ছে...' : '🖼️ ছবি ডাউনলোড'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 12px', overscrollBehavior: 'contain' }}>
        <div className="invoice-wrap" ref={invoiceRef}>
          <div className="inv-body">
            <div className="hdr">
              <div className="brand-name">Vangcur — ভাঙচুর</div>
              <div className="brand-sub">Your First Choice for Gadgets</div>
              <div className="badge">INVOICE</div>
              <div className="order-meta" style={{ marginTop: 10 }}>Order No: <strong>{order.orderNum}</strong> &nbsp;|&nbsp; Date: {ds}</div>
            </div>

            <div className="section-title">Customer Details</div>
            <div className="info-card">
              <div><strong>Name:</strong> {order.customer?.name}</div>
              <div><strong>Phone:</strong> {order.customer?.phone}</div>
              <div><strong>District:</strong> {order.customer?.district}</div>
              <div><strong>Address:</strong> {order.customer?.address}</div>
            </div>

            <div className="section-title">Product Details</div>
            <table className="prod-table">
              <thead>
                <tr><th>Product</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Price</th></tr>
              </thead>
              <tbody>
                {(order.items || []).map((i, idx) => (
                  <tr key={idx}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{emojiOrImg(i.emoji)} {i.name}</td>
                    <td style={{ textAlign: 'center' }}>{i.qty}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>৳{(i.price * i.qty).toLocaleString()}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ color: '#888' }}>Shipping ({order.shipping === 'dhaka' ? 'Dhaka City' : 'All Bangladesh'})</td>
                  <td style={{ textAlign: 'right' }}>৳{order.shippingCost}</td>
                </tr>
              </tbody>
            </table>

            <div className="totals-box">
              <div className="total-row grand"><span>Total</span><span>৳{(order.total || 0).toLocaleString()}</span></div>
              <div className="total-row paid"><span>✅ Paid (bKash Advance)</span><span>৳{advancePaid.toLocaleString()}</span></div>
              <div className="total-row balance"><span>Balance Due (COD)</span><span>৳{balanceDue.toLocaleString()}</span></div>
            </div>

            <div className="payment-badge">💳 Payment: bKash &nbsp;|&nbsp; 🚚 Courier: Pathao</div>

            <div style={{ marginTop: 18, padding: '16px 18px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, fontSize: 13, lineHeight: 1.8, color: '#1e3a5f' }}>
              {dueMsg}
            </div>

            <div className="footer-note" style={{ marginTop: 18 }}>
              📞 {contact.phoneLabel} &nbsp;|&nbsp; ✉️ {contact.email}<br />
              📘 facebook.com/vangcurbdofficial &nbsp;|&nbsp; 📍 {contact.addr}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
