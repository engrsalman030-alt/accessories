import React from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, subtitle, children, size = 'md', zIndex = 9999 }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl'
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-hidden"
          style={{ zIndex }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800 flex flex-col max-h-[90vh]`}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800/50 flex-shrink-0">
                <div>
                  {title && <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{title}</h2>}
                  {subtitle && <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 sm:p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 h-6 text-slate-400" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-6 sm:p-8 overflow-y-auto scrollbar-hide flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;