'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { showToast } from '@/lib/toast';
import { saveCurrentUser, updatePassword } from '@/lib/authData';
import { checkPasswordStrength } from '@/lib/passwordStrength';
import PasswordStrengthMeter from '@/app/components/auth/PasswordStrengthMeter';

// Owner-requested (2026-07-27) — step 2 of the password reset flow.
// The email link (built by requestPasswordReset() in lib/authData.js) points here
// with a Supabase recovery token in the URL hash. supabase-js's client already parses
// that automatically on load (detectSessionInUrl defaults to true) and establishes a
// temporary "recovery" session — this page just waits a tick for that, then calls
// updatePassword(). No manual token parsing needed here, same reasoning as
// LoginModal.js's checkOAuthCallback().
export default function ResetPasswordClient() {
  const [status, setStatus] = useState('checking'); // checking | ready | invalid | done
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // A short delay lets supabase-js finish parsing the URL hash before we check.
      await new Promise((r) => setTimeout(r, 300));
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setStatus(data?.session ? 'ready' : 'invalid');
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async () => {
    const strength = await checkPasswordStrength(pass);
    if (!strength.minLenOk) { setErr('পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে'); return; }
    if (!strength.ok) { setErr('আরও শক্তিশালী পাসওয়ার্ড দিন (নিচের মিটার দেখুন)'); return; }
    if (pass !== confirmPass) { setErr('দুটো পাসওয়ার্ড মিলছে না'); return; }
    setErr('');
    setLoading(true);
    const { error } = await updatePassword(supabase, pass);
    setLoading(false);
    if (error) { setErr('পাসওয়ার্ড পরিবর্তন করা যায়নি, লিংকের মেয়াদ শেষ হয়ে থাকতে পারে'); return; }

    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      saveCurrentUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || 'Customer',
        phone: data.user.user_metadata?.phone || '',
      });
    }
    setStatus('done');
    showToast('✅ পাসওয়ার্ড পরিবর্তন হয়েছে!');
    setTimeout(() => router.push('/'), 1500);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8FA', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 28, padding: '36px 28px', maxWidth: 400, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,.18)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: '#111', borderRadius: 26, padding: '10px 28px' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 1.5, fontFamily: "'DM Sans',sans-serif" }}>VangCur</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.5)', letterSpacing: 3, fontFamily: "'Hind Siliguri','DM Sans',sans-serif" }}>ভাঙচুর</div>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginTop: 16, fontFamily: "'DM Sans','Hind Siliguri',sans-serif" }}>নতুন পাসওয়ার্ড সেট করুন</h2>
        </div>

        {status === 'checking' && (
          <p style={{ textAlign: 'center', color: '#888', fontSize: 13.5, fontFamily: "'Hind Siliguri','DM Sans',sans-serif" }}>লিংক যাচাই করা হচ্ছে...</p>
        )}

        {status === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#374151', fontSize: 13.5, lineHeight: 1.6, fontFamily: "'Hind Siliguri','DM Sans',sans-serif", marginBottom: 16 }}>
              এই লিংকের মেয়াদ শেষ হয়ে গেছে বা এটি অবৈধ। আবার পাসওয়ার্ড রিসেট রিকোয়েস্ট করুন।
            </p>
            <button
              onClick={() => router.push('/')}
              style={{ width: '100%', background: '#111', color: '#fff', border: 'none', padding: 14, borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Hind Siliguri','DM Sans',sans-serif" }}
            >
              হোমপেজে ফিরে যান
            </button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 7, color: '#333', fontFamily: "'Hind Siliguri','DM Sans',sans-serif" }}>নতুন পাসওয়ার্ড</label>
              <input
                type="password" value={pass} onChange={(e) => setPass(e.target.value)}
                placeholder="কমপক্ষে ৮ অক্ষর, শক্তিশালী পাসওয়ার্ড"
                style={{ width: '100%', padding: '13px 18px', border: '1.5px solid #E8EAED', borderRadius: 50, fontSize: 14, fontFamily: "'Hind Siliguri','DM Sans',sans-serif", background: '#F9FAFB', outline: 'none', boxSizing: 'border-box' }}
              />
              <PasswordStrengthMeter password={pass} />
            </div>
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 7, color: '#333', fontFamily: "'Hind Siliguri','DM Sans',sans-serif" }}>পাসওয়ার্ড আবার লিখুন</label>
              <input
                type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="পাসওয়ার্ড আবার লিখুন"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                style={{ width: '100%', padding: '13px 18px', border: '1.5px solid #E8EAED', borderRadius: 50, fontSize: 14, fontFamily: "'Hind Siliguri','DM Sans',sans-serif", background: '#F9FAFB', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {err && <div style={{ fontSize: 11.5, color: '#F59E0B', marginBottom: 8, textAlign: 'center', fontFamily: "'Hind Siliguri','DM Sans',sans-serif" }}>{err}</div>}
            <button
              onClick={handleSubmit} disabled={loading}
              style={{ width: '100%', background: '#111', color: '#fff', border: 'none', padding: 14, borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Hind Siliguri','DM Sans',sans-serif", opacity: loading ? 0.7 : 1 }}
            >
              পাসওয়ার্ড সেভ করুন
            </button>
          </>
        )}

        {status === 'done' && (
          <p style={{ textAlign: 'center', color: '#16A34A', fontSize: 14, fontWeight: 700, fontFamily: "'Hind Siliguri','DM Sans',sans-serif" }}>
            ✅ পাসওয়ার্ড পরিবর্তন হয়েছে! হোমপেজে নিয়ে যাওয়া হচ্ছে...
          </p>
        )}
      </div>
    </div>
  );
}
