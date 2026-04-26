import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  ArrowPathRoundedSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarDaysIcon,
  UserIcon,
  TruckIcon,
  ShoppingBagIcon,
  ReceiptRefundIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import AddReturnModal from '../components/returns/AddReturnModal';
import InvoicePrint from '../components/ui/InvoicePrint';

const Returns = () => {
  const [salesReturns, setSalesReturns] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [printType, setPrintType] = useState('sale_return');

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const [salesRes, purchaseRes] = await Promise.all([
        api.get('/returns/sales'),
        api.get('/returns/purchases')
      ]);
      setSalesReturns(salesRes.data);
      setPurchaseReturns(purchaseRes.data);
    } catch (error) {
      toast.error('Failed to load return records');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (item) => {
    setPrintData(item);
    setPrintType(activeTab === 'sales' ? 'sale_return' : 'purchase_return');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const data = activeTab === 'sales' ? salesReturns : purchaseReturns;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Return <span className="text-primary-600">Records</span>
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
            Manage and track all sales returns from customers and purchase returns to suppliers.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <ArrowPathRoundedSquareIcon className="w-5 h-5" />
          Create Return Bill
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit">
        <button 
          onClick={() => { setActiveTab('sales'); setExpandedId(null); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'sales' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Sales Returns
        </button>
        <button 
          onClick={() => { setActiveTab('purchase'); setExpandedId(null); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'purchase' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Purchase Returns
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card-premium p-16 text-center">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading return records...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="card-premium p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto">
              <ReceiptRefundIcon className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">No {activeTab} returns found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">Any returns you process from history will appear here for your records.</p>
          </div>
        ) : (
          data.map(item => (
            <div key={item.id} className="card-premium overflow-hidden">
              <div 
                className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl ${activeTab === 'sales' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'} flex items-center justify-center`}>
                    <ArrowPathRoundedSquareIcon className={`w-6 h-6 ${activeTab === 'sales' ? 'text-emerald-600' : 'text-rose-600'}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {activeTab === 'sales' ? `Sales Return SR-${item.id}` : `Purchase Return PR-${item.id}`}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-400">
                        {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      {activeTab === 'sales' ? (
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-500">
                            {item.sale?.customer?.name || item.customer?.name || 'Walk-in'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <TruckIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-500">
                            {item.purchase?.supplier?.name || item.supplier?.name || 'Unknown'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className={`text-lg font-black ${activeTab === 'sales' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      PKR {parseFloat(item.total_refund_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Refunded to Balance</p>
                  </div>
                  {expandedId === item.id ? <ChevronUpIcon className="w-5 h-5 text-slate-400" /> : <ChevronDownIcon className="w-5 h-5 text-slate-400" />}
                </div>
              </div>

              {expandedId === item.id && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-6 py-6 space-y-6">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Reason for Return</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 italic">"{item.reason || 'No reason provided'}"</p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">Returned Items</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Product</th>
                            <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Qty</th>
                            <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Rate</th>
                            <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                          {item.items.map((rItem, idx) => (
                            <tr key={idx}>
                              <td className="py-4">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{rItem.product?.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{rItem.product?.sku}</p>
                              </td>
                              <td className="py-4 text-center text-sm font-black text-primary-600">{rItem.quantity}</td>
                              <td className="py-4 text-right text-sm font-bold text-slate-600">
                                PKR {parseFloat(activeTab === 'sales' ? rItem.unit_price : rItem.unit_cost).toFixed(2)}
                              </td>
                              <td className="py-4 text-right text-sm font-black text-slate-900 dark:text-white">
                                PKR {(rItem.quantity * parseFloat(activeTab === 'sales' ? rItem.unit_price : rItem.unit_cost)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-5 bg-slate-900 rounded-[2rem] text-white">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-500">Original Reference</p>
                      <p className="text-sm font-bold mt-0.5">
                        {activeTab === 'sales' 
                          ? (item.sale_id ? `Invoice INV-${item.sale_id}` : 'Direct Return') 
                          : (item.purchase_id ? `Purchase Bill PUR-${item.purchase_id}` : 'Direct Return')}
                      </p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <button 
                        onClick={() => handlePrint(item)}
                        className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-black transition-all"
                      >
                        <PrinterIcon className="w-4 h-4" />
                        Print Receipt
                      </button>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-500">Total Refund</p>
                        <p className="text-2xl font-black">PKR {parseFloat(item.total_refund_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <AddReturnModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchReturns}
      />
      <InvoicePrint data={printData} type={printType} />
    </div>
  );
};

export default Returns;
