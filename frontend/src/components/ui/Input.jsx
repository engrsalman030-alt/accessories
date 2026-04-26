import React from 'react';

const Input = ({ label, error, required, className = '', ...props }) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative group">
        <input
          {...props}
          className={`w-full px-4 py-3 bg-white dark:bg-slate-900/50 border-2 ${
            error ? 'border-rose-500 focus:ring-rose-500/10' : 'border-slate-100 dark:border-slate-800 focus:border-primary-500 focus:ring-primary-500/10'
          } rounded-2xl focus:ring-4 outline-none transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 ${className}`}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs font-bold text-rose-500 ml-1 animate-in">{error}</p>
      )}
    </div>
  );
};

export default Input;