// lib/data.js — Server Component data fetching (ISR 60s)

import { getSupabaseServerClient } from './supabaseServer';

// ============================================================
// Store Settings
// ============================================================
export async function getStoreSettings() {
  try {
    const sb = getSupabaseServerClient();
    // Try both possible column names: 'key'/'value' OR 'setting_key'/'setting_value'
    let { data, error } = await sb
      .from('store_settings')
      .select('setting_key,setting_value');

    if (error || !data?.length) {
      // fallback: try 'key','value'
      const res2 = await sb.from('store_settings').select('key,value');
      if (!res2.error && res2.data?.length) {
        data = res2.data.map(r => ({ setting_key: r.key, setting_value: r.value }));
      }
    }

    const settings = {};
    (data || []).forEach(row => {
      const k = row.setting_key || row.key;
      const v = row.setting_value ?? row.value;
      try {
        settings[k] = typeof v === 'string' ? JSON.parse(v) : v;
      } catch {
        settings[k] = v;
      }
    });
    return settings;
  } catch (e) {
    console.error('getStoreSettings error:', e);
    return {};
  }
}

// ============================================================
// Products — custom_products table থেকে
// ============================================================
export async function getProducts() {
  try {
    const sb = getSupabaseServerClient();
    const { data, error } = await sb
      .from('custom_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(p => ({
      id: p.id,
      name: p.name || '',
      price: Number(p.price) || 0,
      old: Number(p.old_price || p.old || p.price) || 0,
      stock: p.stock !== undefined ? Number(p.stock) : 1,
      category: p.category || p.cat || '',
      imgs: (() => {
        if (Array.isArray(p.imgs)) return p.imgs;
        if (p.imgs) { try { return JSON.parse(p.imgs); } catch { return [p.imgs]; } }
        if (p.image_url) return [p.image_url];
        return ['📦'];
      })(),
      image_url: p.image_url || (Array.isArray(p.imgs) ? p.imgs[0] : null),
      badge: p.badge || '',
      rating: Number(p.rating) || 4.5,
      specs_short: p.specs_short || '',
      discountColor: p.discount_color || p.discountColor || '',
      description: p.description || '',
    }));
  } catch (e) {
    console.error('getProducts error:', e);
    return [];
  }
}

// ============================================================
// Customer Reviews (gallery)
// ============================================================
export async function getCustomerReviews(limit = 30) {
  try {
    const sb = getSupabaseServerClient();
    const { data, error } = await sb
      .from('customer_reviews')
      .select('id,image_url,like_count,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('getCustomerReviews error:', e);
    return [];
  }
}

// ============================================================
// Single Product
// ============================================================
export async function getProductById(id) {
  try {
    const sb = getSupabaseServerClient();
    const { data, error } = await sb
      .from('custom_products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}
