import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  UserIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';

const CustomerLedgerReport = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/customers').then(res => setCustomers(res.data));
  }, []);

  const fetchLedger = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      const res = await api.get(`/ledger/customer/${selectedCustomer}`);
      setLedger(res.data);
    } catch (error) {
      toast.error('Failed to fetch customer ledger');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden card-premium p-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-black uppercase text-slate-400 mb-2 block">Select Customer</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold focus:border-primary-500 outline-none transition-all"
            >
              <option value="">-- Choose a Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 self-end">
          <Button onClick={fetchLedger} disabled={!selectedCustomer} className="h-11 px-6 rounded-xl">
            <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
            View Ledger
          </Button>
          <Button onClick={handlePrint} variant="outline" disabled={ledger.length === 0} className="h-11 px-6 rounded-xl border-2">
            <PrinterIcon className="w-5 h-5 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 font-black text-slate-400 animate-pulse">Loading Transaction History...</div>
      ) : ledger.length > 0 ? (
        <div className="card-premium overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="bg-slate-900 text-white p-8 hidden print:block text-center border-b-4 border-primary-600">
             <h1 className="text-3xl font-black uppercase tracking-tighter">Customer Statement</h1>
             <p className="text-slate-400 font-bold mt-2">
                Customer: {customers.find(c => c.id == selectedCustomer)?.name}
             </p>
             <div className="mt-4 text-xs font-bold text-slate-500 flex justify-between px-10">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>ShopManager Enterprise</span>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ref #</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Debit (+)</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Credit (-)</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(() => {
                  let runningBalance = 0;
                  return ledger.map((entry, idx) => {
                    runningBalance += (entry.debit - entry.credit);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{entry.transaction_type}</p>
                          <p className="text-[10px] font-bold text-slate-400 truncate max-w-xs">{entry.description}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-slate-500">#{entry.reference_id}</td>
                        <td className="px-6 py-4 text-right text-sm font-black text-rose-600">
                          {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">
                          {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                        </td>
                        <td className={`px-6 py-4 text-right text-sm font-black ${runningBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-600'}`}>
                          {runningBalance.toLocaleString()}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-black">
                  <td colSpan="5" className="px-6 py-4 text-right uppercase tracking-widest text-xs">Total Outstanding Balance</td>
                  <td className="px-6 py-4 text-right text-lg underline decoration-double decoration-primary-500">
                    PKR {ledger.reduce((acc, cur) => acc + (cur.debit - cur.credit), 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="card-premium p-12 text-center text-slate-400 font-bold italic border-dashed border-2">
          Please select a customer to view their transaction ledger.
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body { height: auto !important; overflow: visible !important; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .print\\:hidden { display: none !important; }
          .card-premium { border: none !important; shadow: none !important; }
          th, td { padding: 8px 12px !important; font-size: 10px !important; }
          @page { 
            margin: 10mm;
            size: A4 portrait;
          }
        }
      `}} />
    </div>
  );
};

export default CustomerLedgerReport;
