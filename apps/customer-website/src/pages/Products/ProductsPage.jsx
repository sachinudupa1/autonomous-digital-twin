
import { useState } from 'react';
import { PRODUCTS } from '../../constants/config';
import { ProductCard } from '../../components/products/ProductCard';
import { ProductModal } from '../../components/products/ProductModal';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../hooks/useToast';
import {
  PackageIcon,
  CartIcon,
  SearchIcon,
  CloseIcon,
} from '../../components/common/Icons';

/**
 * Convert search text into individual lowercase words.
 */
function tokenize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];
}

/**
 * Match every query word against the product's searchable information.
 * Complete words and word beginnings are supported.
 */
function matchesQuery(product, query) {
  const queryWords = tokenize(query);

  if (queryWords.length === 0) {
    return true;
  }

  const productWords = tokenize([
    product.name,
    product.title,
    product.brand,
    product.brandTagline,
    product.shortDescription,
    product.searchTags || '',
  ].join(' '));

  return queryWords.every((queryWord) =>
    productWords.some((productWord) =>
      productWord === queryWord ||
      productWord.startsWith(queryWord) ||
      (
        queryWord.length > 3 &&
        queryWord.endsWith('s') &&
        productWord === queryWord.slice(0, -1)
      )
    )
  );
}

export function ProductsPage({ onNavigate, navParams }) {
  const { addToCart, totalItems } = useCart();
  const { showToast } = useToast();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Synchronize the search text received from the navbar.
  const navSearch = navParams?.search || '';
  const [prevNavSearch, setPrevNavSearch] = useState(navSearch);
  const [filterQuery, setFilterQuery] = useState(navSearch);

  if (navSearch !== prevNavSearch) {
    setPrevNavSearch(navSearch);
    setFilterQuery(navSearch);
  }

  const filteredProducts = PRODUCTS.filter((product) =>
    matchesQuery(product, filterQuery)
  );

  const handleOpenDetails = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddToCart = (product, quantity) => {
    addToCart(product, quantity);
    showToast(
      `Added ${quantity} × ${product.title} (${product.brand}) to your cart!`,
      'success'
    );
  };

  const handleQuickAdd = (product) => {
    addToCart(product, 1);
    showToast(`Added 1 × ${product.title} to cart!`, 'success');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">

      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-orange-50 text-[#FF7900] border border-orange-200 text-xs font-bold mb-1.5">
            <PackageIcon className="w-3.5 h-3.5" />
            <span>Glass Ball Collection</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Our Products
          </h1>

          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Four premium borosilicate glass balls from four distinct brands.
          </p>
        </div>

        {/* Search and Cart */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setFilterQuery('');
                }
              }}
              placeholder="Search products or brands..."
              className="h-10 pl-9 pr-8 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#FF7900] focus:ring-2 focus:ring-[#FF7900]/20 outline-none font-medium w-44 sm:w-52 transition-all"
              aria-label="Search products"
            />

            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Clear search"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {totalItems > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('cart')}
              className="h-10 flex items-center gap-2 px-4 rounded-xl bg-[#FF7900] text-white font-bold text-xs hover:bg-[#E56D00] transition-all shadow-xs cursor-pointer shrink-0"
            >
              <CartIcon className="w-4 h-4" />
              <span>Cart ({totalItems})</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {filterQuery && filteredProducts.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-sm text-slate-500 space-y-3">
          <p>
            No products matched <strong>&ldquo;{filterQuery}&rdquo;</strong>.
          </p>

          <button
            type="button"
            onClick={() => setFilterQuery('')}
            className="text-[#FF7900] font-bold underline text-xs cursor-pointer"
          >
            Clear search — show all products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={handleOpenDetails}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>
      )}

      {/* Notice */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div>
          <span className="font-bold text-slate-800">
            Fixed Unit Pricing:
          </span>
          {' '}Product unit rates are fixed.
        </div>

        <div className="font-bold text-[#1677FF] shrink-0">
          Maximum 5 units per product
        </div>
      </div>

      {/* Product Details Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleAddToCart}
      />

    </div>
  );
}
