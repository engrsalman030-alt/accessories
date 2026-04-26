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
  FolderPlusIcon
} from '@heroicons/react/24/outline';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    category_id: '',
    amount: '',
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/expense-categories');
      setCategories(res.data);
      if (res.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: res.data[0].id }));
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        ...formData,
        category_id: parseInt(formData.category_id),
        amount: parseFloat(formData.amount)
      });
      toast.success('Expense recorded');
      setIsModalOpen(false);
      setFormData({ 
        description: '', 
        category_id: categories[0]?.id || '', 
        amount: '', 
        payment_method: 'cash', 
        notes: '' 
      });
      fetchExpenses();
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
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white">Shop <span className="text-rose-600">Expenses</span></h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">Track your operational costs and overheads.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary" className="h-14 px-8 rounded-2xl shadow-lg shadow-primary-500/20">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium p-6 border-l-4 border-rose-600">
          <p className="text-sm font-bold text-slate-400 uppercase">Total Expenses</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">PKR {totalExpenses.toFixed(2)}</p>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Date</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Description</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Category</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Method</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Amount</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                  {new Date(exp.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">{exp.description}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {exp.category?.name || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{exp.payment_method}</td>
                <td className="px-6 py-4 text-lg font-black text-rose-600">PKR {exp.amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(exp.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Expense" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-primary-500 text-sm font-bold"
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
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-primary-500 text-sm font-bold"
              value={formData.payment_method}
              onChange={e => setFormData({...formData, payment_method: e.target.value})}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div className="pt-4">
            <Button type="submit" variant="primary" className="w-full h-14 rounded-2xl font-black text-lg">Record Expense</Button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="New Category" size="sm">
        <form onSubmit={handleCreateCategory} className="space-y-4">
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
    </div>
  );
};

export default Expenses;
