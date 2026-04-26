import React from 'react';

const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-fade-in">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title.split(' ').map((word, i) => (
            <span key={i} className={i === 1 ? 'text-primary-600' : ''}>
              {word}{' '}
            </span>
          ))}
        </h1>
        {subtitle && (
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.icon && <action.icon className="w-5 h-5" />}
          {action.label}
        </button>
      )}
    </div>
  );
};

export default PageHeader;