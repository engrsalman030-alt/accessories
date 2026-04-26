import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BanknotesIcon, CreditCardIcon, WalletIcon } from '@heroicons/react/24/outline';

const PaymentModal = ({ isOpen, onClose, partyType, partyId, partyName, currentBalance, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return toast.error('Please enter a valid amount');
    
    setIsSubmitting(true);
    try {
      await api.post('/payments', {
        party_type: partyType,
        party_id: partyId,
        amount: parseFloat(amount),
        method: method,
        reference_note: note,
        date: new Date().toISOString()
      });
      toast.success('Payment recorded successfully');
      setAmount('');
      setNote('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
      const errorMsg = error.response?.data?.detail;
      const msg = Array.isArray(errorMsg) ? errorMsg[0].msg : (errorMsg || 'Failed to record payment');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const methods = [
    { id: 'cash', name: 'Cash', icon: BanknotesIcon },
    { id: 'bank', name: 'Bank', icon: WalletIcon },
    { id: 'card', name: 'Card', icon: CreditCardIcon },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="md">
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-black uppercase text-slate-400">Paying To</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{partyName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase text-slate-400">Current Balance</p>
            <p className="text-lg font-black text-rose-600">PKR {parseFloat(currentBalance || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input 
          label="Amount to Pay (PKR)" 
          type="number" 
          step="0.01" 
          required 
          value={amount} 
          onChange={e => setAmount(e.target.value)}
          className="text-2xl font-black h-16 text-center"
          autoFocus
        />

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {methods.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  method === m.id 
                  ? 'border-primary-500 bg-primary-50/50 text-primary-600' 
                  : 'border-slate-100 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                <m.icon className="w-6 h-6" />
                <span className="text-xs font-black uppercase">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Input 
          label="Reference Note (Optional)" 
          value={note} 
          onChange={e => setNote(e.target.value)} 
          placeholder="Check number, transaction ID, etc."
        />

        <div className="pt-4">
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full h-16 rounded-2xl font-black text-lg"
            loading={isSubmitting}
          >
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;
