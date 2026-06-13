# Vangcur — Next.js Migration Progress

> এই ফাইলটা প্রতিটা Claude সেশনের শুরুতে পড়তে হবে এবং কাজ শেষে আপডেট করতে হবে।
> ফরম্যাট: কী হয়েছে → কী চলছে → পরের ধাপ → জানা সমস্যা/সিদ্ধান্ত।

## প্রজেক্ট সারাংশ

- Source: পুরোনো vanilla JS সাইট (`legacy/index.html`, `legacy/admin.html` — রিপোতে রেফারেন্সের জন্য রাখা আছে, এডিট করা হবে না)
- Target: Next.js (App Router, JavaScript, Supabase)
- Supabase প্রজেক্ট: অপরিবর্তিত (same tables/RLS)

## আর্কিটেকচার সিদ্ধান্ত (চূড়ান্ত — পরিবর্তন করার আগে আলোচনা করো)

- App Router, JavaScript (TS নয়)
- পাবলিক ডেটা = Server Component + ISR (60s)
- ইউজার-নির্ভর/অ্যাডমিন = Client Component + supabase-js
- CSS: legacy CSS থেকে modular CSS ফাইলে ভাগ করা হবে, Tailwind rewrite না

## এখন পর্যন্ত যা সম্পন্ন হয়েছে

- [ ] (এখনো কিছু শুরু হয়নি)

## এখন যা চলছে / আংশিক সম্পন্ন

- (খালি)

## পরের ধাপ (Next Steps) — অগ্রাধিকার ক্রমে

1. Next.js প্রজেক্ট স্ট্রাকচার সেটআপ (App Router, package.json, layout.js, global CSS extraction)
2. Supabase ক্লায়েন্ট সেটআপ (env vars, client + server helper)
3. হোমপেজ (`/`) — হেডার, হিরো, ক্যাটাগরি, প্রোডাক্ট গ্রিড, FAQ, রিভিউ গ্যালারি, About, Footer
4. প্রোডাক্ট পেজ (`/product/[id]`)
5. SRP / সার্চ-ক্যাটাগরি পেজ
6. কার্ট + চেকআউট
7. অ্যাকাউন্ট / অর্ডার ট্র্যাকিং
8. অ্যাডমিন প্যানেল (`/admin`)
9. SEO redirects, sitemap, ফাইনাল QA
10. ডোমেইন সুইচ

## ফাইল/ফোল্ডার ম্যাপ (আপডেট হতে থাকবে)

```
(এখনো তৈরি হয়নি)
```

## জানা সমস্যা / টেস্টিং নোট

- (খালি)

## Environment Variables (নাম, value না — value Vercel ড্যাশবোর্ডে থাকবে)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
