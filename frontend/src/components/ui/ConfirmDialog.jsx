import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Delete", 
  cancelText = "Cancel",
  variant = "danger" 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="py-4">
        <div className="flex items-center gap-4 mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20">
          <div className="p-3 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-xl">
            <ExclamationTriangleIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {message}
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onClose} 
            variant="secondary" 
            className="flex-1 h-12 rounded-xl font-bold"
          >
            {cancelText}
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            variant={variant === 'danger' ? 'primary' : variant} 
            className={`flex-1 h-12 rounded-xl font-black uppercase tracking-wider ${variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
