import './globals.css';
import ClientProviders from './components/ClientProviders';

export const metadata = {
  title: 'Vangcur - ভাঙচুর | Your First Choice for Gadgets',
  description: 'Vangcur - বাংলাদেশের সেরা গ্যাজেট শপ। TWS ইয়ারবাড, LED ল্যাম্প, স্মার্টওয়াচ ও আরও অনেক কিছু। দ্রুত ডেলিভারি, সেরা দাম।',
  keywords: 'গ্যাজেট, earbuds, smartwatch, LED lamp, Bangladesh, online shop, vangcur, ভাঙচুর',
  authors: [{ name: 'Vangcur' }],
  robots: 'index, follow',
  alternates: { canonical: 'https://vangcur.com/' },
  openGraph: {
    type: 'website',
    url: 'https://vangcur.com/',
    title: 'Vangcur - ভাঙচুর | Your First Choice for Gadgets',
    description: 'বাংলাদেশের সেরা গ্যাজেট শপ। TWS ইয়ারবাড, LED ল্যাম্প, স্মার্টওয়াচ ও আরও অনেক কিছু।',
    images: ['https://res.cloudinary.com/dkjzleczw/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg'],
    locale: 'bn_BD',
    siteName: 'Vangcur',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vangcur - ভাঙচুর | Your First Choice for Gadgets',
    description: 'বাংলাদেশের সেরা গ্যাজেট শপ। TWS ইয়ারবাড, LED ল্যাম্প, স্মার্টওয়াচ ও আরও অনেক কিছু।',
    images: ['https://res.cloudinary.com/dkjzleczw/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg'],
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Vangcur' },
  other: { 'mobile-web-app-capable': 'yes' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1A1A1A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Hind+Siliguri:wght@400;600;700&family=Playfair+Display:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body><ClientProviders>{children}</ClientProviders></body>
    </html>
  );
}
