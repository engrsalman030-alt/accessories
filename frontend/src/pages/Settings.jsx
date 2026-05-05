import React, { useEffect, useState, useRef } from 'react';
import useSettingStore from '../store/settingStore';
import { 
  BuildingStorefrontIcon, 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  CurrencyDollarIcon,
  PhotoIcon,
  CheckCircleIcon,
  ArchiveBoxArrowDownIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';

export default function Settings() {
  const { 
    settings, 
    loading, 
    fetchSettings, 
    updateSettings, 
    uploadLogo,
    downloadBackup,
    restoreBackup,
    factoryReset
  } = useSettingStore();
  
  const fileInputRef = useRef(null);
  const restoreInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    shop_name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'PKR',
    printer_type: 'thermal',
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData({
        shop_name: settings.shop_name || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        currency: settings.currency || 'PKR',
        printer_type: settings.printer_type || 'thermal',
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
      e.preventDefault();
      const form = e.currentTarget;
      const elements = Array.from(form.elements).filter(el => !el.disabled && el.type !== 'hidden');
      const index = elements.indexOf(e.target);
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await updateSettings(formData);
    if (success) {
      toast.success('Settings updated successfully!');
    } else {
      toast.error('Failed to update settings');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const toastId = toast.loading('Uploading logo...');
    const success = await uploadLogo(file);
    
    if (success) {
      toast.success('Logo uploaded successfully!', { id: toastId });
    } else {
      toast.error('Failed to upload logo', { id: toastId });
    }
  };

  const handleBackup = async () => {
    const toastId = toast.loading('Generating backup...');
    const success = await downloadBackup();
    if (success) {
      toast.success('Backup downloaded successfully', { id: toastId });
    } else {
      toast.error('Failed to generate backup', { id: toastId });
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite all current database records and cannot be undone.')) {
      e.target.value = '';
      return;
    }

    const toastId = toast.loading('Restoring database...');
    const success = await restoreBackup(file);
    
    if (success) {
      toast.success('Database restored successfully! Restarting app...', { id: toastId });
      setTimeout(() => {
        if (window.electron && window.electron.restartApp) {
          window.electron.restartApp();
        } else {
          window.location.reload();
        }
      }, 2000);
    } else {
      toast.error('Failed to restore database', { id: toastId });
    }
    e.target.value = '';
  };

  const handleFactoryReset = async () => {
    if (resetConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    const toastId = toast.loading('Deleting all data...');
    const success = await factoryReset();
    
    if (success) {
      toast.success('All data has been deleted.', { id: toastId });
      setShowResetConfirm(false);
      setResetConfirmText('');
    } else {
      toast.error('Failed to delete data', { id: toastId });
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Shop <span className="text-primary-600">Settings</span>
        </h1>
        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
          Customize shop details and manage data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Logo & Danger Zone */}
        <div className="lg:col-span-1 space-y-8">
          {/* Logo Section */}
          <div className="card-premium p-4 text-center space-y-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-center gap-2 uppercase tracking-widest">
              <PhotoIcon className="w-4 h-4 text-primary-600" />
              Shop Logo
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Appears on invoices</p>
            
            <div 
              className="w-32 h-32 mx-auto rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer hover:border-primary-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {settings?.logo_url ? (
                <>
                  <img 
                    src={`http://localhost:8000${settings.logo_url}?t=${new Date().getTime()}`} 
                    alt="Shop Logo" 
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-black text-[10px] uppercase">Change</span>
                  </div>
                </>
              ) : (
                <>
                  <PhotoIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
                  <span className="text-[10px] font-black text-slate-400 uppercase">Upload</span>
                </>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleLogoUpload}
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-8 text-[11px] font-black uppercase tracking-widest"
            >
              Select Image
            </Button>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-5">
              <ExclamationTriangleIcon className="w-20 h-20 text-rose-500" />
            </div>
            
            <h3 className="text-xs font-black text-rose-700 dark:text-rose-500 mb-2 flex items-center gap-2 uppercase tracking-widest">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mb-4 font-bold leading-tight">
              Permanently wipe all shop data. This will delete all transactions.
            </p>

            {!showResetConfirm ? (
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 px-4 bg-white dark:bg-slate-900 border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-500 text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors flex items-center justify-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Factory Reset
              </button>
            ) : (
              <div className="space-y-2 animate-slide-up">
                <label className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Type DELETE</label>
                <input 
                  type="text" 
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  className="w-full px-3 py-1.5 border-2 border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 rounded-lg text-xs font-black outline-none focus:border-rose-500 placeholder:font-bold placeholder:text-slate-300"
                  placeholder="DELETE"
                />
                <div className="flex gap-2">
                  <Button variant="danger" className="flex-1 h-8 text-[10px] font-black uppercase" onClick={handleFactoryReset}>Confirm</Button>
                  <Button variant="outline" className="flex-1 h-8 text-[10px] font-black uppercase" onClick={() => {
                    setShowResetConfirm(false);
                    setResetConfirmText('');
                  }}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Forms & Data Mgmt */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Data Management Section */}
          <div className="card-premium p-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-widest">
              <ArchiveBoxArrowDownIcon className="w-5 h-5 text-primary-600" />
              Data Management
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Backup */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg flex items-center justify-center mb-2">
                  <ArchiveBoxArrowDownIcon className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tighter">Backup Database</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 h-8 leading-tight font-bold">
                  Download a complete copy of your records.
                </p>
                <Button variant="primary" className="w-full h-8 text-[10px] font-black uppercase tracking-widest" onClick={handleBackup} loading={loading}>
                  Backup
                </Button>
              </div>

              {/* Restore */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg flex items-center justify-center mb-2">
                  <ArrowUpTrayIcon className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tighter">Restore Data</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 h-8 leading-tight font-bold">
                  Upload backup to restore your system.
                </p>
                <input 
                  type="file" 
                  ref={restoreInputRef} 
                  className="hidden" 
                  accept=".dump"
                  onChange={handleRestore}
                />
                <button 
                  className="w-full h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => restoreInputRef.current?.click()}
                  disabled={loading}
                >
                  Select File
                </button>
              </div>
            </div>
          </div>

          {/* General Details Form */}
          <div className="card-premium p-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-widest">
              <BuildingStorefrontIcon className="w-5 h-5 text-primary-600" />
              General Details
            </h3>

            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Shop Name</label>
                <div className="relative">
                  <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="shop_name"
                    value={formData.shop_name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:border-primary-500 outline-none font-bold transition-colors"
                    placeholder="Shop Name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Physical Address</label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:border-primary-500 outline-none font-bold transition-colors resize-none"
                    placeholder="Address"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Phone</label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:border-primary-500 outline-none font-bold transition-colors"
                      placeholder="Phone"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Email</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:border-primary-500 outline-none font-bold transition-colors"
                      placeholder="Email"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Currency</label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:border-primary-500 outline-none font-bold transition-colors"
                    placeholder="Currency (PKR, USD...)"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">Printer Layout</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${formData.printer_type === 'thermal' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'}`}>
                    <input 
                      type="radio" 
                      name="printer_type" 
                      value="thermal" 
                      checked={formData.printer_type === 'thermal'} 
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white leading-none">Thermal (80mm)</p>
                      <p className="text-[9px] text-slate-500 font-bold leading-tight mt-1 uppercase tracking-tighter">POS Receipts</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${formData.printer_type === 'standard' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'}`}>
                    <input 
                      type="radio" 
                      name="printer_type" 
                      value="standard" 
                      checked={formData.printer_type === 'standard'} 
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white leading-none">Standard (A4)</p>
                      <p className="text-[9px] text-slate-500 font-bold leading-tight mt-1 uppercase tracking-tighter">Business Invoices</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="h-10 px-6 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                  loading={loading}
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Save Settings
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
