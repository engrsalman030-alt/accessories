import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ArchiveBoxIcon, 
  ExclamationTriangleIcon, 
  TrashIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

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
      const res = await api.get('/products?size=1000');
      // The API returns a paginated object: { items: [...], total: ... }
      const items = res.data.items.filter(p => p.scrap_qty > 0);
      setScrapItems(items);
    } catch (error) {
      console.error('Failed to fetch scrap items', error);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Scrap <span className="text-rose-600 underline decoration-rose-500/30">Inventory</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-black uppercase tracking-widest text-[10px]">Damaged items</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:min-w-[280px]">
             <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             <input 
                type="text"
                placeholder="Search scrap..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-[13px] font-bold focus:border-rose-500 outline-none transition-all"
             />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-premium p-4 border-l-4 border-rose-500 bg-rose-50/10 transition-all cursor-default">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-[10px] font-black uppercase text-rose-500 tracking-[0.2em] leading-none">Total Items</p>
               <p className="text-xl font-black text-slate-900 dark:text-white mt-2">{filteredItems.length}</p>
             </div>
             <div className="w-9 h-9 bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-md shadow-rose-500/20">
                <TrashIcon className="w-5 h-5" />
             </div>
           </div>
        </div>

        <div className="card-premium p-4 border-l-4 border-amber-500 bg-amber-50/10 transition-all cursor-default">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] leading-none">Total Quantity</p>
               <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
                  {filteredItems.reduce((acc, cur) => acc + cur.scrap_qty, 0).toLocaleString()}
               </p>
             </div>
             <div className="w-9 h-9 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-md shadow-amber-500/20">
                <ArchiveBoxIcon className="w-5 h-5" />
             </div>
           </div>
        </div>

        <div className="card-premium p-4 border-l-4 border-indigo-500 bg-indigo-50/10 transition-all cursor-default">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] leading-none">Loss Value</p>
               <p className="text-xl font-black text-slate-900 dark:text-white mt-2">PKR {totalScrapValue.toLocaleString()}</p>
             </div>
             <div className="w-9 h-9 bg-indigo-500 text-white rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
                <CurrencyDollarIcon className="w-5 h-5" />
             </div>
           </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">SKU</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total Loss</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-black animate-pulse uppercase tracking-widest">Scanning Wastage Records...</td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-rose-500 font-black text-[10px] border border-slate-200 dark:border-slate-700">
                           {product.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{product.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{product.category?.name || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-tighter">{product.sku}</td>
                    <td className="px-4 py-2.5 text-center">
                       <span className="inline-flex items-center px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-lg text-[10px] font-black border border-rose-500/20">
                          {product.scrap_qty}
                       </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                      {product.cost_price.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-black text-rose-600 tabular-nums">
                      {(product.scrap_qty * product.cost_price).toLocaleString()}
                    </td>
                    <td className="px-5 py-2.5 text-center">
                       <div className="flex items-center justify-center gap-1 text-[9px] font-black text-amber-600 uppercase tracking-tighter">
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
