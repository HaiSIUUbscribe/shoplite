import React, { createContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

export const CartContext = createContext(null);

function itemKey(productId, size = '', color = '') {
  return `${productId}:${size || ''}:${color || ''}`;
}

function createCheckoutItem(product, qty, options = {}) {
  const size = options.size || null;
  const color = options.color || null;
  return {
    item_key: itemKey(product.id, size, color),
    product_id: product.id,
    title: product.title,
    price: Number(product.price),
    qty: Math.max(1, Number(qty) || 1),
    size,
    color,
    thumbnail: product.thumbnail,
    stock: Number(product.stock),
  };
}

function readStoredItems(key, fallback) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
    return Array.isArray(stored)
      ? stored.map((item) => ({ ...item, item_key: item.item_key || itemKey(item.product_id, item.size, item.color) }))
      : fallback;
  } catch (error) {
    return fallback;
  }
}

function readBuyNowItem() {
  try {
    const item = JSON.parse(window.sessionStorage.getItem('shoplite_buy_now_v1') || 'null');
    return item && item.product_id ? item : null;
  } catch (error) {
    return null;
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => readStoredItems('shoplite_cart_v3', []));
  const [buyNowItem, setBuyNowItem] = useState(readBuyNowItem);

  useEffect(() => {
    window.localStorage.setItem('shoplite_cart_v3', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (buyNowItem) window.sessionStorage.setItem('shoplite_buy_now_v1', JSON.stringify(buyNowItem));
    else window.sessionStorage.removeItem('shoplite_buy_now_v1');
  }, [buyNowItem]);

  const addToCart = (product, qty = 1, options = {}) => {
    const stock = Number(product.stock);
    const nextItem = createCheckoutItem(product, qty, options);
    if (stock <= 0) {
      toast.warning('Sản phẩm hiện đã hết hàng.');
      return false;
    }

    let added = false;
    setCartItems((current) => {
      const existing = current.find((item) => item.item_key === nextItem.item_key);
      const nextQty = (existing?.qty || 0) + nextItem.qty;
      if (nextQty > stock) {
        toast.warning(`Sản phẩm chỉ còn ${stock} trong kho.`);
        return current;
      }
      added = true;
      if (existing) {
        return current.map((item) => item.item_key === nextItem.item_key ? { ...item, qty: nextQty, stock } : item);
      }
      return [...current, nextItem];
    });
    if (added) toast.success(`Đã thêm "${product.title}" vào giỏ hàng.`);
    return added;
  };

  const startBuyNow = (product, qty = 1, options = {}) => {
    if (Number(product.stock) <= 0) {
      toast.warning('Sản phẩm hiện đã hết hàng.');
      return false;
    }
    setBuyNowItem(createCheckoutItem(product, qty, options));
    return true;
  };

  const updateQty = (key, qty) => {
    const nextQty = Number(qty);
    if (nextQty < 1) return;
    setCartItems((current) => current.map((item) => {
      if (item.item_key !== key) return item;
      if (nextQty > Number(item.stock)) {
        toast.warning(`Sản phẩm chỉ còn ${item.stock} trong kho.`);
        return item;
      }
      return { ...item, qty: nextQty };
    }));
  };

  const removeItem = (key) => setCartItems((current) => current.filter((item) => item.item_key !== key));
  const clearCart = () => setCartItems([]);
  const clearBuyNow = () => setBuyNowItem(null);
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const totalQuantity = cartItems.reduce((sum, item) => sum + Number(item.qty), 0);

  const value = useMemo(() => ({
    cartItems,
    buyNowItem,
    addToCart,
    startBuyNow,
    updateQty,
    removeItem,
    clearCart,
    clearBuyNow,
    subtotal,
    totalQuantity,
  }), [cartItems, buyNowItem, subtotal, totalQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
