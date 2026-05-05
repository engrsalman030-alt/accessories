import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import supplierService from '../services/supplierService';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ConfirmModal from '../components/ui/ConfirmModal';
import AddEditSupplierModal from '../components/suppliers/AddEditSupplierModal';
import SupplierDetailModal from '../components/suppliers/SupplierDetailModal';
import PaymentModal from '../components/ui/PaymentModal';
import Pagination from '../components/ui/Pagination';
import { formatCurrency } from '../utils/formatCurrency';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary] = useState({
    total_suppliers: 0,
    total_outstanding: 0,
    suppliers_with_balance: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 25,
    total: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
    fetchSummary();
  }, [pagination.page, pagination.size]);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await supplierService.getAll({
        search: searchQuery,
        page: pagination.page,
        size: pagination.size
      });
      setSuppliers(response.data.items);
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await supplierService.getSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchSuppliers();
  };

  const handleDelete = (supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await supplierService.delete(supplierToDelete.id);
      fetchSuppliers();
      fetchSummary();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const handleView = (supplier) => {
    setSelectedSupplier(supplier);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setIsEditModalOpen(true);
  };

  const handleAddSuccess = () => {
    fetchSuppliers();
    fetchSummary();
    setIsAddModalOpen(false);
  };

  const handleEditSuccess = () => {
    fetchSuppliers();
    fetchSummary();
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Suppliers <span className="text-primary-600">Network</span>
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            Manage vendor relationships and track outstanding balances.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add Supplier
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-premium p-4 flex items-center gap-4 border-l-4 border-l-primary-600">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
            <UsersIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Suppliers</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {summary.total_suppliers}
            </p>
          </div>
        </div>

        <div className="card-premium p-4 flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <CurrencyDollarIcon className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Outstanding Dues</p>
            <p className={`text-xl font-black mt-1 ${
              summary.total_outstanding > 0 
                ? 'text-amber-600 dark:text-amber-400' 
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              PKR {formatCurrency(summary.total_outstanding)}
            </p>
          </div>
        </div>

        <div className="card-premium p-4 flex items-center gap-4 border-l-4 border-l-rose-500">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center flex-shrink-0">
            <ArrowTrendingUpIcon className="w-5 h-5 text-rose-500 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Pending Accounts</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {summary.suppliers_with_balance}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="card-premium p-3">
        <div className="relative group max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card-premium overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 animate-slide-up">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
              <IdentificationIcon className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No suppliers found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try a different search or add a new supplier.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Supplier Details</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Contact</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Outstanding</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {suppliers.map((supplier, idx) => (
                  <tr key={supplier.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                           <BuildingOfficeIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">{supplier.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{supplier.company || 'Private Individual'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <PhoneIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{supplier.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black ring-1 ring-inset ${
                        supplier.outstanding_balance > 0 
                          ? 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400' 
                          : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        PKR {formatCurrency(supplier.outstanding_balance)}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(supplier)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {supplier.outstanding_balance > 0 && (
                          <button
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setIsPaymentModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                            title="Pay Dues"
                          >
                            <BanknotesIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                          title="Edit Supplier"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                          title="Delete Supplier"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <Pagination 
          currentPage={pagination.page}
          totalItems={pagination.total}
          pageSize={pagination.size}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onPageSizeChange={(size) => setPagination(prev => ({ ...prev, size, page: 1 }))}
        />
      </div>

      {/* Modals */}
      <AddEditSupplierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {selectedSupplier && (
        <>
          <AddEditSupplierModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            supplier={selectedSupplier}
            onSuccess={handleEditSuccess}
          />
          <SupplierDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedSupplier(null);
            }}
            supplierId={selectedSupplier.id}
          />
          <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            partyType="supplier"
            partyId={selectedSupplier.id}
            partyName={selectedSupplier.name}
            currentBalance={selectedSupplier.outstanding_balance}
            onSuccess={() => {
              fetchSuppliers();
              fetchSummary();
            }}
          />
        </>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete ${supplierToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        isDanger
      />
    </div>
  );
};

export default Suppliers;