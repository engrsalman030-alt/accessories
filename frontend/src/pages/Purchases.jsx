import React, { useEffect, useState } from 'react';
import purchaseService from '../services/purchaseService';
import AddPurchaseModal from '../components/purchases/AddPurchaseModal';
import InvoicePrint from '../components/ui/InvoicePrint';
import PaymentModal from '../components/ui/PaymentModal';
import Pagination from '../components/ui/Pagination';
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
  ArrowPathRoundedSquareIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import ConfirmModal from '../components/ui/ConfirmModal';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const [purchaseToEdit, setPurchaseToEdit] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 25,
    total: 0
  });

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await purchaseService.getAll({
        page: pagination.page,
        size: pagination.size
      });
      setPurchases(response.data.items || response.data || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [pagination.page, pagination.size]);

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

  const handleDelete = (purchase) => {
    setPurchaseToDelete(purchase);
    setIsDeleteModalOpen(true);
  };

  const handleEdit = (purchase) => {
    setPurchaseToEdit(purchase);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPurchaseToEdit(null);
  };

  const confirmDelete = async () => {
    try {
      await purchaseService.delete(purchaseToDelete.id);
      toast.success('Purchase deleted successfully');
      fetchPurchases();
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete purchase');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Stock <span className="text-primary-600">Purchases</span>
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            Complete history of inventory restocks.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-black uppercase tracking-widest rounded-lg flex items-center gap-2 shadow-lg shadow-primary-600/20 transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Record Purchase
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-premium p-4 border-l-4 border-primary-500">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Purchases</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{purchases.length}</p>
        </div>
        <div className="card-premium p-4 border-l-4 border-emerald-500">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Amount</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            PKR {purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="card-premium p-4 border-l-4 border-rose-500">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pending Dues</p>
          <p className="text-xl font-black text-rose-600 mt-0.5">
            PKR {purchases.reduce((sum, p) => sum + (p.balance_due || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
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
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                onClick={() => toggleExpand(purchase.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <TruckIcon className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 leading-none">
                      <h3 className="text-[13px] font-black text-slate-900 dark:text-white">PUR-{purchase.id}</h3>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase ring-1 ring-inset ${getStatusStyle(purchase.status)}`}>
                        {purchase.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 leading-none">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                        {purchase.supplier_name || 'Unknown'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(purchase.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {purchase.items?.length || 0} Items
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[14px] font-black text-slate-900 dark:text-white leading-tight tabular-nums">
                      PKR {(purchase.total_amount || 0).toLocaleString('en-PK')}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter tabular-nums">
                      Paid: {(purchase.amount_paid || 0).toLocaleString('en-PK')}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrint(purchase); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                    >
                      <PrinterIcon className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(purchase); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(purchase); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                    {expandedId === purchase.id ? (
                      <ChevronUpIcon className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    ) : (
                      <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === purchase.id && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-5 py-4 animate-slide-up">
                  {/* Items Table */}
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Purchased Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider">#</th>
                          <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider">Product</th>
                          <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Qty</th>
                          <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-right">Cost</th>
                          <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(purchase.items || []).map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2 text-[11px] font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2 text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                              {item.product_name || `Product #${item.product_id}`}
                            </td>
                            <td className="py-2 text-[11px] font-black text-slate-600 dark:text-slate-300 text-center tabular-nums">{item.quantity}</td>
                            <td className="py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 text-right tabular-nums">
                              {(item.unit_cost || 0).toLocaleString('en-PK')}
                            </td>
                            <td className="py-2 text-[11px] font-black text-slate-900 dark:text-white text-right tabular-nums">
                              {(item.total_cost || 0).toLocaleString('en-PK')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                          <td colSpan="4" className="pt-2.5 text-xs font-black text-slate-900 dark:text-white text-right uppercase tracking-tighter">Grand Total:</td>
                          <td className="pt-2.5 text-xs font-black text-primary-600 text-right tabular-nums">
                            PKR {(purchase.total_amount || 0).toLocaleString('en-PK')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Payment Info */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Method</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5 uppercase">{purchase.payment_method || 'Cash'}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Paid</p>
                      <p className="text-xs font-black text-emerald-600 mt-0.5 tabular-nums">PKR {(purchase.amount_paid || 0).toLocaleString('en-PK')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Balance</p>
                      <p className={`text-xs font-black mt-0.5 tabular-nums ${purchase.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        PKR {(purchase.balance_due || 0).toLocaleString('en-PK')}
                      </p>
                      {purchase.balance_due > 0 && (
                        <button 
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setIsPaymentModalOpen(true);
                          }}
                          className="mt-2 flex items-center gap-1 text-[8px] font-black uppercase text-white bg-rose-500 hover:bg-rose-600 px-2 py-1 rounded transition-colors w-full justify-center tracking-widest"
                        >
                          <BanknotesIcon className="w-3 h-3" />
                          Pay Now
                        </button>
                      )}
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Notes</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 truncate">{purchase.notes || 'No notes'}</p>
                    </div>
                  </div>

                  {/* Return Action */}
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => { setReturnPurchase(purchase); setIsReturnModalOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-rose-100 dark:border-rose-900/50"
                    >
                      <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" />
                      Return Items
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Pagination 
        currentPage={pagination.page}
        totalItems={pagination.total}
        pageSize={pagination.size}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onPageSizeChange={(size) => setPagination(prev => ({ ...prev, size, page: 1 }))}
      />

      <AddPurchaseModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={fetchPurchases}
        purchaseToEdit={purchaseToEdit}
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
          invoiceId={selectedPurchase.id}
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

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Purchase Record"
        message={`Are you sure you want to delete PUR-${purchaseToDelete?.id}? This will decrease stock levels and reduce supplier balance. This action cannot be undone.`}
        confirmText="Delete"
        isDanger
      />
    </div>
  );
}
