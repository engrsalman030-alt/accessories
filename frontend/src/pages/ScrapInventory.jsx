import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ArchiveBoxIcon, 
  ExclamationTriangleIcon, 
  TrashIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';

const ScrapInventory = () => {
  const [scrapItems, setScrapItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchScrapItems();
  }, []);

  const fetchScrapItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products?limit=1000');
      // Filter products that have scrap_qty > 0
      const items = res.data.filter(p => p.scrap_qty > 0);
      setScrapItems(items);
    } catch (error) {
      console.error('Failed to fetch scrap items');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = scrapItems.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalScrapValue = filteredItems.reduce((acc, cur) => acc + (cur.scrap_qty * cur.cost_price), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Scrap <span className="text-rose-600 underline decoration-rose-500/30">Inventory</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs italic">Damaged & non-saleable items</p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:min-w-[300px]">
             <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
             <input 
                type="text"
                placeholder="Search scrap items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold focus:border-rose-500 outline-none transition-all"
             />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium p-8 bg-gradient-to-br from-rose-50 to-white dark:from-rose-500/10 dark:to-slate-900">
           <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <TrashIcon className="w-6 h-6" />
           </div>
           <p className="text-[10px] font-black uppercase text-rose-600 tracking-[0.2em]">Total Scrap Items</p>
           <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{filteredItems.length}</p>
        </div>

        <div className="card-premium p-8 bg-gradient-to-br from-amber-50 to-white dark:from-amber-500/10 dark:to-slate-900">
           <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <ArchiveBoxIcon className="w-6 h-6" />
           </div>
           <p className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em]">Total Quantity</p>
           <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {filteredItems.reduce((acc, cur) => acc + cur.scrap_qty, 0).toLocaleString()}
           </p>
        </div>

        <div className="card-premium p-8 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-500/10 dark:to-slate-900">
           <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <CurrencyDollarIcon className="w-6 h-6" />
           </div>
           <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em]">Loss Value (at Cost)</p>
           <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">PKR {totalScrapValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Details</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">SKU</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Scrap Qty</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Unit Cost</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total Loss</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-black animate-pulse uppercase tracking-widest">Scanning Wastage Records...</td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-rose-500 font-black text-xs">
                           {product.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{product.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{product.category?.name || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-slate-500">{product.sku}</td>
                    <td className="px-6 py-4 text-center">
                       <span className="inline-flex items-center px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-full text-xs font-black ring-1 ring-rose-500/20">
                          {product.scrap_qty}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-600 dark:text-slate-400">
                      {product.cost_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white">
                      {(product.scrap_qty * product.cost_price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-1 text-[10px] font-black text-amber-600 uppercase">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          Non-Saleable
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                       <ArchiveBoxIcon className="w-12 h-12" />
                       <p className="font-black uppercase tracking-widest text-xs">No scrap items found in inventory</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScrapInventory;
