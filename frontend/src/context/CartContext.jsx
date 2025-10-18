import React, { createContext, useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    // Khởi tạo trạng thái từ localStorage
    try {
      const stored = localStorage.getItem('cart');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Không thể đọc giỏ hàng từ localStorage", error);
      return [];
    }
  });

  // Lưu trạng thái vào localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, qty = 1) => {
    setCartItems(prev => {
      const exist = prev.find(item => item.product_id === product.id);

      if (exist) {
        //Kiểm tra tồn kho trước khi tăng số lượng**
        const newQty = exist.qty + qty;
        if (product.stock && newQty > product.stock) {
          toast.warn(`Chỉ còn ${product.stock} sản phẩm trong kho!`);
          return prev; // Trả về trạng thái cũ không thay đổi
        }
        
        // Cập nhật số lượng nếu sản phẩm đã tồn tại
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, qty: newQty }
            : item
        );
      } else {
        // Thêm sản phẩm mới vào giỏ hàng
        return [...prev, { 
            product_id: product.id, 
            title: product.title, 
            price: product.price, 
            qty, 
            thumbnail: product.thumbnail,
            stock: product.stock // Lưu lại thông tin tồn kho
        }];
      }
    });

    toast.success(`Đã thêm "${product.title}" vào giỏ hàng!`);
  };

  const updateQty = (product_id, newQty) => {
    setCartItems(prev => prev.map(item => {
      if (item.product_id === product_id) {
        if (item.stock && newQty > item.stock) {
            toast.warn(`Chỉ còn ${item.stock} sản phẩm trong kho!`);
            return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (product_id) => {
    const itemToRemove = cartItems.find(i => i.product_id === product_id);
    setCartItems(prev => prev.filter(i => i.product_id !== product_id));

    // **CẢI TIẾN: Thêm thông báo cho người dùng khi xóa**
    if (itemToRemove) {
        toast.error(`Đã xóa "${itemToRemove.title}" khỏi giỏ hàng.`);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    toast.info("Giỏ hàng đã được dọn sạch!");
  };

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const contextValue = useMemo(() => ({
    cartItems,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    subtotal
  }), [cartItems]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}