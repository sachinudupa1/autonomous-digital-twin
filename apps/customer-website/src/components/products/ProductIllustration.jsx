/**
 * ProductIllustration — backward-compatibility re-export.
 * All new code should import ProductImage directly.
 * This shim keeps existing imports (CartPage, etc.) working unchanged.
 */
export { ProductImage as ProductIllustration } from './ProductImage';

/**
 * HeroBoxGraphic — no longer used; kept as a null export so any stale
 * import elsewhere does not cause a build error.
 */
export function HeroBoxGraphic() {
  return null;
}
