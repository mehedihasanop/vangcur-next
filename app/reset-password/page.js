import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

// Owner-requested (2026-07-27): dedicated route for password reset, not a modal —
// see app/components/auth/LoginModal.js's header comment for the reasoning.
export const metadata = {
  title: 'পাসওয়ার্ড রিসেট - Vangcur',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
