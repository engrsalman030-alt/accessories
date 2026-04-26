import React from 'react';
import { CubeTransparentIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const EmptyState = ({ title, description, actionLabel, onAction, icon: Icon = CubeTransparentIcon }) => {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-slide-up">
      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-3">
        <Icon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{title}</h3>
      {description && (
        <p className="text-base font-medium text-slate-500 dark:text-slate-400 mb-10 max-w-sm leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="lg">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;