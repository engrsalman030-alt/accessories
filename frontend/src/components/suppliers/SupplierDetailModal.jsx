import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PencilSquareIcon, 
  BanknotesIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon
} from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import supplierService from '../../services/supplierService';
import RecordPaymentModal from './RecordPaymentModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { motion, AnimatePresence } from 'framer-motion';

const SupplierDetailModal = ({ isOpen, onClose, supplierId }) => {
  const [supplier, setSupplier] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && supplierId) {
      fetchSupplierDetails();
    }
  }, [isOpen, supplierId]);

  const fetchSupplierDetails = async () => {
    setIsLoading(true);
    try {
      const [supplierRes, ledgerRes] = await Promise.all([
        supplierService.getById(supplierId),
        supplierService.getLedger(supplierId)
      ]);
      setSupplier(supplierRes.data);
      setLedger(ledgerRes.data.ledger || []);
    } catch (error) {
      console.error('Error fetching supplier details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    fetchSupplierDetails();
    setIsPaymentModalOpen(false);
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Gathering supplier records...</p>
        </div>
      </Modal>
    );
  }

  if (!supplier) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        {/* Header Section */}
        <div className="relative -mx-8 -mt-8 p-10 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-primary-500/20 rotate-3">
                {supplier.name[0]}
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{supplier.name}</h2>
                {supplier.company && (
                  <p className="text-lg font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                    <BuildingOfficeIcon className="w-5 h-5" />
                    {supplier.company}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <Badge color={supplier.outstanding_balance > 0 ? 'amber' : 'green'} className="py-2.5 px-5 text-sm font-black tracking-wide">
                {supplier.outstanding_balance > 0 
                  ? `PKR ${formatCurrency(supplier.outstanding_balance)} Dues`
                  : 'Account Cleared'
                }
              </Badge>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Supplier Credit Balance</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-10 border-b border-slate-100 dark:border-slate-800/50 mb-10">
          {[
            { id: 'details', label: 'Summary & Profile' },
            { id: 'ledger', label: 'Full Ledger history' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-5 px-1 text-sm font-black uppercase tracking-wider transition-all relative ${
                activeTab === tab.id
                  ? 'text-primary-600'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary-600 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div className="min-h-[450px]">
          <AnimatePresence mode="wait">
            {activeTab === 'details' ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                {/* Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                   <div className="space-y-8">
                      <DetailItem icon={PhoneIcon} label="Primary Contact" value={supplier.phone} />
                      <DetailItem icon={EnvelopeIcon} label="Official Email" value={supplier.email} />
                      <DetailItem icon={CalendarIcon} label="Member Since" value={new Date(supplier.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
                   </div>
                   <div className="space-y-8">
                      <DetailItem icon={BuildingOfficeIcon} label="Mailing Address" value={supplier.address} fullWidth />
                      {supplier.notes && <DetailItem icon={DocumentTextIcon} label="Management Notes" value={supplier.notes} fullWidth />}
                   </div>
                </div>

                {/* Recent Activity Mini-Ledger */}
                <div className="space-y-5">
                   <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-primary-500" />
                        Recent Activity
                      </h3>
                      <button 
                        onClick={() => setActiveTab('ledger')}
                        className="text-[10px] font-black text-primary-600 uppercase tracking-tighter hover:underline"
                      >
                        View All Transactions
                      </button>
                   </div>
                   
                   <div className="space-y-3">
                      {ledger.slice(0, 3).length === 0 ? (
                        <p className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-500 text-sm italic">No recent activity found.</p>
                      ) : (
                        ledger.slice(0, 3).map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                             <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  entry.transaction_type === 'purchase' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                   {entry.transaction_type === 'purchase' ? <ArrowUpRightIcon className="w-5 h-5" /> : <ArrowDownLeftIcon className="w-5 h-5" />}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{entry.description}</p>
                                   <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{new Date(entry.date).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <p className={`text-sm font-black ${entry.debit > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {entry.debit > 0 ? `+ PKR ${formatCurrency(entry.debit)}` : `- PKR ${formatCurrency(entry.credit)}`}
                             </p>
                          </div>
                        ))
                      )}
                   </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex items-center gap-4 pt-10 border-t border-slate-100 dark:border-slate-800/50">
                  <Button variant="secondary" className="flex-1 py-4 text-sm font-black uppercase tracking-widest" onClick={() => onClose()}>
                    <PencilSquareIcon className="w-5 h-5 mr-3" />
                    Edit Profile
                  </Button>
                  {supplier.outstanding_balance > 0 && (
                    <Button variant="primary" className="flex-1 py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-500/20" onClick={() => setIsPaymentModalOpen(true)}>
                      <BanknotesIcon className="w-5 h-5 mr-3" />
                      Record a Payment
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ledger"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {ledger.length === 0 ? (
                  <div className="text-center py-24 bg-slate-50 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <DocumentTextIcon className="w-10 h-10" />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ledger is Empty</h4>
                    <p className="text-slate-500 font-bold mt-2">Historical data will appear once transactions are logged.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[550px] overflow-y-auto pr-3 scrollbar-hide">
                    {ledger.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-7 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[2.5rem] hover:border-primary-500/30 transition-all duration-300">
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                            entry.transaction_type === 'purchase' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                          }`}>
                            {entry.transaction_type === 'purchase' ? <ArrowUpRightIcon className="w-7 h-7" /> : <ArrowDownLeftIcon className="w-7 h-7" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-none">{entry.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-black ${
                            entry.debit > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {entry.debit > 0 ? `+ PKR ${formatCurrency(entry.debit)}` : `- PKR ${formatCurrency(entry.credit)}`}
                          </p>
                          <p className="text-xs font-black text-slate-400 tracking-wider mt-1 uppercase">Balance: PKR {formatCurrency(entry.balance)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <RecordPaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            supplier={supplier}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
};

const DetailItem = ({ icon: Icon, label, value, fullWidth }) => (
  <div className={`flex items-start gap-5 ${fullWidth ? 'w-full' : ''}`}>
    <div className="w-12 h-12 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50 rounded-2xl flex items-center justify-center text-primary-500 flex-shrink-0 transition-transform hover:scale-110">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
      <p className="text-base font-bold text-slate-900 dark:text-white mt-1 leading-tight">{value || 'No Data Registered'}</p>
    </div>
  </div>
);

export default SupplierDetailModal;