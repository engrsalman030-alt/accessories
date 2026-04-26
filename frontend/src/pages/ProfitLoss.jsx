import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  CalculatorIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  BanknotesIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  ChartBarIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import useSettingStore from '../store/settingStore';

const ProfitLoss = () => {
  const store = useSettingStore();
  const settings = store?.settings || {};
  const fetchSettings = store?.fetchSettings;
  const [data, setData] = useState(null);

  useEffect(() => {
    if (fetchSettings && !store?.settings) fetchSettings();
  }, [store?.settings, fetchSettings]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('monthly'); // daily, weekly, monthly, yearly, custom
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reports/profit-loss', {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end
        }
      });
      setData(res.data);
    } catch (error) {
      toast.error('Failed to fetch profit & loss data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePeriodChange = (p) => {
    setPeriod(p);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (p === 'daily') {
      start = new Date(now.setHours(0,0,0,0));
    } else if (p === 'weekly') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      start = new Date(now.setDate(diff));
    } else if (p === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (p === 'yearly') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  if (isLoading && !data) {
    return <div className="flex items-center justify-center h-96 font-black text-slate-400 animate-pulse">Calculating Financials...</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            Profit & <span className="text-primary-600">Loss</span>
            <CalculatorIcon className="w-10 h-10 text-slate-200" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">Financial Performance Dashboard</p>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={handlePrint} variant="outline" className="h-12 px-6 rounded-2xl border-2">
            <PrinterIcon className="w-5 h-5 mr-2" />
            Print Report
          </Button>
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  period === p 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Screen Layout */}
      <div className="print:hidden space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Revenue" 
            amount={data?.revenue} 
            icon={ArrowTrendingUpIcon} 
            color="blue"
            subtitle="Gross sales generated"
          />
          <StatCard 
            title="Cost of Goods" 
            amount={data?.cogs} 
            icon={ShoppingCartIcon} 
            color="amber"
            subtitle="Direct inventory costs"
          />
          <StatCard 
            title="Gross Profit" 
            amount={data?.gross_profit} 
            icon={ChartBarIcon} 
            color="emerald"
            subtitle="Revenue minus COGS"
          />
          <StatCard 
            title="Net Profit" 
            amount={data?.net_profit} 
            icon={BanknotesIcon} 
            color={data?.net_profit >= 0 ? "indigo" : "rose"}
            subtitle="Final bottom line"
            isHighlight={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium p-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">Detailed Breakdown</h3>
              <div className="space-y-6">
                <BreakdownRow label="Gross Sales" value={data?.revenue} />
                <BreakdownRow label="Sales Returns" value={data?.sale_returns} isNegative={true} />
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <BreakdownRow label="Actual Revenue" value={data?.actual_revenue} isBold={true} />
                </div>
                <BreakdownRow label="Cost of Goods Sold (COGS)" value={data?.cogs} isNegative={true} />
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <BreakdownRow label="Gross Profit" value={data?.gross_profit} isBold={true} color="text-emerald-600" />
                </div>
                <BreakdownRow label="Operating Expenses" value={data?.expenses} isNegative={true} />
                <div className="border-t-2 border-slate-900 dark:border-slate-100 pt-6 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Net Profit</span>
                    <span className={`text-3xl font-black ${data?.net_profit >= 0 ? 'text-primary-600' : 'text-rose-600'}`}>
                      PKR {data?.net_profit?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-premium p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl">
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 mb-6">Financial Health</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold uppercase">Gross Margin</span>
                    <span className="text-xs font-black">{((data?.gross_profit / (data?.actual_revenue || 1)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, Math.max(0, (data?.gross_profit / (data?.actual_revenue || 1)) * 100))}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold uppercase">Net Margin</span>
                    <span className="text-xs font-black">{((data?.net_profit / (data?.actual_revenue || 1)) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${data?.net_profit >= 0 ? 'bg-primary-500' : 'bg-rose-500'} rounded-full transition-all duration-1000`}
                      style={{ width: `${Math.min(100, Math.max(0, (data?.net_profit / (data?.actual_revenue || 1)) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10 italic text-sm text-slate-300 font-medium">
                "Net profit represents the actual earnings after all costs and expenses are subtracted from revenue."
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Print Layout (Only visible when printing) */}
      <div className="hidden print:block p-0 bg-white text-black font-serif w-full">
        <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <CalculatorIcon className="w-6 h-6 text-white" />
             </div>
             <div className="text-left">
                <h2 className="text-xl font-black uppercase tracking-tighter">{settings?.shop_name || 'ShopManager'}</h2>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Enterprise Solutions</p>
             </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold uppercase">Profit & Loss Statement</h1>
            <p className="text-xs font-bold italic">Generated on {new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="mb-4 bg-slate-100 p-3 rounded-lg border border-slate-300">
           <p className="text-xs font-bold uppercase tracking-widest text-center">
              Reporting Period: {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
           </p>
        </div>

        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-y-2 border-black">
              <th className="py-2 text-left text-sm font-bold uppercase tracking-wider">Account Description</th>
              <th className="py-2 text-right text-sm font-bold uppercase tracking-wider">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            <tr className="font-bold bg-slate-50">
              <td className="py-3 text-sm">REVENUE</td>
              <td></td>
            </tr>
            <tr>
              <td className="py-1.5 pl-6 text-sm">Gross Sales</td>
              <td className="text-right text-sm">{data?.revenue?.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="py-1.5 pl-6 text-sm">Less: Sales Returns</td>
              <td className="text-right text-sm">({data?.sale_returns?.toLocaleString()})</td>
            </tr>
            <tr className="font-bold border-t border-black">
              <td className="py-2 text-sm">TOTAL REVENUE (Net Sales)</td>
              <td className="text-right text-sm">PKR {data?.actual_revenue?.toLocaleString()}</td>
            </tr>

            <tr className="font-bold bg-slate-50">
              <td className="py-3 text-sm">COST OF GOODS SOLD</td>
              <td></td>
            </tr>
            <tr>
              <td className="py-1.5 pl-6 text-sm">Inventory Cost (COGS)</td>
              <td className="text-right text-sm">({data?.cogs?.toLocaleString()})</td>
            </tr>
            <tr className="font-bold border-t border-black bg-slate-100">
              <td className="py-2 text-sm">GROSS PROFIT</td>
              <td className="text-right text-sm">PKR {data?.gross_profit?.toLocaleString()}</td>
            </tr>

            <tr className="font-bold bg-slate-50">
              <td className="py-3 text-sm">OPERATING EXPENSES</td>
              <td></td>
            </tr>
            <tr>
              <td className="py-1.5 pl-6 text-sm">Total Shop Expenses</td>
              <td className="text-right text-sm">({data?.expenses?.toLocaleString()})</td>
            </tr>
            
            <tr className="font-bold border-t-2 border-black bg-slate-200">
              <td className="py-3 text-lg">NET PROFIT / LOSS</td>
              <td className="text-right text-lg underline decoration-double">PKR {data?.net_profit?.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-12 flex justify-between px-10">
          <div className="border-t border-black pt-1 w-40 text-center">
            <p className="text-[10px] font-bold uppercase">Authorized Signature</p>
          </div>
          <div className="border-t border-black pt-1 w-40 text-center">
            <p className="text-[10px] font-bold uppercase">Accounts Department</p>
          </div>
        </div>

        <div className="mt-10 text-center text-[9px] text-slate-400">
          This is a computer-generated financial statement. All amounts are in PKR.
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body { height: auto !important; overflow: visible !important; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { 
            margin: 10mm;
            size: A4 portrait;
          }
        }
      `}} />
    </div>
  );
};

const StatCard = ({ title, amount, icon: Icon, color, subtitle, isHighlight }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10",
    rose: "text-rose-600 bg-rose-50 dark:bg-rose-500/10",
  };

  return (
    <div className={`card-premium p-6 relative overflow-hidden transition-all duration-500 hover:scale-[1.02] ${isHighlight ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</p>
          <p className={`text-2xl font-black text-slate-900 dark:text-white`}>
            PKR {amount?.toLocaleString(undefined, {minimumFractionDigits: 0})}
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-2xl ${colors[color] || colors.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 ${colors[color]?.split(' ')[1]}`}></div>
    </div>
  );
};

const BreakdownRow = ({ label, value, isNegative, isBold, color }) => (
  <div className="flex justify-between items-center group">
    <span className={`text-sm ${isBold ? 'font-black text-slate-900 dark:text-white uppercase tracking-tight' : 'font-bold text-slate-500 dark:text-slate-400'}`}>
      {label}
    </span>
    <span className={`text-sm font-black transition-transform group-hover:scale-110 ${isNegative ? 'text-rose-500' : (color || 'text-slate-900 dark:text-white')}`}>
      {isNegative ? '-' : ''}PKR {Math.abs(value || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
    </span>
  </div>
);

export default ProfitLoss;
