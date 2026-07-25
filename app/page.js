import { Suspense } from 'react';
import SearchPageClient from './SearchPageClient';

// /srp is a real, standalone route now (owner's decision — legacy's
// 17-search-result-page.html itself is a `.srp-overlay` with display:none by
// default, confirmed against the fresh index.html export too, but the Next.js
// version deliberately departs from that: full page instead of an overlay).
// No site Navbar/Footer here on purpose — same minimal look as the old overlay
// (its own small header: back button + search box), per owner's instruction.
export const metadata = {
  title: 'সার্চ ফলাফল - Vangcur',
  robots: { index: false, follow: false }, // dynamic query-driven results, not for indexing
};

export default function SRPPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageClient />
    </Suspense>
  );
}
