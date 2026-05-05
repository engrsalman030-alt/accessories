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
  PrinterIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import AddReturnModal from '../components/returns/AddReturnModal';
import InvoicePrint from '../components/ui/InvoicePrint';
import ConfirmModal from '../components/ui/ConfirmModal';

const Returns = () => {
  const [salesReturns, setSalesReturns] = useState([]);
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [printType, setPrintType] = useState('sale_return');
  // Delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState(null);
  // Edit reason state
  const [editingId, setEditingId] = useState(null);
  const [editReason, setEditReason] = useState('');

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const [salesRes, purchaseRes] = await Promise.all([
        api.get('/returns/sales'),
        api.get('/returns/purchases')
      ]);
      setSalesReturns(salesRes.data || []);
      setPurchaseReturns(purchaseRes.data || []);
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

  // Delete handlers
  const handleDelete = (item) => {
    setReturnToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const endpoint = activeTab === 'sales' 
        ? `/returns/sale/${returnToDelete.id}` 
        : `/returns/purchase/${returnToDelete.id}`;
      await api.delete(endpoint);
      toast.success('Return record deleted successfully');
      fetchReturns();
      setIsDeleteModalOpen(false);
      setReturnToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete return');
    }
  };

  // Edit reason handlers
  const startEditing = (item) => {
    setEditingId(item.id);
    setEditReason(item.reason || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditReason('');
  };

  const saveReason = async (item) => {
    try {
      const endpoint = activeTab === 'sales' 
        ? `/returns/sale/${item.id}` 
        : `/returns/purchase/${item.id}`;
      await api.put(endpoint, { reason: editReason });
      toast.success('Return reason updated');
      fetchReturns();
      setEditingId(null);
      setEditReason('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update return');
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const data = activeTab === 'sales' ? salesReturns : purchaseReturns;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Return <span className="text-primary-600">Records</span>
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            Manage sales and purchase return tracking.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
        <button 
          onClick={() => { setActiveTab('sales'); setExpandedId(null); setEditingId(null); }}
          className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'sales' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Sales Returns
        </button>
        <button 
          onClick={() => { setActiveTab('purchase'); setExpandedId(null); setEditingId(null); }}
          className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'purchase' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
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
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${activeTab === 'sales' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'} flex items-center justify-center border border-slate-100 dark:border-slate-800`}>
                    <ArrowPathRoundedSquareIcon className={`w-5 h-5 ${activeTab === 'sales' ? 'text-emerald-600' : 'text-rose-600'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                      {activeTab === 'sales' ? `SR-${item.id}` : `PR-${item.id}`}
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

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-base font-black ${activeTab === 'sales' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      PKR {parseFloat(item.total_refund_amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Refunded</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEditing(item); setExpandedId(item.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all"
                      title="Edit Reason"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                      title="Delete Return"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    {expandedId === item.id ? <ChevronUpIcon className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-4 py-4 space-y-4">
                  {/* Reason - Editable */}
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 leading-none">Reason</p>
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2 mt-1.5">
                        <input
                          type="text"
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-2 border-primary-200 dark:border-primary-800 rounded-lg text-xs font-bold outline-none focus:border-primary-500 transition-all dark:text-white"
                          placeholder="Reason..."
                          autoFocus
                        />
                        <button
                          onClick={() => saveReason(item)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all"
                          title="Save"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-all"
                          title="Cancel"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic">"{item.reason || 'No reason provided'}"</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1 leading-none">Returned Items</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider">Product</th>
                            <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Qty</th>
                            <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-right">Rate</th>
                            <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                          {item.items.map((rItem, idx) => (
                            <tr key={idx}>
                              <td className="py-2.5">
                                <p className="text-[13px] font-black text-slate-900 dark:text-white leading-none">{rItem.product?.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{rItem.product?.sku}</p>
                                {rItem.serial_numbers && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {rItem.serial_numbers.split(',').map((sn, i) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[8px] font-mono font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                                        {sn.trim()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 text-center text-xs font-black text-primary-600">{rItem.quantity}</td>
                              <td className="py-2.5 text-right text-xs font-bold text-slate-600">
                                {parseFloat(activeTab === 'sales' ? rItem.unit_price : rItem.unit_cost).toFixed(0)}
                              </td>
                              <td className="py-2.5 text-right text-xs font-black text-slate-900 dark:text-white">
                                {(rItem.quantity * parseFloat(activeTab === 'sales' ? rItem.unit_price : rItem.unit_cost)).toFixed(0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-900 rounded-xl text-white">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-500 leading-none">Reference</p>
                      <p className="text-xs font-bold mt-1">
                        {activeTab === 'sales' 
                          ? (item.sale_id ? `INV-${item.sale_id}` : 'Direct') 
                          : (item.purchase_id ? `PUR-${item.purchase_id}` : 'Direct')}
                      </p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button 
                        onClick={() => handlePrint(item)}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-black transition-all uppercase tracking-widest"
                      >
                        <PrinterIcon className="w-3.5 h-3.5" />
                        Print
                      </button>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-slate-500 leading-none">Total Refund</p>
                        <p className="text-xl font-black mt-1">PKR {parseFloat(item.total_refund_amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
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

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setReturnToDelete(null); }}
        onConfirm={confirmDelete}
        title="Delete Return Record"
        message={`Are you sure you want to delete ${activeTab === 'sales' ? `SR-${returnToDelete?.id}` : `PR-${returnToDelete?.id}`}? This will revert stock levels and balance adjustments. This action cannot be undone.`}
        confirmText="Delete"
        isDanger
      />
    </div>
  );
};

export default Returns;
