import { useState, useRef, useEffect } from 'react';
import { UserIcon, ChevronDownIcon, WalletIcon } from '../common/Icons';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';

export function GuestDropdown({ onNavigate, onRequestLogout }) {
  const { currentGuest } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentGuest) return null;

  // Short initials e.g. "G1" from "Guest_1"
  const shortInitials = currentGuest.guestId.replace('Guest_', 'G');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white transition-all cursor-pointer text-left"
        aria-expanded={isOpen}
      >
        <div className="w-7 h-7 rounded-full bg-[#FFD400] text-slate-900 font-black text-xs flex items-center justify-center shrink-0">
          {shortInitials}
        </div>
        <span className="text-xs font-bold text-slate-800 hidden sm:inline">
          {currentGuest.guestId}
        </span>
        <ChevronDownIcon className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in duration-100">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
            <p className="text-[11px] text-slate-500 font-semibold">Active Guest</p>
            <p className="text-sm font-black text-slate-900">{currentGuest.guestId}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-[#16A34A] bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
              <WalletIcon className="w-3.5 h-3.5" />
              <span>Balance: {formatCurrency(currentGuest.walletBalance)}</span>
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('profile');
              }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>My Profile</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('wallet');
              }}
              className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <WalletIcon className="w-4 h-4 text-slate-400" />
              <span>Wallet & Transactions</span>
            </button>
          </div>

          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onRequestLogout();
              }}
              className="w-full text-left px-4 py-2 text-xs font-bold text-[#FF4F9A] hover:bg-pink-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
