// app/api/search/route.js — প্রোডাক্ট সার্চ API
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const sb = getSupabaseServerClient();
    const { data, error } = await sb
      .from('custom_products')
      .select('id,name,price,image_url,imgs')
      .ilike('name', `%${q}%`)
      .limit(8);

    if (error) throw error;

    const results = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: p.image_url || (
        Array.isArray(p.imgs) ? p.imgs[0] :
        (p.imgs ? JSON.parse(p.imgs)[0] : null)
      ),
    }));

    return NextResponse.json({ results });
  } catch (e) {
    console.error('Search error:', e);
    return NextResponse.json({ results: [] });
  }
}
