'use client';

import { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { createClient } from '@supabase/supabase-js';

const DISTRICTS = ['ঢাকা','চট্টগ্রাম','রাজশাহী','খুলনা','বরিশাল','সিলেট','রংপুর','ময়মনসিংহ','কুমিল্লা','ফেনী','নোয়াখালী','লক্ষ্মীপুর','চাঁদপুর','ব্রাহ্মণবাড়িয়া','কিশোরগঞ্জ','নরসিংদী','নারায়ণগঞ্জ','মুন্সীগঞ্জ','মানিকগঞ্জ','গাজীপুর','টাঙ্গাইল','ফরিদপুর','মাদারীপুর','শরীয়তপুর','রাজবাড়ী','গোপালগঞ্জ','বগুড়া','নওগাঁ','নাটোর','পাবনা','সিরাজগঞ্জ','জয়পুরহাট','চাঁপাইনবাবগঞ্জ','যশোর','সাতক্ষীরা','মেহেরপুর','নড়াইল','চুয়াডাঙ্গা','কুষ্টিয়া','মাগুরা','ঝিনাইদহ','বাগেরহাট','পিরোজপুর','ঝালকাঠি','পটুয়াখালী','বরগুনা','ভোলা','সুনামগঞ্জ','হবিগঞ্জ','মৌলভীবাজার','নেত্রকোনা','জামালপুর','শেরপুর','গাইবান্ধা','নীলফামারী','লালমনিরহাট','কুড়িগ্রাম','ঠাকুরগাঁও','পঞ্চগড়','দিনাজপুর','কক্সবাজার','বান্দরবান','রাঙ্গামাটি','খাগড়াছড়ি'];

const SHIP_COST = { dhaka: 90, outside: 130, bangladesh: 130 };

function getShipOpts(dist) {
  if (dist === 'ঢাকা') return [
    { key: 'dhaka', label: 'ঢাকা সিটি কর্পোরেশনের আওতাধীন', sub: 'Pathao Courier · Home Delivery 1-2 Days', cost: 90 },
    { key: 'outside', label: 'ঢাকা সিটি কর্পোরেশনের বাইরে', sub: 'Pathao Courier · Home Delivery 1-3 Days', cost: 130 },
  ];
  if (dist) return [
    { key: 'bangladesh', label: 'সারা বাংলাদেশ', sub: 'Pathao Courier · Home Delivery 2-4 Days', cost: 130 },
  ];
  return [
    { key: 'dhaka', label: 'ঢাকা সিটি কর্পোরেশনের আওতাধীন', sub: 'Pathao Courier · Home Delivery 1-2 Days', cost: 90 },
    { key: 'bangladesh', label: 'সারা বাংলাদেশ', sub: 'Pathao Courier · Home Delivery 2-4 Days', cost: 130 },
  ];
}

let _sb = null;
function getSbClient() {
  if (_sb) return _sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) _sb = createClient(url, key);
  return _sb;
}

export default function OrderModal() {
  const { orderOpen, setOrderOpen, orderItems, clearCart, showToast } = useCart();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', dist: '', addr: '', email: '', txn: '', l4: '' });
  const [ship, setShip] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderNum, setOrderNum] = useState('');

  useEffect(() => {
    if (orderOpen) {
      document.body.style.overflow = 'hidden';
      setStep(1);
      // Auto-select ship if only one option
      const opts = getShipOpts(form.dist);
      if (opts.length === 1) setShip(opts[0].key);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [orderOpen]);

  if (!orderOpen) return null;

  const sub = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const sc = SHIP_COST[ship] || 0;
  const total = sub + sc;
  const shipOpts = getShipOpts(form.dist);

  function onDistChange(dist) {
    setForm(f => ({ ...f, dist }));
    const opts = getShipOpts(dist);
    setShip(opts.length === 1 ? opts[0].key : '');
    setErrors(e => ({ ...e, dist: '' }));
  }

  function validateStep1() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'নাম দিন';
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(form.phone)) {
      errs.phone = 'সঠিক বাংলাদেশী নম্বর দিন (01X দিয়ে শুরু, ১১ সংখ্যা)';
    }
    if (!form.dist) errs.dist = 'জেলা সিলেক্ট করুন';
    const addrOk = form.addr.trim().length >= 8 && /\s/.test(form.addr) && !/(.)\\1{4,}/.test(form.addr);
    if (!addrOk) errs.addr = 'বিস্তারিত ঠিকানা দিন (যেমন: রোড বা বাসা নম্বর)';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) errs.email = 'সঠিক ইমেইল দিন';
    if (!ship) errs.ship = 'শিপিং অপশন সিলেক্ট করুন';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goStep2() {
    if (!validateStep1()) return;
    setStep(2);
  }

  async function confirmOrder() {
    if (!form.txn.trim()) { setErrors({ txn: 'bKash ট্রানজেকশন আইডি দিন' }); return; }
    if (!form.l4.trim()) { setErrors({ l4: 'bKash নম্বরের শেষ ৪ ডিজিট দিন' }); return; }
    setSubmitting(true);
    const num = 'VC-' + Date.now().toString().slice(-6);
    const oid = 'ord_' + Date.now();
    try {
      const sb = getSbClient();
      const payload = {
        order_num: num,
        created_at: new Date().toISOString(),
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_district: form.dist,
        customer_address: form.addr.trim(),
        customer_email: form.email.trim(),
        items: orderItems,
        shipping: ship,
        shipping_cost: sc,
        subtotal: sub,
        total,
        payment_txn: form.txn.trim(),
        payment_last4: form.l4.trim(),
        status: 'pending',
      };
      let savedId = oid;
      if (sb) {
        const { data, error } = await sb.from('orders').insert(payload).select('id').single();
        if (!error && data?.id) savedId = data.id;
      }
      setOrderId(savedId);
      setOrderNum(num);
      clearCart();
      setStep(3);
    } catch (e) {
      showToast('❌ অর্ডার সেভ হয়নি, আবার চেষ্টা করুন');
    }
    setSubmitting(false);
  }

  function closeModal() {
    setOrderOpen(false);
    setStep(1);
    setForm({ name: '', phone: '', dist: '', addr: '', email: '', txn: '', l4: '' });
    setShip('');
    setErrors({});
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)',
    borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };
  const errStyle = { color: '#E63946', fontSize: 11.5, marginTop: 4 };
  const labelStyle = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--dark)' };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && step !== 3) closeModal(); }}
    >
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 520, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'slideUp .28s ease',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 18px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {step === 1 ? '📋 ডেলিভারি তথ্য' : step === 2 ? '💳 পেমেন্ট' : '✅ অর্ডার সম্পন্ন'}
            </div>
            {step < 3 && (
              <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                ধাপ {step}/2
              </div>
            )}
          </div>
          {step !== 3 && (
            <button onClick={closeModal} style={{
              background: 'var(--light)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          )}
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '18px 18px 0' }}>

          {/* Order Items Summary */}
          {step < 3 && (
            <div style={{ background: 'var(--light)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>অর্ডার সামারি</div>
              {orderItems.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: 'var(--dark)' }}>{i.name.slice(0, 30)}{i.name.length > 30 ? '…' : ''} × {i.qty}</span>
                  <span style={{ fontWeight: 600 }}>৳{(i.price * i.qty).toLocaleString()}</span>
                </div>
              ))}
              {ship && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--gray)' }}>ডেলিভারি চার্জ</span>
                  <span style={{ fontWeight: 600 }}>৳{sc}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                <span>মোট</span>
                <span style={{ color: 'var(--red, #E63946)' }}>৳{total.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* STEP 1: Delivery info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 18 }}>
              <div>
                <label style={labelStyle}>পূর্ণ নাম *</label>
                <input
                  style={inputStyle}
                  placeholder="আপনার পূর্ণ নাম"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(err => ({ ...err, name: '' })); }}
                />
                {errors.name && <div style={errStyle}>{errors.name}</div>}
              </div>
              <div>
                <label style={labelStyle}>ফোন নম্বর * <span style={{ fontWeight: 400, color: 'var(--gray)' }}>(বাংলাদেশি নম্বর)</span></label>
                <input
                  style={inputStyle}
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                  value={form.phone}
                  onChange={e => { setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') })); setErrors(err => ({ ...err, phone: '' })); }}
                />
                {errors.phone && <div style={errStyle}>{errors.phone}</div>}
              </div>
              <div>
                <label style={labelStyle}>জেলা *</label>
                <select
                  style={{ ...inputStyle, color: form.dist ? 'var(--dark)' : 'var(--gray)' }}
                  value={form.dist}
                  onChange={e => onDistChange(e.target.value)}
                >
                  <option value="">জেলা সিলেক্ট করুন</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.dist && <div style={errStyle}>{errors.dist}</div>}
              </div>
              <div>
                <label style={labelStyle}>বিস্তারিত ঠিকানা *</label>
                <textarea
                  style={{ ...inputStyle, resize: 'none', height: 76 }}
                  placeholder="বাসা/রোড নম্বর, এলাকা, থানা"
                  value={form.addr}
                  onChange={e => { setForm(f => ({ ...f, addr: e.target.value })); setErrors(err => ({ ...err, addr: '' })); }}
                />
                {errors.addr && <div style={errStyle}>{errors.addr}</div>}
              </div>
              <div>
                <label style={labelStyle}>ইমেইল <span style={{ fontWeight: 400, color: 'var(--gray)' }}>(ঐচ্ছিক)</span></label>
                <input
                  style={inputStyle}
                  placeholder="example@email.com"
                  type="email"
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(err => ({ ...err, email: '' })); }}
                />
                {errors.email && <div style={errStyle}>{errors.email}</div>}
              </div>

              {/* Shipping Options */}
              <div>
                <label style={labelStyle}>শিপিং পদ্ধতি *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {shipOpts.map(opt => (
                    <div
                      key={opt.key}
                      onClick={() => { setShip(opt.key); setErrors(err => ({ ...err, ship: '' })); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                        border: ship === opt.key ? '2px solid var(--dark)' : '1.5px solid var(--border)',
                        background: ship === opt.key ? 'rgba(0,0,0,0.03)' : '#fff',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: ship === opt.key ? '5px solid var(--dark)' : '2px solid var(--border)',
                          flexShrink: 0, transition: 'all 0.15s',
                        }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{opt.sub}</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}>৳{opt.cost}</div>
                    </div>
                  ))}
                </div>
                {errors.ship && <div style={errStyle}>{errors.ship}</div>}
              </div>
            </div>
          )}

          {/* STEP 2: Payment */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 18 }}>
              {/* bKash block */}
              <div style={{
                background: 'linear-gradient(135deg,#FFF5F5 0%,#FFE4E6 100%)',
                border: '1.5px solid #FDA4AF', borderRadius: 16, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: '#E63946', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    💳
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>bKash Send Money</div>
                    <div style={{ fontSize: 19, fontWeight: 800, color: '#E63946', letterSpacing: 0.3 }}>01816-365504</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                  উপরের নম্বরে <strong style={{ color: '#E63946' }}>৳{total.toLocaleString()}</strong> bKash Send Money করুন। তারপর নিচে ট্রানজেকশন আইডি দিন।
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FFF5F5', borderRadius: 10, border: '1px solid #FCA5A5' }}>
                  <span style={{ fontSize: 12, color: '#E63946', fontWeight: 600 }}>⚠️</span>
                  <span style={{ fontSize: 12, color: '#E63946' }}>অ্যাডভান্স পেমেন্ট ছাড়া অর্ডার প্রসেস করা হবে না</span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>bKash ট্রানজেকশন আইডি *</label>
                <input
                  style={inputStyle}
                  placeholder="যেমন: 8N7GHD12K4"
                  value={form.txn}
                  onChange={e => { setForm(f => ({ ...f, txn: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })); setErrors(err => ({ ...err, txn: '' })); }}
                  maxLength={10}
                />
                {errors.txn && <div style={errStyle}>{errors.txn}</div>}
              </div>
              <div>
                <label style={labelStyle}>bKash নম্বরের শেষ ৪ সংখ্যা *</label>
                <input
                  style={inputStyle}
                  placeholder="XXXX"
                  maxLength={4}
                  value={form.l4}
                  onChange={e => { setForm(f => ({ ...f, l4: e.target.value.replace(/\D/g, '').slice(0, 4) })); setErrors(err => ({ ...err, l4: '' })); }}
                />
                {errors.l4 && <div style={errStyle}>{errors.l4}</div>}
              </div>
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0 30px' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>অর্ডার সম্পন্ন হয়েছে!</div>
              <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.7, marginBottom: 20 }}>
                আপনার অর্ডার নম্বর: <strong style={{ color: 'var(--dark)' }}>{orderNum}</strong><br />
                আমাদের টিম শীঘ্রই আপনাকে কনফার্ম করবে।
              </div>
              <div style={{ background: 'var(--light)', borderRadius: 14, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
                {orderItems.map(i => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span>{i.name.slice(0, 28)}{i.name.length > 28 ? '…' : ''} × {i.qty}</span>
                    <span style={{ fontWeight: 600 }}>৳{(i.price * i.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
                  <span>মোট পরিশোধ</span>
                  <span>৳{total.toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: '100%', background: 'var(--dark)', color: '#fff', border: 'none',
                  borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                হোমপেজে ফিরে যান
              </button>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {step === 1 && (
          <div style={{ padding: '14px 18px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <button
              onClick={goStep2}
              style={{
                width: '100%', background: 'var(--dark)', color: '#fff', border: 'none',
                borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              পেমেন্টে যান →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: '14px 18px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <button
              onClick={confirmOrder}
              disabled={submitting}
              style={{
                width: '100%', background: submitting ? '#ccc' : '#E63946', color: '#fff', border: 'none',
                borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {submitting ? '⏳ প্রসেস হচ্ছে...' : '✅ অর্ডার কনফার্ম করুন'}
            </button>
            <button
              onClick={() => setStep(1)}
              style={{
                width: '100%', background: 'none', border: '1.5px solid var(--border)',
                borderRadius: 12, padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", marginTop: 8,
              }}
            >
              ← পেছনে যান
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
