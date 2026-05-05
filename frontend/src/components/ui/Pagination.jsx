import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Pagination = ({ 
  currentPage, 
  totalItems, 
  pageSize, 
  onPageChange,
  onPageSizeChange 
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1 && totalItems > 0) return null;
  if (totalItems === 0) return null;

  const startRange = (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-slate-100 rounded-b-[2rem]">
      {/* Info */}
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        Showing <span className="text-slate-900">{startRange}</span> to <span className="text-slate-900">{endRange}</span> of <span className="text-slate-900">{totalItems}</span> results
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-xl border border-slate-100 disabled:opacity-30 hover:bg-slate-50 transition-all active:scale-95"
        >
          <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-slate-400">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`min-w-[40px] h-10 rounded-xl text-sm font-black transition-all active:scale-95 ${
                    currentPage === page 
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-xl border border-slate-100 disabled:opacity-30 hover:bg-slate-50 transition-all active:scale-95"
        >
          <ChevronRightIcon className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Page Size Switcher (Optional) */}
      {onPageSizeChange && (
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400">Per page:</span>
          <select 
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-600 py-1 pl-2 pr-8 focus:ring-0 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;
