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
  ArrowPathRoundedSquareIcon,
  CalculatorIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

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
  const { settings, fetchSettings } = useSettingStore();

  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  const shopNameWords = (settings?.shop_name || 'ShopManager').trim().split(' ');
  const firstWord = shopNameWords[0];
  const restWords = shopNameWords.slice(1).join(' ');

  return (
    <aside 
      className={`relative flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out ${isOpen ? 'w-72' : 'w-20'} h-full z-30 shadow-xl shadow-slate-200/50 dark:shadow-none`}
    >
      {/* Logo Area */}
      <div className="flex items-center h-20 px-6 border-b border-slate-100 dark:border-slate-800/50 overflow-hidden shrink-0">
        <div className="flex-shrink-0 w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20 overflow-hidden">
          {settings?.logo_url ? (
            <img src={`http://localhost:8000${settings.logo_url}`} alt="Logo" className="w-full h-full object-cover bg-white" />
          ) : (
            <CubeIcon className="w-6 h-6 text-white" />
          )}
        </div>
        <div className={`ml-4 transition-all duration-500 overflow-hidden ${isOpen ? 'opacity-100 w-48' : 'opacity-0 w-0 translate-x-4'}`}>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white block whitespace-nowrap truncate w-full" title={settings?.shop_name || 'ShopManager'}>
            {firstWord}{restWords ? <span className="text-primary-600"> {restWords}</span> : null}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block -mt-1">
            Enterprise
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 scrollbar-hide">
        <div className={`mb-4 px-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          Main Menu
        </div>
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                    isActive 
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 shadow-sm shadow-primary-500/5' 
                      : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`h-6 w-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                    <span className={`ml-4 font-semibold whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                      {item.name}
                    </span>
                    {isActive && (
                      <div className="absolute left-0 w-1.5 h-6 bg-primary-600 rounded-r-full shadow-[0_0_12px_rgba(37,99,235,0.4)] animate-in"></div>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Profile / Bottom Area */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
        <div className={`flex items-center ${isOpen ? 'px-2' : 'justify-center'}`}>
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0 border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
          </div>
          <div className={`ml-3 overflow-hidden transition-all duration-300 ${isOpen ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Admin User</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">admin@shop.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
