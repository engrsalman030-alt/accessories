import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { 
  BanknotesIcon, 
  CreditCardIcon, 
  WalletIcon, 
  PrinterIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const CheckoutModal = ({ isOpen, onClose, total, onConfirm, isSubmitting, isSuccess }) => {
  const [amountPaid, setAmountPaid] = useState(total);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [change, setChange] = useState(0);

  useEffect(() => {
    setAmountPaid(total);
  }, [total, isOpen]);

  useEffect(() => {
    const changeAmount = parseFloat(amountPaid) - total;
    setChange(changeAmount > 0 ? changeAmount : 0);
  }, [amountPaid, total]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      amount_paid: parseFloat(amountPaid),
      payment_method: paymentMethod
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const methods = [
    { id: 'cash', name: 'Cash', icon: BanknotesIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'card', name: 'Card', icon: CreditCardIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'transfer', name: 'Transfer', icon: WalletIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'credit', name: 'Credit (Due)', icon: CheckCircleIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (isSuccess) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Sale Completed" 
        size="md"
      >
        <div className="py-8 flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-16 h-16 text-emerald-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Sale Successful!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">The transaction has been recorded successfully.</p>
          </div>

          <div className="w-full grid grid-cols-1 gap-3 pt-4">
            <Button 
              onClick={handlePrint}
              variant="primary" 
              className="h-16 rounded-2xl text-lg font-black uppercase flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800"
            >
              <PrinterIcon className="w-6 h-6" />
              Print Receipt
            </Button>
            
            <Button 
              onClick={onClose}
              variant="secondary" 
              className="h-14 rounded-2xl font-bold"
            >
              Close & New Sale
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Payment Settlement" 
      subtitle="Complete the transaction and manage customer dues"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Summary Card */}
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white text-center shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Final Total</p>
          <p className="text-5xl font-black">PKR {total.toFixed(2)}</p>
        </div>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-2 gap-3">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => {
                setPaymentMethod(method.id);
                if (method.id === 'credit') setAmountPaid(0);
                else if (amountPaid === 0) setAmountPaid(total);
              }}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                paymentMethod === method.id 
                ? 'border-primary-500 bg-primary-50/30' 
                : 'border-slate-100 bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl ${method.bg} ${method.color}`}>
                <method.icon className="w-5 h-5" />
              </div>
              <span className={`font-bold text-sm ${paymentMethod === method.id ? 'text-primary-700' : 'text-slate-600'}`}>
                {method.name}
              </span>
            </button>
          ))}
        </div>

        {/* Amount Paid & Change */}
        <div className="space-y-4">
          <Input 
            label="Received Amount (PKR)" 
            type="number" 
            step="0.01"
            value={amountPaid} 
            onChange={(e) => setAmountPaid(e.target.value)}
            className="text-2xl font-black h-16 text-center"
            autoFocus
          />

          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-500 uppercase text-xs">Return Change:</span>
            <span className="text-2xl font-black text-primary-600">PKR {change.toFixed(2)}</span>
          </div>
          
          {parseFloat(amountPaid) < total && paymentMethod !== 'credit' && (
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100 text-center">
              ⚠️ Warning: Remaining PKR {(total - parseFloat(amountPaid)).toFixed(2)} will be added to Customer Dues.
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-2">
          <Button 
            type="submit" 
            variant="primary" 
            className="flex-1 h-16 rounded-2xl text-lg font-black uppercase tracking-wider shadow-lg shadow-primary-500/20"
            loading={isSubmitting}
          >
            Confirm & Finish
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CheckoutModal;
