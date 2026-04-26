import React from 'react';

const Badge = ({ children, color = 'gray', className = '' }) => {
  const colorClasses = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400',
    blue: 'bg-primary-50 text-primary-700 ring-primary-600/20 dark:bg-primary-900/30 dark:text-primary-400',
    gray: 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-400'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-2xl text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${colorClasses[color]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;