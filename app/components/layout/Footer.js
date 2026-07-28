'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  DEFAULT_FOOTER, DEFAULT_SERVICE_LINKS, resolveServiceLink,
  fetchFooterSettings, subscribeFooterSettings,
} from '@/lib/footerData';
import {
  OPEN_ACCOUNT_EVENT, OPEN_TRACK_ORDER_EVENT, OPEN_OFFER_PAGE_EVENT, OPEN_INFO_EVENT,
} from '@/lib/uiEvents';
import { sanitizeHref } from '@/lib/sanitize';

// Converted from 32-javascript-all.js:
// - applyAdminSettings() (lines ~140-267) — logo / contact / footer desc+social /
//   footerServiceCol overrides, sourced from store_settings.
// - Initial bootstrap fetch (lines ~407-417) + realtime watch (lines ~1115-1177,
//   see lib/footerData.js for the verified realtime-scope note).
// - openAcc() / openTrackOrder() / openOfferPage() / openInfo(type) button handlers —
//   these open overlays that don't exist yet (see lib/uiEvents.js), so they dispatch
//   placeholder window events for now instead of calling undefined globals.
// Markup source: 14-footer.html
//
// Note: .footer-top / .f-* / .soc-btn / .f-col have no opacity:0 / vc-visible
// reveal-gating in globals.css (verified via grep), so no scroll-reveal is needed.

function computeLogo(raw) {
  if (raw && raw.type === 'image' && raw.img) {
    return { mode: 'image', img: raw.img, alt: raw.alt || 'Vangcur Logo', height: raw.height || 50 };
  }
  return {
    mode: 'text',
    main: (raw && raw.main) || DEFAULT_FOOTER.logo.main,
    sub: (raw && raw.sub) || DEFAULT_FOOTER.logo.sub,
  };
}

function computeContact(raw) {
  const c = { ...DEFAULT_FOOTER.contact };
  if (!raw) return c;
  if (raw.phone) { c.phoneLabel = raw.phone; c.phoneHref = sanitizeHref('tel:' + raw.phone.replace(/\D/g, '')); }
  if (raw.wa) { c.waHref = sanitizeHref('https://wa.me/' + ('88' + raw.wa.replace(/^88/, '').replace(/\D/g, ''))); }
  if (raw.email) c.email = raw.email;
  if (raw.fb) c.fb = sanitizeHref(raw.fb);
  if (raw.addr) c.addr = raw.addr;
  return c;
}

function computeFooterExtras(raw) {
  // desc / copy / social — only present on initial load (see realtime-scope note)
  const social = { ...DEFAULT_FOOTER.social };
  let desc = DEFAULT_FOOTER.desc;
  let copy = DEFAULT_FOOTER.copy;
  if (raw) {
    if (raw.desc) desc = raw.desc;
    if (raw.copy) copy = raw.copy;
    if (raw.fb) social.fb = sanitizeHref(raw.fb);
    if (raw.ig) social.ig = sanitizeHref(raw.ig);
    if (raw.tk) social.tk = sanitizeHref(raw.tk);
    if (raw.yt) social.yt = sanitizeHref(raw.yt);
    if (raw.wa) social.wa = sanitizeHref('https://wa.me/' + raw.wa.replace(/\D/g, ''));
  }
  return { desc, copy, social };
}

export default function Footer() {
  const [logo, setLogo] = useState(computeLogo(null));
  const [contact, setContact] = useState(DEFAULT_FOOTER.contact);
  const [extras, setExtras] = useState({ desc: DEFAULT_FOOTER.desc, copy: DEFAULT_FOOTER.copy, social: DEFAULT_FOOTER.social });
  const [serviceLinks, setServiceLinks] = useState(null); // null => render DEFAULT_SERVICE_LINKS

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const settings = await fetchFooterSettings(supabase);
      if (cancelled) return;
      if (settings.vc_logo) setLogo(computeLogo(settings.vc_logo));
      if (settings.vc_contact) setContact(computeContact(settings.vc_contact));
      if (settings.vc_footer) setExtras(computeFooterExtras(settings.vc_footer));
      if (Array.isArray(settings.vc_footer_links) && settings.vc_footer_links.length) {
        setServiceLinks(settings.vc_footer_links.map(resolveServiceLink));
      }
    })();

    // Legacy: only vc_logo / vc_contact re-apply live (see lib/footerData.js note)
    const channel = subscribeFooterSettings(supabase, (key, val) => {
      if (key === 'vc_logo') setLogo(computeLogo(val));
      if (key === 'vc_contact') setContact(computeContact(val));
    });

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  const openAccount = () => window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT));
  const openTrackOrder = () => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT));
  const openOfferPage = () => window.dispatchEvent(new CustomEvent(OPEN_OFFER_PAGE_EVENT));
  const openInfo = (type) => window.dispatchEvent(new CustomEvent(OPEN_INFO_EVENT, { detail: { type } }));

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToCategories = () => document.getElementById('catCardsGrid')?.scrollIntoView({ behavior: 'smooth' });
  const scrollToFaq = () => document.getElementById('faqSec')?.scrollIntoView({ behavior: 'smooth' });

  const renderServiceLink = (lnk, i) => {
    switch (lnk.action) {
      case 'faq':
        return <button key={i} onClick={scrollToFaq}>{lnk.label}</button>;
      case 'info:shipping':
        return <button key={i} onClick={() => openInfo('shipping')}>{lnk.label}</button>;
      case 'info:returns':
        return <button key={i} onClick={() => openInfo('returns')}>{lnk.label}</button>;
      case 'info:privacy':
        return <button key={i} onClick={() => openInfo('privacy')}>{lnk.label}</button>;
      case 'info:terms':
        return <button key={i} onClick={() => openInfo('terms')}>{lnk.label}</button>;
      case 'scroll':
        return (
          <button
            key={i}
            onClick={() => { try { document.querySelector(lnk.target)?.scrollIntoView({ behavior: 'smooth' }); } catch (e) { /* noop, matches legacy try/catch */ } }}
          >
            {lnk.label}
          </button>
        );
      case 'external':
      default:
        return <a key={i} href={lnk.href} target="_blank" rel="noopener noreferrer">{lnk.label}</a>;
    }
  };

  return (
    <footer>
      <div className="footer-top">
        <div>
          <div id="footerLogoWrap">
            {logo.mode === 'image' ? (
              <img
                id="footerLogoImg"
                src={logo.img}
                alt={logo.alt}
                style={{ display: 'block', maxHeight: logo.height, width: 'auto', marginBottom: 8 }}
              />
            ) : (
              <>
                <div className="f-logo" id="footerLogoText">{logo.main}</div>
                <div className="f-logo-sub" id="footerLogoSub">{logo.sub}</div>
              </>
            )}
          </div>
          <p className="f-desc" id="footerDescText">{extras.desc}</p>
          <div className="f-social" id="footerSocialLinks">
            <a className="soc-btn" id="socialFb" href={extras.social.fb} target="_blank" rel="noopener noreferrer" title="Facebook">
              <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            </a>
            <a className="soc-btn" id="socialIg" href={extras.social.ig} target="_blank" rel="noopener noreferrer" title="Instagram">
              <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
            </a>
            <a className="soc-btn" id="socialTk" href={extras.social.tk} target="_blank" rel="noopener noreferrer" title="TikTok">
              <svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" /></svg>
            </a>
            <a className="soc-btn" id="socialWa" href={extras.social.wa} target="_blank" rel="noopener noreferrer" title="WhatsApp">
              <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            </a>
            <a className="soc-btn" id="socialYt" href={extras.social.yt} target="_blank" rel="noopener noreferrer" title="YouTube">
              <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </a>
          </div>
        </div>

        <div className="f-col" id="footerQuickLinksCol">
          <h4>কুইক লিঙ্কস</h4>
          <button onClick={openAccount}>মাই প্রোফাইল</button>
          <button onClick={openTrackOrder}>ট্র্যাক অর্ডার</button>
          <button onClick={scrollTop}>হোম</button>
          <button onClick={scrollToCategories}>ক্যাটাগরি</button>
          <button onClick={openOfferPage} style={{ color: '#D4A853' }}>📢 চলতি অফারসমূহ</button>
        </div>

        <div className="f-col" id="footerServiceCol">
          <h4>Customer Service</h4>
          {(serviceLinks || DEFAULT_SERVICE_LINKS).map(renderServiceLink)}
        </div>

        <div className="f-col" id="footerContactCol">
          <h4>CONTACT</h4>
          <a id="contactPhoneLink" href={contact.phoneHref}>📞 {contact.phoneLabel}</a>
          <a id="contactEmailLink" href={`mailto:${contact.email}`}>✉️ {contact.email}</a>
          <a id="contactWaLink" href={contact.waHref} target="_blank" rel="noopener noreferrer">💬 WhatsApp Support</a>
          <a id="contactFbLink" href={contact.fb} target="_blank" rel="noopener noreferrer">📘 Facebook Page</a>
          <p id="contactAddrText" style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 8 }}>📍 {contact.addr}</p>
        </div>
      </div>
      <div className="footer-bottom"><div className="f-copy" id="footerCopyText">{extras.copy}</div></div>
    </footer>
  );
}
