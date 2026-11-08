import { useState } from 'react';
import { AutoPackLogo, CartIcon, SearchIcon, MenuIcon, CloseIcon } from '../common/Icons';
import { useCart } from '../../hooks/useCart';
import { NotificationDropdown } from '../navigation/NotificationDropdown';
import { GuestDropdown } from '../navigation/GuestDropdown';

export function Navbar({ currentPage, onNavigate, onRequestLogout }) {
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'My Orders' },
    { id: 'wallet', label: 'Wallet' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('products', { search: searchQuery.trim() });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Mobile hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="cursor-pointer text-left focus:outline-none"
            >
              <AutoPackLogo />
            </button>
          </div>

          {/* Desktop Search Bar (Matches Reference Images) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex flex-1 max-w-md items-center relative"
          >
            {/* Clickable search icon — submits the form */}
            <button
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#FF7900] transition-colors cursor-pointer p-0.5"
              aria-label="Submit search"
            >
              <SearchIcon className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand, colour or name…"
              className="w-full h-10 pl-9 pr-4 text-xs font-medium rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF7900] focus:ring-2 focus:ring-[#FF7900]/20 outline-none transition-all placeholder:text-slate-400"
            />
          </form>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FF7900] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Cart, Notifications, Guest Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Icon with badge */}
            <button
              type="button"
              onClick={() => onNavigate('cart')}
              className="relative p-2 rounded-full border border-slate-200 hover:border-slate-300 bg-white transition-all cursor-pointer text-slate-700 hover:text-[#FF7900]"
              aria-label="View shopping cart"
            >
              <CartIcon className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#FF4F9A] text-[10px] font-black text-white border-2 border-white shadow-xs animate-in zoom-in-75">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <NotificationDropdown onNavigate={onNavigate} />

            {/* Guest Dropdown */}
            <GuestDropdown onNavigate={onNavigate} onRequestLogout={onRequestLogout} />
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative mb-2">
            <button
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#FF7900] transition-colors cursor-pointer p-0.5"
              aria-label="Submit search"
            >
              <SearchIcon className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand, colour or name…"
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-[#FF7900]"
            />
          </form>

          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FF7900] text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
