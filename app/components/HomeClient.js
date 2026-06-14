'use client';

import { useCart } from './CartContext';
import ProductGrid from './ProductGrid';
import { useEffect } from 'react';

// This thin client wrapper connects the server-passed products
// to the CartContext (quickOrder, addToCart, openProduct)
export default function HomeClient({ initialProducts }) {
  const { quickOrder, addToCart, openProduct } = useCart();

  // Register products globally so ProductModal can find them
  useEffect(() => {
    if (initialProducts?.length) {
      window.__vc_products = initialProducts;
    }
  }, [initialProducts]);

  function handleQuickOrder(productId) {
    const product = initialProducts.find(p => String(p.id) === String(productId));
    if (product) quickOrder(product);
  }

  function handleAddToCart(productId) {
    const product = initialProducts.find(p => String(p.id) === String(productId));
    if (product) addToCart(product);
  }

  function handleOpenProduct(productId) {
    openProduct(productId);
  }

  return (
    <ProductGrid
      initialProducts={initialProducts}
      onQuickOrder={handleQuickOrder}
      onAddToCart={handleAddToCart}
      onProductOpen={handleOpenProduct}
    />
  );
}
