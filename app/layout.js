import './globals.css';
import Script from 'next/script';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1A1A1A',
};

export const metadata = {
  title: 'Vangcur - ভাঙচুর | Your First Choice for Gadgets',
  description: 'Vangcur - বাংলাদেশের সেরা গ্যাজেট শপ। TWS ইয়ারবাড, LED ল্যাম্প, স্মার্টওয়াচ ও আরও অনেক কিছু। দ্রুত ডেলিভারি, সেরা দাম।',
  keywords: ['গ্যাজেট', 'earbuds', 'smartwatch', 'LED lamp', 'Bangladesh', 'online shop', 'vangcur', 'ভাঙচুর'],
  authors: [{ name: 'Vangcur' }],
  robots: 'index, follow',
  metadataBase: new URL('https://vangcur.com'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://vangcur.com/',
    title: 'Vangcur - ভাঙচুর | Your First Choice for Gadgets',
    description: 'বাংলাদেশের সেরা গ্যাজেট শপ। TWS ইয়ারবাড, LED ল্যাম্প, স্মার্টওয়াচ ও আরও অনেক কিছু। দ্রুত ডেলিভারি, সেরা দাম।',
    images: [{
      url: 'https://res.cloudinary.com/dkjzleczw/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg',
      width: 1200,
      height: 630,
      alt: 'Vangcur - ভাঙচুর',
    }],
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
  appleWebApp: {
    capable: true,
    title: 'Vangcur',
    statusBarStyle: 'default',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'color-scheme': 'light',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        {/* Fonts — legacy-র মতো একই */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Hind+Siliguri:wght@400;600;700&family=Playfair+Display:wght@700;800&display=swap"
          rel="stylesheet"
        />
        {/* Cloudinary CDN preconnect */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Hero ছবি preload */}
        <link
          rel="preload"
          as="image"
          fetchPriority="high"
          href="https://res.cloudinary.com/dkjzleczw/image/upload/w_600,q_auto,f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg"
        />
        <link
          rel="preload"
          as="image"
          fetchPriority="high"
          href="https://res.cloudinary.com/dkjzleczw/image/upload/w_600,q_auto,f_auto/v1779535309/Enhancer-AI_UHD-Like_20260521_213052_0000_tq4ud1.png"
        />
      </head>
      <body>
        {children}
        {/* Microsoft Clarity */}
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "x0me4a9xh8");`}
        </Script>
      </body>
    </html>
  );
}
