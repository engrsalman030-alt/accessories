import React, { useEffect, useState } from 'react';
import saleService from '../services/saleService';
import InvoicePrint from '../components/ui/InvoicePrint';
import ReturnModal from '../components/sales/ReturnModal';
import AddSaleModal from '../components/sales/AddSaleModal';
import Pagination from '../components/ui/Pagination';
import { 
  ShoppingBagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PrinterIcon,
  ReceiptPercentIcon,
  UserIcon,
  ArrowPathRoundedSquareIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import PaymentModal from '../components/ui/PaymentModal';
import { BanknotesIcon } from '@heroicons/react/24/outline';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [printSale, setPrintSale] = useState(null);
  const [returnSale, setReturnSale] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [saleToEdit, setSaleToEdit] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 25,
    total: 0
  });

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await saleService.getAll({
        page: pagination.page,
        size: pagination.size
      });
      setSales(response.data.items || response.data || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [pagination.page, pagination.size]);

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

  const handleDelete = async (sale) => {
    setSaleToDelete(sale);
    setIsDeleteModalOpen(true);
  };

  const handleEdit = (sale) => {
    setSaleToEdit(sale);
    setIsSaleModalOpen(true);
  };

  const closeSaleModal = () => {
    setIsSaleModalOpen(false);
    setSaleToEdit(null);
  };

  const confirmDelete = async () => {
    try {
      await saleService.delete(saleToDelete.id);
      toast.success('Sale deleted successfully');
      fetchSales();
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete sale');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Sales <span className="text-primary-600">History</span>
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            Complete record of all sales invoices.
          </p>
        </div>
        <button
          onClick={() => setIsSaleModalOpen(true)}
          className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-black uppercase tracking-widest rounded-lg flex items-center gap-2 shadow-lg shadow-primary-600/20 transition-all"
        >
          <ShoppingBagIcon className="h-4 w-4" />
          Create Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-premium p-4 border-l-4 border-primary-500">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Invoices</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{sales.length}</p>
        </div>
        <div className="card-premium p-4 border-l-4 border-emerald-500">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Revenue</p>
          <p className="text-xl font-black text-emerald-600 mt-0.5">
            PKR {sales.reduce((sum, s) => sum + (s.total_amount || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="card-premium p-4 border-l-4 border-indigo-500">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Received</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            PKR {sales.reduce((sum, s) => sum + (s.amount_paid || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className="card-premium p-4 border-l-4 border-rose-500">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Outstanding</p>
          <p className="text-xl font-black text-rose-600 mt-0.5">
            PKR {sales.reduce((sum, s) => sum + (s.balance_due || 0), 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
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
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                onClick={() => toggleExpand(sale.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                    <ReceiptPercentIcon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 leading-none">
                      <h3 className="text-[13px] font-black text-slate-900 dark:text-white">INV-{sale.id}</h3>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase ring-1 ring-inset ${getStatusStyle(sale.status)}`}>
                        {sale.status}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                        {sale.customer_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 leading-none">
                      <UserIcon className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                        {sale.customer_name || 'Walk-in'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(sale.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {sale.items?.length || 0} Items
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[14px] font-black text-slate-900 dark:text-white leading-tight tabular-nums">
                      PKR {(sale.total_amount || 0).toLocaleString('en-PK')}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter tabular-nums">
                      Paid: {(sale.amount_paid || 0).toLocaleString('en-PK')}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrint(sale); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                    >
                      <PrinterIcon className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(sale); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(sale); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                    {expandedId === sale.id ? (
                      <ChevronUpIcon className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    ) : (
                      <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === sale.id && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 px-5 py-4 animate-slide-up">
                  {/* Items Table */}
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Sold Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider">#</th>
                          <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider">Product</th>
                          <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Qty</th>
                          <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-right">Price</th>
                          <th className="pb-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(sale.items || []).map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2 text-[11px] font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2 text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                              {item.product_name || `Product #${item.product_id}`}
                            </td>
                            <td className="py-2 text-[11px] font-black text-slate-600 dark:text-slate-300 text-center tabular-nums">{item.quantity}</td>
                            <td className="py-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 text-right tabular-nums">
                              {(item.unit_price || 0).toLocaleString('en-PK')}
                            </td>
                            <td className="py-2 text-[11px] font-black text-slate-900 dark:text-white text-right tabular-nums">
                              {(item.total_price || 0).toLocaleString('en-PK')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        {sale.discount > 0 && (
                          <tr className="border-t border-slate-200 dark:border-slate-700">
                            <td colSpan="4" className="pt-2 text-[10px] font-black text-slate-400 text-right uppercase">Discount:</td>
                            <td className="pt-2 text-[10px] font-black text-rose-600 text-right tabular-nums">
                              - PKR {(sale.discount || 0).toLocaleString('en-PK')}
                            </td>
                          </tr>
                        )}
                        <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                          <td colSpan="4" className="pt-2.5 text-xs font-black text-slate-900 dark:text-white text-right uppercase tracking-tighter">Grand Total:</td>
                          <td className="pt-2.5 text-xs font-black text-primary-600 text-right tabular-nums">
                            PKR {(sale.total_amount || 0).toLocaleString('en-PK')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Payment Info */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Customer</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5 uppercase tracking-tighter truncate">{sale.customer_name || 'Walk-in'}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Method</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5 uppercase">{sale.payment_method || 'Cash'}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Received</p>
                      <p className="text-xs font-black text-emerald-600 mt-0.5 tabular-nums">PKR {(sale.amount_paid || 0).toLocaleString('en-PK')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Balance</p>
                      <p className={`text-xs font-black mt-0.5 tabular-nums ${sale.balance_due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        PKR {(sale.balance_due || 0).toLocaleString('en-PK')}
                      </p>
                      {sale.balance_due > 0 && sale.customer_id && (
                        <button 
                          onClick={() => {
                            setSelectedSale(sale);
                            setIsPaymentModalOpen(true);
                          }}
                          className="mt-2 flex items-center gap-1 text-[8px] font-black uppercase text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded transition-colors w-full justify-center tracking-widest"
                        >
                          <BanknotesIcon className="w-3 h-3" />
                          Receive
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Return Action */}
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => { setReturnSale(sale); setIsReturnModalOpen(true); }}
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

      <AddSaleModal
        isOpen={isSaleModalOpen}
        onClose={closeSaleModal}
        onSuccess={fetchSales}
        saleToEdit={saleToEdit}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Sale Invoice"
        message={`Are you sure you want to delete INV-${saleToDelete?.id}? This will revert stock levels and customer balance. This action cannot be undone.`}
        confirmText="Delete"
        isDanger
      />

      {selectedSale && (
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedSale(null);
          }}
          partyType="customer"
          partyId={selectedSale.customer_id}
          partyName={selectedSale.customer_name || 'Walk-in'}
          currentBalance={selectedSale.balance_due}
          invoiceId={selectedSale.id}
          onSuccess={fetchSales}
        />
      )}
    </div>
  );
}
