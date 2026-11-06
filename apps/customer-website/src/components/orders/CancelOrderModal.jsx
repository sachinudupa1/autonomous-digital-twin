import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { AlertCircleIcon } from '../common/Icons';

export function CancelOrderModal({ order, isOpen, onClose, onConfirm, isCancelling }) {
  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Order & Full Refund"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-pink-50 border border-[#FF4F9A] flex items-start gap-2.5 text-xs text-slate-800">
          <AlertCircleIcon className="w-5 h-5 text-[#FF4F9A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm text-[#FF4F9A] block">Confirm Order Cancellation</span>
            <p className="leading-relaxed">
              Are you sure you want to cancel order <span className="font-mono font-bold text-slate-900">{order.orderId}</span>?
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Order Type:</span>
            <span className="font-bold text-slate-800">{order.orderType}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Status:</span>
            <span className="font-bold text-slate-800">{order.status}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-[#16A34A] text-sm">
            <span>Refund to Wallet:</span>
            <span className="font-mono">{formatCurrency(order.finalAmountPaid)}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Because this order has not yet entered robotic packing, 100% of the funds (including rush surcharge) will be immediately returned to your demo wallet.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isCancelling}>
            Keep Order
          </Button>
          <Button
            variant="pink"
            size="sm"
            onClick={() => onConfirm(order.orderId)}
            loading={isCancelling}
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </Modal>
  );
}
