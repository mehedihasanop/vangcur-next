import { DM_Sans, Hind_Siliguri, Playfair_Display } from 'next/font/google';
import './globals.css';

// ============================================================
// Fonts — legacy index.html-এর Google Fonts লিংকের সমতুল্য
// next/font ব্যবহার করলে fonts বিল্ড-টাইমে self-host হয়ে যায়
// (extra network request লাগে না, CLS কম হয়)
// ============================================================
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '600', '700'],
  variable: '--font-hind-siliguri',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata = {
  title: 'Vangcur - ভাঙচুর | Your First Choice for Gadgets',
  description:
    'Vangcur - বাংলাদেশের সেরা গ্যাজেট শপ। TWS ইয়ারবাড, LED ল্যাম্প, স্মার্টওয়াচ ও আরও অনেক কিছু। দ্রুত ডেলিভারি, সেরা দাম।',
  keywords: 'গ্যাজেট, earbuds, smartwatch, LED lamp, Bangladesh, online shop, vangcur, ভাঙচুর',
  authors: [{ name: 'Vangcur' }],
  robots: 'index, follow',
  alternates: {
    canonical: 'https://vangcur.com/',
  },
  openGraph: {
    type: 'website',
    url: 'https://vangcur.com/',
    title: 'Vangcur - ভাঙচুর | Your First Choice for Gadgets',
    description:
      'বাংলাদেশের সেরা গ্যাজেট শপ। TWS ইয়ারবাড, LED ল্যাম্প, স্মার্টওয়াচ ও আরও অনেক কিছু। দ্রুত ডেলিভারি, সেরা দাম।',
    images: [
      'https://res.cloudinary.com/dkjzleczw/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg',
    ],
    locale: 'bn_BD',
    siteName: 'Vangcur',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vangcur - ভাঙচুর | Your First Choice for Gadgets',
    description: 'বাংলাদেশের সেরা গ্যাজেট শপ। TWS ইয়ারবাড, LED ল্যাম্প, স্মার্টওয়াচ ও আরও অনেক কিছু।',
    images: [
      'https://res.cloudinary.com/dkjzleczw/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg',
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vangcur',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1A1A1A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={`${dmSans.variable} ${hindSiliguri.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
