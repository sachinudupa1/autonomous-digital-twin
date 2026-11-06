import { OrderStatusStepper } from '../orders/OrderStatusStepper';
import { RushCountdown } from '../orders/RushCountdown';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../common/Button';
import { ArrowRightIcon } from '../common/Icons';

export function ActiveOrdersPreview({ orders, onNavigate, onTrackOrder }) {
  const activeOrders = orders.filter(
    (o) => o.status !== 'Completed' && o.status !== 'Cancelled'
  );

  const latestOrder = activeOrders[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Track Your Order
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('orders')}
          className="text-xs font-bold text-[#1677FF] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View All</span>
          <ArrowRightIcon className="w-3 h-3" />
        </button>
      </div>

      {!latestOrder ? (
        <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">No active orders right now.</p>
          <p className="text-[11px] text-slate-400">
            Select a glass ball product from the catalogue to place an order.
          </p>
          <Button
            variant="orange"
            size="sm"
            onClick={() => onNavigate('products')}
          >
            Shop Products
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active Order Summary */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-mono text-xs font-bold text-slate-900">
                {latestOrder.orderId}
              </span>
              <div className="text-[11px] text-slate-400">
                {latestOrder.items.length} item(s) • {formatCurrency(latestOrder.finalAmountPaid)}
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-[#FF7900] border border-orange-200">
              {latestOrder.status}
            </span>
          </div>

          {latestOrder.orderType === 'Rush' && (
            <RushCountdown order={latestOrder} />
          )}

          {/* Stepper with Live Integration Notice */}
          <OrderStatusStepper status={latestOrder.status} showNotice={true} />

          {/* Track Order Action Button */}
          <Button
            variant="outline-blue"
            size="sm"
            fullWidth
            onClick={() => onTrackOrder ? onTrackOrder(latestOrder) : onNavigate('orders')}
            icon={<ArrowRightIcon className="w-3.5 h-3.5" />}
          >
            Track Order Details
          </Button>
        </div>
      )}
    </div>
  );
}
