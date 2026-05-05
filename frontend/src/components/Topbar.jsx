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
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-5 z-20 sticky top-0">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all active:scale-95"
        >
          <Bars3Icon className={`h-5 w-5 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative group">
          <MagnifyingGlassIcon className="absolute left-3.5 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Quick Search..." 
            className="pl-10 pr-4 py-2 w-56 lg:w-80 bg-slate-100/50 dark:bg-slate-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[13px] font-bold focus:w-72 lg:focus:w-[350px] transition-all duration-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
        >
          <SunIcon className="h-5 w-5 dark:hidden" />
          <MoonIcon className="h-5 w-5 hidden dark:block" />
        </button>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block"></div>
      </div>
    </header>
  );
}
