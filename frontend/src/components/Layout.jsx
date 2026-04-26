import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden print:h-auto print:bg-white print:overflow-visible">
      <div className="print:hidden">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden relative print:overflow-visible">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0 print:hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary-500/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-indigo-500/5 blur-[100px] rounded-full"></div>
        </div>

        <div className="print:hidden">
          <Topbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 z-10 scrollbar-hide flex flex-col print:p-0 print:overflow-visible print:block">
          <div className="max-w-[1600px] mx-auto w-full animate-fade-in flex-1 print:max-w-none print:m-0">
            <Outlet />
          </div>

          <footer className="mt-10 pt-6 text-center border-t border-slate-200/50 dark:border-slate-800/50 w-full max-w-[1600px] mx-auto shrink-0 print:hidden">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              &copy; {new Date().getFullYear()} ShopManager. All rights reserved.
            </p>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5">
              Developed by <span className="text-primary-600 dark:text-primary-500">Virtual Tech Solution</span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
