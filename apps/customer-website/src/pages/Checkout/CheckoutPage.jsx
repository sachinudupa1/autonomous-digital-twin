import { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { customerService } from '../../services/interfaces';
import { formatCurrency } from '../../utils/formatters';
import {
  RUSH_SURCHARGE_PERCENT,
  RUSH_DEADLINES,
  ORDER_TYPES,
  RECHARGE_AMOUNTS,
} from '../../constants/config';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  CheckCircleIcon,
  AlertCircleIcon,
  LightningIcon,
  ClockIcon,
} from '../../components/common/Icons';

export function CheckoutPage({ onNavigate }) {
  const { items, totalPrice, clearCart } = useCart();
  const { currentGuest, refreshGuest } = useAuth();
  const { showToast } = useToast();

  const [orderType, setOrderType] = useState(ORDER_TYPES.NORMAL);
  const [rushDeadlineMinutes, setRushDeadlineMinutes] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [selectedRechargeAmount, setSelectedRechargeAmount] = useState(RECHARGE_AMOUNTS[0]);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto my-8 animate-in fade-in duration-200">
        <h3 className="text-lg font-black text-slate-800">Your cart is empty</h3>
        <p className="text-xs text-slate-500 mt-1">
          Please add items to your cart before proceeding to checkout.
        </p>
        <div className="mt-5">
          <Button variant="orange" size="sm" onClick={() => onNavigate('products')}>
            View Products
          </Button>
        </div>
      </div>
    );
  }

  // Exact calculations per Part 9
  const productTotal = totalPrice;
  const isRush = orderType === ORDER_TYPES.RUSH;
  const rushSurcharge = isRush ? Math.round(productTotal * RUSH_SURCHARGE_PERCENT) : 0;
  const finalPayableAmount = productTotal + rushSurcharge;

  const currentWalletBalance = currentGuest?.walletBalance || 0;
  const remainingWalletBalance = currentWalletBalance - finalPayableAmount;
  const isInsufficientBalance = currentWalletBalance < finalPayableAmount;
  const shortageAmount = isInsufficientBalance ? finalPayableAmount - currentWalletBalance : 0;

  const handleQuickRecharge = async () => {
    if (!currentGuest?.guestId) return;
    try {
      await customerService.rechargeWallet(currentGuest.guestId, selectedRechargeAmount);
      refreshGuest();
      showToast(`Successfully recharged ₹${selectedRechargeAmount.toLocaleString('en-IN')}!`, 'success');
      setIsRechargeModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Recharge failed', 'error');
    }
  };

  const handlePlaceOrder = async () => {
    if (isInsufficientBalance) {
      showToast('Insufficient wallet balance. Please recharge your wallet first.', 'error');
      return;
    }

    if (isRush && !rushDeadlineMinutes) {
      showToast('Please select a deadline for your Rush order.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await customerService.placeOrder(currentGuest.guestId, {
        items,
        orderType,
        rushDeadlineMinutes: isRush ? rushDeadlineMinutes : null,
      });

      refreshGuest();
      clearCart();
      showToast(`Order ${order.orderId} placed successfully!`, 'success');
      onNavigate('confirmation', { order });
    } catch (err) {
      showToast(err.message || 'Order placement failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Checkout & Priority Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure delivery priority, verify wallet funds, and confirm packaging order.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('cart')}
          className="text-xs font-bold text-[#1677FF] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>← Back to Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left Column: Order Items + Priority Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Items Summary */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-3">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
              1. Order Items Summary
            </h3>

            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    {item.brand && (
                      <span className="text-[10px] font-black uppercase tracking-wider block text-slate-400">
                        {item.brand}
                      </span>
                    )}
                    <span className="font-bold text-slate-900">{item.title}</span>
                    <span className="text-slate-400 block text-[11px]">
                      {formatCurrency(item.price)} × {item.quantity}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Product Base Total (P):</span>
              <span className="font-black text-sm text-slate-900 font-mono">
                {formatCurrency(productTotal)}
              </span>
            </div>
          </section>

          {/* 2. Priority Selection */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                2. Select Priority Option
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Normal priority joins standard line queue. Rush priority enables dedicated conveyor routing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Normal Option */}
              <button
                type="button"
                onClick={() => setOrderType(ORDER_TYPES.NORMAL)}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  orderType === ORDER_TYPES.NORMAL
                    ? 'bg-blue-50/50 border-[#1677FF] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-black text-slate-900">
                      Normal Order
                    </span>
                    <span className="text-[10px] font-bold text-[#1677FF] bg-blue-100 px-2 py-0.5 rounded">
                      Standard
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Standard automated line scheduling. No extra surcharge.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs font-bold text-slate-500">
                  Rush Surcharge: ₹0
                </div>
              </button>

              {/* Rush Option */}
              <button
                type="button"
                onClick={() => setOrderType(ORDER_TYPES.RUSH)}
                className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  orderType === ORDER_TYPES.RUSH
                    ? 'bg-orange-50/50 border-[#FF7900] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                      <LightningIcon className="w-4 h-4 text-[#FF7900]" />
                      <span>Rush Order</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#FF7900] bg-orange-100 px-2 py-0.5 rounded">
                      +20% Surcharge
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dedicated conveyor queue with customer-selected deadline window.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs font-bold text-[#FF7900]">
                  Rush Surcharge: +{formatCurrency(Math.round(productTotal * RUSH_SURCHARGE_PERCENT))}
                </div>
              </button>
            </div>

            {/* Rush Deadline Selector */}
            {isRush && (
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-[#FF7900]" />
                  <label className="text-xs font-black text-[#FF7900] uppercase tracking-wider">
                    Select Rush Deadline (Mandatory):
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {RUSH_DEADLINES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setRushDeadlineMinutes(d.value)}
                      className={`h-9 px-2 rounded-lg border font-bold text-xs transition-all cursor-pointer text-center ${
                        rushDeadlineMinutes === d.value
                          ? 'bg-[#FF7900] text-white border-[#FF7900] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Price Calculation & Wallet Deduction */}
        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2.5">
              Payment Breakdown
            </h3>

            {/* Calculations */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Products Base (P)</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCurrency(productTotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Priority Surcharge {isRush ? '(20%)' : '(Normal)'}</span>
                <span className={`font-bold font-mono ${isRush ? 'text-[#FF7900]' : 'text-slate-900'}`}>
                  {formatCurrency(rushSurcharge)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-800">Final Payable Amount</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {formatCurrency(finalPayableAmount)}
                </span>
              </div>
            </div>

            {/* Wallet Balance State */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Wallet Balance:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatCurrency(currentWalletBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deduction:</span>
                <span className="font-bold text-[#FF4F9A] font-mono">
                  -{formatCurrency(finalPayableAmount)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                <span className={isInsufficientBalance ? 'text-[#FF4F9A]' : 'text-[#16A34A]'}>
                  Remaining After Payment:
                </span>
                <span className={`font-mono ${isInsufficientBalance ? 'text-[#FF4F9A]' : 'text-[#16A34A]'}`}>
                  {isInsufficientBalance ? 'Insufficient Funds' : formatCurrency(remainingWalletBalance)}
                </span>
              </div>
            </div>

            {/* Insufficient Balance Alert & Quick Recharge */}
            {isInsufficientBalance && (
              <div className="p-3.5 rounded-xl bg-pink-50 border border-[#FF4F9A] space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF4F9A]">
                  <AlertCircleIcon className="w-4 h-4 shrink-0" />
                  <span>Insufficient Balance</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Short by <strong className="text-[#FF4F9A]">{formatCurrency(shortageAmount)}</strong>. Recharge your demo wallet to complete payment.
                </p>
                <Button
                  variant="pink"
                  size="sm"
                  fullWidth
                  onClick={() => setIsRechargeModalOpen(true)}
                >
                  Quick Recharge
                </Button>
              </div>
            )}

            {/* Payment Button */}
            <Button
              variant="orange"
              size="md"
              fullWidth
              disabled={isInsufficientBalance}
              loading={isSubmitting}
              onClick={handlePlaceOrder}
              icon={<CheckCircleIcon className="w-4 h-4" />}
            >
              Confirm Payment & Place Order
            </Button>
          </section>
        </div>
      </div>

      {/* Quick Recharge Modal */}
      <Modal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        title="Quick Wallet Recharge"
        maxWidth="max-w-xs"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select a fixed demo amount to recharge your wallet:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {RECHARGE_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setSelectedRechargeAmount(amt)}
                className={`h-10 rounded-xl border-2 font-black text-xs transition-all cursor-pointer text-center ${
                  selectedRechargeAmount === amt
                    ? 'bg-green-50 text-[#16A34A] border-[#16A34A]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {formatCurrency(amt)}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setIsRechargeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="green" size="sm" onClick={handleQuickRecharge}>
              Add {formatCurrency(selectedRechargeAmount)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
