import { useState, useCallback, useEffect } from 'react';
import { CartItem, MenuItem, Variation, AddOn } from '../types';

const CART_STORAGE_KEY = 'reina_cart_items';

const loadCartFromStorage = (): CartItem[] => {
  try {
    const s = localStorage.getItem(CART_STORAGE_KEY);
    if (!s) return [];
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCartFromStorage);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist cart so it survives refresh or back navigation
  useEffect(() => {
    try {
      if (cartItems.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch {}
  }, [cartItems]);

  const calculateItemPrice = (item: MenuItem, variation?: Variation, addOns?: AddOn[]) => {
    let price = item.basePrice;
    if (variation) {
      price += variation.price;
    }
    if (addOns) {
      addOns.forEach(addOn => {
        price += addOn.price;
      });
    }
    return price;
  };

  const addToCart = useCallback((item: MenuItem, quantity: number = 1, variation?: Variation, addOns?: AddOn[]) => {
    const totalPrice = calculateItemPrice(item, variation, addOns);
    
    // Normalize add-ons: group by ID and sum quantities
    // Handle both flat arrays (from MenuItemCard) and already-grouped arrays
    const normalizeAddOns = (addOns?: AddOn[]): (AddOn & { quantity: number })[] => {
      if (!addOns || addOns.length === 0) return [];
      
      const grouped = addOns.reduce((acc, addOn) => {
        const existing = acc.find(g => g.id === addOn.id);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + 1;
        } else {
          acc.push({ ...addOn, quantity: addOn.quantity || 1 });
        }
        return acc;
      }, [] as (AddOn & { quantity: number })[]);
      
      return grouped.sort((a, b) => a.id.localeCompare(b.id));
    };
    
    const groupedAddOns = normalizeAddOns(addOns);
    
    // Helper function to create a comparison key for an item
    const createItemKey = (menuItemId: string, selectedVariation?: Variation, selectedAddOns?: AddOn[]) => {
      const variationKey = selectedVariation?.id || 'none';
      const addOnsKey = normalizeAddOns(selectedAddOns)
        .map(a => `${a.id}:${a.quantity}`)
        .sort()
        .join(',') || 'none';
      return `${menuItemId}|${variationKey}|${addOnsKey}`;
    };
    
    setCartItems(prev => {
      const newItemKey = createItemKey(item.id, variation, addOns);
      
      const existingItem = prev.find(cartItem => {
        // Extract original menu item id from cart item id (format: "menuItemId:::CART:::timestamp-random")
        // Use ::: as separator since it won't appear in UUIDs
        const parts = cartItem.id.split(':::CART:::');
        const originalMenuItemId = parts.length > 1 ? parts[0] : cartItem.id.split('-')[0];
        const cartItemKey = createItemKey(originalMenuItemId, cartItem.selectedVariation, cartItem.selectedAddOns);
        return cartItemKey === newItemKey;
      });
      
      if (existingItem) {
        // Item already exists, increment quantity
        return prev.map(cartItem =>
          cartItem === existingItem
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        // New item, add to cart with unique id that preserves original menu item id
        const uniqueId = `${item.id}:::CART:::${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return [...prev, { 
          ...item,
          id: uniqueId,
          quantity,
          selectedVariation: variation,
          selectedAddOns: groupedAddOns,
          totalPrice
        }];
      }
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  }, []);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
  }, [cartItems]);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return {
    cartItems,
    isCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    openCart,
    closeCart
  };
};