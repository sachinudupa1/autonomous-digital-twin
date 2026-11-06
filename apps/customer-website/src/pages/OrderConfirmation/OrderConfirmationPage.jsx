import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { OrderStatusStepper } from '../../components/orders/OrderStatusStepper';
import { CheckCircleIcon, ArrowRightIcon, LightningIcon, ClockIcon } from '../../components/common/Icons';

export function OrderConfirmationPage({ order, onNavigate }) {
  if (!order) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto my-8 animate-in fade-in duration-200">
        <h3 className="text-lg font-bold text-slate-800">Order not found</h3>
        <p className="text-xs text-slate-500 mt-1">
          Unable to retrieve confirmation details.
        </p>
        <div className="mt-5">
          <Button variant="orange" size="sm" onClick={() => onNavigate('home')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isRush = order.orderType === 'Rush';

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Success Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-green-100 text-[#16A34A] mx-auto flex items-center justify-center animate-in zoom-in-75">
          <CheckCircleIcon className="w-8 h-8" />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
          Payment Authorized & Scheduled
        </span>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Thank you! Your order is placed.
        </h1>

        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          The packaging order has been logged into the autonomous packaging line queue.
        </p>

        {/* Order ID Tag */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 inline-block font-mono text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Order Reference ID
          </span>
          <span className="text-lg sm:text-xl font-black text-slate-900">
            {order.orderId}
          </span>
        </div>
      </div>

      {/* Order Specification Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">Order Specifications</h3>
            <span className="text-xs text-slate-400">
              Placed on {formatDateTime(order.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                isRush
                  ? 'bg-yellow-50 text-slate-900 border-[#FFD400]'
                  : 'bg-blue-50 text-[#1677FF] border-blue-200'
              }`}
            >
              {isRush && <LightningIcon className="w-3 h-3 text-[#FF7900]" />}
              <span>{order.orderType} Order</span>
            </span>

            {isRush && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-orange-50 text-[#FF7900] border border-orange-200 flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                <span>Target: {order.rushDeadlineMinutes} mins</span>
              </span>
            )}
          </div>
        </div>

        {/* Products list */}
        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                {item.brand && (
                  <span className="text-[10px] font-black uppercase tracking-wider block text-slate-400">
                    {item.brand}
                  </span>
                )}
                <strong className="text-slate-900">{item.title}</strong>
                <span className="text-slate-400 block text-[11px]">
                  Qty: {item.quantity} × {formatCurrency(item.price)}
                </span>
              </div>
              <span className="font-bold text-slate-900 font-mono">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Subtotals */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Product Subtotal:</span>
            <span className="font-bold text-slate-800 font-mono">{formatCurrency(order.productTotal)}</span>
          </div>
          {isRush && (
            <div className="flex justify-between text-[#FF7900]">
              <span>Rush Surcharge (20%):</span>
              <span className="font-bold font-mono">+{formatCurrency(order.rushSurcharge)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
            <span>Total Paid (Wallet):</span>
            <span className="font-mono">{formatCurrency(order.finalAmountPaid)}</span>
          </div>
        </div>

        {/* Live Status Tracking Stepper */}
        <div className="pt-1 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Packaging Line Progress
          </span>
          <OrderStatusStepper status={order.status} showNotice={true} />
        </div>

        {/* Action Buttons: Track Order & View My Orders per Part 7 */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={() => onNavigate('home')}
          >
            ← Back to Home
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline-blue"
              size="md"
              onClick={() => onNavigate('orders')}
            >
              View My Orders
            </Button>
            <Button
              variant="orange"
              size="md"
              onClick={() => onNavigate('orders', { trackingOrderId: order.orderId })}
              icon={<ArrowRightIcon className="w-4 h-4" />}
            >
              Track Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
