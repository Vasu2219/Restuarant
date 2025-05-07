import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, setDoc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { useFirebase } from './FirebaseContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { db } = useFirebase();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const cartRef = collection(db, 'cart');
    const q = query(cartRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cartItems = (snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }) as CartItem)
          .filter(item => item.quantity > 0));
        setItems(cartItems);
      },
      (err) => {
        console.error('Error fetching cart:', err);
      }
    );

    return () => unsubscribe();
  }, [db]);

  const addItem = async (item: CartItem) => {
    const cartRef = collection(db, 'cart');
    await setDoc(doc(cartRef, item.id), item);
  };

  const removeItem = async (itemId: string) => {
    const cartRef = collection(db, 'cart');
    await deleteDoc(doc(cartRef, itemId));
  };

  const clearCart = async () => {
    const cartRef = collection(db, 'cart');
    for (const item of items) {
      await setDoc(doc(cartRef, item.id), { quantity: 0 });
    }
  };

  const value = {
    items,
    addItem,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}; 