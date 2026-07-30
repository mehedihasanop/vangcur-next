'use client';

// Converted from 32-javascript-all.js:
// - preConfirmCheck()/closePreConfirmModal() -> isOpen/onClose props, same pattern as
//   every other overlay in this codebase (WishlistDrawer/CartSidebar/LoginModal). The
//   actual "show this modal" decision (guest checking out) lives in checkout/page.js's
//   handleConfirmClick(), since that's where currentUser/terms-checked state already is.
// - preConfirmGoLogin()/preConfirmGoRegister() -> onLogin/onRegister props. checkout/page.js
//   wires these to open <LoginModal orderMode initialMode="login"|"register" .../> —
//   the actual email/password form lives there, not duplicated here.
// - preConfirmGoGoogle() (the localStorage pending-order-data save + loginWithGoogle())
//   -> onGoogle prop. This one is NOT routed through LoginModal (LoginModal hides its
//   Google button entirely in orderMode — see its file header note) because the
//   pending-data-preservation logic is checkout-specific, so checkout/page.js owns it
//   directly and this component just triggers the callback.
// - preConfirmSkip() -> onSkip prop, which checkout/page.js wires straight to its real
//   submitOrderNow().
// - Keyboard ESC handler: none of WishlistDrawer/CartSidebar/LoginModal implement this
//   in this codebase either (checked before writing this file) — skipped here too, for
//   the same consistency reason those files already state.
// Markup source: 24-pre-confirm-login.html

export default function PreConfirmLoginModal({ isOpen, onClose, onLogin, onRegister, onGoogle, onSkip }) {
  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div
      className={`modal-bg${isOpen ? ' show' : ''}`}
      id="preConfirmModal"
      style={{ zIndex: 3500, alignItems: 'center', justifyContent: 'center' }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          background: '#fff', borderRadius: 24, maxWidth: 400, width: '92%', padding: 0,
          overflow: 'hidden', animation: 'slideUp .3s cubic-bezier(.34,1.56,.64,1)',
          boxShadow: '0 32px 80px rgba(0,0,0,.18)', margin: 'auto',
        }}
      >
        <div style={{ background: '#F7F8FA', padding: '28px 28px 20px', textAlign: 'center', borderBottom: '1px solid #EFEFEF' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }}>
            অর্ডার সুরক্ষিত রাখুন
          </h2>
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.7, fontFamily: "'Hind Siliguri','DM Sans',sans-serif" }}>
            লগইন করলে পরবর্তীতে আপনার অর্ডার ট্র্যাক, ম্যানেজ ও দেখতে পারবেন।
          </p>
        </div>

        <div style={{ padding: '22px 24px 26px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
            নতুন অ্যাকাউন্ট তৈরি করতে
          </div>
          <button
            onClick={onRegister}
            style={{
              width: '100%', background: '#111', color: '#fff', border: 'none', padding: 13,
              borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Hind Siliguri','DM Sans',sans-serif", boxShadow: '0 4px 16px rgba(0,0,0,.2)',
              transition: 'all .2s', marginBottom: 10,
            }}
          >
            রেজিস্ট্রেশন করুন
          </button>

          <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
            পূর্বে অ্যাকাউন্ট তৈরি করা থাকলে
          </div>
          <button
            onClick={onLogin}
            style={{
              width: '100%', background: '#fff', color: '#111', border: '1.5px solid #E8EAED', padding: 13,
              borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Hind Siliguri','DM Sans',sans-serif", transition: 'all .2s', marginBottom: 16,
            }}
          >
            লগইন করুন
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, color: '#C5C9D0', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, fontFamily: "'DM Sans',sans-serif" }}>
            <span style={{ flex: 1, height: 1, background: '#EFEFEF', display: 'block' }} />
            অথবা
            <span style={{ flex: 1, height: 1, background: '#EFEFEF', display: 'block' }} />
          </div>

          <button
            onClick={onGoogle}
            style={{
              width: '100%', background: '#fff', color: '#111', border: '1.5px solid #E8EAED', padding: 12,
              borderRadius: 50, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Hind Siliguri','DM Sans',sans-serif", display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, transition: 'all .2s', marginBottom: 16,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google দিয়ে লগইন করুন
          </button>

          <button
            onClick={onSkip}
            style={{ width: '100%', background: 'none', border: 'none', color: '#aaa', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", padding: 6 }}
          >
            এখন না, অর্ডার করুন →
          </button>
        </div>
      </div>
    </div>
  );
}
