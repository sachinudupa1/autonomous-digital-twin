import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { OrderStatusStepper } from './OrderStatusStepper';
import { RushCountdown } from './RushCountdown';
import { LightningIcon } from '../common/Icons';

export function OrderTrackingModal({ order, isOpen, onClose, onCancelClick }) {
  if (!order) return null;

  const isRush = order.orderType === 'Rush';
  const isCancellable = order.status === 'Order Received' || order.status === 'Queued';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Live Tracking: ${order.orderId}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Order Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-slate-900">{order.orderId}</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  isRush ? 'bg-yellow-50 text-slate-900 border-[#FFD400]' : 'bg-blue-50 text-[#1677FF] border-blue-200'
                }`}
              >
                {isRush && <LightningIcon className="w-3 h-3 text-[#FF7900]" />}
                <span>{order.orderType}</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Placed on {formatDateTime(order.createdAt)}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount Paid</span>
            <span className="text-base font-black text-slate-900 font-mono">
              {formatCurrency(order.finalAmountPaid)}
            </span>
          </div>
        </div>

        {/* Rush Target if applicable */}
        {isRush && (
          <div className="flex justify-between items-center p-3 rounded-xl bg-yellow-50 border border-[#FFD400]">
            <RushCountdown order={order} />
            <span className="text-xs text-slate-600 font-medium">Selected Rush Window</span>
          </div>
        )}

        {/* Status Stepper */}
        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Automated Packaging Line Stages
          </span>
          <OrderStatusStepper status={order.status} showNotice={true} />
        </div>

        {/* Items Included */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Packaging Contents ({order.items.length})
          </span>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white p-3">
            {order.items.map((item) => (
              <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-slate-900">{item.brand ? `${item.brand} ${item.title}` : (item.title || item.name)}</strong>
                  <span className="text-slate-400 ml-2 font-mono">Qty: {item.quantity}</span>
                </div>
                <span className="font-bold text-slate-800 font-mono">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {isCancellable ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onClose();
                if (onCancelClick) onCancelClick(order);
              }}
            >
              Cancel Order
            </Button>
          ) : (
            <div className="text-xs text-slate-400">
              {order.status === 'Completed' ? '✓ Order Completed' : 'Packing in Progress'}
            </div>
          )}

          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Tracking
          </Button>
        </div>
      </div>
    </Modal>
  );
}
