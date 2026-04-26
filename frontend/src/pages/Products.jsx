import React, { useEffect, useState } from 'react';
import useProductStore from '../store/productStore';
import ProductModal from '../components/ProductModal';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function Products() {
  const { products, categories, brands, fetchProducts, fetchCategories, fetchBrands, deleteProduct, uploadImage, loading } = useProductStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, [fetchProducts, fetchCategories, fetchBrands]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(searchTerm);
  };

  const handleAddProduct = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id) => {
    setIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (idToDelete) {
      const success = await deleteProduct(idToDelete);
      if (success) toast.success('Product deleted successfully');
      setIdToDelete(null);
    }
  };

  const handleImageUpload = async (e, id) => {
    const file = e.target.files[0];
    if (file) {
      const success = await uploadImage(id, file);
      if (success) toast.success('Image uploaded successfully');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === '' || p.category_id === parseInt(selectedCategory);
    const matchesBrand = selectedBrand === '' || p.brand_id === parseInt(selectedBrand);
    return matchesCategory && matchesBrand;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Inventory <span className="text-primary-600">Stock</span>
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
            Manage your products, track stock levels and update pricing.
          </p>
        </div>
        <div className="flex items-center gap-3">

          <button
            onClick={handleAddProduct}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Filters & Search Card */}
      <div className="card-premium p-4 md:p-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, SKU, Barcode, or IMEI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowFilters(!showFilters)} className={`btn-secondary px-4 ${showFilters ? 'bg-primary-50 text-primary-600 border-primary-200' : ''}`}>
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              <span className="hidden lg:inline">Filters</span>
            </button>
            <button type="submit" className="btn-primary px-8">
              Search
            </button>
          </div>
        </form>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 animate-slide-up">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full sm:w-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 font-bold text-slate-600 dark:text-slate-300"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full sm:w-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary-500 font-bold text-slate-600 dark:text-slate-300"
            >
              <option value="">All Brands</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {(selectedCategory || selectedBrand) && (
              <button
                type="button"
                onClick={() => { setSelectedCategory(''); setSelectedBrand(''); }}
                className="text-sm font-bold text-rose-500 hover:text-rose-600 px-4"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Table */}
      <div className="card-premium overflow-hidden border-none shadow-premium-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Product Info</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">SKU</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pricing (R/W/D)</th>
                <th className="px-6 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Availability</th>
                <th className="px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-600 rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-bold animate-pulse">Loading Inventory...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 animate-slide-up">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                        <CubeIcon className="h-10 w-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">No products found</h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Try adjusting your search or add a new product to get started.</p>
                      <button onClick={handleAddProduct} className="btn-primary mt-2">Add First Product</button>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 animate-slide-up">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                        <AdjustmentsHorizontalIcon className="h-10 w-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">No matches found</h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Try adjusting your filters or search terms.</p>
                      <button onClick={() => { setSelectedCategory(''); setSelectedBrand(''); setSearchTerm(''); handleSearch({ preventDefault: () => { } }); }} className="btn-secondary mt-2">Clear All Filters</button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, idx) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-14 w-14 flex-shrink-0 relative group/img cursor-pointer">
                          {product.image_url ? (
                            <img className="h-14 w-14 rounded-2xl object-cover shadow-sm group-hover/img:shadow-md transition-all border border-slate-100 dark:border-slate-800" src={`http://localhost:8000${product.image_url}`} alt="" />
                          ) : (
                            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700">
                              <PhotoIcon className="h-7 w-7 text-slate-400" />
                            </div>
                          )}
                          <label className="absolute inset-0 bg-primary-600/80 flex items-center justify-center rounded-2xl opacity-0 group-hover/img:opacity-100 cursor-pointer transition-opacity backdrop-blur-[2px]">
                            <PhotoIcon className="h-6 w-6 text-white" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, product.id)} />
                          </label>
                        </div>
                        <div className="ml-5">
                          <div className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">{product.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{product.category?.name || 'Uncategorized'}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-xs font-semibold text-slate-400">{product.brand?.name || 'No Brand'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="font-mono text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {product.sku || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-400 font-bold uppercase">Retail:</span>
                          <span className="text-primary-600 dark:text-primary-400 font-extrabold text-sm">PKR {product.retail_price}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-400 font-bold uppercase">Wholesale:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">PKR {product.wholesale_price}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-bold ring-1 ring-inset ${product.stock_qty <= product.min_stock_qty
                            ? 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400'
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                          {product.stock_qty} in stock
                        </span>
                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${product.stock_qty <= product.min_stock_qty ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((product.stock_qty / (product.min_stock_qty * 3)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all active:scale-95"
                          title="Edit Product"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all active:scale-95"
                          title="Delete Product"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete Product"
      />
    </div>
  );
}
