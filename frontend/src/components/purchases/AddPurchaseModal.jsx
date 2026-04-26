import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import purchaseService from '../../services/purchaseService';
import supplierService from '../../services/supplierService';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import InvoicePrint from '../ui/InvoicePrint';

const AddPurchaseModal = ({ isOpen, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    supplier_id: '',
    items: [{ product_id: '', quantity: 1, unit_cost: 0 }],
    discount: 0,
    amount_paid: 0,
    payment_method: 'cash',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPurchaseData, setLastPurchaseData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      supplierService.getAll().then(res => setSuppliers(res.data));
      api.get('/products').then(res => setProducts(res.data));
    }
  }, [isOpen]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, unit_cost: 0 }]
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
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const subtotalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * (item.unit_cost || 0)), 0);
  const totalAmount = subtotalAmount - (parseFloat(formData.discount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier_id) return toast.error('Please select a supplier');
    if (formData.items.some(item => !item.product_id)) return toast.error('Please select products for all items');

    setIsSubmitting(true);
    try {
      const payload = {
        supplier_id: parseInt(formData.supplier_id),
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseFloat(item.quantity),
          unit_cost: parseFloat(item.unit_cost)
        })),
        subtotal: subtotalAmount,
        discount: parseFloat(formData.discount) || 0,
        total_amount: totalAmount,
        amount_paid: parseFloat(formData.amount_paid) || 0,
        payment_method: formData.payment_method,
        notes: formData.notes
      };

      const res = await purchaseService.create(payload);
      
      setLastPurchaseData({
        ...res.data,
        supplier: suppliers.find(s => s.id === parseInt(formData.supplier_id)),
        items: formData.items.map(item => {
          const product = products.find(p => p.id === parseInt(item.product_id));
          return { ...item, name: product?.name, unit_price: item.unit_cost }; // Map for InvoicePrint
        })
      });

      toast.success('Purchase recorded successfully');
      onSuccess();
      
      // Delay closing
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Purchase error:', error);
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to record purchase');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Restock Inventory" 
      subtitle="Record new stock arrivals from your suppliers"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Supplier Source</label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 transition-all"
              required
            >
              <option value="">Choose Supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Input 
            label="Initial Payment (PKR)" 
            type="number" 
            step="0.01"
            value={formData.amount_paid} 
            onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })} 
            placeholder="0.00"
          />
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 ml-1">Payment Method</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 transition-all"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="credit">Credit/Due</option>
            </select>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Stock Items</h3>
            </div>
            <button 
              type="button" 
              onClick={addItem} 
              className="px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-sm font-black hover:bg-primary-100 transition-all flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
            {formData.items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-white border-2 border-slate-50 p-5 rounded-3xl hover:border-primary-100 transition-all group">
                <div className="flex-1 w-full space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 ml-1">Select Product</label>
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-primary-500 transition-all"
                    required
                  >
                    <option value="">Select Item...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>)}
                  </select>
                </div>
                <div className="w-full md:w-32">
                  <Input 
                    label="Quantity" 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                  />
                </div>
                <div className="w-full md:w-40">
                  <Input 
                    label="Unit Cost (PKR)" 
                    type="number" 
                    step="0.01"
                    value={item.unit_cost} 
                    onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                    required
                  />
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
        <div className="pt-4 border-t border-slate-100 space-y-6">
          <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl shadow-slate-900/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grand Total Cost</p>
                <p className="text-3xl font-black">PKR {totalAmount.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex gap-10">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtotal</p>
                <p className="text-sm font-bold text-slate-400 line-through">PKR {subtotalAmount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance Due</p>
                <p className="text-xl font-bold text-rose-400">PKR {(totalAmount - (parseFloat(formData.amount_paid) || 0)).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Purchase Discount (PKR)" 
              type="number" 
              step="0.01"
              value={formData.discount} 
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })} 
              placeholder="0.00"
            />
            <Input 
              label="Purchase Notes" 
              value={formData.notes} 
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
              placeholder="Add any internal remarks..."
            />
          </div>

          <div className="flex gap-4">
            <Button 
              type="button"
              variant="secondary" 
              className="flex-1 h-14 rounded-2xl font-black uppercase tracking-wider" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="flex-2 h-14 rounded-2xl font-black uppercase tracking-wider text-lg" 
              loading={isSubmitting}
            >
              Record Purchase
            </Button>
          </div>
        </div>
      </form>
      <InvoicePrint data={lastPurchaseData} type="purchase" />
    </Modal>
  );
};

// Internal icon import since heroicons might not be enough
const CurrencyDollarIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default AddPurchaseModal;
