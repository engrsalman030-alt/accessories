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

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await customerService.getAll({ search: searchTerm });
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">
            Customer <span className="text-primary-600">Base</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your retail and corporate clients.</p>
        </div>
        <button 
          onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      <div className="card-premium p-4 flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name, business or phone..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Contact</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Balance</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="p-12 text-center text-slate-400">Loading clients...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="5" className="p-12 text-center text-slate-400">No customers found.</td></tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900">{customer.name}</div>
                    <div className="text-xs text-slate-500 uppercase font-medium">{customer.business_name || 'Individual'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                      customer.type === 'distributor' ? 'bg-indigo-50 text-indigo-600' :
                      customer.type === 'wholesale' ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {customer.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">{customer.phone || 'N/A'}</td>
                  <td className="px-6 py-5 font-bold text-slate-900">PKR {customer.outstanding_balance.toFixed(2)}</td>
                  <td className="px-6 py-5 text-right space-x-2">
                    <button 
                      onClick={() => { setSelectedCustomer(customer); setIsPaymentModalOpen(true); }}
                      className="p-2 text-emerald-500 hover:text-emerald-600 transition-colors"
                      title="Record Payment / Advance"
                    >
                      <BanknotesIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => { setSelectedCustomer(customer); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(customer.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
