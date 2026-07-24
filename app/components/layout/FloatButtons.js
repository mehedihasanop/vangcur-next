'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  DEFAULT_WA_LINK, computeWaLink, computeMsgLink,
  fetchContactSettings, subscribeContactSettings,
} from '@/lib/floatButtonsData';
import {
  SRP_OPEN_EVENT, SRP_CLOSE_EVENT, PP_OPEN_EVENT, PP_CLOSE_EVENT,
} from '@/lib/uiEvents';

// Converted from 32-javascript-all.js:
// - Dynamic WhatsApp/Messenger link update from vc_contact admin settings
//   (lines ~150-165)
// - Hide/restore on Product Page open/close (lines ~758-760, ~790-792) and on
//   Search Result Page open/close (lines ~600-605, ~631-633) — 19-product-full-
//   page.html and 17-search-result-page.html aren't converted yet (Priority 2),
//   so this listens for the shared PP_OPEN/PP_CLOSE/SRP_OPEN/SRP_CLOSE custom
//   events (see lib/uiEvents.js) instead of the legacy code reaching in via
//   querySelector('.float-btns'). The future ProductDetail/SearchPage components
//   should dispatch those events on open/close.
// Markup source: 16-float-buttons.html
//
// Note: .float-btns / .f-btn / .fb-wa / .fb-msg have no opacity:0 / vc-visible
// reveal-gating in globals.css (verified via grep), so no scroll-reveal logic is
// needed here.

export default function FloatButtons() {
  const [waLink, setWaLink] = useState(DEFAULT_WA_LINK);
  const [msgLink, setMsgLink] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const contact = await fetchContactSettings(supabase);
      if (cancelled || !contact) return;
      setWaLink(computeWaLink(contact));
      setMsgLink(computeMsgLink(contact));
    })();

    const channel = subscribeContactSettings(supabase, (contact) => {
      setWaLink(computeWaLink(contact));
      setMsgLink(computeMsgLink(contact));
    });

    const hide = () => setHidden(true);
    const show = () => setHidden(false);
    window.addEventListener(SRP_OPEN_EVENT, hide);
    window.addEventListener(SRP_CLOSE_EVENT, show);
    window.addEventListener(PP_OPEN_EVENT, hide);
    window.addEventListener(PP_CLOSE_EVENT, show);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.removeEventListener(SRP_OPEN_EVENT, hide);
      window.removeEventListener(SRP_CLOSE_EVENT, show);
      window.removeEventListener(PP_OPEN_EVENT, hide);
      window.removeEventListener(PP_CLOSE_EVENT, show);
    };
  }, []);

  return (
    <div className="float-btns" style={{ display: hidden ? 'none' : 'flex' }}>
      <button
        className="f-btn fb-wa"
        onClick={() => window.open(waLink, '_blank')}
        title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </button>
      {msgLink && (
        <button
          className="f-btn fb-msg"
          onClick={() => window.open(msgLink, '_blank')}
          title="Messenger"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff">
            <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
          </svg>
        </button>
      )}
    </div>
  );
}
