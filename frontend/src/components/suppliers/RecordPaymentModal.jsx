import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import supplierService from '../../services/supplierService';
import { formatCurrency } from '../../utils/formatCurrency';

const RecordPaymentModal = ({ isOpen, onClose, supplier, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    method: 'Cash',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods = [
    'Cash',
    'Bank Transfer',
    'Cheque',
    'Easypaisa',
    'JazzCash',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFullAmount = () => {
    setFormData(prev => ({
      ...prev,
      amount: supplier.outstanding_balance.toString()
    }));
  };

  const validate = () => {
    const newErrors = {};
    const amount = parseFloat(formData.amount);
    
    if (!amount || amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (amount > supplier.outstanding_balance) {
      newErrors.amount = `Exceeds balance of PKR ${formatCurrency(supplier.outstanding_balance)}`;
    }
    
    if (!formData.method) {
      newErrors.method = 'Method is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await supplierService.recordPayment(supplier.id, {
        amount: parseFloat(formData.amount),
        method: formData.method,
        reference_note: formData.reference,
        date: formData.date
      });
      
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      setErrors({
        submit: error.response?.data?.detail || 'Failed to record payment'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      subtitle={`Payment transaction for ${supplier?.name}`}
      size="md"
    >
      {/* Balance Summary Card */}
      <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-500/10 rounded-[2rem] border-2 border-amber-100 dark:border-amber-500/20 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Outstanding Balance</p>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">PKR {formatCurrency(supplier?.outstanding_balance)}</p>
        </div>
        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
           <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
           </svg>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Amount Input with Quick Action */}
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Payment Amount</label>
               <button 
                 type="button" 
                 onClick={handleFullAmount}
                 className="text-[10px] font-extrabold text-primary-600 hover:text-primary-700 uppercase tracking-tighter bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-lg transition-all"
               >
                 Pay Full Balance
               </button>
            </div>
            <div className="relative group">
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                placeholder="0.00"
                className={`w-full px-4 py-3 bg-white dark:bg-slate-900/50 border-2 ${
                  errors.amount ? 'border-rose-500 focus:ring-rose-500/10' : 'border-slate-100 dark:border-slate-800 focus:border-primary-500 focus:ring-primary-500/10'
                } rounded-2xl focus:ring-4 outline-none transition-all duration-300 font-extrabold text-lg`}
              />
            </div>
            {errors.amount && <p className="text-xs font-bold text-rose-500 ml-1">{errors.amount}</p>}
          </div>

          {/* Payment Method Select */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Payment Method</label>
            <select
              name="method"
              value={formData.method}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl outline-none transition-all duration-300 font-bold"
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <Input
            label="Reference / Receipt #"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            placeholder="e.g. TR-99210 or Bank Ref"
          />

          <Input
            label="Transaction Date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            type="date"
            error={errors.date}
          />
        </div>

        {errors.submit && (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-bold">
            {errors.submit}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 order-2 sm:order-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Discard
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 order-1 sm:order-2"
            loading={isSubmitting}
          >
            Confirm Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;