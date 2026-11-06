import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ProductImage } from './ProductImage';
import { formatCurrency } from '../../utils/formatters';
import { PlusIcon, MinusIcon, CartIcon } from '../common/Icons';
import { QUANTITY_LIMITS } from '../../constants/config';

export function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(QUANTITY_LIMITS.min, prev - 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => Math.min(QUANTITY_LIMITS.max, prev + 1));
  };

  const handleAdd = () => {
    if (quantity > 0) {
      onAddToCart(product, quantity);
      setQuantity(1);
      onClose();
    }
  };

  const handleClose = () => {
    setQuantity(1);
    onClose();
  };

  // Render spec entries dynamically for forward/backward compatibility
  const specEntries = Object.entries(product.specs || {}).map(([key, val]) => {
    const labels = {
      dimensions: 'Dimensions',
      material: 'Material',
      weightCapacity: 'Max Payload',
      sealType: 'Seal / Pack Type',
      diameter: 'Diameter',
      finish: 'Finish',
    };
    return { label: labels[key] || key, value: val };
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={product.title}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Photo + Price row */}
        <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <ProductImage productId={product.id} size="lg" className="shrink-0" />
          <div className="space-y-1 min-w-0">
            {/* Brand */}
            <span
              className="text-[11px] font-black uppercase tracking-widest block"
              style={{ color: product.colorHex }}
            >
              {product.brand}
            </span>
            {/* Tagline */}
            <p className="text-[11px] text-slate-400 italic">{product.brandTagline}</p>
            {/* Title */}
            <h4 className="text-lg font-black text-slate-900 leading-tight">{product.title}</h4>
            {/* Price */}
            <div className="text-2xl font-black text-slate-900 pt-0.5">
              {formatCurrency(product.price)}{' '}
              <span className="text-xs font-normal text-slate-500">/ unit (fixed)</span>
            </div>
          </div>
        </div>

        {/* Description + Specs */}
        <div className="space-y-2 text-xs">
          <p className="text-slate-600 leading-relaxed">{product.longDescription}</p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {specEntries.map(({ label, value }) => (
              <div key={label} className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block font-medium">{label}:</span>
                <span className="font-bold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Quantity:</span>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={quantity <= 0}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                aria-label="Decrease quantity"
              >
                <MinusIcon className="w-3.5 h-3.5 text-slate-700" />
              </button>
              <span className="w-8 text-center text-xs font-black text-slate-900 font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                disabled={quantity >= QUANTITY_LIMITS.max}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                aria-label="Increase quantity"
              >
                <PlusIcon className="w-3.5 h-3.5 text-slate-700" />
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">(Max 5)</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Subtotal</span>
            <span className="text-base font-black text-slate-900">
              {formatCurrency(product.price * quantity)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant={product.color}
            size="sm"
            disabled={quantity <= 0}
            onClick={handleAdd}
            icon={<CartIcon className="w-4 h-4" />}
          >
            Add {quantity} to Cart
          </Button>
        </div>
      </div>
    </Modal>
  );
}
