# Vangcur — Next.js (Migration in Progress)

বর্তমান লাইভ সাইট vanilla JS (`legacy/index.html`, `legacy/admin.html`) থেকে Next.js (App Router)-এ
ধাপে ধাপে রূপান্তর হচ্ছে।

## প্রজেক্ট চালু করার জন্য (Vercel স্বয়ংক্রিয়ভাবে করে দেবে, লোকালি লাগলে):

```bash
npm install
npm run dev
```

## Environment Variables

`.env.local.example` ফাইল দেখো — Vercel Project → Settings → Environment Variables-এ
একই নাম/মান বসাতে হবে (Production + Preview দুটোতেই)।

## ফোল্ডার স্ট্রাকচার

- `app/` — Next.js App Router পেজ ও লেআউট
- `lib/` — Supabase client helper গুলো
- `legacy/` — পুরোনো vanilla JS সাইটের কোড (রেফারেন্সের জন্য, কোডে import হয় না)
- `PROGRESS.md` — মাইগ্রেশনের status ট্র্যাকিং (প্রতি Claude সেশনে এটা পড়তে/আপডেট করতে হবে)
- `MASTER_PROMPT.md` — নতুন Claude চ্যাট শুরু করার সময় paste করার টেমপ্লেট
