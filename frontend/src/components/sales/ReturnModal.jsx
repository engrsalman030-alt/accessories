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
        max_qty: item.quantity,
        condition: 'fine'
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
      setIsSubmitting(false);
      return toast.error('Selection Required: Please enter the return quantity for at least one product before confirming.');
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
          unit_cost: type === 'purchase' ? item.unit_cost : 0,
          condition: item.condition,
          serial_numbers: item.selected_serials || []
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
                <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Status</th>
                <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center w-24">Return Qty</th>
                <th className="pb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {returnItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.product_name || item.name || item.product?.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">PKR {type === 'sale' ? item.unit_price : item.unit_cost} / unit</p>
                      
                      {item.serials && item.serials.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.serials.map((s, sIdx) => {
                            const isSelected = (item.selected_serials || []).includes(s.serial_number);
                            return (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => {
                                  const current = item.selected_serials || [];
                                  const next = isSelected 
                                    ? current.filter(sn => sn !== s.serial_number)
                                    : [...current, s.serial_number];
                                  
                                  const newItems = [...returnItems];
                                  newItems[idx].selected_serials = next;
                                  newItems[idx].return_qty = next.length;
                                  setReturnItems(newItems);
                                }}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                              >
                                {s.serial_number}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...returnItems];
                            newItems[idx].condition = 'fine';
                            setReturnItems(newItems);
                          }}
                          className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${item.condition === 'fine' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400'}`}
                        >
                          Fine
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...returnItems];
                            newItems[idx].condition = 'damaged';
                            setReturnItems(newItems);
                          }}
                          className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${item.condition === 'damaged' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-400'}`}
                        >
                          Damaged
                        </button>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Max: {item.max_qty}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <input 
                      type="number"
                      min="0"
                      max={item.max_qty}
                      step="0.01"
                      value={item.return_qty}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      readOnly={item.serials && item.serials.length > 0}
                      className={`w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-2 py-1.5 text-center font-black text-primary-600 focus:border-primary-500 outline-none transition-all ${item.serials && item.serials.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              variant="secondary"
              className="h-14 px-8 rounded-2xl font-black uppercase tracking-wider !bg-white !text-slate-900 hover:!bg-slate-100 border-none shadow-xl"
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
