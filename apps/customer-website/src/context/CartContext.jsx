import { useState, useEffect } from 'react';
import { CartContext } from './cartContextInstance';
import { QUANTITY_LIMITS } from '../constants/config';

const CART_STORAGE_KEY = 'adt_session_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save cart to sessionStorage', e);
    }
  }, [items]);

  const addToCart = (product, quantityToAdd = 1) => {
    if (quantityToAdd <= 0) return;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = Math.min(
          QUANTITY_LIMITS.max,
          updated[existingIndex].quantity + quantityToAdd
        );
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      } else {
        const qty = Math.min(QUANTITY_LIMITS.max, Math.max(1, quantityToAdd));
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.name,
            title: product.title,
            price: product.price,
            color: product.color,
            quantity: qty,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    setItems((prevItems) => {
      if (newQuantity <= 0) {
        return prevItems.filter((item) => item.id !== productId);
      }
      const capped = Math.min(QUANTITY_LIMITS.max, newQuantity);
      return prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: capped } : item
      );
    });
  };

  const removeFromCart = (productId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    sessionStorage.removeItem(CART_STORAGE_KEY);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
