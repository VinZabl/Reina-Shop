import React from 'react';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';

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
  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="mb-4 flex justify-center">
            <img 
              src="/logo.png" 
              alt="Reina Shop Logo"
              className="h-24 sm:h-32 md:h-40 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h2 className="text-2xl font-medium text-cafe-text mb-2">Your cart is empty</h2>
          <p className="text-cafe-textMuted mb-6">Add some currency packages to get started!</p>
          <button
            onClick={onContinueShopping}
            className="text-white px-6 py-3 rounded-full hover:opacity-90 transition-all duration-200"
            style={{ backgroundColor: '#DC2626' }}
          >
            Browse Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-4xl mx-auto px-4 py-8" style={{ maxHeight: 'calc(100vh - 120px)', height: 'calc(100vh - 120px)', minHeight: 0 }}>
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <button
          onClick={onContinueShopping}
          aria-label="Back"
          className="flex items-center text-cafe-textMuted hover:text-cafe-primary transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-semibold text-cafe-text whitespace-nowrap text-center flex-1">Cart</h1>
        <button
          onClick={clearCart}
          className="text-cafe-primary hover:text-cafe-secondary transition-colors duration-200 whitespace-nowrap"
        >
          Clear All
        </button>
      </div>

      <div 
        className="flex-1 overflow-y-auto mb-6 min-h-0"
        style={{ 
          WebkitOverflowScrolling: 'touch', 
          overscrollBehavior: 'contain'
        }}
      >
        <div className="glass-card rounded-xl overflow-hidden">
          {cartItems.map((item, index) => (
            <div key={item.id} className={`p-6 ${index !== cartItems.length - 1 ? 'border-b border-cafe-primary/30' : ''}`}>
              <div className="flex">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-cafe-text mb-1">{item.name}</h3>
                  {item.selectedVariation && (
                    <p className="text-sm text-cafe-textMuted mb-1">Package: {item.selectedVariation.name}</p>
                  )}
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <p className="text-sm text-cafe-textMuted mb-1">
                      Add-ons: {item.selectedAddOns.map(addOn => 
                        addOn.quantity && addOn.quantity > 1 
                          ? `${addOn.name} x${addOn.quantity}`
                          : addOn.name
                      ).join(', ')}
                    </p>
                  )}
                  <p className="text-lg font-semibold text-cafe-text">₱{item.totalPrice} each</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-3 glass rounded-full p-1 border border-cafe-primary/30">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-cafe-primary/20 rounded-full transition-colors duration-200"
                  >
                    <Minus className="h-4 w-4 text-cafe-primary" />
                  </button>
                  <span className="font-semibold text-cafe-text min-w-[32px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-cafe-primary/20 rounded-full transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 text-cafe-primary" />
                  </button>
                </div>

                <div className="flex items-center space-x-4 ml-auto">
                  <p className="text-lg font-semibold text-cafe-text">₱{item.totalPrice * item.quantity}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-cafe-primary hover:text-cafe-secondary hover:bg-cafe-primary/20 rounded-full transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 flex-shrink-0" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between text-2xl font-semibold text-cafe-text mb-6">
          <span>Total:</span>
          <span className="text-cafe-text">₱{(getTotalPrice() || 0).toFixed(2)}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onContinueShopping}
            className="flex-1 text-cafe-text py-4 rounded-xl hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] font-medium text-lg border-2 border-cafe-primary/30"
            style={{ backgroundColor: 'transparent' }}
          >
            Add More
          </button>
          <button
            onClick={onCheckout}
            className="flex-1 text-white py-4 rounded-xl hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] font-medium text-lg"
            style={{ backgroundColor: '#DC2626' }}
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;