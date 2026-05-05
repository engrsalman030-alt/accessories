import React, { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import useProductStore from '../store/productStore';
import toast from 'react-hot-toast';

function QuickAddModal({ isOpen, onClose, title, onSubmit }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setName('');
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const success = await onSubmit(name.trim());
    setSubmitting(false);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10002 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700"
        style={{ animation: 'fadeInScale 0.2s ease-out' }}
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          {title}
        </h3>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
            className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-3 px-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
      
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default function ProductModal({ isOpen, closeModal, productToEdit }) {
  const { addProduct, updateProduct, categories, brands, fetchCategories, fetchBrands, addCategory, addBrand, error } = useProductStore();
  const isEditMode = Boolean(productToEdit);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    brand_id: '',
    description: '',
    cost_price: '',
    retail_price: '',
    wholesale_price: '',
    distributor_price: '',
    stock_qty: '',
    min_stock_qty: '',
    is_active: true
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, [fetchCategories, fetchBrands]);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        sku: productToEdit.sku || '',
        barcode: productToEdit.barcode || '',
        category_id: productToEdit.category_id || '',
        brand_id: productToEdit.brand_id || '',
        description: productToEdit.description || '',
        cost_price: productToEdit.cost_price || '',
        retail_price: productToEdit.retail_price || '',
        wholesale_price: productToEdit.wholesale_price || '',
        distributor_price: productToEdit.distributor_price || '',
        stock_qty: productToEdit.stock_qty || '',
        min_stock_qty: productToEdit.min_stock_qty || '',
        is_active: productToEdit.is_active !== undefined ? productToEdit.is_active : true
      });
    } else {
      setFormData({
        name: '', sku: '', barcode: '', category_id: '', brand_id: '',
        description: '', cost_price: '', retail_price: '', wholesale_price: '',
        distributor_price: '', stock_qty: '', min_stock_qty: '', is_active: true
      });
    }
  }, [productToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
      e.preventDefault();
      const form = e.currentTarget;
      const elements = Array.from(form.elements).filter(el => !el.disabled && el.type !== 'hidden');
      const index = elements.indexOf(e.target);
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      barcode: formData.barcode.trim() === '' ? null : formData.barcode,
      sku: formData.sku.trim() === '' ? null : formData.sku,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      brand_id: formData.brand_id ? parseInt(formData.brand_id) : null,
      cost_price: parseFloat(formData.cost_price) || 0,
      retail_price: parseFloat(formData.retail_price) || 0,
      wholesale_price: parseFloat(formData.wholesale_price) || 0,
      distributor_price: parseFloat(formData.distributor_price) || 0,
      stock_qty: parseFloat(formData.stock_qty) || 0,
      min_stock_qty: parseFloat(formData.min_stock_qty) || 0,
    };

    if (isEditMode) {
      const success = await updateProduct(productToEdit.id, payload);
      if (success) {
        if (imageFile) {
          await useProductStore.getState().uploadImage(productToEdit.id, imageFile);
        }
        toast.success('Product updated successfully!');
        closeModal();
      }
    } else {
      const newProduct = await addProduct(payload);
      if (newProduct) {
        if (imageFile) {
          await useProductStore.getState().uploadImage(newProduct.id, imageFile);
        }
        toast.success('Product added successfully!');
        closeModal();
      }
    }
  };

  const handleAddCategory = async (name) => {
    const newCat = await addCategory(name);
    if (newCat) {
      toast.success('Category created!');
      setFormData(prev => ({ ...prev, category_id: newCat.id }));
      return true;
    }
    // Error is handled by store and displayed in ProductModal
    return false;
  };

  const handleAddBrand = async (name) => {
    const newBrand = await addBrand(name);
    if (newBrand) {
      toast.success('Brand created!');
      setFormData(prev => ({ ...prev, brand_id: newBrand.id }));
      return true;
    }
    // Error is handled by store and displayed in ProductModal
    return false;
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[10000]" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-5">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-slate-900 dark:text-slate-100">
                      {isEditMode ? 'Edit Product' : 'Add New Product'}
                    </Dialog.Title>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {error && (
                    <div className="mb-4 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm font-bold rounded-r-xl animate-shake">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4 text-slate-700 dark:text-slate-300">
                    {/* Image Upload Area */}
                    <div className="flex justify-center mb-6">
                      <label className="relative cursor-pointer group">
                        <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden hover:border-primary-500 transition-all bg-slate-50 dark:bg-slate-800">
                          {imagePreview || (productToEdit?.image_url) ? (
                            <img src={imagePreview || `http://127.0.0.1:8000${productToEdit.image_url}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center">
                              <PhotoIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                              <p className="text-[10px] font-black uppercase text-slate-400">Add Photo</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                             <PhotoIcon className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Product Name *</label>
                        <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-transparent py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">SKU</label>
                        <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-transparent py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 flex justify-between items-center">
                          Category
                          <button 
                            type="button" 
                            onClick={() => setShowCategoryModal(true)}
                            className="text-indigo-600 hover:text-indigo-700 text-xs font-bold"
                          >
                            + Add New
                          </button>
                        </label>
                        <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-transparent py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 flex justify-between items-center">
                          Brand
                          <button 
                            type="button" 
                            onClick={() => setShowBrandModal(true)}
                            className="text-indigo-600 hover:text-indigo-700 text-xs font-bold"
                          >
                            + Add New
                          </button>
                        </label>
                        <select name="brand_id" value={formData.brand_id} onChange={handleChange} className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-transparent py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                          <option value="">Select Brand</option>
                          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Cost Price</label>
                        <input type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleChange} className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-transparent py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Retail Price *</label>
                        <input required type="number" step="0.01" name="retail_price" value={formData.retail_price} onChange={handleChange} className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-transparent py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Wholesale Price *</label>
                        <input required type="number" step="0.01" name="wholesale_price" value={formData.wholesale_price} onChange={handleChange} className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-transparent py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Distributor Price *</label>
                        <input required type="number" step="0.01" name="distributor_price" value={formData.distributor_price} onChange={handleChange} className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-transparent py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Current Stock Qty</label>
                        <input type="number" name="stock_qty" value={formData.stock_qty} onChange={handleChange} className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-transparent py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Min Stock Alert</label>
                        <input type="number" name="min_stock_qty" value={formData.min_stock_qty} onChange={handleChange} className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-transparent py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Barcode</label>
                        <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-transparent py-2 px-3 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                      <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700">
                        Cancel
                      </button>
                      <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700">
                        {isEditMode ? 'Save Changes' : 'Add Product'}
                      </button>
                    </div>
                  </form>

                  {/* Move Quick Add Modals INSIDE Dialog.Panel to avoid focus trap issues */}
                  <QuickAddModal
                    isOpen={showCategoryModal}
                    onClose={() => setShowCategoryModal(false)}
                    title="Create New Category"
                    onSubmit={handleAddCategory}
                  />

                  <QuickAddModal
                    isOpen={showBrandModal}
                    onClose={() => setShowBrandModal(false)}
                    title="Create New Brand"
                    onSubmit={handleAddBrand}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
