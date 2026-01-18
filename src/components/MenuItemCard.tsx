import React, { useState, useRef, useEffect } from 'react';
import { X, XCircle } from 'lucide-react';
import { MenuItem, Variation } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity?: number, variation?: Variation) => void;
  quantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onItemAdded?: () => void; // Callback when item is added to cart
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onAddToCart, 
  quantity, 
  onUpdateQuantity,
  onItemAdded
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | undefined>(
    item.variations?.[0]
  );
  const nameRef = useRef<HTMLHeadingElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  // Calculate discounted price for a variation/currency package
  const getDiscountedPrice = (basePrice: number): number => {
    if (item.isOnDiscount && item.discountPercentage !== undefined) {
      const discountAmount = (basePrice * item.discountPercentage) / 100;
      return basePrice - discountAmount;
    }
    return basePrice;
  };

  const handleCardClick = () => {
    if (!item.available) return;
    setShowCustomization(true);
  };

  const handleItemSelect = (variation?: Variation) => {
    onAddToCart(item, 1, variation || selectedVariation);
    setShowCustomization(false);
    setSelectedVariation(item.variations?.[0]);
    // Call the callback to redirect to cart after adding item
    if (onItemAdded) {
      onItemAdded();
    }
  };

  // Check if text overflows and needs scrolling
  useEffect(() => {
    const checkOverflow = () => {
      if (!nameRef.current) return;
      
      const element = nameRef.current;
      const isOverflowing = element.scrollWidth > element.clientWidth;
      setShouldScroll(isOverflowing);
    };

    // Use setTimeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      checkOverflow();
    }, 100);

    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [item.name]);

  return (
    <>
      {/* Uniform vertical layout for all items: image on top, title, subtitle */}
      <div 
        onClick={handleCardClick}
        className={`flex flex-col items-center transition-all duration-300 group rounded-xl overflow-hidden ${!item.available ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} glass-card hover:glass-hover`}
      >
        {/* Game Image Icon on Top - corner to corner */}
        <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-cafe-darkCard to-cafe-darkBg transition-transform duration-300 group-hover:scale-105">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center ${item.image ? 'hidden' : ''}`}>
            {!item.available ? (
              <XCircle className="h-12 w-12 sm:h-16 sm:w-16 opacity-30 text-gray-400" />
            ) : (
              <div className="text-4xl opacity-20 text-gray-400">🎮</div>
            )}
          </div>
        </div>
        
        {/* Game Title and Subtitle - compact padding */}
        <div className="w-full px-2 py-1.5">
          <h4 
            ref={nameRef}
            className={`text-cafe-text font-bold text-center text-xs sm:text-sm mb-0 ${
              shouldScroll ? 'animate-scroll-text' : ''
            }`}
            style={shouldScroll ? {
              display: 'inline-block',
            } : {}}
          >
            {shouldScroll ? (
              <>
                <span>{item.name}</span>
                <span className="mx-4">•</span>
                <span>{item.name}</span>
              </>
            ) : (
              item.name
            )}
          </h4>
          
          {/* Subtitle */}
          {item.subtitle && (
            <p className="text-xs text-cafe-textMuted text-center mt-0.5">
              {item.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Item Selection Modal */}
      {showCustomization && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCustomization(false)}>
          <div 
            className="flex flex-col rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden" 
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1.5px solid rgba(220, 38, 38, 0.5)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.7), 0 2px 8px 0 rgba(220, 38, 38, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="flex-shrink-0 p-6 flex items-center justify-between rounded-t-2xl" 
              style={{ 
                background: 'rgba(26, 26, 26, 0.95)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                zIndex: 20,
                borderBottom: '1.5px solid rgba(220, 38, 38, 0.4)',
                boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-cafe-text">{item.name}</h3>
                  {item.subtitle && (
                    <p className="text-sm text-cafe-textMuted mt-1">{item.subtitle}</p>
                  )}
                  {item.description && (
                    <p className="text-sm text-cafe-textMuted mt-2">{item.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowCustomization(false)}
                className="p-2 hover:bg-cafe-primary/20 rounded-full transition-colors duration-200 flex-shrink-0 ml-2"
              >
                <X className="h-5 w-5 text-cafe-text" />
              </button>
            </div>

            <div 
              className="flex-1 overflow-y-auto min-h-0 relative" 
              style={{ 
                background: 'rgba(26, 26, 26, 0.9)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {/* Fade-out gradient overlay at top - items fade as they approach header */}
              <div
                className="sticky top-0 left-0 right-0 z-10 pointer-events-none"
                style={{
                  height: '32px',
                  background: 'linear-gradient(to bottom, rgba(26, 26, 26, 0.95) 0%, rgba(26, 26, 26, 0.9) 20%, rgba(26, 26, 26, 0.7) 50%, transparent 100%)',
                  marginBottom: '-32px'
                }}
              />
              
              <div className="p-6 pt-4">
                {/* Show currency packages grouped by category */}
                {item.variations && item.variations.length > 0 ? (
                  (() => {
                    // Group variations by category and track category sort order
                    const groupedByCategory: Record<string, { variations: Variation[], categorySort: number }> = {};
                    item.variations.forEach((variation) => {
                      const category = variation.category || 'Uncategorized';
                      const categorySort = variation.sort !== null && variation.sort !== undefined ? variation.sort : 999;
                      
                      if (!groupedByCategory[category]) {
                        groupedByCategory[category] = { variations: [], categorySort: 999 };
                      }
                      groupedByCategory[category].variations.push(variation);
                      // Use the minimum sort value as the category sort order
                      if (categorySort < groupedByCategory[category].categorySort) {
                        groupedByCategory[category].categorySort = categorySort;
                      }
                    });

                    // Sort categories by category sort order (sort field), then alphabetically
                    const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
                      const sortA = groupedByCategory[a].categorySort;
                      const sortB = groupedByCategory[b].categorySort;
                      if (sortA !== sortB) {
                        return sortA - sortB;
                      }
                      return a.localeCompare(b);
                    });

                    // Sort variations within each category by sort_order, then by price
                    sortedCategories.forEach((category) => {
                      groupedByCategory[category].variations.sort((a, b) => {
                        const sortOrderA = a.sort_order || 0;
                        const sortOrderB = b.sort_order || 0;
                        if (sortOrderA !== sortOrderB) {
                          return sortOrderA - sortOrderB;
                        }
                        return a.price - b.price;
                      });
                    });

                    return (
                      <div className="space-y-6">
                        {sortedCategories.map((category, categoryIndex) => (
                          <div key={category}>
                            {/* Category Header */}
                            <h4 className="text-lg font-bold text-cafe-text mb-3">{category}</h4>
                            
                            {/* Packages Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              {groupedByCategory[category].variations.map((variation) => {
                                const originalPrice = variation.price;
                                const discountedPrice = getDiscountedPrice(originalPrice);
                                const isDiscounted = item.isOnDiscount && item.discountPercentage !== undefined;
                                
                                return (
                                  <button
                                    key={variation.id}
                                    onClick={() => handleItemSelect(variation)}
                                    className="bg-cafe-darkCard rounded-lg p-3 text-left group shadow-md relative overflow-hidden package-card-hover border border-cafe-primary/20"
                                    style={{
                                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <div className="font-semibold text-cafe-text text-sm mb-1">
                                        {variation.name}
                                      </div>
                                      {variation.description && (
                                        <div className="text-xs text-cafe-textMuted mb-2 line-clamp-2">
                                          {variation.description}
                                        </div>
                                      )}
                                      <div className="mt-auto">
                                        <div className="text-base font-bold text-cafe-text">
                                          ₱{discountedPrice.toFixed(2)}
                                        </div>
                                        {isDiscounted && (
                                          <div className="flex items-center gap-2 mt-1">
                                            <div className="text-xs text-cafe-textMuted line-through">
                                              ₱{originalPrice.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-cafe-text font-semibold">
                                              -{item.discountPercentage}%
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Divider between categories */}
                            {categoryIndex < sortedCategories.length - 1 && (
                              <div className="border-t border-cafe-primary/30 my-4"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-8 text-cafe-textMuted">
                    No currency packages available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItemCard;