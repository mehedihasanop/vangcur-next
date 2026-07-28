// Security hardening pass (owner-requested review, 2026-07-27): admin panel content
// (category icons, hero slider SVGs, footer contact/social links, custom footer
// service links) was being rendered without any sanitization — either via
// dangerouslySetInnerHTML (Categories.js, HeroSlider.js) or as a raw `href` (Footer.js).
// Since these all come from the `store_settings` table (admin-editable, not public
// user input), the realistic attack requires a compromised/phished admin account —
// but if that happens, unsanitized output here would run in *every visitor's*
// browser (stored XSS), which is the worst-case version of that bug. Both call
// sites now route through here instead of using the raw value directly.

import DOMPurify from 'isomorphic-dompurify';

// For admin-supplied SVG/HTML snippets (category icons, hero slider emoji/SVG field).
// Allows the SVG tags/attrs these actually use; strips <script>, event handlers
// (onerror=, onload=, ...), <foreignObject>, and anything else not on the list.
export function sanitizeSvgHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'polygon', 'line', 'g'],
  });
}

// For admin-supplied `href` values (footer social links, contact phone/WhatsApp,
// custom service links). Only allows protocols that can't execute script when
// clicked — rejects `javascript:`, `data:`, `vbscript:`, etc. Relative paths and
// hash links (`/`, `#faq`) are allowed through unchanged since those are never
// script-executing.
const SAFE_PROTOCOLS = ['http:', 'https:', 'tel:', 'mailto:'];

export function sanitizeHref(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) return trimmed;
  try {
    // A base is required to parse protocol-relative/relative strings consistently;
    // it's discarded — only `.protocol` of the resolved URL is inspected.
    const parsed = new URL(trimmed, 'https://vangcur.netlify.app');
    return SAFE_PROTOCOLS.includes(parsed.protocol) ? trimmed : '#';
  } catch (e) {
    return '#';
  }
}
