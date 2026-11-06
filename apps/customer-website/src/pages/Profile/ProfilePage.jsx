import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  UserIcon,
  WalletIcon,
  PackageIcon,
  CheckCircleIcon,
  CloseIcon,
  ClockIcon,
} from '../../components/common/Icons';

export function ProfilePage() {
  const { currentGuest } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'details', 'activity'

  const guestId = currentGuest?.guestId || '—';
  const registeredAt = currentGuest?.registeredAt || null;
  const walletBalance = currentGuest?.walletBalance || 0;
  const orders = currentGuest?.orders || [];
  const activity = currentGuest?.activity || [];

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'Completed').length;
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled').length;
  const totalSpending = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.finalAmountPaid, 0);

  const tabs = [
    { id: 'overview', label: '1. Overview' },
    { id: 'details', label: '2. Account Details' },
    { id: 'activity', label: '3. Activity Log' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1677FF] shrink-0 font-black text-sm">
            <UserIcon className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {guestId}
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-green-50 text-[#16A34A] border border-green-200">
                Active Session
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Registered: {formatDateTime(registeredAt)}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-right">
          <span className="text-[10px] uppercase font-bold text-[#FF7900] block">
            Wallet Balance
          </span>
          <span className="text-xl font-black text-slate-900 font-mono">
            {formatCurrency(walletBalance)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#FF7900] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-150">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1677FF] flex items-center justify-center mb-2">
              <PackageIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Orders
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {totalOrders}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-[#16A34A] flex items-center justify-center mb-2">
              <CheckCircleIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Completed Orders
            </span>
            <span className="text-2xl font-black text-[#16A34A] font-mono">
              {completedOrders}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-[#FF4F9A] flex items-center justify-center mb-2">
              <CloseIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Cancelled Orders
            </span>
            <span className="text-2xl font-black text-[#FF4F9A] font-mono">
              {cancelledOrders}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 sm:col-span-2 lg:col-span-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF7900] flex items-center justify-center mb-2">
              <WalletIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Packaging Spending (Excl. Refunds)
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(totalSpending)}
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Account Details */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 max-w-lg space-y-4 animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-black text-slate-900">Account Credentials</h3>
            <p className="text-xs text-slate-500">
              Permanent Guest identifier & registration metadata
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Guest ID (Read-only)
              </label>
              <input
                type="text"
                readOnly
                value={guestId}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed select-all text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Permanent identifier, non-editable.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Account Registration Timestamp
              </label>
              <input
                type="text"
                readOnly
                value={formatDateTime(registeredAt)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-medium text-slate-700 cursor-not-allowed text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Activity Log */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4 animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-black text-slate-900">Chronological Activity Log</h3>
            <p className="text-xs text-slate-500">
              Audit log of orders, balance updates, and authentication actions
            </p>
          </div>

          {activity.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No recorded activity yet.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-3 pl-5 space-y-5 py-2">
              {activity.map((act) => (
                <div key={act.id} className="relative">
                  <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full bg-[#1677FF] border-2 border-white ring-2 ring-blue-100" />
                  <p className="text-xs font-bold text-slate-900">
                    {act.description}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                    <ClockIcon className="w-3 h-3" />
                    <span>{formatDateTime(act.timestamp)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
