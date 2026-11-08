
import { ProductImage } from './ProductImage';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../common/Button';

export function ProductCard({ product, onViewDetails, onQuickAdd }) {
  return (
    <article className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-150 flex flex-col overflow-hidden">

      {/* Full-width product photograph */}
      <button
        type="button"
        onClick={() => onViewDetails(product)}
        className="group block w-full aspect-[4/3] overflow-hidden bg-slate-50 cursor-pointer"
        aria-label={`View ${product.title} details`}
      >
        <ProductImage
          productId={product.id}
          size="fill"
          fit="cover"
          rounded={false}
          className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </button>

      {/* Product information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <span
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: product.colorHex }}
          >
            {product.brand}
          </span>

          <h4
            onClick={() => onViewDetails(product)}
            className="mt-1 text-sm sm:text-base font-black text-slate-900 cursor-pointer hover:text-[#FF7900] transition-colors leading-tight"
          >
            {product.title}
          </h4>

          <p className="mt-1 text-[11px] text-slate-400 italic leading-tight">
            {product.brandTagline}
          </p>

          <div className="text-xl sm:text-2xl font-black text-slate-900 pt-2">
            {formatCurrency(product.price)}
          </div>
        </div>

        {/* Product actions */}
        <div className="pt-1 flex flex-col gap-1.5">
          <Button
            variant={product.color}
            size="md"
            fullWidth
            onClick={() => onQuickAdd(product)}
          >
            Add to Cart
          </Button>

          <button
            type="button"
            onClick={() => onViewDetails(product)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 text-center py-0.5 cursor-pointer hover:underline"
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}
