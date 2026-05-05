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
import SearchableSelect from '../ui/SearchableSelect';
import AddEditSupplierModal from '../suppliers/AddEditSupplierModal';
import ProductModal from '../ProductModal';

const AddPurchaseModal = ({ isOpen, onClose, onSuccess, purchaseToEdit }) => {
  const isEditMode = !!purchaseToEdit;
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    items: [{ product_id: '', quantity: 1, unit_cost: 0, serial_numbers: [''] }],
    discount: 0,
    discount_type: 'fixed',
    discount_value: 0,
    amount_paid: 0,
    payment_method: 'cash',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPurchaseData, setLastPurchaseData] = useState(null);
  const [expandedSerials, setExpandedSerials] = useState({}); // { itemIndex: boolean }

  const fetchSuppliers = async () => {
    const res = await supplierService.getAll();
    setSuppliers(res.data?.items || res.data?.suppliers || res.data || []);
  };

  const fetchProducts = async () => {
    const res = await api.get('/products?size=1000');
    setProducts(res.data?.items || res.data || []);
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      fetchProducts();
      
      if (purchaseToEdit) {
        setFormData({
          supplier_id: purchaseToEdit.supplier_id || '',
          items: purchaseToEdit.items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            serial_numbers: item.serial_numbers || []
          })),
          discount: purchaseToEdit.discount || 0,
          discount_type: purchaseToEdit.discount_type || 'fixed',
          discount_value: purchaseToEdit.discount_value || purchaseToEdit.discount || 0,
          amount_paid: purchaseToEdit.amount_paid || 0,
          payment_method: purchaseToEdit.payment_method || 'cash',
          notes: purchaseToEdit.notes || ''
        });
      } else {
        // Reset form for new purchase
        setFormData({
          supplier_id: '',
          items: [{ product_id: '', quantity: 1, unit_cost: 0, serial_numbers: [''] }],
          discount: 0,
          discount_type: 'fixed',
          discount_value: 0,
          amount_paid: 0,
          payment_method: 'cash',
          notes: ''
        });
      }
      setLastPurchaseData(null);
    }
  }, [isOpen, purchaseToEdit]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, unit_cost: 0, serial_numbers: [''] }]
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
    // Resize serial_numbers array when quantity changes
    if (field === 'quantity') {
      const qty = parseInt(value) || 0;
      const current = newItems[index].serial_numbers || [];
      if (qty > current.length) {
        newItems[index].serial_numbers = [...current, ...Array(qty - current.length).fill('')];
      } else {
        newItems[index].serial_numbers = current.slice(0, qty);
      }
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSerialChange = (itemIndex, serialIndex, value) => {
    const newItems = [...formData.items];
    const serials = [...(newItems[itemIndex].serial_numbers || [])];
    serials[serialIndex] = value;
    newItems[itemIndex].serial_numbers = serials;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const toggleSerials = (index) => {
    setExpandedSerials(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const subtotalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * (item.unit_cost || 0)), 0);
  const calculatedDiscount = formData.discount_type === 'percentage' 
    ? (subtotalAmount * (parseFloat(formData.discount_value) || 0) / 100)
    : (parseFloat(formData.discount_value) || 0);
  const totalAmount = subtotalAmount - calculatedDiscount;

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
    if (!formData.supplier_id) return toast.error('Please select a supplier');
    if (formData.items.some(item => !item.product_id)) return toast.error('Please select products for all items');

    setIsSubmitting(true);
    try {
      const payload = {
        supplier_id: parseInt(formData.supplier_id),
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseFloat(item.quantity),
          unit_cost: parseFloat(item.unit_cost),
          serial_numbers: (item.serial_numbers || []).filter(sn => sn.trim() !== '')
        })),
        subtotal: subtotalAmount,
        discount: calculatedDiscount,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        total_amount: totalAmount,
        amount_paid: parseFloat(formData.amount_paid) || 0,
        payment_method: formData.payment_method,
        notes: formData.notes
      };

      const res = isEditMode
        ? await purchaseService.update(purchaseToEdit.id, payload)
        : await purchaseService.create(payload);
      
      // Create arrays for searching
      const suppliersArray = Array.isArray(suppliers) ? suppliers : (suppliers?.items || []);
      const productsArray = Array.isArray(products) ? products : (products?.items || []);

      setLastPurchaseData({
        ...res.data,
        supplier: suppliersArray.find(s => s.id === parseInt(formData.supplier_id)),
        items: formData.items.map(item => {
          const product = productsArray.find(p => p.id === parseInt(item.product_id));
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
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={isEditMode ? "Edit Purchase Record" : "Restock Inventory"} 
        subtitle={isEditMode ? "Modify details of this stock arrival" : "Record new stock arrivals from your suppliers"}
        size="lg"
      >
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-8">
          {/* Main Info */}
          <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-700">
            <SearchableSelect 
              label="Supplier Source"
              options={suppliers}
              value={formData.supplier_id}
              onChange={(val) => setFormData({ ...formData, supplier_id: val })}
              placeholder="Search supplier..."
              onAddNew={() => setIsSupplierModalOpen(true)}
            />
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
                className="px-4 py-2 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-black hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-all flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
              {formData.items.map((item, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 md:p-5 rounded-3xl hover:border-primary-100 dark:hover:border-primary-900/50 transition-all shadow-sm">
                  <div className="flex flex-wrap md:flex-nowrap gap-4 items-start">
                    {/* Product Selection */}
                    <div className="w-full md:flex-1 min-w-[200px]">
                      <SearchableSelect 
                        label="Select Product"
                        options={products}
                        value={item.product_id}
                        onChange={(val) => handleItemChange(index, 'product_id', val)}
                        placeholder="Search product..."
                        onAddNew={() => setIsProductModalOpen(true)}
                      />
                    </div>

                    {/* Quantity & Cost Group */}
                    <div className="flex gap-3 w-full md:w-auto">
                      <div className="w-1/2 md:w-28">
                        <Input 
                          label="Qty" 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="w-1/2 md:w-36">
                        <Input 
                          label="Unit Cost" 
                          type="number" 
                          step="0.01"
                          value={item.unit_cost} 
                          onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                          required
                          className="h-12"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-7 md:pt-8 flex items-center justify-end w-full md:w-auto">
                      <button 
                        type="button" 
                        onClick={() => removeItem(index)} 
                        className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        title="Remove item"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {/* Serial / IMEI Number Inputs Toggle */}
                  {item.product_id && parseInt(item.quantity) > 0 && (
                    <div className="mt-4 pt-4 border-t border-dashed border-slate-100 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => toggleSerials(index)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase text-primary-600 hover:text-primary-700 tracking-wider mb-2 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 transition-transform ${expandedSerials[index] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        {expandedSerials[index] ? 'Hide' : 'Show'} Serial / IMEI Numbers ({item.serial_numbers?.filter(s => s.trim()).length || 0} / {item.quantity})
                      </button>
                      
                      {expandedSerials[index] && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 animate-fadeIn">
                          {(item.serial_numbers || []).map((sn, snIdx) => (
                            <input
                              key={snIdx}
                              type="text"
                              value={sn}
                              onChange={(e) => handleSerialChange(index, snIdx, e.target.value)}
                              placeholder={`Unit ${snIdx + 1} — Serial / IMEI`}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-mono dark:text-white"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Summary & Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl shadow-slate-900/20 gap-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-700">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Purchase Discount</label>
                <div className="flex gap-2">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${formData.discount_type === 'fixed' ? 'bg-white dark:bg-slate-600 text-primary-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      PKR
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${formData.discount_type === 'percentage' ? 'bg-white dark:bg-slate-600 text-primary-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      %
                    </button>
                  </div>
                  <div className="flex-1">
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formData.discount_value} 
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })} 
                      placeholder="0.00"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
              <Input 
                label="Purchase Notes" 
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                placeholder="Add any internal remarks..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-700">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input 
                    label="Amount Paid" 
                    type="number" 
                    step="0.01"
                    value={formData.amount_paid} 
                    onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })} 
                    placeholder="0.00"
                    className="h-12"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full h-12 px-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 transition-all text-sm font-bold dark:text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="card">Card</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-center p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-dashed border-primary-200 dark:border-primary-800">
                <p className="text-xs font-bold text-primary-600 dark:text-primary-400">Final Balance: PKR {(totalAmount - (parseFloat(formData.amount_paid) || 0)).toFixed(2)}</p>
              </div>
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
        {lastPurchaseData && <InvoicePrint data={lastPurchaseData} type="purchase" />}
      </Modal>

      <AddEditSupplierModal 
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSuccess={fetchSuppliers}
        zIndex={10001}
      />

      <ProductModal 
        isOpen={isProductModalOpen}
        closeModal={() => setIsProductModalOpen(false)}
        onSuccess={fetchProducts}
      />
    </>
  );
};

// Internal icon import since heroicons might not be enough
const CurrencyDollarIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default AddPurchaseModal;
