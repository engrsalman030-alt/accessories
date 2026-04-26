import React, { useEffect, useState } from 'react';
import purchaseService from '../services/purchaseService';
import AddPurchaseModal from '../components/purchases/AddPurchaseModal';
import InvoicePrint from '../components/ui/InvoicePrint';
import PaymentModal from '../components/ui/PaymentModal';
import toast from 'react-hot-toast';
import ReturnModal from '../components/sales/ReturnModal';
import { 
  PlusIcon, 
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PrinterIcon,
  TruckIcon,
  EyeIcon,
  BanknotesIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [printPurchase, setPrintPurchase] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnPurchase, setReturnPurchase] = useState(null);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await purchaseService.getAll();
      setPurchases(response.data);
    } catch (error) {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'partial': return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400';
    }
  };

  // Print handler
  const handlePrint = (purchase) => {
    setPrintPurchase(purchase);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Stock <span className="text-primary-600">Purchases</span>
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
            Complete history of your inventory restocks with full details.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5" />
          Record Purchase
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-premium p-5">
          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Total Purchases</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{purchases.length}</p>
        </div>
        <div className="card-premium p-5">
          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Total Amount</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            PKR {purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card-premium p-5">
          <p className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Pending Dues</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            PKR {purchases.reduce((sum, p) => sum + (p.balance_due || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Purchases List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card-premium p-16 text-center">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading purchase history...</p>
          </div>
        ) : purchases.length === 0 ? (
          <div className="card-premium p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto">
              <ShoppingCartIcon className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">No purchases recorded yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">Start by recording your first purchase from a supplier.</p>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-4">Record First Purchase</button>
          </div>
        ) : (
          purchases.map(purchase => (
            <div key={purchase.id} className="card-premium overflow-hidden transition-all duration-200">
              {/* Main Row */}
              <div 
                className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                onClick={() => toggleExpand(purchase.id)}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <TruckIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">PUR-{purchase.id}</h3>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ring-1 ring-inset ${getStatusStyle(purchase.status)}`}>
                        {purchase.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {purchase.supplier_name || 'Unknown Supplier'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-xs font-semibold text-slate-400">
                        {new Date(purchase.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-xs font-semibold text-slate-400">
                        {purchase.items?.length || 0} item{(purchase.items?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                      PKR {(purchase.total_amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      PAID: PKR {(purchase.amount_paid || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrint(purchase); }}
                      className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                      title="Print Bill"
                    >
                      <PrinterIcon className="w-5 h-5" />
                    </button>
                    {expandedId === purchase.id ? (
                      <ChevronUpIcon className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === purchase.id && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-6 py-5 animate-slide-up">
                  {/* Items Table */}
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Purchased Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">#</th>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Product</th>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Qty</th>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Unit Cost</th>
                          <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(purchase.items || []).map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 text-sm font-semibold text-slate-400">{idx + 1}</td>
                            <td className="py-3 text-sm font-bold text-slate-900 dark:text-white">
                              {item.product_name || `Product #${item.product_id}`}
                            </td>
                            <td className="py-3 text-sm font-bold text-slate-600 dark:text-slate-300 text-center">{item.quantity}</td>
                            <td className="py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">
                              PKR {(item.unit_cost || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 text-sm font-bold text-slate-900 dark:text-white text-right">
                              PKR {(item.total_cost || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                          <td colSpan="4" className="pt-3 text-sm font-extrabold text-slate-900 dark:text-white text-right">Grand Total:</td>
                          <td className="pt-3 text-sm font-extrabold text-primary-600 text-right">
                            PKR {(purchase.total_amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Payment Info */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Payment Method</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 capitalize">{purchase.payment_method || 'Cash'}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Amount Paid</p>
                      <p className="text-sm font-bold text-emerald-600 mt-1">PKR {(purchase.amount_paid || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Balance Due</p>
                      <p className={`text-sm font-bold mt-1 ${purchase.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        PKR {(purchase.balance_due || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </p>
                      {purchase.balance_due > 0 && (
                        <button 
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setIsPaymentModalOpen(true);
                          }}
                          className="mt-3 flex items-center gap-1 text-[10px] font-black uppercase text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition-colors w-full justify-center"
                        >
                          <BanknotesIcon className="w-4 h-4" />
                          Pay Supplier Now
                        </button>
                      )}
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Notes</p>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">{purchase.notes || 'No notes'}</p>
                    </div>
                  </div>

                  {/* Return Action */}
                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => { setReturnPurchase(purchase); setIsReturnModalOpen(true); }}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all border border-rose-100"
                    >
                      <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                      Return Items to Supplier
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <AddPurchaseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPurchases}
      />

      {selectedPurchase && (
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPurchase(null);
          }}
          partyType="supplier"
          partyId={selectedPurchase.supplier_id}
          partyName={selectedPurchase.supplier_name || 'Unknown Supplier'}
          currentBalance={selectedPurchase.balance_due}
          onSuccess={fetchPurchases}
        />
      )}

      {/* Hidden Print View */}
      {printPurchase && (
        <div className="hidden print:block">
          <InvoicePrint 
            type="purchase"
            data={printPurchase}
          />
        </div>
      )}

      <ReturnModal 
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        data={returnPurchase}
        type="purchase"
        onComplete={fetchPurchases}
      />
    </div>
  );
}
