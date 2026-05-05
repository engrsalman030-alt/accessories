import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import useSettingStore from '../store/settingStore';
import { 
  HomeIcon, 
  CubeIcon, 
  UsersIcon, 
  ShoppingCartIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  TruckIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  CalculatorIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Suppliers', href: '/suppliers', icon: TruckIcon },
  { name: 'Purchases', href: '/purchases', icon: ShoppingCartIcon },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Sales (POS)', href: '/sales', icon: CurrencyDollarIcon },
  { name: 'Sales History', href: '/sales-history', icon: ClipboardDocumentListIcon },
  { name: 'Expenses', href: '/expenses', icon: BanknotesIcon },
  { name: 'Profit & Loss', href: '/profit-loss', icon: CalculatorIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Returns', href: '/returns', icon: ArrowPathRoundedSquareIcon },
  { name: 'Scrap Inventory', href: '/scrap-inventory', icon: TrashIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const { settings, fetchSettings } = useSettingStore();

  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const shopNameWords = (settings?.shop_name || 'ShopManager').trim().split(' ');
  const firstWord = shopNameWords[0];
  const restWords = shopNameWords.slice(1).join(' ');

  return (
    <aside 
      className={`relative flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out ${isOpen ? 'w-64' : 'w-20'} h-full z-30 shadow-xl shadow-slate-200/50 dark:shadow-none`}
    >
      {/* Logo Area */}
      <div className="flex items-center h-16 px-5 border-b border-slate-100 dark:border-slate-800/50 overflow-hidden shrink-0">
        <div className="flex-shrink-0 w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-600/20 overflow-hidden">
          {settings?.logo_url ? (
            <img src={`http://localhost:8000${settings.logo_url}`} alt="Logo" className="w-full h-full object-cover bg-white" />
          ) : (
            <CubeIcon className="w-5 h-5 text-white" />
          )}
        </div>
        <div className={`ml-3 transition-all duration-500 overflow-hidden ${isOpen ? 'opacity-100 w-40' : 'opacity-0 w-0 translate-x-4'}`}>
          <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white block whitespace-nowrap truncate w-full" title={settings?.shop_name || 'ShopManager'}>
            {firstWord}{restWords ? <span className="text-primary-600"> {restWords}</span> : null}
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block -mt-1">
            Enterprise
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide">
        <div className={`mb-3 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          Main Menu
        </div>
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-xl transition-all duration-300 group relative ${
                    isActive 
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 shadow-sm shadow-primary-500/5' 
                      : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                    <span className={`ml-3 text-[13px] font-bold whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                      {item.name}
                    </span>
                    {isActive && (
                      <div className="absolute left-0 w-1 h-5 bg-primary-600 rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.4)] animate-in"></div>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Profile / Bottom Area */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 mt-auto">
        <div className={`flex items-center justify-between ${isOpen ? 'px-1' : 'justify-center'}`}>
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex-shrink-0 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center text-xs text-primary-600 dark:text-primary-400 font-black">
               AD
            </div>
            <div className={`ml-2.5 overflow-hidden transition-all duration-300 ${isOpen ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
              <p className="text-[12px] font-black text-slate-900 dark:text-white truncate">Admin User</p>
              <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate">Administrator</p>
            </div>
          </div>
          
          {isOpen && (
            <button 
              onClick={handleLogout}
              className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all group/logout"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 group-hover/logout:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
        
        {!isOpen && (
          <button 
            onClick={handleLogout}
            className="mt-4 w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all mx-auto"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
