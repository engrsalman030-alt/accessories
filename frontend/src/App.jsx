import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Layout from './components/Layout';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import SalesHistory from './pages/SalesHistory';
import Returns from './pages/Returns';
import ProfitLoss from './pages/ProfitLoss';
import ScrapInventory from './pages/ScrapInventory';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  CubeIcon, 
  ShoppingCartIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [summary, setSummary] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    import('./services/api').then(api => {
      api.default.get('/reports/summary').then(res => setSummary(res.data));
    });
  }, []);

  const stats = [
    { name: "Total Revenue", value: `PKR ${summary?.total_sales.toFixed(2) || '0.00'}`, icon: CurrencyDollarIcon, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", trend: "Live" },
    { name: "Total Stock Value", value: `PKR ${summary?.total_stock_value.toLocaleString() || '0.00'}`, icon: CubeIcon, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-500/10", trend: "Inventory" },
    { name: "Customer Dues", value: `PKR ${summary?.total_customer_balance.toFixed(2) || '0.00'}`, icon: ArrowTrendingUpIcon, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/10", trend: "Attention" },
    { name: "Low Stock Alert", value: `${summary?.low_stock_count || 0} items`, icon: ShoppingCartIcon, color: "text-primary-600", bg: "bg-primary-50 dark:bg-primary-500/10", trend: "Check" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            System <span className="text-primary-600">Overview</span>
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
            Welcome back! Here's what's happening with your shop today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           Live System Status
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={stat.name} className="card-premium p-8 group relative overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/20 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shadow-sm`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-6 relative z-10">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions Card */}
        <div className="card-premium p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Quick Operations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {[
               { name: 'New Sale (POS)', icon: ShoppingCartIcon, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-500/10', desc: 'Create a direct customer sale', path: '/sales' },
               { name: 'Receive Payment', icon: CurrencyDollarIcon, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', desc: 'Collect dues from customers', path: '/customers' },
               { name: 'Register Purchase', icon: ShoppingCartIcon, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', desc: 'Add stock from suppliers', path: '/purchases' },
               { name: 'Add Product', icon: CubeIcon, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10', desc: 'List new item in inventory', path: '/products' },
             ].map((action) => (
               <button 
                key={action.name} 
                onClick={() => navigate(action.path)}
                className="flex flex-col items-start p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border-2 border-transparent hover:border-primary-500/20 hover:shadow-xl hover:shadow-primary-500/5 transition-all group text-left"
               >
                  <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                     <action.icon className={`w-6 h-6 ${action.color}`} />
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{action.name}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{action.desc}</p>
               </button>
             ))}
          </div>
        </div>

        {/* Recent Activity / Pending Tasks */}
        <div className="card-premium p-8">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h3>
             <button onClick={() => navigate('/sales-history')} className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1">
               View All <ArrowRightIcon className="w-4 h-4" />
             </button>
           </div>
           <div className="space-y-6">
              {(summary?.activities || []).map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">
                    {item.user[0]}
                  </div>
                  <div className="flex-1 border-b border-slate-50 dark:border-slate-800/50 pb-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      <span className="text-slate-500 font-medium">{item.user}</span> {item.action}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      {(() => {
                        const date = new Date(item.time);
                        const now = new Date();
                        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
                        if (diffInMinutes < 1) return 'Just now';
                        if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
                        const diffInHours = Math.floor(diffInMinutes / 60);
                        if (diffInHours < 24) return `${diffInHours} hours ago`;
                        return date.toLocaleDateString();
                      })()}
                    </p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '1rem',
            background: '#1e293b',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: '600',
            padding: '1rem 1.5rem',
          },
        }} 
      />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales-history" element={<SalesHistory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="profit-loss" element={<ProfitLoss />} />
            <Route path="returns" element={<Returns />} />
            <Route path="scrap-inventory" element={<ScrapInventory />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
