import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../ui/Button';
import { 
  UserIcon, 
  PrinterIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CubeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PrintFooter from '../common/PrintFooter';
import useSettingStore from '../../store/settingStore';

const SupplierLedgerReport = () => {
  const { settings, fetchSettings } = useSettingStore();
  const [suppliers, setSuppliers] = useState([]);
  const [reportType, setReportType] = useState('individual'); // 'individual' or 'all'
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [datePreset, setDatePreset] = useState('month');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [reportData, setReportData] = useState(null);
  const [allSuppliersData, setAllSuppliersData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/suppliers?limit=1000').then(res => {
      const data = res.data?.items || res.data || [];
      setSuppliers(Array.isArray(data) ? data : []);
    }).catch(err => {
      console.error("Failed to fetch suppliers:", err);
      setSuppliers([]);
    });
    if (!settings) fetchSettings();
  }, [settings, fetchSettings]);

  const getDates = () => {
    const end = new Date();
    let start = new Date();
    
    if (datePreset === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (datePreset === 'month') {
      start.setMonth(end.getMonth() - 1);
    } else if (datePreset === 'year') {
      start.setFullYear(end.getFullYear() - 1);
    } else if (datePreset === 'custom') {
      return { 
        start: customDates.start ? new Date(customDates.start).toISOString() : null,
        end: customDates.end ? new Date(customDates.end).toISOString() : null
      };
    }
    
    return { 
      start: start.toISOString(), 
      end: end.toISOString() 
    };
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'individual') {
        if (!selectedSupplierId) {
          setLoading(false);
          return toast.error('Please select a supplier');
        }
        
        const { start, end } = getDates();
        let url = `/suppliers/${selectedSupplierId}/ledger?limit=1000`;
        if (start) url += `&start_date=${start}`;
        if (end) url += `&end_date=${end}`;
        
        const res = await api.get(url);
        const data = res.data;
        
        if (!data || !data.ledger) throw new Error('Invalid data received');
        
        const totalDebit = data.ledger.reduce((sum, e) => sum + Number(e.debit || 0), 0);
        const totalCredit = data.ledger.reduce((sum, e) => sum + Number(e.credit || 0), 0);
        
        setReportData({
          ...data,
          totalDebit,
          totalCredit,
          period: { start, end }
        });
        setAllSuppliersData(null);
        toast.success('Ledger generated');
      } else {
        // All Suppliers Report
        const res = await api.get('/suppliers?limit=1000');
        const data = res.data?.items || res.data || [];
        
        if (!Array.isArray(data)) throw new Error('Invalid suppliers list');
        
        const sortedSuppliers = [...data].sort((a, b) => Number(b.outstanding_balance || 0) - Number(a.outstanding_balance || 0));
        const totalBalance = sortedSuppliers.reduce((sum, s) => sum + Number(s.outstanding_balance || 0), 0);
        
        setAllSuppliersData({
          suppliers: sortedSuppliers,
          totalBalance
        });
        setReportData(null);
        toast.success('Summary generated');
      }
    } catch (error) {
      console.error('Report Generation Error:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="printable-report-container" className="space-y-6">
      {/* Report Selection Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit print:hidden">
        <button 
          onClick={() => { setReportType('individual'); setReportData(null); setAllSuppliersData(null); }}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${reportType === 'individual' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'}`}
        >
          Individual Ledger
        </button>
        <button 
          onClick={() => { setReportType('all'); setReportData(null); setAllSuppliersData(null); }}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${reportType === 'all' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500'}`}
        >
          All Suppliers Summary
        </button>
      </div>

      {/* Configuration Header */}
      <div className="card-premium p-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {reportType === 'individual' ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Supplier</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary-500 font-bold dark:text-white"
                  >
                    <option value="">Select Supplier</option>
                    {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.company || 'Private'})</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Timeframe</label>
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                  {['week', 'month', 'year', 'custom'].map(p => (
                    <button
                      key={p}
                      onClick={() => setDatePreset(p)}
                      className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                        datePreset === p 
                        ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-2 flex items-center gap-4 bg-primary-50/50 dark:bg-primary-500/5 p-4 rounded-2xl border border-primary-100 dark:border-primary-500/10">
              <div className="p-3 bg-primary-100 dark:bg-primary-500/20 text-primary-600 rounded-xl">
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-primary-900 dark:text-primary-400">All Suppliers Report</p>
                <p className="text-xs font-bold text-primary-700 dark:text-primary-500/70">This will generate a summary of all balances for all {(suppliers || []).length} suppliers.</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={generateReport}
              loading={loading}
              variant="primary" 
              className="flex-1 h-[52px] rounded-2xl font-black uppercase tracking-wider gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Generate
            </Button>
            {(reportData || allSuppliersData) && (
              <Button 
                onClick={handlePrint}
                variant="secondary" 
                className="h-[52px] w-14 rounded-2xl"
              >
                <PrinterIcon className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>

        {reportType === 'individual' && datePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">Start Date</label>
              <input 
                type="date" 
                value={customDates.start}
                onChange={(e) => setCustomDates({...customDates, start: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">End Date</label>
              <input 
                type="date" 
                value={customDates.end}
                onChange={(e) => setCustomDates({...customDates, end: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Individual Report View */}
      {reportType === 'individual' && reportData && (
        <div id="printable-report" className="card-premium overflow-hidden bg-white dark:bg-slate-900 border-0 shadow-2xl print:shadow-none print:m-0">
          {/* Professional Header (Print Only) */}
          <div className="hidden print:flex justify-between items-start p-10 border-b-2 border-slate-100">
             <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden">
                  {settings?.logo_url ? (
                    <img src={`http://localhost:8000${settings.logo_url}`} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <CubeIcon className="w-10 h-10 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight">{settings?.shop_name || 'SHOP MANAGER'}</h1>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Supplier Statement</p>
                </div>
             </div>
             <div className="text-right space-y-1">
               <p className="text-sm font-black text-slate-900">{settings?.address}</p>
               <p className="text-xs font-bold text-slate-500">{settings?.phone}</p>
               <p className="text-xs font-bold text-slate-500">{settings?.email}</p>
             </div>
          </div>

          <div className="p-10">
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-primary-600 mb-1">Prepared For</p>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">{reportData.supplier.name}</h2>
                  <p className="text-slate-500 font-bold text-lg">{reportData.supplier.company || 'Private Individual'}</p>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Period</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {new Date(reportData.period.start).toLocaleDateString()} - {new Date(reportData.period.end).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Statement Date</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="summary-card-print text-right p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm min-w-[240px]">
                <p className="text-[10px] font-black uppercase text-rose-600 mb-1 tracking-widest">Balance Due</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white print:text-4xl">
                  <span className="text-xl mr-1">{settings?.currency || 'PKR'}</span>
                  {Number(reportData.supplier.outstanding_balance).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-4 border-slate-900 dark:border-white">
                    <th className="text-left py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="text-left py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                    <th className="text-right py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Debit (Pay)</th>
                    <th className="text-right py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Credit (Buy)</th>
                    <th className="text-right py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                    <td colSpan={4} className="py-5 px-4 font-black text-slate-500 text-xs uppercase tracking-wider italic">Opening Balance</td>
                    <td className="py-5 px-2 text-right font-black text-slate-900 dark:text-white">
                      {settings?.currency} {Number(reportData.opening_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  {reportData.ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-5 px-2 text-sm font-black text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-5 px-2">
                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight">{entry.transaction_type}</div>
                        <div className="text-[10px] text-slate-500 font-bold max-w-xs">{entry.description}</div>
                      </td>
                      <td className="py-5 px-2 text-right font-black text-emerald-600">
                        {Number(entry.debit) > 0 ? `+${Number(entry.debit).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-5 px-2 text-right font-black text-rose-600">
                        {Number(entry.credit) > 0 ? `-${Number(entry.credit).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-5 px-2 text-right font-black text-slate-900 dark:text-white">
                        {Number(entry.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {reportData.ledger.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400 italic font-bold">
                        No transactions found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
                {reportData.ledger.length > 0 && (
                  <tfoot className="border-t-4 border-slate-900 dark:border-white">
                    <tr className="bg-slate-900 dark:bg-slate-800 text-white">
                      <td colSpan={2} className="py-6 px-4 font-black uppercase text-xs tracking-[0.2em]">Period Totals</td>
                      <td className="py-6 px-2 text-right font-black text-emerald-400">
                        +{reportData.totalDebit.toLocaleString()}
                      </td>
                      <td className="py-6 px-2 text-right font-black text-rose-400">
                        -{reportData.totalCredit.toLocaleString()}
                      </td>
                      <td className="py-6 px-2 text-right font-black text-white text-lg">
                         {Number(reportData.supplier.outstanding_balance).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-12 print:mt-24">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Notes & Remarks</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                  This statement reflects all transactions recorded between {new Date(reportData.period.start).toLocaleDateString()} and {new Date(reportData.period.end).toLocaleDateString()}. 
                  Please report any discrepancies within 7 working days.
                </p>
              </div>
            <div className="flex flex-col items-end justify-end space-y-8">
                <div className="w-48 border-b-2 border-slate-900 dark:border-white"></div>
                <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-[0.3em]">Authorized Signature</p>
              </div>
            </div>

            <PrintFooter className="mt-16" />
          </div>
        </div>
      )}

      {/* All Suppliers Summary Report View */}
      {reportType === 'all' && allSuppliersData && (
        <div id="printable-report" className="card-premium overflow-hidden bg-white dark:bg-slate-900 border-0 shadow-2xl print:shadow-none print:m-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Professional Header */}
          <div className="hidden print:flex justify-between items-start p-10 border-b-2 border-slate-100">
             <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden">
                  {settings?.logo_url ? (
                    <img src={`http://localhost:8000${settings.logo_url}`} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <CubeIcon className="w-10 h-10 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight">{settings?.shop_name || 'SHOP MANAGER'}</h1>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">All Suppliers Aging Summary</p>
                </div>
             </div>
             <div className="text-right">
               <p className="text-sm font-black text-slate-900">{settings?.address}</p>
               <p className="text-xs font-bold text-slate-500">Report Date: {new Date().toLocaleDateString()}</p>
             </div>
          </div>

          <div className="p-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Outstanding Balances</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Consolidated Supplier Liabilities</p>
              </div>
              <div className="summary-card-print text-right p-8 bg-rose-50 dark:bg-rose-500/10 rounded-[2.5rem] border border-rose-100 dark:border-rose-500/20 shadow-sm min-w-[300px]">
                <p className="text-[10px] font-black uppercase text-rose-600 mb-1 tracking-widest">Total Liability</p>
                <p className="text-5xl font-black text-rose-900 dark:text-white print:text-4xl">
                  <span className="text-xl mr-1">{settings?.currency || 'PKR'}</span>
                  {allSuppliersData.totalBalance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-4 border-slate-900 dark:border-white">
                    <th className="summary-col-name text-left py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier Name</th>
                    <th className="summary-col-company text-left py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Company</th>
                    <th className="summary-col-phone text-left py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</th>
                    <th className="summary-col-balance text-right py-4 px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allSuppliersData.suppliers.map((s, idx) => (
                    <tr key={s.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${Number(s.outstanding_balance) > 0 ? '' : 'opacity-40'}`}>
                      <td className="py-5 px-2">
                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase">{s.name}</div>
                        <div className="text-[9px] font-bold text-slate-400">ID: SUP-{s.id}</div>
                      </td>
                      <td className="py-5 px-2 text-sm font-bold text-slate-600 dark:text-slate-400">{s.company || '—'}</td>
                      <td className="py-5 px-2 text-sm font-bold text-slate-600 dark:text-slate-400">{s.phone || '—'}</td>
                      <td className="py-5 px-2 text-right">
                        <span className={`text-lg font-black ${Number(s.outstanding_balance) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {Number(s.outstanding_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white">
                    <td colSpan={3} className="py-6 px-4 font-black uppercase text-xs tracking-[0.2em]">Total Shop Liability</td>
                    <td className="py-6 px-2 text-right font-black text-2xl">
                      {settings?.currency} {allSuppliersData.totalBalance.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="mt-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] hidden print:block">
              End of Summary Report
            </div>

            <PrintFooter className="mt-16" />
          </div>
        </div>
      )}

      {/* Placeholder State */}
      {!reportData && !allSuppliersData && (
        <div className="card-premium p-20 flex flex-col items-center justify-center text-slate-400 space-y-6 opacity-50 bg-slate-50/50">
           <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
             {reportType === 'individual' ? <DocumentTextIcon className="w-12 h-12" /> : <UserGroupIcon className="w-12 h-12" />}
           </div>
           <div className="text-center">
             <p className="font-black text-xl text-slate-600 dark:text-slate-300">Ready to Generate</p>
             <p className="font-bold text-sm">Select the report criteria and click generate to view the professional layout.</p>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body { height: auto !important; overflow: visible !important; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .print\\:hidden { display: none !important; }
          #printable-report { 
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .p-10 { padding: 15px !important; }
          .mb-12 { margin-bottom: 20px !important; }
          .mb-10 { margin-bottom: 15px !important; }
          .py-5 { padding-top: 8px !important; padding-bottom: 8px !important; }
          th, td { font-size: 10px !important; }
          .text-5xl { font-size: 24px !important; }
          .text-3xl { font-size: 18px !important; }
          .summary-card-print { padding: 15px !important; border-radius: 15px !important; }
          @page { 
            margin: 10mm;
            size: A4 portrait;
          }
        }
      `}} />
    </div>
  );
};

export default SupplierLedgerReport;
