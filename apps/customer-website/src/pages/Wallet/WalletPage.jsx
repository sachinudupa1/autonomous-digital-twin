import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { customerService } from '../../services/interfaces';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { RECHARGE_AMOUNTS } from '../../constants/config';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import {
  WalletIcon,
  CheckCircleIcon,
  PlusIcon,
} from '../../components/common/Icons';

export function WalletPage() {
  const { currentGuest, refreshGuest } = useAuth();
  const { showToast } = useToast();

  const [selectedAmount, setSelectedAmount] = useState(RECHARGE_AMOUNTS[0]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRecharging, setIsRecharging] = useState(false);

  const walletBalance = currentGuest?.walletBalance || 0;
  const transactions = currentGuest?.transactions || [];

  const handleOpenConfirm = (amount) => {
    setSelectedAmount(amount);
    setIsConfirmModalOpen(true);
  };

  const handleExecuteRecharge = async () => {
    if (!currentGuest?.guestId) return;

    setIsRecharging(true);
    try {
      await customerService.rechargeWallet(currentGuest.guestId, selectedAmount);
      refreshGuest();
      showToast(
        `Successfully added ${formatCurrency(selectedAmount)} to your wallet!`,
        'success'
      );
      setIsConfirmModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Recharge failed', 'error');
    } finally {
      setIsRecharging(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header & Balance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Wallet Overview Card */}
        <div className="lg:col-span-2 bg-[#FF7900] text-white rounded-2xl shadow-sm p-6 sm:p-7 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
              <WalletIcon className="w-3.5 h-3.5" />
              <span>Simulated Digital Wallet</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white pt-1">
              Customer Account Wallet
            </h1>
            <p className="text-xs text-orange-100 max-w-md">
              Simulated demonstration funds used exclusively to book packaging line capacity and test priority queueing.
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-white/20 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200 block">
                Available Wallet Balance
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {formatCurrency(walletBalance)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-orange-200 block">
                Guest Reference:
              </span>
              <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-md font-mono text-white">
                {currentGuest?.guestId}
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Demo Wallet Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1677FF]">
              Demo Balance Rules
            </span>
            <h4 className="text-sm font-black text-slate-800">
              No Real Currency Required
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every guest is automatically seeded with ₹10,000 upon account creation. You can top up in fixed amounts anytime without credit cards or bank gateways.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-xs font-semibold text-[#16A34A]">
            ✓ Instant automated credit reflection
          </div>
        </div>
      </div>

      {/* Fixed Recharge Tiers */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">
            Recharge Wallet Balance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose one of the fixed demo amounts below to top up your account balance immediately.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {RECHARGE_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleOpenConfirm(amount)}
              className="p-4 rounded-xl border border-slate-200 hover:border-[#16A34A] hover:bg-green-50/40 bg-white transition-all cursor-pointer text-center shadow-2xs hover:scale-101 flex flex-col items-center justify-center space-y-1.5"
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 text-[#16A34A] flex items-center justify-center">
                <PlusIcon className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-slate-900 font-mono">
                {formatCurrency(amount)}
              </span>
              <span className="text-[10px] font-bold text-[#16A34A]">
                + Instant Top Up
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Transaction History Ledger */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Transaction History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ledger of credits, payments, and cancellation refunds
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {transactions.length} record{transactions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-5">Date & Time</th>
                  <th className="py-2.5 px-5">Type</th>
                  <th className="py-2.5 px-5">Description</th>
                  <th className="py-2.5 px-5 text-right">Amount</th>
                  <th className="py-2.5 px-5 text-right">Balance After</th>
                  <th className="py-2.5 px-5">Related Order ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {transactions.map((txn) => {
                  const isCredit = txn.type === 'Credit';
                  const isRefund = txn.type === 'Refund';

                  const typeBadgeClass =
                    isCredit || isRefund
                      ? 'bg-green-50 text-[#16A34A] border-green-200'
                      : 'bg-pink-50 text-[#FF4F9A] border-pink-200';

                  const amountTextClass =
                    isCredit || isRefund
                      ? 'text-[#16A34A] font-bold'
                      : 'text-[#FF4F9A] font-bold';

                  const amountPrefix = txn.amount > 0 ? '+' : '';

                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 whitespace-nowrap text-slate-500 font-mono">
                        {formatDateTime(txn.dateTime)}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded border text-[11px] font-bold ${typeBadgeClass}`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-semibold text-slate-800">
                        {txn.description}
                      </td>
                      <td className={`py-3 px-5 whitespace-nowrap text-right font-mono text-xs sm:text-sm ${amountTextClass}`}>
                        {amountPrefix}{formatCurrency(txn.amount)}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap text-right font-mono font-bold text-slate-800">
                        {formatCurrency(txn.balanceAfter)}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap font-mono text-slate-500">
                        {txn.relatedOrderId || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recharge Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Wallet Recharge"
        maxWidth="max-w-xs"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-[#16A34A] shrink-0">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">Simulated Top Up:</p>
              <p className="text-xl font-black text-slate-900 font-mono">
                {formatCurrency(selectedAmount)}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Will be immediately credited to guest account <strong className="font-mono text-slate-800">{currentGuest?.guestId}</strong>. New balance will be <strong className="font-mono text-[#16A34A]">{formatCurrency(walletBalance + selectedAmount)}</strong>.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isRecharging}
            >
              Cancel
            </Button>
            <Button
              variant="green"
              size="sm"
              onClick={handleExecuteRecharge}
              loading={isRecharging}
            >
              Authorize Recharge
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
