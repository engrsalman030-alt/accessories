import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import api from '../services/api';
import { 
  BuildingOfficeIcon, 
  CubeIcon, 
  CurrencyDollarIcon,
  TagIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const ProductViewModal = ({ isOpen, onClose, productId }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && productId) {
      fetchDetail();
    }
  }, [isOpen, productId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${productId}/detail`);
      setDetail(res.data);
    } catch (error) {
      console.error('Failed to fetch product details', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product Inventory Insights" size="lg">
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Analyzing stock data...</p>
        </div>
      ) : detail ? (
        <div className="space-y-8">
          {/* Header Info */}
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden">
              {detail.product.image_url ? (
                <img 
                  src={`${api.defaults.baseURL}${detail.product.image_url}`} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <CubeIcon className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{detail.product.name}</h2>
                <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-full text-[10px] font-black uppercase text-primary-600 border border-primary-100 dark:border-primary-800">
                  {detail.product.category?.name || 'No Category'}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                SKU: <span className="text-slate-900 dark:text-slate-200 font-black">{detail.product.sku || 'N/A'}</span>
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retail Price</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">PKR {(detail.product.retail_price || 0).toLocaleString()}</p>
                </div>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost Price</p>
                  <p className="text-lg font-black text-rose-600">PKR {(detail.product.cost_price || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stock Metrics */}
            <div className="card-premium p-6 bg-primary-50/10 border-l-4 border-primary-500">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CubeIcon className="w-4 h-4 text-primary-500" />
                Current Stock
              </h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900 dark:text-white">{detail.product.stock_qty || 0}</span>
                <span className="text-sm font-bold text-slate-500">Units Available</span>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inventory Value (at Cost)</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  PKR {detail.stock_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Supplier Network */}
            <div className="card-premium p-6 bg-slate-50/30">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BuildingOfficeIcon className="w-4 h-4 text-amber-500" />
                Known Suppliers
              </h3>
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {detail.suppliers && detail.suppliers.length > 0 ? (
                  detail.suppliers.map((s, i) => (
                    <div key={i} className="px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <BuildingOfficeIcon className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{s}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs font-bold text-slate-400 italic">No purchase history found for this item.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {detail.product.description && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <InformationCircleIcon className="w-4 h-4" />
                Product Description
              </h3>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                {detail.product.description}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-slate-500 font-bold">Failed to load product details.</p>
        </div>
      )}
    </Modal>
  );
};

export default ProductViewModal;
