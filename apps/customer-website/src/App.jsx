import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { AuthPage } from './pages/auth/AuthPage';
import { HomePage } from './pages/Home/HomePage';
import { ProductsPage } from './pages/Products/ProductsPage';
import { CartPage } from './pages/Cart/CartPage';
import { CheckoutPage } from './pages/Checkout/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmation/OrderConfirmationPage';
import { MyOrdersPage } from './pages/MyOrders/MyOrdersPage';
import { WalletPage } from './pages/Wallet/WalletPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { ProfilePage } from './pages/Profile/ProfilePage';

import './App.css';

function MainApp() {
  const { isLoggedIn, loading } = useAuth();

  const getInitialPage = () => {
    const hash = window.location.hash.replace('#', '').trim();
    const validPages = ['home', 'products', 'cart', 'checkout', 'orders', 'wallet', 'notifications', 'profile'];
    return validPages.includes(hash) ? hash : 'home';
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [navParams, setNavParams] = useState({});

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      const validPages = ['home', 'products', 'cart', 'checkout', 'orders', 'wallet', 'notifications', 'profile'];
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page, params = {}) => {
    setCurrentPage(page);
    setNavParams(params);
    window.location.hash = `#${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#FF7900] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Portal...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Guest Registration & Login Screen
  if (!isLoggedIn) {
    return <AuthPage />;
  }

  // Render active page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'products':
        return <ProductsPage onNavigate={navigateTo} navParams={navParams} />;
      case 'cart':
        return <CartPage onNavigate={navigateTo} />;
      case 'checkout':
        return <CheckoutPage onNavigate={navigateTo} />;
      case 'confirmation':
        return <OrderConfirmationPage order={navParams?.order} onNavigate={navigateTo} />;
      case 'orders':
        return <MyOrdersPage onNavigate={navigateTo} navParams={navParams} />;
      case 'wallet':
        return <WalletPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onNavigate={navigateTo}>
      {renderCurrentPage()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
