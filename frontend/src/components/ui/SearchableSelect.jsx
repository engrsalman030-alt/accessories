import React, { useState, useRef, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  ChevronUpDownIcon, 
  CheckIcon,
} from '@heroicons/react/24/outline';

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Search...", 
  label,
  onAddNew,
  displayKey = 'name',
  valueKey = 'id',
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const optionsArray = Array.isArray(options) ? options : (options?.items || []);

  const filteredOptions = optionsArray.filter(option => 
    String(option[displayKey]).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.sku && option.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (option.company && option.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedOption = optionsArray.find(opt => String(opt[valueKey]) === String(value));

  return (
    <div className="flex flex-col gap-1.5" ref={wrapperRef}>
      {label && (
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {label}
          </label>
          {onAddNew && (
            <button 
              type="button"
              onClick={onAddNew}
              className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors"
            >
              + Create New
            </button>
          )}
        </div>
      )}
      
      <div className="relative">
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-12 px-4 bg-white dark:bg-slate-800 border-2 rounded-xl cursor-pointer flex items-center justify-between transition-all duration-200 ${
            isOpen 
              ? 'border-primary-500 ring-4 ring-primary-500/10 shadow-sm' 
              : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
          } ${error ? 'border-rose-500' : ''}`}
        >
          <span className={`text-sm font-bold truncate ${selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption[displayKey] : placeholder}
          </span>
          <ChevronUpDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden animate-slide-up origin-top">
            {/* Search Input */}
            <div className="p-2 border-b border-slate-50 dark:border-slate-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  autoFocus
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500/20 transition-all dark:text-white"
                />
              </div>
            </div>
            
            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 scrollbar-hide">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div 
                    key={option[valueKey]}
                    onClick={() => {
                      onChange(option[valueKey]);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                      String(value) === String(option[valueKey])
                        ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-bold truncate dark:text-white">{option[displayKey]}</span>
                      {(option.sku || option.company) && (
                        <span className="text-[10px] text-slate-400 truncate">
                          {option.sku && `SKU: ${option.sku}`} {option.company && `• ${option.company}`}
                        </span>
                      )}
                    </div>
                    {String(value) === String(option[valueKey]) && <CheckIcon className="w-4 h-4 text-primary-600" />}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs font-bold text-slate-400">No results found</p>
                  {onAddNew && (
                    <button 
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onAddNew();
                      }}
                      className="mt-1 text-[10px] font-black uppercase text-primary-600 hover:underline"
                    >
                      Add new item
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-[10px] font-bold text-rose-500 ml-1">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
