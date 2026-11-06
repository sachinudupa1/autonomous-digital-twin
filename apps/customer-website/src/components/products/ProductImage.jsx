/**
 * ProductImage — Displays the actual glass-ball product photograph.
 */

import { PRODUCT_IMAGES } from '../../constants/productImages';

const SIZE_CLASSES = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
  hero: 'w-40 h-40',
  fill: 'w-full h-full',
};

export function ProductImage({
  productId,
  size = 'md',
  fit = 'contain',
  rounded = true,
  className = '',
}) {
  const image = PRODUCT_IMAGES[productId] || PRODUCT_IMAGES['prod-1'];

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const shapeClass = rounded ? 'rounded-2xl' : 'rounded-none';
  const objectFitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${shapeClass} ${sizeClass} ${className}`.trim()}
      style={{ backgroundColor: `${image.bg}22` }}
    >
      <img
        src={image.src}
        alt={image.alt}
        className={`block w-full h-full ${objectFitClass} select-none`}
        draggable={false}
        loading="lazy"
      />
    </div>
  );
}