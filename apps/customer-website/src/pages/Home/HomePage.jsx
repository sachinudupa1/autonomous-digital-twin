
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PromoCarousel } from '../../components/home/PromoCarousel';
import { ActiveOrdersPreview } from '../../components/home/ActiveOrdersPreview';
import { RecentNotificationsPreview } from '../../components/home/RecentNotificationsPreview';
import { OrderTrackingModal } from '../../components/orders/OrderTrackingModal';
import { ProductImage } from '../../components/products/ProductImage';
import { PRODUCTS } from '../../constants/config';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatters';

import {
  WalletIcon,
  LightningIcon,
  TruckIcon,
  ShieldCheckIcon,
  LeafIcon,
  HeadphoneIcon,
  ArrowRightIcon,
  PackageIcon,
} from '../../components/common/Icons';

export function HomePage({ onNavigate }) {
  const { currentGuest } = useAuth();

  const walletBalance = currentGuest?.walletBalance || 0;
  const orders = currentGuest?.orders || [];
  const notifications = currentGuest?.notifications || [];

  const [trackingOrder, setTrackingOrder] = useState(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const handleTrackOrder = (order) => {
    setTrackingOrder(order);
    setIsTrackingModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ==========================================
            MAIN CONTENT COLUMN
        ========================================== */}
        <div className="lg:col-span-8 space-y-5">

          {/* 1. BRAND ADVERTISING CAROUSEL */}
          <PromoCarousel onNavigate={onNavigate} />

          {/* 2. BENEFITS STRIP */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF7900] flex items-center justify-center shrink-0">
                <TruckIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  Fast Processing
                </p>
                <p className="text-[10px] text-slate-400">
                  3–7 min Rush option
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-green-50 text-[#16A34A] flex items-center justify-center shrink-0">
                <ShieldCheckIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  Wallet Payments
                </p>
                <p className="text-[10px] text-slate-400">
                  Simple checkout
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1677FF] flex items-center justify-center shrink-0">
                <LeafIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  Thoughtful Packing
                </p>
                <p className="text-[10px] text-slate-400">
                  Careful handling
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-yellow-50 text-[#FF7900] flex items-center justify-center shrink-0">
                <HeadphoneIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  Customer Support
                </p>
                <p className="text-[10px] text-slate-400">
                  Here to help
                </p>
              </div>
            </div>

          </section>

          {/* 3. GLASS BALL COLLECTION PREVIEW */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">

            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF7900] flex items-center justify-center shrink-0">
                  <PackageIcon className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Our Glass Ball Collection
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Explore all four colours and brands
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="text-xs font-bold text-[#1677FF] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                View All
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>

            </div>

            {/* Actual glass-ball photographs */}
            <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">

              {PRODUCTS.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onNavigate('products')}
                  className="min-w-0 text-left group cursor-pointer"
                  aria-label={`Explore ${product.title} by ${product.brand}`}
                >

                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                    <ProductImage
                      productId={product.id}
                      size="fill"
                      fit="cover"
                      rounded={false}
                      className="w-full h-full transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="pt-2 text-center">
                    <p
                      className="text-[10px] font-black uppercase tracking-wide truncate"
                      style={{ color: product.colorHex }}
                    >
                      {product.brand}
                    </p>

                    <p className="text-xs font-bold text-slate-900 mt-0.5 leading-tight">
                      {product.title}
                    </p>

                    <p className="text-sm font-black text-slate-900 mt-1">
                      {formatCurrency(product.price)}
                    </p>
                  </div>

                </button>
              ))}

            </div>

            <div className="px-4 sm:px-5 pb-5">
              <Button
                variant="orange"
                size="sm"
                fullWidth
                onClick={() => onNavigate('products')}
                icon={<ArrowRightIcon className="w-3.5 h-3.5" />}
              >
                Shop All Products
              </Button>
            </div>

          </section>

          {/* 4. WIDE ECO-FRIENDLY PACKAGING BANNER */}
          <section className="relative min-h-[190px] sm:min-h-[220px] rounded-2xl overflow-hidden border border-green-100 bg-[#EFF9DB]">

            {/* Decorative background circles */}
            <div className="absolute right-[-55px] top-[-85px] w-72 h-72 rounded-full border-[24px] border-[#16A34A]/10" />

            <div className="absolute right-[65px] bottom-[-125px] w-60 h-60 rounded-full border-[18px] border-[#84CC16]/15" />

            {/* Banner text */}
            <div className="relative z-10 flex flex-col justify-center min-h-[190px] sm:min-h-[220px] px-6 sm:px-9 py-6 w-[68%]">

              <div className="flex items-center gap-2 text-[#16A34A] font-black text-xs sm:text-sm uppercase tracking-wider">
                <LeafIcon className="w-5 h-5" />
                Eco-Friendly Packaging
              </div>

              <h3 className="mt-3 text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                A Greener Tomorrow, Together.
              </h3>

              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                Thoughtful packaging for a better tomorrow. Discover our collection and packaging approach.
              </p>

              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="mt-4 inline-flex items-center gap-2 self-start rounded-lg border border-[#16A34A] bg-white px-4 py-2 text-xs sm:text-sm font-bold text-[#16A34A] hover:bg-green-50 transition-colors cursor-pointer"
              >
                Learn More
                <ArrowRightIcon className="w-4 h-4" />
              </button>

            </div>

            {/* Large packaging and leaves illustration */}
            <div className="absolute right-0 bottom-0 w-[43%] h-full flex items-end justify-center pointer-events-none">

              <svg
                viewBox="0 0 340 230"
                className="w-full h-full max-h-[215px]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >

                {/* Background leaves */}
                <path
                  d="M245 150 C245 85 290 45 325 38 C325 90 294 139 245 150Z"
                  fill="#16A34A"
                />
                <path
                  d="M248 151 C253 99 291 63 317 47"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                />

                <path
                  d="M265 165 C285 110 315 100 338 105 C325 145 302 169 265 165Z"
                  fill="#84CC16"
                />
                <path
                  d="M267 164 L329 111"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                />

                <path
                  d="M80 155 C39 121 30 79 43 56 C83 75 101 119 80 155Z"
                  fill="#65A30D"
                />
                <path
                  d="M79 153 L46 64"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                />

                {/* Package shadow */}
                <ellipse
                  cx="190"
                  cy="207"
                  rx="120"
                  ry="15"
                  fill="#365314"
                  opacity=".12"
                />

                {/* Package top */}
                <path
                  d="M91 91 L190 48 L291 91 L190 137 Z"
                  fill="#E7BD8B"
                />

                {/* Package front */}
                <path
                  d="M91 91 V178 L190 220 V137 Z"
                  fill="#C88B52"
                />

                {/* Package side */}
                <path
                  d="M190 137 V220 L291 178 V91 Z"
                  fill="#DEA871"
                />

                {/* Package edges */}
                <path
                  d="M190 48 V137"
                  stroke="#B7793D"
                  strokeWidth="2"
                />
                <path
                  d="M91 91 L190 137 L291 91"
                  stroke="#B7793D"
                  strokeWidth="2"
                />

                {/* Packing tape */}
                <path
                  d="M176 55 L202 67 V146 L176 135 Z"
                  fill="#F3DAA8"
                />
                <path
                  d="M176 55 L190 49 L216 61 L202 67 Z"
                  fill="#F8E7C5"
                />

                {/* Recycling symbol */}
                <g
                  transform="translate(224 116) scale(.65)"
                  stroke="#166534"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 5 L21 5 L26 14" />
                  <path d="M26 14 L18 17" />
                  <path d="M26 14 L30 7" />
                  <path d="M29 21 L35 31 L29 40" />
                  <path d="M29 40 L25 32" />
                  <path d="M29 40 L37 42" />
                  <path d="M17 43 L5 43 L0 34" />
                  <path d="M0 34 L9 31" />
                  <path d="M0 34 L-3 41" />
                </g>

              </svg>

            </div>

          </section>

        </div>

        {/* ==========================================
            RIGHT INFORMATION COLUMN
        ========================================== */}
        <div className="lg:col-span-4 space-y-4">

          {/* 1. WALLET BALANCE */}
          <div className="bg-[#FF7900] text-white rounded-2xl shadow-sm p-5 space-y-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <WalletIcon className="w-5 h-5 text-white" />
                </div>

                <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">
                  Wallet Balance
                </span>
              </div>

              <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-md">
                {currentGuest?.guestId}
              </span>

            </div>

            <div className="flex items-baseline justify-between pt-1">

              <span className="text-3xl font-black font-mono tracking-tight">
                {formatCurrency(walletBalance)}
              </span>

              <button
                type="button"
                onClick={() => onNavigate('wallet')}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-orange-50 text-[#FF7900] text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Recharge
              </button>

            </div>

          </div>

          {/* 2. RUSH DELIVERY PROMOTION */}
          <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-[#EAF3FF] p-5 min-h-[190px] flex items-center">

            {/* Rush text */}
            <div className="relative z-10 w-[68%]">

              <div className="flex items-center gap-1.5 text-[#1677FF] text-[11px] font-black uppercase tracking-wider">
                <LightningIcon className="w-4 h-4" />
                Priority Delivery
              </div>

              <h3 className="mt-3 text-xl font-black text-slate-900 leading-tight">
                Need It Faster?
              </h3>

              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Choose a 3–7 minute Rush deadline at checkout.
              </p>

              <p className="mt-1 text-xs font-black text-[#1677FF]">
                +20% surcharge
              </p>

              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#1677FF] bg-white px-3 py-2 text-xs font-bold text-[#1677FF] hover:bg-blue-50 transition-colors cursor-pointer"
              >
                Select Rush
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>

            </div>

            {/* Large stopwatch illustration */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-[36%] flex items-center justify-center pointer-events-none">

              <svg
                viewBox="0 0 160 180"
                className="w-full max-w-[140px]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >

                {/* Speed lines */}
                <path
                  d="M5 66 H36"
                  stroke="#1677FF"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M0 83 H27"
                  stroke="#1677FF"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M10 100 H33"
                  stroke="#1677FF"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Stopwatch button */}
                <rect x="66" y="8" width="27" height="13" rx="5" fill="#0958D9" />
                <rect x="75" y="0" width="9" height="13" rx="3" fill="#1677FF" />

                {/* Stopwatch body */}
                <circle
                  cx="80"
                  cy="91"
                  r="61"
                  fill="#FFFFFF"
                  stroke="#1677FF"
                  strokeWidth="10"
                />

                <circle
                  cx="80"
                  cy="91"
                  r="51"
                  stroke="#BFDBFE"
                  strokeWidth="2"
                />

                {/* Clock markings */}
                <path
                  d="M80 49 V56 M80 126 V133 M38 91 H45 M115 91 H122"
                  stroke="#1677FF"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Clock hands */}
                <path
                  d="M80 91 L80 60"
                  stroke="#0958D9"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                <path
                  d="M80 91 L102 75"
                  stroke="#FF7900"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                <circle cx="80" cy="91" r="6" fill="#FF7900" />

                {/* Stopwatch highlight */}
                <path
                  d="M113 48 L119 41"
                  stroke="#93C5FD"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

              </svg>

            </div>

          </section>

          {/* 3. ACTIVE ORDERS */}
          <ActiveOrdersPreview
            orders={orders}
            onNavigate={onNavigate}
            onTrackOrder={handleTrackOrder}
          />

          {/* 4. RECENT NOTIFICATIONS */}
          <RecentNotificationsPreview
            notifications={notifications}
            onNavigate={onNavigate}
          />

        </div>

      </div>

      {/* ORDER TRACKING MODAL */}
      <OrderTrackingModal
        order={trackingOrder}
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        onCancelClick={() => onNavigate('orders')}
      />

    </div>
  );
}
