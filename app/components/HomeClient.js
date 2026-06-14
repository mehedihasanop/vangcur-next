'use client';

import { useCart } from './CartContext';
import ProductGrid from './ProductGrid';
import { useEffect } from 'react';

export default function HomeClient({ initialProducts }) {
  const { quickOrder, addToCart, openProduct } = useCart();

  useEffect(() => {
    if (initialProducts?.length) {
      window.__vc_products = initialProducts;
    }
  }, [initialProducts]);

  function handleQuickOrder(product) {
    quickOrder(product);
  }

  function handleAddToCart(product) {
    addToCart(product);
  }

  function handleOpenModal(product) {
    openProduct(product.id);
  }

  return (
    <ProductGrid
      initialProducts={initialProducts}
      onQuickOrder={handleQuickOrder}
      onAddToCart={handleAddToCart}
      onOpenModal={handleOpenModal}
    />
  );
}
