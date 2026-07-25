import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { idFromSlug, makeSlug, DEFAULT_PRODS } from '@/lib/productData';
import ProductDetailClient from './ProductDetailClient';

// /product/[slug] is a real, standalone route (owner's decision, same call as /srp —
// see app/srp/page.js's comment). Legacy's 19-product-full-page.html is a `.pp-overlay`
// with display:none by default that ClientHome toggled via history.replaceState() +
// a `_panelStack` hack; that entire state machine is replaced by normal Next.js
// routing here. `slug` accepts either the full legacy-style slug
// (`makeSlug(name)+'-'+id`, e.g. "gearup-nrgb50-5m-rgb-neon-light-1") or a bare id
// (e.g. "1") — see findProdBySlug()/idFromSlug() in lib/productData.js.
//
// No site Navbar/Footer here on purpose, mirroring /srp — the page has its own
// pp-nav header (back button + breadcrumb) per the legacy markup.

const SITE_URL = 'https://vangcur.com';

async function fetchMetaProduct(id) {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('custom_products')
      .select('id,name,price,old,imgs,desc_text,stock')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) return data;
  } catch (e) {
    // fall through to DEFAULT_PRODS below
  }
  return DEFAULT_PRODS.find((p) => String(p.id) === String(id)) || null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const p = id ? await fetchMetaProduct(id) : null;

  if (!p) {
    return {
      title: 'প্রোডাক্ট পাওয়া যায়নি - Vangcur',
      robots: { index: false, follow: true },
    };
  }

  const title = `${p.name} - ৳${Number(p.price).toLocaleString()} | Vangcur`;
  const rawDesc = p.desc_text || p.desc || '';
  const description = rawDesc
    ? (rawDesc.length > 160 ? rawDesc.slice(0, 157) + '...' : rawDesc)
    : `${p.name} মাত্র ৳${Number(p.price).toLocaleString()} টাকায়, Vangcur-এ। দ্রুত ডেলিভারি, সেরা দাম।`;
  const imgs = Array.isArray(p.imgs) ? p.imgs : [];
  const firstImg = imgs.find((im) => typeof im === 'string' && im.startsWith('http'));
  const canonicalSlug = `${makeSlug(p.name)}-${p.id}`;

  return {
    title,
    description,
    alternates: { canonical: `/product/${canonicalSlug}` },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/product/${canonicalSlug}`,
      title,
      description,
      images: firstImg ? [{ url: firstImg, width: 800, height: 800, alt: p.name }] : undefined,
      locale: 'bn_BD',
      siteName: 'Vangcur',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: firstImg ? [firstImg] : undefined,
    },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  return <ProductDetailClient slug={slug} initialId={id} />;
                           }
