import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  TrashIcon, 
  BanknotesIcon, 
  TagIcon, 
  CalendarDaysIcon,
  ReceiptPercentIcon,
  FolderPlusIcon,
  PencilSquareIcon,
  EyeIcon,
  XMarkIcon,
  InformationCircleIcon,
  ClockIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categories, setCategories] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    category_id: '',
    amount: '',
    payment_method: 'cash',
    notes: ''
  });
  const [summary, setSummary] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0
  });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/reports/expenses/summary');
      setSummary(res.data);
    } catch (error) {
      console.error('Failed to fetch summary', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/expense-categories');
      setCategories(res.data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data);
    } catch (error) {
      toast.error('Failed to fetch expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditItem(null);
    setFormData({ 
      description: '', 
      category_id: categories[0]?.id || '', 
      amount: '', 
      payment_method: 'cash', 
      notes: '' 
    });
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        description: item.description,
        category_id: item.category_id,
        amount: item.amount,
        payment_method: item.payment_method || 'cash',
        notes: item.notes || ''
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (item) => {
    setViewItem(item);
    setIsViewModalOpen(true);
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
      e.preventDefault();
      const form = e.currentTarget;
      const elements = Array.from(form.elements).filter(el => !el.disabled && el.type !== 'hidden');
      const index = elements.indexOf(e.target);
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id),
        amount: parseFloat(formData.amount)
      };

      if (editItem) {
        await api.put(`/expenses/${editItem.id}`, payload);
        toast.success('Expense updated');
      } else {
        await api.post('/expenses', payload);
        toast.success('Expense recorded');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchExpenses();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to save expense');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await api.post('/expense-categories', { name: newCategoryName });
      toast.success('Category created');
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      await fetchCategories();
      setFormData(prev => ({ ...prev, category_id: res.data.id }));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Deleted');
      fetchExpenses();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Shop <span className="text-rose-600">Expenses</span></h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Track operational costs and overheads.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-premium p-4 border-l-4 border-rose-500 bg-rose-50/10 transition-all cursor-default">
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">Today</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">PKR {summary.daily.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="card-premium p-4 border-l-4 border-amber-500 bg-amber-50/10 transition-all cursor-default">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">This Week</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">PKR {summary.weekly.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="card-premium p-4 border-l-4 border-emerald-500 bg-emerald-50/10 transition-all cursor-default">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">This Month</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">PKR {summary.monthly.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="card-premium p-4 border-l-4 border-primary-500 bg-primary-50/10 transition-all cursor-default">
          <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest leading-none">This Year</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">PKR {summary.yearly.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-5 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Method</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold animate-pulse">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold italic">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white truncate max-w-xs">{exp.description}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {exp.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{exp.payment_method}</td>
                    <td className="px-4 py-2.5 text-sm font-black text-rose-600">PKR {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}</td>
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleOpenViewModal(exp)} 
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(exp)} 
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(exp.id)} 
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete"
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
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editItem ? "Edit Expense" : "Add Expense"} size="md">
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4">
          <Input 
            label="Description" 
            required 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Category</label>
                <button 
                  type="button" 
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[10px] font-black uppercase text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <PlusIcon className="w-3 h-3" /> New
                </button>
              </div>
              <select 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-primary-500 text-sm font-bold dark:text-white"
                value={formData.category_id}
                onChange={e => setFormData({...formData, category_id: e.target.value})}
                required
              >
                <option value="">Select Category...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input 
              label="Amount (PKR)" 
              type="number" 
              required 
              value={formData.amount} 
              onChange={e => setFormData({...formData, amount: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Payment Method</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-primary-500 text-sm font-bold dark:text-white"
              value={formData.payment_method}
              onChange={e => setFormData({...formData, payment_method: e.target.value})}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div className="space-y-2">
             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Additional Notes</label>
             <textarea 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-primary-500 text-sm font-bold dark:text-white min-h-[100px]"
                placeholder="Optional details about this expense..."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
             />
          </div>
          <div className="pt-4">
            <Button type="submit" variant="primary" className="w-full h-14 rounded-2xl font-black text-lg">
              {editItem ? "Update Expense" : "Record Expense"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="New Category" size="sm">
        <form onSubmit={handleCreateCategory} onKeyDown={handleFormKeyDown} className="space-y-4">
          <Input 
            label="Category Name" 
            required 
            placeholder="e.g. Fuel, Stationery, Tea..."
            value={newCategoryName} 
            onChange={e => setNewCategoryName(e.target.value)} 
          />
          <Button type="submit" variant="primary" className="w-full h-12 rounded-xl font-bold">Create Category</Button>
        </form>
      </Modal>

      {/* View Expense Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Expense Details" size="sm">
        {viewItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-rose-600">
                <BanknotesIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Amount</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">PKR {viewItem.amount.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex gap-3">
                  <InformationCircleIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{viewItem.description}</p>
                  </div>
               </div>

               <div className="flex gap-3">
                  <TagIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{viewItem.category?.name || 'Uncategorized'}</p>
                  </div>
               </div>

               <div className="flex gap-3">
                  <ClockIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date & Time</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {new Date(viewItem.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
               </div>

               <div className="flex gap-3">
                  <CreditCardIcon className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payment Method</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">{viewItem.payment_method}</p>
                  </div>
               </div>

               {viewItem.notes && (
                 <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Internal Notes</p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 italic">"{viewItem.notes}"</p>
                 </div>
               )}
            </div>

            <div className="pt-4 flex gap-3">
               <Button 
                onClick={() => { setIsViewModalOpen(false); handleOpenModal(viewItem); }}
                variant="outline" 
                className="flex-1 rounded-xl h-12"
               >
                 <PencilSquareIcon className="w-5 h-5 mr-2" />
                 Edit
               </Button>
               <Button onClick={() => setIsViewModalOpen(false)} variant="primary" className="flex-1 rounded-xl h-12">Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Expenses;
