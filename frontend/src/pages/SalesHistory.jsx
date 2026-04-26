import React, { useEffect, useState } from 'react';
import saleService from '../services/saleService';
import InvoicePrint from '../components/ui/InvoicePrint';
import ReturnModal from '../components/sales/ReturnModal';
import { 
  ShoppingBagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PrinterIcon,
  ReceiptPercentIcon,
  UserIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [printSale, setPrintSale] = useState(null);
  const [returnSale, setReturnSale] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await saleService.getAll();
      setSales(response.data);
    } catch (error) {
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'partial': return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const handlePrint = (sale) => {
    setPrintSale(sale);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Sales <span className="text-primary-600">History</span>
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
          Complete record of all your sales invoices with full item details.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-premium p-5">
          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Total Invoices</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{sales.length}</p>
        </div>
        <div className="card-premium p-5">
          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Total Revenue</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            PKR {sales.reduce((sum, s) => sum + (s.total_amount || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card-premium p-5">
          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Amount Received</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            PKR {sales.reduce((sum, s) => sum + (s.amount_paid || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card-premium p-5">
          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Outstanding</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            PKR {sales.reduce((sum, s) => sum + (s.balance_due || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card-premium p-16 text-center">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading sales history...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="card-premium p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto">
              <ShoppingBagIcon className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">No sales recorded yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">Complete your first sale from the POS to see it here.</p>
          </div>
        ) : (
          sales.map(sale => (
            <div key={sale.id} className="card-premium overflow-hidden transition-all duration-200">
              {/* Main Row */}
              <div 
                className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                onClick={() => toggleExpand(sale.id)}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                    <ReceiptPercentIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">INV-{sale.id}</h3>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ring-1 ring-inset ${getStatusStyle(sale.status)}`}>
                        {sale.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {sale.customer_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {sale.customer_name || 'Walk-in'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-xs font-semibold text-slate-400">
                        {new Date(sale.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-xs font-semibold text-slate-400">
                        {sale.items?.length || 0} item{(sale.items?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                      PKR {(sale.total_amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      PAID: PKR {(sale.amount_paid || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrint(sale); }}
                      className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                      title="Print Invoice"
                    >
                      <PrinterIcon className="w-5 h-5" />
                    </button>
                    {expandedId === sale.id ? (
                      <ChevronUpIcon className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === sale.id && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-6 py-5 animate-slide-up">
                  {/* Items Table */}
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Sold Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">#</th>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Product</th>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Qty</th>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Unit Price</th>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(sale.items || []).map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 text-sm font-semibold text-slate-400">{idx + 1}</td>
                            <td className="py-3 text-sm font-bold text-slate-900 dark:text-white">
                              {item.product_name || `Product #${item.product_id}`}
                            </td>
                            <td className="py-3 text-sm font-bold text-slate-600 dark:text-slate-300 text-center">{item.quantity}</td>
                            <td className="py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">
                              PKR {(item.unit_price || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 text-sm font-bold text-slate-900 dark:text-white text-right">
                              PKR {(item.total_price || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        {sale.discount > 0 && (
                          <tr className="border-t border-slate-200 dark:border-slate-700">
                            <td colSpan="4" className="pt-3 text-sm font-bold text-slate-500 text-right">Discount:</td>
                            <td className="pt-3 text-sm font-bold text-rose-600 text-right">
                              - PKR {(sale.discount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}
                        <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                          <td colSpan="4" className="pt-3 text-sm font-extrabold text-slate-900 dark:text-white text-right">Grand Total:</td>
                          <td className="pt-3 text-sm font-extrabold text-primary-600 text-right">
                            PKR {(sale.total_amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Payment Info */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Customer</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{sale.customer_name || 'Walk-in'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{sale.customer_type}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Payment Method</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 capitalize">{sale.payment_method || 'Cash'}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Amount Paid</p>
                      <p className="text-sm font-bold text-emerald-600 mt-1">PKR {(sale.amount_paid || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Balance Due</p>
                      <p className={`text-sm font-bold mt-1 ${sale.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        PKR {(sale.balance_due || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Return Action */}
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => { setReturnSale(sale); setIsReturnModalOpen(true); }}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all border border-rose-100"
                    >
                      <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                      Process Items Return
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Hidden Print View */}
      {printSale && (
        <div className="hidden print:block">
          <InvoicePrint 
            type="sale"
            data={printSale}
          />
        </div>
      )}

      <ReturnModal 
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        data={returnSale}
        type="sale"
        onComplete={fetchSales}
      />
    </div>
  );
}
