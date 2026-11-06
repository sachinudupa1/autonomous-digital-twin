import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { OrderStatusStepper } from './OrderStatusStepper';
import { RushCountdown } from './RushCountdown';
import { Button } from '../common/Button';
import { LightningIcon, CheckCircleIcon, ArrowRightIcon } from '../common/Icons';

export function OrderCard({ order, onCancelClick, onTrackOrder }) {
  const isRush = order.orderType === 'Rush';
  const isCancellable = order.status === 'Order Received' || order.status === 'Queued';
  const isCompleted = order.status === 'Completed';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4 hover:border-slate-300 transition-all">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-black text-slate-900">
              {order.orderId}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                isRush
                  ? 'bg-yellow-50 text-slate-900 border-[#FFD400]'
                  : 'bg-blue-50 text-[#1677FF] border-blue-200'
              }`}
            >
              {isRush && <LightningIcon className="w-3 h-3 text-[#FF7900]" />}
              <span>{order.orderType} Order</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isRush && <RushCountdown order={order} />}
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total Paid
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
              {formatCurrency(order.finalAmountPaid)}
            </span>
          </div>
        </div>
      </div>

      {/* Ordered Items summary */}
      <div className="flex flex-wrap gap-1.5">
        {order.items.map((item) => (
          <span
            key={item.id}
            className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
          >
            <strong className="text-slate-900">{item.brand ? `${item.brand} ${item.title}` : (item.title || item.name)}</strong> × {item.quantity}{' '}
            <span className="text-slate-400 font-mono">({formatCurrency(item.subtotal)})</span>
          </span>
        ))}
      </div>

      {/* Live Status Progress Stepper */}
      <OrderStatusStepper status={order.status} showNotice={true} />

      {/* Footer Actions: Track Order & Cancel */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">
          {isCompleted ? (
            <span className="text-[#16A34A] font-bold flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4" /> Completed
            </span>
          ) : isCancellable ? (
            <span>Eligible for full wallet refund prior to packing.</span>
          ) : (
            <span>Processing on automated packaging line.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onTrackOrder && (
            <Button
              variant="outline-blue"
              size="sm"
              onClick={() => onTrackOrder(order)}
              icon={<ArrowRightIcon className="w-3.5 h-3.5" />}
            >
              Track Order
            </Button>
          )}

          {isCancellable && onCancelClick && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onCancelClick(order)}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
