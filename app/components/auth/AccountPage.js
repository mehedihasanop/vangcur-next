'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import { productHref, WISHLIST_EVENT } from '@/lib/productData';
import {
  saveCurrentUser, logout, getLinkedAccounts, switchToAccount,
} from '@/lib/authData';
import { OPEN_MEMBERSHIP_EVENT, GENERATE_INVOICE_EVENT } from '@/lib/uiEvents';
import {
  computeCelestialState, fetchIsRaining, formatLiveTimeDate, getGreeting,
  fetchMyOrders, orderStats, updateProfileName,
  getStockNotifications, removeStockNotification, clearAllStockNotifications,
  fetchDrafts, deleteDraft, deleteAllDrafts,
} from '@/lib/accountData';
import { getTier, tierIconSVG, crownSVG } from '@/lib/membershipData';

// Converted from 32-javascript-all.js — see lib/accountData.js's header for the
// per-function line references; this file is the JSX + component state that drives
// those pure helpers. Markup source: 22-account-page.html.
// openAcc()'s `if(!currentUser){openLogin();return;}` branch (~372) lives one level up
// in ClientHome.js's OPEN_ACCOUNT_EVENT handler (it decides whether to open this
// component or LoginModal), not here — this component assumes currentUser is already set.
// _pushPanel('acc')/_pauseHeroSlider()/_resumeHeroSlider() (browser-back stack + hero
// autoplay pause) aren't used by any other converted overlay in this codebase either
// (WishlistDrawer/CartSidebar/LoginModal all skip them) — same simplification here.

const STATUS_CLASS = { pending: 'status-pending', confirmed: 'status-confirmed', shipped: 'status-confirmed', delivered: 'status-delivered', cancelled: 'status-pending', rejected: 'status-pending' };
const STATUS_LABEL = { pending: '⏳ Pending', confirmed: '✅ Confirmed', shipped: '🚚 Shipped', delivered: '📦 Delivered', cancelled: '❌ Cancelled', rejected: '❌ Cancelled' };

function ItemThumb({ imgVal }) {
  const isUrl = typeof imgVal === 'string' && imgVal.startsWith('http');
  if (isUrl) {
    return <img src={imgVal} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 7, border: '1px solid #e5e7eb', flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />;
  }
  return <span style={{ fontSize: 20, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--light)', borderRadius: 7, flexShrink: 0 }}>{imgVal || '📦'}</span>;
}

export default function AccountPage({ isOpen, onClose, currentUser, onAddAccount }) {
  const [now, setNow] = useState(() => new Date());
  const [isRaining, setIsRaining] = useState(false);
  const cardRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(300);

  const [nameEditOpen, setNameEditOpen] = useState(false);
  const [nameEditValue, setNameEditValue] = useState('');
  const [nameEditErr, setNameEditErr] = useState('');

  const [switchPanelOpen, setSwitchPanelOpen] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [orders, setOrders] = useState([]);
  const [stockNotifs, setStockNotifs] = useState([]);
  const [drafts, setDrafts] = useState([]);

  const router = useRouter();

  // Legacy: openAcc()/closeAcc() -> lockBody()/unlockBody()
  useEffect(() => {
    if (isOpen) lockBody(); else unlockBody();
  }, [isOpen]);

  // Legacy: _startAccClock() — updateTimeDate() every second, drives both the clock
  // text and updateCelestialPosition()
  useEffect(() => {
    if (!isOpen) return undefined;
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  // Measure the profile card's width for computeCelestialState's sun/moon arc (legacy
  // used `card.clientWidth||300` directly since it read the live DOM element)
  useEffect(() => {
    if (!isOpen || !cardRef.current) return undefined;
    const measure = () => setCardWidth(cardRef.current?.clientWidth || 300);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen]);

  // Legacy: fetchLocalWeather() — once per open is enough (2h cache internally anyway)
  useEffect(() => {
    if (!isOpen) return;
    fetchIsRaining(supabase, currentUser).then(setIsRaining);
  }, [isOpen, currentUser]);

  // Legacy: openAcc() fills accNameTxt/accEmailTxt/avatarCircle + renderMyOrders() +
  // _renderSNProfileSection() + loadDraftDrawer(), all on open
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    setNameEditOpen(false);
    setSwitchPanelOpen(false);
    setStockNotifs(getStockNotifications());
    fetchMyOrders(supabase, currentUser).then(setOrders);
    fetchDrafts(supabase, currentUser).then(setDrafts);
  }, [isOpen, currentUser]);

  const celestial = useMemo(
    () => computeCelestialState(now.getHours() + now.getMinutes() / 60, isRaining, cardWidth),
    [now, isRaining, cardWidth],
  );
  const stats = useMemo(() => orderStats(orders), [orders]);

  if (!currentUser) return null;

  const initials = (currentUser.name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const createdStr = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
    : '১০ জুন, ২০২৬';

  const openNameEdit = () => { setNameEditValue(currentUser.name || ''); setNameEditErr(''); setNameEditOpen(true); };
  const closeNameEdit = () => { setNameEditOpen(false); setNameEditErr(''); };
  const saveNameEdit = async () => {
    const nm = nameEditValue.trim();
    if (!nm || nm.length < 2) { setNameEditErr('অন্তত ২ অক্ষরের নাম দিন'); return; }
    await updateProfileName(supabase, currentUser, nm);
    saveCurrentUser({ ...currentUser, name: nm }); // also refreshes Navbar's avatar via AUTH_EVENT
    closeNameEdit();
    showToast('✅ নাম পরিবর্তন হয়েছে');
  };

  const toggleSwitchPanel = () => {
    setSwitchPanelOpen((v) => {
      const next = !v;
      if (next) setLinkedAccounts(getLinkedAccounts().filter((a) => a.email !== currentUser.email));
      return next;
    });
  };
  const handleSwitchToAccount = async (email) => {
    showToast('⏳ সুইচ হচ্ছে...');
    const result = await switchToAccount(supabase, email);
    if (result.error) { showToast(result.error === 'expired' ? 'সেশন মেয়াদ শেষ, আবার লগইন করুন' : '❌ সুইচ করতে সমস্যা হয়েছে'); return; }
    setSwitchPanelOpen(false);
    showToast('✅ অ্যাকাউন্ট পরিবর্তন হয়েছে');
  };

  const doLogout = async () => {
    setShowLogoutConfirm(false);
    await logout(supabase);
    try { localStorage.removeItem('vc_wish'); } catch (e) {}
    window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: { wishlist: [] } }));
    onClose();
    showToast('লগআউট হয়েছে');
  };

  const handleRemoveStockNotif = (key) => { removeStockNotification(key); setStockNotifs((prev) => prev.filter((i) => i.key !== key)); };
  const handleClearStockNotifs = () => { clearAllStockNotifications(); setStockNotifs([]); };
  const viewNotifiedProduct = (item) => { onClose(); router.push(productHref({ id: item.prodId, name: item.prodName || '' })); };

  const handleDeleteDraft = async (draftId, sbId) => {
    await deleteDraft(supabase, currentUser, draftId, sbId);
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };
  const handleClearAllDrafts = async () => {
    await deleteAllDrafts(supabase, currentUser);
    setDrafts([]);
  };
  // Legacy: continueFromDraft()/continueRecoveryOrder() — 23-order-overlay.html.
  // Fix (2026-08-01 audit): this used to just dispatch 'vc:continueDraftOrder' with no
  // listener anywhere — a dead button (see uiEvents.js audit note). Checkout already has
  // two restore mechanisms on mount: sessionStorage 'vc_form_draft' (name/phone/dist/addr/
  // email/txn/l4) and sessionStorage 'vc_quick_order_items' (one-time cart override, same
  // key QuickOrderBridge uses). Writing to both here lets /checkout's existing mount logic
  // pick everything up automatically — no changes needed in checkout/page.js.
  const continueFromDraft = (draft) => {
    try {
      if (Array.isArray(draft.items) && draft.items.length) {
        sessionStorage.setItem('vc_quick_order_items', JSON.stringify(draft.items));
      }
      sessionStorage.setItem('vc_form_draft', JSON.stringify({
        name: draft.name || '', phone: draft.phone || '', dist: draft.dist || '',
        addr: draft.addr || '', email: draft.email || '',
      }));
      if (draft.ship) sessionStorage.setItem('vc_ship', draft.ship);
    } catch (e) {
      // sessionStorage full/blocked — checkout will still open with an empty form,
      // which is strictly better than the previous no-op dead button.
    }
    onClose();
    router.push('/checkout');
  };

  const openInvoice = (orderId) => window.dispatchEvent(new CustomEvent(GENERATE_INVOICE_EVENT, { detail: { orderId, ctx: 'acc' } }));
  const currentTier = getTier(stats.completed);
  const openMembership = () => window.dispatchEvent(new CustomEvent(OPEN_MEMBERSHIP_EVENT, { detail: { completedCount: stats.completed } }));

  return (
    <div className={`acc-page${isOpen ? ' show' : ''}`} id="accPage">
      <div className="acc-nav">
        <div className="acc-nav-left">
          <button className="pp-back" onClick={onClose} aria-label="ফিরে যান">‹</button>
        </div>
      </div>

      <div className="acc-inner">
        <div className="welcome-header">
          <h1 className="welcome-title">Welcome To Your Profile</h1>
          <div className="welcome-subtitle">{getGreeting(currentUser, now)}</div>
          <div className="welcome-time">{formatLiveTimeDate(now)}</div>
        </div>

        <div className="acc-grid">
          {/* COLUMN 1: SIDEBAR */}
          <div className="profile-sidebar">
            <div className={`acc-profile-card state-${celestial.state}`} id="vectorCard" ref={cardRef}>
              <div className="lightning-flash-overlay" />

              <svg className="vector-stars" viewBox="0 0 400 120" preserveAspectRatio="none">
                <circle cx="30" cy="20" r="1" fill="#fff" style={{ animation: 'twinkling 2s infinite 0.1s' }} />
                <circle cx="70" cy="45" r="1.5" fill="#fff" style={{ animation: 'twinkling 1.5s infinite 0.5s' }} />
                <circle cx="150" cy="15" r="1" fill="#fff" style={{ animation: 'twinkling 2.5s infinite 0.8s' }} />
                <circle cx="210" cy="30" r="1.5" fill="#fff" style={{ animation: 'twinkling 1.8s infinite 0.2s' }} />
                <circle cx="280" cy="20" r="1" fill="#fff" style={{ animation: 'twinkling 3s infinite 0.4s' }} />
                <circle cx="340" cy="40" r="1" fill="#fff" style={{ animation: 'twinkling 2s infinite 0.9s' }} />
                <circle cx="380" cy="15" r="1.5" fill="#fff" style={{ animation: 'twinkling 1.6s infinite 0.1s' }} />
              </svg>

              <svg className="vector-clouds" viewBox="0 0 400 80" preserveAspectRatio="none">
                <g className="cloud" style={{ animation: 'cloudDrift 18s linear infinite' }}>
                  <path d="M 10 30 a 10 10 0 0 1 10 -10 a 12 12 0 0 1 22 2 a 10 10 0 0 1 10 8 a 8 8 0 0 1 -4 7 L 10 37 a 10 10 0 0 1 0 -7 z" />
                </g>
                <g className="cloud" style={{ animation: 'cloudDrift 12s linear infinite -4s' }}>
                  <path d="M 120 15 a 8 8 0 0 1 8 -8 a 10 10 0 0 1 18 2 a 8 8 0 0 1 8 6 a 6 6 0 0 1 -3 5 L 120 20 a 8 8 0 0 1 0 -5 z" opacity="0.8" />
                </g>
                <g className="cloud" style={{ animation: 'cloudDrift 24s linear infinite -10s' }}>
                  <path d="M 280 25 a 12 12 0 0 1 12 -12 a 15 15 0 0 1 27 3 a 12 12 0 0 1 12 10 a 10 10 0 0 1 -5 9 L 280 35 a 12 12 0 0 1 0 -10 z" opacity="0.9" />
                </g>
              </svg>

              <div className="vector-rain">
                {['10%', '20%', '35%', '50%', '65%', '80%', '92%', '15%', '45%', '75%'].map((left, i) => (
                  <div key={i} className="rain-drop" style={{ left, animationDelay: `${(i % 6) * 0.1 + 0.1}s`, animationDuration: `${0.6 + (i % 3) * 0.1}s` }} />
                ))}
              </div>

              <svg className="lightning-bolt" viewBox="0 0 30 90" preserveAspectRatio="none">
                <path d="M15,0 L3,45 L15,42 L7,90 L27,35 L15,38 Z" fill="#E0F2FE" />
              </svg>

              <div className={`vector-birds${celestial.birdsVisible ? '' : ' hidden'}`}>
                <div className="bird" style={{ animationDelay: '0s', animationDuration: '10s' }}>
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5 Q4 1 7 5 T13 5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
                <div className="bird" style={{ animationDelay: '-4s', animationDuration: '14s', top: 10 }}>
                  <svg width="10" height="7" viewBox="0 0 14 10" fill="none"><path d="M1 5 Q4 1 7 5 T13 5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
              </div>

              {celestial.celestial !== 'none' && (
                <div className={`vector-celestial ${celestial.celestial}`} style={{ left: celestial.posX, top: celestial.posY }} />
              )}

              <div className="vector-midground" dangerouslySetInnerHTML={{ __html: celestial.sceneryHtml }} />

              <div className="vector-fireflies">
                {['15%', '35%', '55%', '75%', '90%'].map((left, i) => (
                  <div key={i} className="firefly" style={{ left, animationDelay: `${0.1 + i * 0.2}s`, animationDuration: `${1.8 + i * 0.15}s` }} />
                ))}
              </div>

              <svg className="vector-landscape" viewBox="0 0 400 96" preserveAspectRatio="none">
                <path className="back-hill" d="M0,50 Q100,18 200,36 T400,30 L400,96 L0,96 Z" />
                <path className="front-hill" d="M0,66 Q120,38 240,56 T400,52 L400,96 L0,96 Z" />
              </svg>

              <div className="profile-content">
                <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar-wrap">
                    <div className="profile-avatar">{initials}</div>
                    {currentTier.crown && <span dangerouslySetInnerHTML={{ __html: crownSVG(currentTier.crown) }} />}
                  </div>
                  <div className="acc-profile-info">
                    <div className="acc-name-txt">{currentUser.name || '-'}</div>
                    <div className="acc-email-txt">{currentUser.email || '-'}</div>
                    <div className="account-created">📅 অ্যাকাউন্ট তৈরি: {createdStr}</div>
                  </div>
                </div>

                <div className="acc-profile-actions">
                  <button onClick={openNameEdit} className="acc-edit-btn">✏️ এডিট</button>
                  <button onClick={toggleSwitchPanel} className="acc-switch-btn">🔄 সুইচ</button>
                  <button className="acc-logout-btn" onClick={() => setShowLogoutConfirm(true)}>↩ লগআউট</button>
                </div>

                {nameEditOpen && (
                  <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 7, fontWeight: 600 }}>নতুন নাম লিখুন</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text" placeholder="আপনার নাম" value={nameEditValue}
                        onChange={(e) => setNameEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveNameEdit(); }}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13.5, outline: 'none' }}
                      />
                      <button onClick={saveNameEdit} style={{ background: '#D4A853', color: '#111', border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>সেভ</button>
                      <button onClick={closeNameEdit} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 10px', fontSize: 12, cursor: 'pointer' }}>✕</button>
                    </div>
                    {nameEditErr && <div style={{ color: '#FCA5A5', fontSize: 11, marginTop: 5, minHeight: 14 }}>{nameEditErr}</div>}
                  </div>
                )}
              </div>
            </div>

            {switchPanelOpen && (
              <div className="switch-panel" id="switchPanel" style={{ display: 'block' }}>
                <div className="switch-title">অ্যাকাউন্ট পরিবর্তন করুন</div>
                <div id="switchAccountsContainer">
                  <div className="switch-row active">
                    <div className="switch-av">{initials}</div>
                    <div className="switch-info">
                      <div className="switch-name">{currentUser.name || 'Guest'}</div>
                      <div className="switch-email">{currentUser.email || ''}</div>
                    </div>
                    <div className="switch-tick">✓</div>
                  </div>
                  {linkedAccounts.map((a) => (
                    <div key={a.email} className="switch-row" style={{ cursor: 'pointer' }} onClick={() => handleSwitchToAccount(a.email)}>
                      <div className="switch-av" style={{ background: '#6366F1' }}>{a.initials || '?'}</div>
                      <div className="switch-info">
                        <div className="switch-name">{a.name || ''}</div>
                        <div className="switch-email">{a.email || ''}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 700 }}>সুইচ</div>
                    </div>
                  ))}
                </div>
                <button className="add-account-btn" onClick={() => { onClose(); if (onAddAccount) setTimeout(onAddAccount, 150); }}>➕ নতুন অ্যাকাউন্ট যোগ করুন</button>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-num">{stats.total}টি</div>
                <div className="stat-lbl">মোট অর্ডার</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{stats.running}টি</div>
                <div className="stat-lbl">রানিং অর্ডার</div>
              </div>
              <div className="stat-box" style={{ padding: '9px 4px 6px', cursor: 'pointer' }} onClick={openMembership}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '2px 0' }}>
                  <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: tierIconSVG(currentTier.key) }} />
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '-0.2px', fontFamily: "'DM Sans',sans-serif", ...(currentTier.key === 'silver' ? { color: '#475569' } : currentTier.key === 'gold' ? { color: '#92400E' } : currentTier.key === 'diamond' ? { color: '#1E40AF' } : { color: '#78350F' }) }}>{currentTier.bn}</div>
                  <div className="stat-lbl" style={{ marginTop: 0, fontSize: 8.5 }}>মেম্বারশিপ</div>
                </div>
              </div>
            </div>

            {drafts.length > 0 && (
              <div className="draft-scenery-box" style={{ marginTop: 14 }}>
                <div className="draft-box-header">
                  <div className="draft-box-title">🛒 অর্ডার করতে চেয়েছিলেন</div>
                  <button className="clear-all-btn" onClick={handleClearAllDrafts}>🗑️ সব মুছুন</button>
                </div>
                <div>
                  {drafts.map((draft) => {
                    const items = Array.isArray(draft.items) ? draft.items : [];
                    const firstItem = items[0] || null;
                    const d = new Date(draft.createdAt);
                    const dateStr = d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
                    const timeStr = d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
                    const prodName = firstItem ? firstItem.name : 'প্রোডাক্ট';
                    const tot = items.reduce((s, i) => s + i.price * i.qty, 0);
                    return (
                      <div className="draft-card" key={draft.id}>
                        <div className="draft-meta">📅 {dateStr} · ⏰ {timeStr} · {items.length} আইটেম</div>
                        <div className="draft-prod-row">
                          <div className="draft-thumb">{firstItem ? <ItemThumb imgVal={(firstItem.imgs || ['📦'])[0]} /> : '📦'}</div>
                          <div className="draft-name">{prodName.length > 32 ? `${prodName.slice(0, 32)}...` : prodName}</div>
                          <div className="draft-price">৳{tot.toLocaleString()}</div>
                        </div>
                        <div className="draft-actions">
                          <button className="draft-btn remove" onClick={() => handleDeleteDraft(draft.id, draft._sbId)}>🗑️ সরান</button>
                          <button className="draft-btn continue" onClick={() => continueFromDraft(draft)}>⚡ চালিয়ে যান</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stockNotifs.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', fontFamily: "'DM Sans',sans-serif" }}>🔔 স্টকে আসলে জানানো</div>
                  <button onClick={handleClearStockNotifs} style={{ fontSize: 11, color: 'var(--gray)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>সব মুছুন</button>
                </div>
                <div>
                  {stockNotifs.map((item) => {
                    const dateStr = item.ts ? new Date(item.ts).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' }) : '';
                    return (
                      <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', background: '#F9FAFB', borderRadius: 10, marginBottom: 6, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 20, flexShrink: 0 }}>📦</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'DM Sans',sans-serif" }}>{item.prodName || 'প্রোডাক্ট'}</div>
                          <div style={{ fontSize: 11, color: '#6B7280', fontFamily: "'DM Sans',sans-serif" }}>⏳ স্টক নেই · {dateStr}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                          <button onClick={() => viewNotifiedProduct(item)} style={{ background: 'var(--dark)', color: '#fff', border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>দেখুন</button>
                          <button onClick={() => handleRemoveStockNotif(item.key)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 2: ORDERS */}
          <div className="acc-orders-section">
            <div className="acc-orders-title" style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>
              📦 আমার অর্ডার সমূহ
            </div>
            <div>
              {orders.length === 0 ? (
                <div className="acc-no-orders" style={{ textAlign: 'center', padding: '28px 12px' }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>📦</div>
                  <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: 5, fontSize: 14 }}>এখনো কোনো অর্ডার নেই</div>
                  <div style={{ fontSize: 12, color: 'var(--gray)' }}>অর্ডার করলে এখানে দেখাবে</div>
                </div>
              ) : (
                orders.map((o) => {
                  const dateStr = new Date(o.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
                  return (
                    <div className="order-card" key={o.id}>
                      <div className="order-card-header">
                        <span className="order-number">{o.orderNum}</span>
                        <span className={`status-pill ${STATUS_CLASS[o.status] || 'status-pending'}`}>{STATUS_LABEL[o.status] || '⏳ Pending'}</span>
                      </div>
                      <div className="order-card-body">
                        <div className="order-meta">📅 {dateStr} &nbsp;|&nbsp; 👤 {o.customer?.name || '-'}</div>
                        <div>
                          {(o.items || []).map((i, idx) => (
                            <div className="product-row" key={idx}>
                              <ItemThumb imgVal={(i.imgs || ['📦'])[0]} />
                              <div className="product-name">{i.name}</div>
                              <div className="product-qty-price">{i.qty} × ৳{i.price.toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                        <div className="order-card-footer">
                          <div className="order-total-price">মোট: ৳{(o.total || 0).toLocaleString()} (শিপিং সহ)</div>
                          <button onClick={() => openInvoice(o.id)} className="invoice-btn">📄 ইনভয়েস</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="logout-confirm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}>
          <div className="logout-confirm-box">
            <div className="logout-confirm-icon">👋</div>
            <div className="logout-confirm-msg">আপনি কি নিশ্চিতভাবে লগআউট করতে চান?</div>
            <div className="logout-confirm-btns">
              <button className="logout-confirm-no" onClick={() => setShowLogoutConfirm(false)}>না</button>
              <button className="logout-confirm-yes" onClick={doLogout}>লগআউট</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
