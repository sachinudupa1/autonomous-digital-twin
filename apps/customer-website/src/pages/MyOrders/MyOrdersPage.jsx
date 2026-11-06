import { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { customerService } from '../../services/interfaces';
import { OrderCard } from '../../components/orders/OrderCard';
import { CancelOrderModal } from '../../components/orders/CancelOrderModal';
import { OrderTrackingModal } from '../../components/orders/OrderTrackingModal';
import { Button } from '../../components/common/Button';
import { SearchIcon, OrderListIcon, ArrowRightIcon } from '../../components/common/Icons';

export function MyOrdersPage({ onNavigate, navParams }) {
  const { currentGuest, refreshGuest } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'completed', 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [trackingOrder, setTrackingOrder] = useState(null);
  const [dismissedTrackingId, setDismissedTrackingId] = useState(null);

  const guestOrders = currentGuest?.orders;
  const orders = useMemo(() => guestOrders || [], [guestOrders]);

  // Derived tracking state without props mutation or complex memoization
  const initialTrackingId = navParams?.trackingOrderId;
  const activeNavTrackingId = (initialTrackingId && initialTrackingId !== dismissedTrackingId) ? initialTrackingId : null;
  const activeTrackingOrder = trackingOrder || (activeNavTrackingId ? orders.find((o) => o.orderId === activeNavTrackingId) : null);
  const isTrackingOpen = Boolean(activeTrackingOrder);

  // Filter & Search logic
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (activeTab === 'active') {
      result = result.filter(
        (o) => o.status !== 'Completed' && o.status !== 'Cancelled'
      );
    } else if (activeTab === 'completed') {
      result = result.filter((o) => o.status === 'Completed');
    } else if (activeTab === 'cancelled') {
      result = result.filter((o) => o.status === 'Cancelled');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o) => o.orderId.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      const timeA = a.placedAtTimestamp || new Date(a.createdAt).getTime();
      const timeB = b.placedAtTimestamp || new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [orders, activeTab, searchQuery, sortOrder]);

  const handleOpenCancel = (order) => {
    setSelectedOrderToCancel(order);
    setIsCancelModalOpen(true);
  };

  const handleOpenTrack = (order) => {
    setTrackingOrder(order);
  };

  const handleCloseTrack = () => {
    setTrackingOrder(null);
    if (initialTrackingId) {
      setDismissedTrackingId(initialTrackingId);
    }
  };

  const handleConfirmCancel = async (orderId) => {
    if (!currentGuest?.guestId) return;

    setIsCancelling(true);
    try {
      const result = await customerService.cancelOrder(currentGuest.guestId, orderId);
      refreshGuest();
      showToast(
        `Order ${orderId} cancelled. ₹${result.refundAmount.toLocaleString('en-IN')} refunded to your wallet!`,
        'success'
      );
      setIsCancelModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to cancel order.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Orders', count: orders.length },
    {
      id: 'active',
      label: 'Active',
      count: orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled').length,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: orders.filter((o) => o.status === 'Completed').length,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: orders.filter((o) => o.status === 'Cancelled').length,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1677FF] border border-blue-200 text-xs font-bold mb-1.5">
            <OrderListIcon className="w-3.5 h-3.5" />
            <span>Order History</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Orders & Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor autonomous packaging status, view receipts, and manage order cancellations.
          </p>
        </div>

        <Button
          variant="orange"
          size="md"
          onClick={() => onNavigate('products')}
          icon={<ArrowRightIcon className="w-4 h-4" />}
        >
          Place New Order
        </Button>
      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* 4 Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#FF7900] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-white/30 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID..."
              className="w-full h-9 pl-9 pr-3 text-xs font-medium rounded-xl border border-slate-200 focus:border-[#FF7900] outline-none bg-white font-mono"
            />
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto my-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto text-xl">
            📦
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No orders found {searchQuery ? `matching "${searchQuery}"` : `in "${activeTab}" tab`}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {searchQuery
              ? 'Check the order identifier and try searching again.'
              : 'You do not have any orders in this category yet. Browse our packaging catalogue to place an order!'}
          </p>
          <div className="pt-1">
            <Button
              variant="orange"
              size="sm"
              onClick={() => onNavigate('products')}
            >
              Browse Products
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onCancelClick={handleOpenCancel}
              onTrackOrder={handleOpenTrack}
            />
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal
        order={selectedOrderToCancel}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        isCancelling={isCancelling}
      />

      {/* Live Order Tracking Modal per Part 7 */}
      <OrderTrackingModal
        order={activeTrackingOrder}
        isOpen={isTrackingOpen}
        onClose={handleCloseTrack}
        onCancelClick={handleOpenCancel}
      />
    </div>
  );
}
