import React from 'react';

const PrintFooter = ({ className = "" }) => {
  return (
    <div className={`mt-12 pt-6 text-center border-t-2 border-slate-200 dark:border-slate-800 w-full ${className}`}>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
        &copy; {new Date().getFullYear()} ShopManager. All rights reserved.
      </p>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5">
        Developed by <span className="text-primary-600 dark:text-primary-500">Virtual Tech Solution</span>
      </p>
    </div>
  );
};

export default PrintFooter;
