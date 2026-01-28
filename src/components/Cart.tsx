import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Minus, ArrowLeft, Check, X } from 'lucide-react';
import { CartItem } from '../types';

const CART_SCROLL_KEY = 'reina_cartContainerScrollPos';
const SKIP_SCROLL_RESTORE_KEY = 'reina_skipScrollRestore';

interface CartProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalPrice,
  onContinueShopping,
  onCheckout
}) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const cartScrollRef = useRef<HTMLDivElement>(null);
  const previousCartItemsLengthRef = useRef(cartItems.length);

  // Restore scroll position when cart opens (unless coming from item added)
  useEffect(() => {
    const skipRestore = localStorage.getItem(SKIP_SCROLL_RESTORE_KEY);
    if (!skipRestore && cartScrollRef.current) {
      const savedScroll = localStorage.getItem(CART_SCROLL_KEY);
      if (savedScroll) {
        setTimeout(() => {
          if (cartScrollRef.current) {
            cartScrollRef.current.scrollTop = parseInt(savedScroll, 10);
          }
        }, 100);
      }
    } else if (skipRestore) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (cartScrollRef.current) {
        cartScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      localStorage.removeItem(SKIP_SCROLL_RESTORE_KEY);
    }
  }, []);

  // Save cart container scroll position
  useEffect(() => {
    const el = cartScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      localStorage.setItem(CART_SCROLL_KEY, String(el.scrollTop));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      localStorage.setItem(CART_SCROLL_KEY, String(el.scrollTop));
    };
  }, []);

  // Scroll cart container to top when new items are added
  useEffect(() => {
    if (cartItems.length > previousCartItemsLengthRef.current && cartScrollRef.current) {
      cartScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    previousCartItemsLengthRef.current = cartItems.length;
  }, [cartItems.length]);

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) setSelectedItems(new Set());
  };

  const toggleItemSelection = (itemId: string) => {
    const next = new Set(selectedItems);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setSelectedItems(next);
  };

  const selectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  const deleteSelected = () => {
    selectedItems.forEach(id => removeFromCart(id));
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="mb-3 flex justify-center">
            <img
              src="/logo.png"
              alt="Reina Shop Logo"
              className="h-20 sm:h-24 md:h-28 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h2 className="text-xl font-medium text-cafe-text mb-1.5">Your cart is empty</h2>
          <p className="text-sm text-cafe-textMuted mb-4">Add some currency packages to get started!</p>
          <button
            onClick={onContinueShopping}
            className="text-white text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-all duration-200"
            style={{ backgroundColor: '#DC2626' }}
          >
            Browse Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-4xl mx-auto px-4 py-4" style={{ maxHeight: 'calc(100vh - 120px)', height: 'calc(100vh - 120px)', minHeight: 0 }}>
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <button
          onClick={onContinueShopping}
          aria-label="Back"
          className="flex items-center text-cafe-textMuted hover:text-cafe-primary transition-colors duration-200 p-1"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-semibold text-cafe-text whitespace-nowrap text-center flex-1">Cart</h1>
        {selectionMode ? (
          <button
            onClick={toggleSelectionMode}
            className="text-cafe-primary hover:text-cafe-secondary transition-colors duration-200 whitespace-nowrap text-sm"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={toggleSelectionMode}
            className="text-cafe-primary hover:text-cafe-secondary transition-colors duration-200 whitespace-nowrap text-sm"
          >
            Select
          </button>
        )}
      </div>

      {selectionMode && (
        <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
          <button
            onClick={selectAll}
            className="text-xs text-cafe-text hover:text-cafe-primary transition-colors duration-200"
          >
            {selectedItems.size === cartItems.length ? 'Deselect All' : 'Select All'}
          </button>
          {selectedItems.size > 0 && (
            <button
              onClick={deleteSelected}
              className="text-xs text-red-400 hover:text-red-300 transition-colors duration-200 flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete ({selectedItems.size})
            </button>
          )}
        </div>
      )}

      <div
        ref={cartScrollRef}
        className="flex-1 overflow-y-auto mb-4 min-h-0"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="glass-card rounded-xl overflow-hidden">
          {cartItems.map((item, index) => (
            <div
              key={item.id}
              onClick={selectionMode ? () => toggleItemSelection(item.id) : undefined}
              className={`p-3 ${index !== cartItems.length - 1 ? 'border-b border-cafe-primary/30' : ''} ${selectionMode ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start gap-2">
                {selectionMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItemSelection(item.id);
                    }}
                    className={`flex items-center justify-center w-4 h-4 rounded border transition-all duration-200 flex-shrink-0 mt-0.5 ${
                      selectedItems.has(item.id) ? 'bg-cafe-primary border-cafe-primary text-white' : 'border-cafe-primary/50 bg-transparent'
                    }`}
                  >
                    {selectedItems.has(item.id) && <Check className="h-2.5 w-2.5" />}
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-cafe-text">{item.name}</h3>
                    <span className="text-base font-semibold text-cafe-text">₱{item.totalPrice * item.quantity}</span>
                  </div>
                  <p className="text-xs text-cafe-textMuted mt-0.5">₱{item.totalPrice} each</p>
                  {item.selectedVariation && (
                    <p className="text-xs text-cafe-textMuted">Package: {item.selectedVariation.name}</p>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <p className="text-xs text-cafe-textMuted">
                      Add-ons: {item.selectedAddOns.map(addOn =>
                        addOn.quantity && addOn.quantity > 1 ? `${addOn.name} x${addOn.quantity}` : addOn.name
                      ).join(', ')}
                    </p>
                  )}
                  <div
                    className="mt-2 flex items-center justify-between gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center rounded-full p-0.5 border border-cafe-primary/30 glass">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-cafe-primary/20 rounded-full transition-colors duration-200"
                      >
                        <Minus className="h-3 w-3 text-cafe-primary" />
                      </button>
                      <span className="font-semibold text-cafe-text min-w-[22px] text-center text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-cafe-primary/20 rounded-full transition-colors duration-200"
                      >
                        <Plus className="h-3 w-3 text-cafe-primary" />
                      </button>
                    </div>
                    {!selectionMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id);
                        }}
                        className="p-1 text-cafe-primary hover:bg-cafe-primary/20 rounded-full transition-colors duration-200"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 flex-shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between text-lg font-semibold text-cafe-text mb-3">
          <span>Total:</span>
          <span className="text-cafe-text">₱{(getTotalPrice() || 0).toFixed(2)}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onContinueShopping}
            className="flex-1 text-cafe-text py-3 rounded-lg hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] font-medium text-sm border-2 border-cafe-primary/30"
            style={{ backgroundColor: 'transparent' }}
          >
            Add More
          </button>
          <button
            onClick={onCheckout}
            className="flex-1 text-white py-3 rounded-lg hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] font-medium text-sm"
            style={{ backgroundColor: '#DC2626' }}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
