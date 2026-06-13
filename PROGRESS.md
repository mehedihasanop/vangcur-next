# Vangcur — Next.js Migration Progress

> এই ফাইলটা প্রতিটা Claude সেশনের শুরুতে পড়তে হবে এবং কাজ শেষে আপডেট করতে হবে।
> ফরম্যাট: কী হয়েছে → কী চলছে → পরের ধাপ → জানা সমস্যা/সিদ্ধান্ত।

## প্রজেক্ট সারাংশ

- Source: পুরোনো vanilla JS সাইট (`legacy/index.html`, `legacy/admin.html` — রেফারেন্সের জন্য রাখা আছে, এডিট করা হবে না, কোডে import হবে না)
- Target: Next.js (App Router, JavaScript, Supabase)
- Supabase প্রজেক্ট: অপরিবর্তিত (same tables/RLS) — URL/anon key `.env.local.example`-এ আছে

## আর্কিটেকচার সিদ্ধান্ত (চূড়ান্ত — পরিবর্তন করার আগে আলোচনা করো)

- Next.js **15.5.x** (App Router, JavaScript — TS নয়)
  - *নোট: Next.js 16 stable হিসেবে আছে কিন্তু 16-এর breaking changes নিয়ে কম পরিচিত, তাই 15-এ শুরু — পরে চাইলে আপগ্রেড আলোচনা করা যাবে*
- পাবলিক ডেটা (প্রোডাক্ট লিস্ট/ডিটেইল, রিভিউ) = Server Component + ISR (revalidate: 60s)
- ইউজার-নির্ভর/অ্যাডমিন/রিয়েল-টাইম = Client Component + `lib/supabaseClient.js` (supabase-js)
- সার্ভার সাইডে ডেটা আনতে হলে `lib/supabaseServer.js` ব্যবহার করো
- CSS: legacy CSS (`<style>` ব্লক, ২৩৬৮ লাইন) সম্পূর্ণ `app/globals.css`-এ এক্সট্র্যাক্ট করা হয়েছে — font-family গুলো CSS variable (`var(--font-body)`, `var(--font-display)`) দিয়ে next/font-এর সাথে সংযুক্ত করা হয়েছে। **পেজ-স্পেসিফিক CSS পরে আলাদা module CSS-এ ভাগ করার কথা ভাবা হবে**, কিন্তু আপাতত সব globals.css-এই থাকবে যাতে কিছু miss না হয়।
- Fonts: next/font/google (DM Sans, Hind Siliguri, Playfair Display) — self-hosted হয়ে যাবে বিল্ডের সময়, সাইট আরও দ্রুত হবে

## এখন পর্যন্ত যা সম্পন্ন হয়েছে

- [x] Next.js 15 প্রজেক্ট স্ট্রাকচার তৈরি (`package.json`, `next.config.js`, `jsconfig.json`, `.gitignore`)
- [x] `app/globals.css` — legacy CSS সম্পূর্ণ এক্সট্র্যাক্ট ও font-family CSS variable-এ রূপান্তর
- [x] `app/layout.js` — root layout, metadata (SEO/OG/Twitter), viewport, fonts সেটআপ (legacy `<head>` থেকে নেওয়া)
- [x] `app/page.js` — placeholder হোমপেজ (পরের ধাপে আসল হোমপেজ বসবে)
- [x] `lib/supabaseClient.js` — browser-side Supabase client
- [x] `lib/supabaseServer.js` — server-side Supabase client helper
- [x] `.env.local.example` — env var টেমপ্লেট (Supabase URL/anon key + Google Sheet URL সহ)
- [x] `public/manifest.json` — basic PWA manifest placeholder
- [x] `legacy/index.html`, `legacy/admin.html` — রেফারেন্স কোড কপি করা হয়েছে
- [x] Build verification: sandbox-এ `npm run build` চালানো হয়েছে — **শুধু next/font Google Fonts fetch ছাড়া বাকি সব সফল কম্পাইল হয়েছে** (sandbox network Google Fonts ব্লক করে, কিন্তু Vercel-এ এটা সমস্যা হবে না)

## এখন যা চলছে / আংশিক সম্পন্ন

- (খালি — পরের সেশনে হোমপেজ থেকে শুরু হবে)

## পরের ধাপ (Next Steps) — অগ্রাধিকার ক্রমে

1. **হোমপেজ (`/`)** — legacy `index.html`-এর body থেকে: হেডার/নেভ, হিরো সেকশন, ক্যাটাগরি কার্ড, প্রোডাক্ট গ্রিড, FAQ, Unboxing রিভিউ গ্যালারি, About Vangcur, Footer — সব আলাদা React component-এ ভাগ করে বানাতে হবে। প্রোডাক্ট লিস্ট/রিভিউ Server Component দিয়ে Supabase থেকে fetch (ISR 60s)।
2. প্রোডাক্ট ডিটেইল পেজ (`/product/[id]`)
3. SRP / সার্চ-ক্যাটাগরি পেজ
4. কার্ট + চেকআউট (client-side state, localStorage/cookies বিবেচনা)
5. অ্যাকাউন্ট / অর্ডার ট্র্যাকিং
6. অ্যাডমিন প্যানেল (`/admin`) — `legacy/admin.html` থেকে
7. PWA: real `manifest.json` icons + `public/sw.js` (deployed site-এর public ফোল্ডার থেকে কপি করতে হবে — এই দুটো ফাইল legacy uploads-এ ছিল না)
8. SEO redirects (পুরোনো URL ফরম্যাট থেকে নতুন), sitemap, ফাইনাল QA
9. ডোমেইন সুইচ

## ফাইল/ফোল্ডার ম্যাপ

```
vangcur-next/
├── app/
│   ├── layout.js        # root layout, fonts, metadata
│   ├── page.js          # হোমপেজ (placeholder এখন)
│   └── globals.css       # সম্পূর্ণ legacy CSS (২৩৬৮ লাইন), font-family → CSS vars
├── lib/
│   ├── supabaseClient.js # browser-side
│   └── supabaseServer.js # server-side (Server Components)
├── legacy/
│   ├── index.html        # রেফারেন্স — পুরোনো ফ্রন্টএন্ড
│   └── admin.html        # রেফারেন্স — পুরোনো অ্যাডমিন প্যানেল
├── public/
│   └── manifest.json      # placeholder, replace with real icons later
├── .env.local.example
├── next.config.js
├── jsconfig.json
├── package.json
└── README.md
```

## জানা সমস্যা / টেস্টিং নোট

- `next/font/google` build sandbox-এ Google Fonts fetch করতে পারে না (network restriction) — **এটা Vercel-এ সমস্যা হবে না**, কিন্তু Vercel build log-এ যদি ভিন্ন কোনো font error আসে, তাহলে রিপোর্ট করো।
- `public/manifest.json` এখন placeholder — আসল icons (deployed site-এর `/icons/...`) এবং `public/sw.js` (service worker) পরে deployed repo থেকে কপি করে আনতে হবে।
- legacy `index.html`-এ invoice generation-এর জন্য আলাদা একটা `<style>`/HTML টেমপ্লেট আছে (লাইন ~৮৩৮৫ ও ~৯৪০৭) — এটা migrate করার সময় মাথায় রাখতে হবে (Order invoice feature)।

## Environment Variables

`.env.local.example`-এ values আছে (anon key, public-safe):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_SHEET_URL`
