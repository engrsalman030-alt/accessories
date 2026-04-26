import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  TrashIcon, 
  ShoppingCartIcon,
  ArrowPathRoundedSquareIcon,
  UserIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import InvoicePrint from '../ui/InvoicePrint';

const AddReturnModal = ({ isOpen, onClose, onSuccess }) => {
  const [type, setType] = useState('sale'); // 'sale' or 'purchase'
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    party_id: '',
    items: [{ product_id: '', quantity: 1, rate: 0, condition: 'fine' }],
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReturnData, setLastReturnData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch products
      api.get('/products').then(res => setProducts(res.data));
      
      // Fetch parties based on type
      if (type === 'sale') {
        api.get('/customers').then(res => setParties(res.data));
      } else {
        api.get('/suppliers').then(res => setParties(res.data));
      }
    }
  }, [isOpen, type]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, rate: 0, condition: 'fine' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-fill rate if product is selected
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].rate = type === 'sale' ? product.retail_price : product.cost_price;
      }
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * (item.rate || 0)), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.party_id) return toast.error(`Please select a ${type === 'sale' ? 'customer' : 'supplier'}`);
    if (formData.items.some(item => !item.product_id)) return toast.error('Please select products for all items');

    setIsSubmitting(true);
    try {
      const payload = {
        [type === 'sale' ? 'customer_id' : 'supplier_id']: parseInt(formData.party_id) || null,
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id) || 0,
          quantity: parseFloat(item.quantity) || 0,
          [type === 'sale' ? 'unit_price' : 'unit_cost']: parseFloat(item.rate) || 0,
          condition: item.condition || 'fine'
        })),
        reason: formData.reason
      };

      const endpoint = type === 'sale' ? '/returns/sale' : '/returns/purchase';
      const res = await api.post(endpoint, payload);
      
      setLastReturnData({
        ...res.data,
        [type === 'sale' ? 'customer' : 'supplier']: parties.find(p => p.id === parseInt(formData.party_id)),
        items: formData.items.map(item => {
          const product = products.find(p => p.id === parseInt(item.product_id));
          return { ...item, product };
        })
      });

      toast.success('Return recorded successfully');
      onSuccess();
      
      // Reset form and close after success
      setTimeout(() => {
        onClose();
        setFormData({ party_id: '', items: [{ product_id: '', quantity: 1, rate: 0, condition: 'fine' }], reason: '' });
      }, 500);
    } catch (error) {
      console.error('Return error:', error);
      const errorDetail = error.response?.data?.detail;
      const errorMessage = typeof errorDetail === 'string' 
        ? errorDetail 
        : Array.isArray(errorDetail) 
          ? errorDetail[0]?.msg || JSON.stringify(errorDetail)
          : typeof errorDetail === 'object'
            ? JSON.stringify(errorDetail)
            : 'Failed to record return';
            
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Create Return Bill" 
      subtitle="Issue a new return credit note for customers or suppliers"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Type Toggle */}
        <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit mx-auto">
          <button 
            type="button"
            onClick={() => setType('sale')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${type === 'sale' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserIcon className="w-4 h-4" /> Sales Return
          </button>
          <button 
            type="button"
            onClick={() => setType('purchase')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${type === 'purchase' ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <TruckIcon className="w-4 h-4" /> Purchase Return
          </button>
        </div>

        {/* Main Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
              {type === 'sale' ? 'Customer Name' : 'Supplier Source'}
            </label>
            <select
              value={formData.party_id}
              onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-primary-500 transition-all"
              required
            >
              <option value="">Choose {type === 'sale' ? 'Customer' : 'Supplier'}...</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
             <Input 
              label="Reason for Return"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Damaged goods, Exchange, Refusal..."
              required
            />
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <ArrowPathRoundedSquareIcon className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Return Items</h3>
            </div>
            <button 
              type="button" 
              onClick={addItem} 
              className="px-4 py-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 rounded-xl text-sm font-black hover:bg-primary-100 transition-all flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
            {formData.items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-white dark:bg-slate-800/50 border-2 border-slate-50 dark:border-slate-800 p-5 rounded-3xl hover:border-primary-100 dark:hover:border-primary-900/50 transition-all group">
                <div className="flex-1 w-full space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 ml-1">Select Product</label>
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-xl text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 transition-all"
                    required
                  >
                    <option value="">Select Item...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_qty})</option>)}
                  </select>
                </div>
                
                <div className="w-full md:w-32">
                  <Input 
                    label="Quantity" 
                    type="number" 
                    step="0.01"
                    value={item.quantity} 
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                  />
                </div>

                <div className="w-full md:w-40">
                  <Input 
                    label="Rate"
                    type="number"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    required
                  />
                </div>
                
                <div className="w-full md:w-32">
                  <label className="block text-[10px] font-black uppercase text-slate-400 ml-1 mb-1">Condition</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 h-[42px]">
                    <button
                      type="button"
                      onClick={() => handleItemChange(index, 'condition', 'fine')}
                      className={`flex-1 text-[9px] font-black rounded-lg transition-all ${item.condition === 'fine' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      FINE
                    </button>
                    <button
                      type="button"
                      onClick={() => handleItemChange(index, 'condition', 'damaged')}
                      className={`flex-1 text-[9px] font-black rounded-lg transition-all ${item.condition === 'damaged' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500'}`}
                    >
                      DMG
                    </button>
                  </div>
                </div>

                <div className="pb-1">
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)} 
                    className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Remove item"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>

          {/* Summary & Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl shadow-slate-900/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary-400">
                   <ShoppingCartIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grand Total Refund</p>
                  <p className="text-3xl font-black">PKR {totalAmount.toFixed(2)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                <p className="text-xl font-bold text-emerald-400 capitalize">{type} Return</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                className="flex-1 h-14 rounded-2xl font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <Button 
                type="submit" 
                variant="primary" 
                className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-wider text-lg" 
                loading={isSubmitting}
              >
                Issue Return Bill
              </Button>
            </div>
          </div>
        </form>
        <InvoicePrint data={lastReturnData} type={`${type}_return`} />
      </Modal>
    );
  };

export default AddReturnModal;
