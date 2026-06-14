'use client';

import { CartProvider, useCart } from './CartContext';
import CartDrawer from './CartDrawer';
import OrderModal from './OrderModal';
import ProductModal from './ProductModal';
import { createContext, useContext, useState } from 'react';

// ProductsContext — passes product list down to ProductModal
const ProductsContext = createContext([]);
export const useProducts = () => useContext(ProductsContext);

function ToastUI() {
  const { toast } = useCart();
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: '#1a1a1a', color: '#fff', padding: '10px 20px',
      borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 99999,
      pointerEvents: 'none', whiteSpace: 'nowrap',
      transition: 'opacity 0.3s, transform 0.3s',
      opacity: toast.visible ? 1 : 0,
      transform: `translateX(-50%) translateY(${toast.visible ? 0 : 10}px)`,
    }}>
      {toast.msg}
    </div>
  );
}

function Modals({ allProducts }) {
  return (
    <>
      <CartDrawer />
      <OrderModal />
      <ProductModal allProducts={allProducts} />
      <ToastUI />
    </>
  );
}

export default function ClientProviders({ children, initialProducts }) {
  return (
    <ProductsContext.Provider value={initialProducts || []}>
      <CartProvider>
        {children}
        <Modals allProducts={initialProducts || []} />
      </CartProvider>
    </ProductsContext.Provider>
  );
}
