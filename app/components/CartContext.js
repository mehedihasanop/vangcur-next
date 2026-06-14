'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [toast, setToast] = useState({ msg: '', visible: false });
  const [productModal, setProductModal] = useState({ open: false, productId: null });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vc_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch (e) {}
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('vc_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  const showToast = useCallback((msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  }, []);

  const addToCart = useCallback((product, qty = 1) => {
    if (!product || product.stock <= 0) { showToast('❌ স্টক শেষ!'); return; }
    setCart(prev => {
      const existing = prev.find(x => x.id === product.id);
      const currentQty = existing?.qty || 0;
      const available = product.stock - currentQty;
      if (available <= 0) { showToast('❌ স্টক শেষ!'); return prev; }
      const addQty = Math.min(qty, available);
      if (existing) {
        return prev.map(x => x.id === product.id ? { ...x, qty: x.qty + addQty } : x);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        img: Array.isArray(product.imgs) ? product.imgs[0] : (product.image_url || '📦'),
        qty: addQty,
        stock: product.stock,
      }];
    });
    showToast('✅ কার্টে যোগ হয়েছে');
  }, [showToast]);

  const updateQty = useCallback((id, delta) => {
    setCart(prev => {
      const item = prev.find(x => x.id === id);
      if (!item) return prev;
      if (delta < 0 && item.qty <= 1) {
        return prev.filter(x => x.id !== id);
      }
      return prev.map(x => x.id === id ? { ...x, qty: x.qty + delta } : x);
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(x => x.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    try { localStorage.removeItem('vc_cart'); } catch (e) {}
  }, []);

  const quickOrder = useCallback((product) => {
    if (!product || product.stock <= 0) { showToast('❌ স্টক শেষ!'); return; }
    setOrderItems([{
      id: product.id,
      name: product.name,
      price: product.price,
      img: Array.isArray(product.imgs) ? product.imgs[0] : (product.image_url || '📦'),
      qty: 1,
    }]);
    setOrderOpen(true);
  }, [showToast]);

  const checkoutCart = useCallback(() => {
    if (!cart.length) { showToast('কার্ট খালি!'); return; }
    setOrderItems(cart.map(i => ({ ...i })));
    setCartOpen(false);
    setOrderOpen(true);
  }, [cart, showToast]);

  const openProduct = useCallback((productId) => {
    setProductModal({ open: true, productId });
  }, []);

  const closeProduct = useCallback(() => {
    setProductModal({ open: false, productId: null });
  }, []);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{
      cart, totalItems, totalPrice,
      addToCart, updateQty, removeFromCart, clearCart,
      cartOpen, setCartOpen,
      orderOpen, setOrderOpen, orderItems, setOrderItems,
      quickOrder, checkoutCart,
      productModal, openProduct, closeProduct,
      showToast, toast,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
