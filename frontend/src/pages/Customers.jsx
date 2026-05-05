import React, { useEffect, useState, useCallback } from 'react';
import customerService from '../services/customerService';
import AddEditCustomerModal from '../components/customers/AddEditCustomerModal';
import { 
  PlusIcon, 
  UserGroupIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PaymentModal from '../components/ui/PaymentModal';
import Pagination from '../components/ui/Pagination';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    size: 25,
    total: 0
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await customerService.getAll({ 
        search: searchTerm,
        page: pagination.page,
        size: pagination.size
      });
      setCustomers(response.data.items);
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.page, pagination.size]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this customer?')) {
      try {
        await customerService.delete(id);
        toast.success('Customer deleted');
        fetchCustomers();
      } catch (error) {
        toast.error('Failed to delete customer');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Customer <span className="text-primary-600">Base</span>
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Manage retail and corporate clients.</p>
        </div>
        <button 
          onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <PlusIcon className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="card-premium p-3 flex gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 text-[13px] font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Customer</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Type</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Contact</th>
              <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Balance</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="p-12 text-center text-slate-400">Loading clients...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="5" className="p-12 text-center text-slate-400">No customers found.</td></tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-5 py-2.5">
                    <div className="text-sm font-black text-slate-900 dark:text-white">{customer.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{customer.business_name || 'Individual'}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                      customer.type === 'distributor' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' :
                      customer.type === 'wholesale' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' :
                      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                    }`}>
                      {customer.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 font-bold">{customer.phone || 'N/A'}</td>
                  <td className="px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white">PKR {customer.outstanding_balance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => { setSelectedCustomer(customer); setIsPaymentModalOpen(true); }}
                        className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Record Payment / Advance"
                      >
                        <BanknotesIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setSelectedCustomer(customer); setIsModalOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Customer"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <Pagination 
          currentPage={pagination.page}
          totalItems={pagination.total}
          pageSize={pagination.size}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onPageSizeChange={(size) => setPagination(prev => ({ ...prev, size, page: 1 }))}
        />
      </div>

      <AddEditCustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />

      {selectedCustomer && (
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          partyType="customer"
          partyId={selectedCustomer.id}
          partyName={selectedCustomer.name}
          currentBalance={selectedCustomer.outstanding_balance}
          onSuccess={fetchCustomers}
        />
      )}
    </div>
  );
}
