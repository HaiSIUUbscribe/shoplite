import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';
import { cartService } from '../services/api';

export const CartContext = createContext(null);

function createBuyNowItem(product, qty, options = {}) {
  const size = options.size || null;
  const color = options.color || null;
  return {
    item_key: `${product.id}:${size || ''}:${color || ''}`,
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

function readBuyNowItem() {
  try {
    const item = JSON.parse(window.sessionStorage.getItem('shoplite_buy_now_v1') || 'null');
    return item && item.product_id ? item : null;
  } catch (error) {
    return null;
  }
}

export function CartProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [buyNowItem, setBuyNowItem] = useState(readBuyNowItem);
  const [loadingCart, setLoadingCart] = useState(true);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setLoadingCart(false);
      return;
    }
    try {
      const data = await cartService.getCart();
      setCartItems(data.items || []);
    } catch (error) {
      if (![401, 403].includes(error.response?.status)) {
        toast.error('Không thể tải giỏ hàng.', { toastId: 'cart-load-error' });
      }
    } finally {
      setLoadingCart(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (buyNowItem) window.sessionStorage.setItem('shoplite_buy_now_v1', JSON.stringify(buyNowItem));
    else window.sessionStorage.removeItem('shoplite_buy_now_v1');
  }, [buyNowItem]);

  const addToCart = useCallback(async (product, qty = 1, options = {}) => {
    if (!user) return false;
    const stock = Number(product.stock);
    if (stock <= 0) {
      toast.warning('Sản phẩm hiện đã hết hàng.');
      return false;
    }

    try {
      await cartService.addToCart(product.id, qty, options.size || null, options.color || null);
      await fetchCart();
      toast.success(`Đã thêm "${product.title}" vào giỏ hàng.`);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng.');
      return false;
    }
  }, [fetchCart, user]);

  const startBuyNow = useCallback((product, qty = 1, options = {}) => {
    if (Number(product.stock) <= 0) {
      toast.warning('Sản phẩm hiện đã hết hàng.');
      return false;
    }
    setBuyNowItem(createBuyNowItem(product, qty, options));
    return true;
  }, []);

  const updateQty = useCallback(async (key, qty) => {
    const nextQty = Number(qty);
    if (nextQty < 1) return;

    // Tìm item trong state
    const item = cartItems.find(i => i.item_key === key);
    if (!item) return;

    if (nextQty > Number(item.stock)) {
      toast.warning(`Sản phẩm chỉ còn ${item.stock} trong kho.`);
      return;
    }

    try {
      await cartService.updateQty(key, nextQty); // item_key chính là id của cart_items
      await fetchCart();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật số lượng thất bại.');
    }
  }, [cartItems, fetchCart]);

  const removeItem = useCallback(async (key) => {
    try {
      await cartService.removeItem(key);
      await fetchCart();
    } catch (error) {
      toast.error('Không thể xóa sản phẩm.');
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      if (user) await cartService.clearCart();
      setCartItems([]);
    } catch (error) {
      if (![401, 403].includes(error.response?.status)) {
        toast.error('Không thể xóa giỏ hàng.', { toastId: 'cart-clear-error' });
      }
    }
  }, [user]);

  const clearBuyNow = useCallback(() => setBuyNowItem(null), []);

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
    loadingCart,
  }), [
    addToCart,
    buyNowItem,
    cartItems,
    clearBuyNow,
    clearCart,
    loadingCart,
    removeItem,
    startBuyNow,
    subtotal,
    totalQuantity,
    updateQty,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
