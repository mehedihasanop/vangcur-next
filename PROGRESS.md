# Vangcur Next.js Migration — Progress Log

## ✅ সম্পন্ন হয়েছে

### Session 1 — Project Setup
- Next.js project initialized (App Router, JS, Supabase)
- `package.json`, `next.config.js`, `jsconfig.json` তৈরি
- `globals.css` (legacy থেকে নেওয়া), `supabaseClient.js`, `supabaseServer.js` তৈরি
- `layout.js` তৈরি (metadata, viewport সহ)
- Placeholder `page.js` তৈরি

### Session 2 — Homepage Components (আজ সম্পন্ন ✅)
- **`app/` folder structure** সঠিকভাবে সাজানো হয়েছে
- **`lib/data.js`** — server-side data fetching (getProducts, getStoreSettings, getCustomerReviews, getProductById)
- **`lib/supabaseServer.js`** + **`lib/supabaseClient.js`** — lib folder-এ রাখা হয়েছে
- **`app/api/search/route.js`** — product search API endpoint

#### Components তৈরি:
| Component | Type | কাজ |
|-----------|------|-----|
| `Navbar.js` | Client | Search (dropdown), cart/wish icon, mobile search bar |
| `TrustStrip.js` | Server | 5টি trust badge |
| `HeroDuoSlider.js` | Client | 2-card auto-sliding hero (swipe+dots+arrows) |
| `Categories.js` | Client | Scrollable category carousel |
| `ProductCard.js` | Client | Individual product card (rating, badge, discount%) |
| `ProductGrid.js` | Client | Infinite scroll grid + category filtering |
| `FAQ.js` | Client | Accordion FAQ |
| `About.js` | Server | About section |
| `CustomerGallery.js` | Client | Unboxing review gallery + like button |
| `Footer.js` | Server | Full footer with social links |
| `BackToTop.js` | Client | Scroll-to-top button (auto-shows after 400px) |
| `FloatButtons.js` | Server | WhatsApp + Messenger float buttons |

- **`app/page.js`** — Server Component, ISR 60s, সব data parallel fetch করে
- **Build ✓ সফল** — `npm run build` pass করেছে

## ⏳ বাকি আছে

### পরের ধাপ (Priority অনুযায়ী):

1. **Product Detail Modal / Page** — `/product/[id]` route তৈরি করা
   - প্রোডাক্ট ছবি gallery, specs, reviews, অর্ডার/কার্ট button
   
2. **Cart + Order System** (Client-side, Supabase)
   - CartDrawer component (slide-in)
   - Order form (নাম, ফোন, ঠিকানা, bKash)
   - Supabase-এ order save করা

3. **Auth System** — Login/Register modal (Supabase Auth)

4. **Category Filter Bridge** — Navbar-এ category click → ProductGrid filter

5. **Toast notification** system (global)

6. **Admin Panel** migration — `app/admin/` folder

## 📋 টেস্ট করার চেকলিস্ট (deploy করার পর)

- [ ] হোমপেজ লোড হয় কিনা (Supabase env vars সেট করার পর)
- [ ] Products সঠিকভাবে দেখাচ্ছে কিনা
- [ ] Hero slider কাজ করছে কিনা (swipe, auto-play)
- [ ] Categories scroll কাজ করছে কিনা
- [ ] Search box কাজ করছে কিনা
- [ ] Mobile view ঠিক আছে কিনা

## 🔧 Vercel-এ Environment Variables (একবার সেট করতে হবে)

Vercel Dashboard → Project Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL = (তোমার Supabase project URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY = (তোমার Supabase anon key)
```

## 📁 ফাইল স্ট্রাকচার (বর্তমান)

```
vangcur-next/
├── app/
│   ├── api/
│   │   └── search/route.js
│   ├── components/
│   │   ├── About.js
│   │   ├── BackToTop.js
│   │   ├── Categories.js
│   │   ├── CustomerGallery.js
│   │   ├── FAQ.js
│   │   ├── FloatButtons.js
│   │   ├── Footer.js
│   │   ├── HeroDuoSlider.js
│   │   ├── Navbar.js
│   │   ├── ProductCard.js
│   │   ├── ProductGrid.js
│   │   └── TrustStrip.js
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── lib/
│   ├── data.js
│   ├── supabaseClient.js
│   └── supabaseServer.js
├── legacy/
│   ├── index.html (reference only)
│   └── admin.html (reference only)
├── next.config.js
├── package.json
└── jsconfig.json
```
