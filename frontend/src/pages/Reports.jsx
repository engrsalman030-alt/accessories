import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  TruckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import SupplierLedgerReport from '../components/reports/SupplierLedgerReport';
import CustomerLedgerReport from '../components/reports/CustomerLedgerReport';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    api.get('/reports/summary')
      .then(res => setSummary(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
      <div className="text-xl font-black text-slate-400 animate-pulse tracking-tighter uppercase">Analyzing Business Intelligence...</div>
    </div>
  );

  const stats = [
    { name: 'Total Sales', value: `PKR ${summary?.total_sales.toLocaleString(undefined, {minimumFractionDigits: 2})}`, icon: CurrencyDollarIcon, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { name: 'Total Purchases', value: `PKR ${summary?.total_purchases.toLocaleString(undefined, {minimumFractionDigits: 2})}`, icon: TruckIcon, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { name: 'Customer Dues', value: `PKR ${summary?.total_customer_balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`, icon: UserGroupIcon, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { name: 'Supplier Dues', value: `PKR ${summary?.total_supplier_balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`, icon: ArrowTrendingUpIcon, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Business <span className="text-primary-600 underline decoration-indigo-500/30">Intelligence</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-black uppercase tracking-widest text-[10px]">Real-time Status</p>
        </div>
        
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
          {[
            { id: 'summary', label: 'Summary', icon: ChartBarIcon },
            { id: 'customer', label: 'Customers', icon: UserGroupIcon },
            { id: 'supplier', label: 'Suppliers', icon: TruckIcon }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm shadow-slate-200/50 dark:shadow-none' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div 
                key={stat.name} 
                className="card-premium p-5 group relative overflow-hidden transition-all duration-500 hover:translate-y-[-2px]"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 dark:bg-slate-800/20 rounded-full translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform duration-700"></div>
                <div className="flex flex-col gap-3 relative z-10">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.name}</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Analytics Chart (Pure CSS Implementation) */}
            <div className="card-premium p-6 flex flex-col h-[320px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
                  Last 7 Days Revenue
                </h3>
                <span className="text-[9px] font-black text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-full uppercase">Live Sync</span>
              </div>
              <div className="flex-1 flex items-end justify-between gap-2 px-1">
                {summary?.revenue_analytics?.length > 0 ? (
                  summary.revenue_analytics.map((day, idx) => {
                    const max = Math.max(...summary.revenue_analytics.map(d => d.amount), 1);
                    const height = (day.amount / max) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-4 group relative">
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap z-20">
                          PKR {day.amount.toLocaleString()}
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-primary-600 to-indigo-500 rounded-t-xl transition-all duration-1000 ease-out hover:from-primary-500 hover:to-indigo-400 cursor-pointer shadow-lg shadow-primary-500/10"
                          style={{ height: `${Math.max(5, height)}%` }}
                        ></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter transform -rotate-45 origin-right">
                          {new Date(day.date).toLocaleDateString(undefined, {weekday: 'short'})}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                     Not enough data for analytics yet.
                  </div>
                )}
              </div>
            </div>

            {/* Top Categories Analytics */}
            <div className="card-premium p-6 flex flex-col h-[320px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                  Category performance
                </h3>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-hide">
                {summary?.top_categories?.length > 0 ? (
                  summary.top_categories.map((cat, idx) => {
                    const total = summary.top_categories.reduce((acc, cur) => acc + cur.value, 0);
                    const percentage = (cat.value / total) * 100;
                    return (
                      <div key={idx} className="space-y-2 group">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{cat.name}</span>
                          <span className="text-[10px] font-black text-slate-400">{cat.value.toLocaleString()} Units</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-primary-500 rounded-full transition-all duration-1000 ease-in-out shadow-sm"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                     Start selling to see category performance!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customer' && (
        <div className="animate-in slide-in-from-right-8 duration-500">
           <CustomerLedgerReport />
        </div>
      )}

      {activeTab === 'supplier' && (
        <div className="animate-in slide-in-from-right-8 duration-700">
          <SupplierLedgerReport />
        </div>
      )}
    </div>
  );
}
