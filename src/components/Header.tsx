import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemsCount, onCartClick, onMenuClick }) => {
  const { siteSettings } = useSiteSettings();

  return (
    <header className="sticky top-0 z-50 shadow-sm" style={{ 
      border: 'none',
      background: '#1A1A1A',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(220, 38, 38, 0.2)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3">
        <div className="flex items-center justify-between min-h-12 md:min-h-16">
          <button 
            onClick={onMenuClick}
            className="text-white hover:opacity-80 transition-colors duration-200 flex items-center gap-3"
          >
            <img 
              src="/logo.png" 
              alt="Reina Shop Logo"
              className="h-10 sm:h-12 md:h-16 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-base sm:text-lg md:text-xl font-bold text-white whitespace-nowrap">
              Reina Shop
            </span>
          </button>

          <div className="flex items-center space-x-2">
            <button 
              onClick={onCartClick}
              className="relative p-2 text-white hover:opacity-80 hover:bg-white/10 rounded-full transition-all duration-200"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cafe-primary to-cafe-secondary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce-gentle glow-blue" style={{ boxShadow: '0 0 15px rgba(220, 38, 38, 0.6)' }}>
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;