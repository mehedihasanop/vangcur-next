# Vangcur Next.js Migration — Progress Log

## ✅ সম্পন্ন হয়েছে

### Session 1 — Project Setup
- Next.js project initialized (App Router, JS, Supabase)
- `package.json`, `next.config.js`, `jsconfig.json` তৈরি
- `globals.css`, `supabaseClient.js`, `supabaseServer.js` তৈরি
- `layout.js`, placeholder `page.js` তৈরি

### Session 2 — Homepage Components ✅
- `lib/data.js` — server-side data fetching
- `app/api/search/route.js` — search API
- সব Homepage Components তৈরি (Navbar, Hero, Categories, ProductGrid, FAQ, About, Gallery, Footer ইত্যাদি)

### Session 3 — Cart + Order System ✅
- `CartContext.js` — global cart state (localStorage persistence)
- `CartDrawer.js` — slide-up cart panel
- `OrderModal.js` — 3-step order form (delivery → bKash → success)
- `ClientProviders.js`, `HomeClient.js` — wiring
- Navbar cart count connected

### Session 4 — Bug Fixes + Supabase Migration ✅
- `page.js` → `force-dynamic` করা হয়েছে
- `globals.css` → font CSS variables ঠিক করা
- `layout.js` → Google Fonts link ঠিক করা
- **নতুন Supabase project তৈরি** (`vangcur-next`)
- `SUPABASE_SETUP.sql` দিয়ে সব table + RLS + trigger তৈরি
- Migration tool দিয়ে আগের Supabase থেকে data copy:
  - ✅ `custom_products` — 26টি row
  - ✅ `store_settings` — 10টি row
  - ✅ `customer_reviews` — 4টি row
- Vercel-এ নতুন Supabase URL + Key আপডেট → Redeploy ✅
- Products সাইটে দেখাচ্ছে ✅
- `ProductCard.js` → `old_price` field name fix
- `HomeClient.js` → id type mismatch fix (String comparison)

## 🔴 এখনো যা ভাঙা আছে

1. **"অর্ডার করুন" বাটন** — click করলে OrderModal খুলছে না (ProductCard.js + HomeClient.js fix দেওয়া হয়েছে, deploy বাকি)
2. **Hero slider** — একটা বড় ছবি দেখাচ্ছে, duo card layout ভাঙা
3. **Categories** — carousel নেই, সব grid হয়ে গেছে
4. **Product images** — কিছু product-এ ছবির বদলে অক্ষর দেখাচ্ছে (imgs field JSONB parse issue)
5. **Font** — Google Fonts ঠিকমতো load হচ্ছে না
6. **Float buttons** — WhatsApp/Messenger button দেখা যাচ্ছে না
7. **"চলতি অফার" section** — নেই

## ⏳ কোড দিক থেকে বাকি feature

1. **Product Detail Modal** — product click করলে ছবি gallery, specs, অর্ডার button
2. **Cart dot badge animation** — Navbar cart icon-এ count dot
3. **Category filter** — Categories click → ProductGrid filter
4. **Auth System** — Login/Register modal
5. **Admin Panel** — `app/admin/` folder

## 🔧 Supabase Info

**নতুন Supabase (vangcur-next):**
- URL: `https://oldxmxtpaxgvzmrfoiym.supabase.co`
- Tables: `custom_products`, `store_settings`, `orders`, `customer_reviews`, `abandoned_checkouts`
- RLS: সব table-এ policy আছে
- Stock trigger: order insert হলে automatically stock কমবে

**পুরনো Supabase:** হাত দেওয়া হয়নি, অপরিবর্তিত আছে ✅

## 📁 ফাইল স্ট্রাকচার (বর্তমান)

```
vangcur-next/
├── app/
│   ├── api/search/route.js
│   ├── components/
│   │   ├── About.js
│   │   ├── BackToTop.js
│   │   ├── CartContext.js
│   │   ├── CartDrawer.js
│   │   ├── Categories.js
│   │   ├── ClientProviders.js
│   │   ├── CustomerGallery.js
│   │   ├── FAQ.js
│   │   ├── FloatButtons.js
│   │   ├── Footer.js
│   │   ├── HeroDuoSlider.js
│   │   ├── HomeClient.js         ← Updated (id fix)
│   │   ├── Navbar.js
│   │   ├── OrderModal.js
│   │   ├── ProductCard.js        ← Updated (old_price fix)
│   │   ├── ProductGrid.js
│   │   └── TrustStrip.js
│   ├── globals.css               ← Updated (font fix)
│   ├── layout.js                 ← Updated (Google Fonts)
│   └── page.js                   ← Updated (force-dynamic)
├── lib/
│   ├── data.js
│   ├── supabaseClient.js
│   └── supabaseServer.js
├── SUPABASE_SETUP.sql
├── PROGRESS.md
├── next.config.js
├── package.json
└── jsconfig.json
```

## 🔧 Claude-এর জন্য নির্দেশনা (নতুন চ্যাটে)

- নতুন Supabase-এ table বা column লাগলে → `SUPABASE_SETUP.sql` আপডেট করো এবং user-কে SQL Editor-এ run করতে বলো
- পুরনো Supabase-এ কখনো হাত দেওয়া যাবে না
- Hero slider, Categories carousel, Font loading — এগুলো পরের session-এ fix করতে হবে
