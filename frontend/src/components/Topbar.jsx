import React from 'react';
import { 
  Bars3Icon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon, 
  MagnifyingGlassIcon,
  BellIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Topbar({ toggleSidebar, isSidebarOpen }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-20 sticky top-0">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all active:scale-95"
        >
          <Bars3Icon className={`h-6 w-6 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative group">
          <MagnifyingGlassIcon className="absolute left-3.5 h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="pl-11 pr-4 py-2.5 w-64 lg:w-96 bg-slate-100/50 dark:bg-slate-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-sm focus:w-80 lg:focus:w-[450px] transition-all duration-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
        >
          <SunIcon className="h-6 w-6 dark:hidden" />
          <MoonIcon className="h-6 w-6 hidden dark:block" />
        </button>

        {/* Notifications */}
        <button 
          onClick={() => toast("You're all caught up! No new notifications.", { icon: '👏' })}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all relative"
        >
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
        </button>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block"></div>

        {/* User Profile / Logout */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-sm font-bold transition-all active:scale-95"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
