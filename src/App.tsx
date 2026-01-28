import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useCart } from './hooks/useCart';
import Header from './components/Header';
import SubNav from './components/SubNav';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import FloatingSupportButton from './components/FloatingSupportButton';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import { useMenu } from './hooks/useMenu';

const CUSTOMER_VIEW_KEY = 'reina_customer_view';
const CUSTOMER_CATEGORY_KEY = 'reina_customer_category';
const CUSTOMER_SEARCH_KEY = 'reina_customer_search';

function getInitialView(): 'menu' | 'cart' | 'checkout' {
  try {
    const v = localStorage.getItem(CUSTOMER_VIEW_KEY);
    if (v === 'menu' || v === 'cart' || v === 'checkout') return v;
  } catch {}
  return 'menu';
}

function getInitialCategory(): string {
  try {
    const c = localStorage.getItem(CUSTOMER_CATEGORY_KEY);
    if (c != null && c !== '') return c;
  } catch {}
  return 'all';
}

function getInitialSearch(): string {
  try {
    const s = localStorage.getItem(CUSTOMER_SEARCH_KEY);
    if (s != null) return s;
  } catch {}
  return '';
}

function MainApp() {
  const cart = useCart();
  const { menuItems } = useMenu();
  const [currentView, setCurrentView] = React.useState<'menu' | 'cart' | 'checkout'>(getInitialView);
  const [selectedCategory, setSelectedCategory] = React.useState<string>(getInitialCategory);
  const [searchQuery, setSearchQuery] = React.useState<string>(getInitialSearch);

  // Persist customer page state so it survives refresh or accidental back
  React.useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_VIEW_KEY, currentView);
    } catch {}
  }, [currentView]);
  React.useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_CATEGORY_KEY, selectedCategory);
    } catch {}
  }, [selectedCategory]);
  React.useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_SEARCH_KEY, searchQuery);
    } catch {}
  }, [searchQuery]);

  const handleViewChange = (view: 'menu' | 'cart' | 'checkout') => {
    setCurrentView(view);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== '') {
      setSelectedCategory('all');
    }
  };

  // When item is added from package selection modal, go to cart (skip scroll restore so cart scrolls to top)
  const handleItemAdded = React.useCallback(() => {
    try {
      localStorage.setItem('reina_skipScrollRestore', 'true');
    } catch {}
    setCurrentView('cart');
  }, []);

  // Check if there are any popular items
  const hasPopularItems = React.useMemo(() => {
    return menuItems.some(item => Boolean(item.popular) === true);
  }, [menuItems]);

  // If on cart or checkout but cart is empty, go back to menu
  React.useEffect(() => {
    if ((currentView === 'cart' || currentView === 'checkout') && cart.cartItems.length === 0) {
      setCurrentView('menu');
    }
  }, [currentView, cart.cartItems.length]);

  // If user is on popular category but there are no popular items, redirect to 'all'
  React.useEffect(() => {
    if (selectedCategory === 'popular' && !hasPopularItems && menuItems.length > 0) {
      setSelectedCategory('all');
    }
  }, [hasPopularItems, selectedCategory, menuItems.length]);

  // Filter menu items based on selected category and search query
  const filteredMenuItems = React.useMemo(() => {
    let filtered = menuItems;

    // First filter by category
    if (selectedCategory === 'popular') {
      filtered = filtered.filter(item => Boolean(item.popular) === true);
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Then filter by search query if present
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#0A0A0A' }}>
      {/* Background logo with 20% opacity - appears on all customer pages */}
      <div 
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/logo.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity: 0.1
        }}
      />
      
      <Header 
        cartItemsCount={cart.getTotalItems()}
        onCartClick={() => handleViewChange('cart')}
        onMenuClick={() => handleViewChange('menu')}
      />
      {currentView === 'menu' && (
        <SubNav 
          selectedCategory={selectedCategory} 
          onCategoryClick={handleCategoryClick}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          hasPopularItems={hasPopularItems}
        />
      )}
      
      {currentView === 'menu' && (
        <Menu 
          menuItems={filteredMenuItems}
          addToCart={cart.addToCart}
          cartItems={cart.cartItems}
          updateQuantity={cart.updateQuantity}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onItemAdded={handleItemAdded}
        />
      )}
      
      {currentView === 'cart' && (
        <Cart
          cartItems={cart.cartItems}
          updateQuantity={cart.updateQuantity}
          removeFromCart={cart.removeFromCart}
          clearCart={cart.clearCart}
          getTotalPrice={cart.getTotalPrice}
          onContinueShopping={() => handleViewChange('menu')}
          onCheckout={() => handleViewChange('checkout')}
        />
      )}
      
      {currentView === 'checkout' && (
        <Checkout
          cartItems={cart.cartItems}
          totalPrice={cart.getTotalPrice()}
          onBack={() => handleViewChange('cart')}
          onNavigateToMenu={() => {
            cart.clearCart();
            handleViewChange('menu');
          }}
        />
      )}
      
      <FloatingSupportButton />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;