import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { 
  ExclamationCircleIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ReturnModal = ({ isOpen, onClose, data, type = 'sale', onComplete }) => {
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (data && data.items) {
      setReturnItems(data.items.map(item => ({
        ...item,
        return_qty: 0,
        max_qty: item.quantity
      })));
    }
  }, [data]);

  const handleQtyChange = (idx, value) => {
    const qty = parseFloat(value) || 0;
    const newItems = [...returnItems];
    if (qty > newItems[idx].max_qty) {
      toast.error(`Cannot return more than purchased (${newItems[idx].max_qty})`);
      newItems[idx].return_qty = newItems[idx].max_qty;
    } else {
      newItems[idx].return_qty = qty;
    }
    setReturnItems(newItems);
  };

  const totalRefund = returnItems.reduce((sum, item) => sum + (item.return_qty * (type === 'sale' ? item.unit_price : item.unit_cost)), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemsToReturn = returnItems.filter(item => item.return_qty > 0);
    
    if (itemsToReturn.length === 0) {
      return toast.error('Please select at least one item to return');
    }

    setIsSubmitting(true);
    try {
      const payload = {
        reference_id: data.id,
        reason: reason,
        items: itemsToReturn.map(item => ({
          product_id: item.product_id,
          quantity: item.return_qty,
          unit_price: type === 'sale' ? item.unit_price : 0,
          unit_cost: type === 'purchase' ? item.unit_cost : 0
        }))
      };

      const endpoint = type === 'sale' ? '/returns/sale' : '/returns/purchase';
      const api = await import('../../services/api');
      await api.default.post(endpoint, payload);
      
      toast.success(`${type === 'sale' ? 'Sale' : 'Purchase'} return processed successfully`);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Return failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!data) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Process ${type === 'sale' ? 'Sales' : 'Purchase'} Return`}
      subtitle={`Reference: ${type === 'sale' ? 'INV' : 'PUR'}-${data.id}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex gap-3">
          <ExclamationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Processing a return will automatically adjust stock levels and update {type === 'sale' ? 'customer' : 'supplier'} outstanding balances.
          </p>
        </div>

        <div className="max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Product</th>
                <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Purchased</th>
                <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center w-24">Return Qty</th>
                <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {returnItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{item.product_name || item.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">PKR {type === 'sale' ? item.unit_price : item.unit_cost} / unit</p>
                  </td>
                  <td className="py-4 text-center font-bold text-slate-600">{item.max_qty}</td>
                  <td className="py-4">
                    <input 
                      type="number"
                      min="0"
                      max={item.max_qty}
                      step="0.01"
                      value={item.return_qty}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-2 py-1.5 text-center font-black text-primary-600 focus:border-primary-500 outline-none transition-all"
                    />
                  </td>
                  <td className="py-4 text-right font-bold text-slate-900 dark:text-white">
                    PKR {(item.return_qty * (type === 'sale' ? item.unit_price : item.unit_cost)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <Input 
            label="Reason for Return"
            placeholder="e.g. Defective item, Wrong size, Customer changed mind..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex justify-between items-center shadow-xl">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Refund Amount</p>
              <p className="text-3xl font-black mt-1">PKR {totalRefund.toFixed(2)}</p>
            </div>
            <Button 
              type="submit"
              variant="primary"
              className="h-14 px-8 rounded-2xl font-black uppercase tracking-wider bg-white text-slate-900 hover:bg-slate-100"
              loading={isSubmitting}
            >
              Confirm Return
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ReturnModal;
