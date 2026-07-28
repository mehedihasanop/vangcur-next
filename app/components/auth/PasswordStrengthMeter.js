'use client';

import { useEffect, useState } from 'react';
import { checkPasswordStrength } from '@/lib/passwordStrength';

export default function PasswordStrengthMeter({ password }) {
  const [strength, setStrength] = useState(null);

  useEffect(() => {
    if (!password) { setStrength(null); return undefined; }
    let cancelled = false;
    checkPasswordStrength(password).then((s) => { if (!cancelled) setStrength(s); });
    return () => { cancelled = true; };
  }, [password]);

  if (!password || !strength) return null;
  const pct = ((strength.score + 1) / 5) * 100;
  return (
    <div style={{ marginTop: 6, marginBottom: 4 }}>
      <div style={{ height: 4, borderRadius: 4, background: '#E8EAED', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: strength.color, transition: 'width .2s ease, background .2s ease' }} />
      </div>
      <div style={{ fontSize: 11, color: strength.color, fontWeight: 600, marginTop: 3, fontFamily: "'Hind Siliguri','DM Sans',sans-serif" }}>{strength.label}</div>
    </div>
  );
}
