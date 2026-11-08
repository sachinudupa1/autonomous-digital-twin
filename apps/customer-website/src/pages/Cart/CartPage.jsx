import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatters';
import { ProductImage } from '../../components/products/ProductImage';
import { Button } from '../../components/common/Button';
import { TrashIcon, PlusIcon, MinusIcon, CartIcon, ArrowRightIcon } from '../../components/common/Icons';
import { QUANTITY_LIMITS, PRODUCTS } from '../../constants/config';

// Quick brand/colour lookup from config
const BRAND_MAP = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, { brand: p.brand, colorHex: p.colorHex }])
);

export function CartPage({ onNavigate }) {
  const { items, updateQuantity, removeFromCart, totalItems, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 sm:p-12 text-center max-w-lg mx-auto my-8 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF7900] mx-auto mb-4">
          <CartIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Your cart is empty.
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
          Browse our glass ball collection and add products to your cart.
        </p>
        <div className="mt-6 flex justify-center">
          <Button
            variant="orange"
            size="md"
            onClick={() => onNavigate('products')}
            icon={<ArrowRightIcon className="w-4 h-4" />}
          >
            Shop Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Shopping Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review your glass ball selection, adjust units, and proceed to checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('products')}
          className="text-xs font-bold text-[#1677FF] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>← Continue Shopping</span>
        </button>
      </div>

      {/* Cart Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Product Details</span>
            <span>Subtotal</span>
          </div>

          <div className="p-4 sm:p-6 divide-y divide-slate-100">
            {items.map((item) => {
              const meta = BRAND_MAP[item.id] || {};
              return (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <ProductImage productId={item.id} size="sm" className="shrink-0 rounded-xl" />
                    <div>
                      <span
                        className="text-[10px] font-black uppercase tracking-widest block"
                        style={{ color: meta.colorHex || '#FF7900' }}
                      >
                        {meta.brand || item.name}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">
                        {item.title}
                      </h4>
                      <span className="text-xs font-bold text-slate-500 mt-0.5 block font-mono">
                        {formatCurrency(item.price)} each
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls & Subtotal */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 cursor-pointer text-slate-600"
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= QUANTITY_LIMITS.max}
                        className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer text-slate-600"
                        aria-label="Increase quantity"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[5rem]">
                      <span className="text-sm font-black text-slate-900 font-mono block">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-400 hover:text-[#FF4F9A] hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cart Summary Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
            Cart Summary
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Units</span>
              <span className="font-bold text-slate-900 font-mono">{totalItems}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Products Base Total</span>
              <span className="font-bold text-slate-900 font-mono">{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Rush Surcharge</span>
              <span>Selected at checkout</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-700">Subtotal</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(totalPrice)}
            </span>
          </div>

          <Button
            variant="orange"
            size="md"
            fullWidth
            onClick={() => onNavigate('checkout')}
            icon={<ArrowRightIcon className="w-4 h-4" />}
          >
            Proceed to Checkout
          </Button>

          <p className="text-[11px] text-slate-400 text-center">
            Cart is session-scoped and clears on logout.
          </p>
        </div>
      </div>
    </div>
  );
}
