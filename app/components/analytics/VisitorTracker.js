'use client';

// ✅ Mounted once in app/layout.js so it fires exactly once per app session,
// on every route (home, product page, search, checkout, etc.) — matching the
// legacy index.html DOMContentLoaded visitor-tracking behavior. Renders nothing.

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { trackDailyVisit } from '@/lib/visitorTracking';

export default function VisitorTracker() {
  useEffect(() => {
    trackDailyVisit(supabase);
  }, []);

  return null;
}
