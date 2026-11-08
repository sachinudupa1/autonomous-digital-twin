import { useState } from 'react';
import { Navbar } from './Navbar';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ToastContainer } from '../common/Toast';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { AlertCircleIcon } from '../common/Icons';

export function AppLayout({ currentPage, onNavigate, children }) {
  const { logout, currentGuest } = useAuth();
  const { clearCart } = useCart();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleConfirmLogout = () => {
    clearCart();
    logout();
    setIsLogoutModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans antialiased">
      {/* E-Commerce Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onRequestLogout={() => setIsLogoutModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* E-Commerce Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">AutoPack</span>
            <span>•</span>
            <span>Autonomous Digital Twin Customer Portal</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>Fixed Catalog Pricing</span>
            <span>•</span>
            <span>Instant Demo Wallet</span>
            <span>•</span>
            <span>Autonomous Packaging Line</span>
          </div>
        </div>
      </footer>

      {/* Toast Feedback */}
      <ToastContainer />

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Session Logout"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-50 border border-[#FFD400] text-slate-800">
            <AlertCircleIcon className="w-5 h-5 text-[#FF7900] shrink-0 mt-0.5" />
            <p className="text-xs font-semibold">
              Are you sure you want to end active session for{' '}
              <span className="font-bold font-mono text-[#FF7900]">{currentGuest?.guestId}</span>?
            </p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your temporary session cart items will be cleared. All saved orders, transactions, and wallet balance will remain preserved in your demo profile.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="pink"
              size="sm"
              onClick={handleConfirmLogout}
            >
              Confirm Logout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
