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
      toast.success('Database restored successfully! Please refresh the page.', { id: toastId });
      setTimeout(() => window.location.reload(), 2000);
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
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Shop <span className="text-primary-600">Settings</span>
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
          Customize your shop details, manage backups, and control your data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Logo & Danger Zone */}
        <div className="lg:col-span-1 space-y-8">
          {/* Logo Section */}
          <div className="card-premium p-6 text-center space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <PhotoIcon className="w-5 h-5 text-primary-600" />
              Shop Logo
            </h3>
            <p className="text-xs text-slate-500">This logo will appear on your printed invoices and receipts.</p>
            
            <div 
              className="w-48 h-48 mx-auto rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer hover:border-primary-500 transition-colors"
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
                    <span className="text-white font-bold text-sm">Change Logo</span>
                  </div>
                </>
              ) : (
                <>
                  <PhotoIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
                  <span className="text-sm font-semibold text-slate-500">Upload Logo</span>
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
              className="w-full"
            >
              Select Image
            </Button>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5">
              <ExclamationTriangleIcon className="w-32 h-32 text-rose-500" />
            </div>
            
            <h3 className="text-lg font-bold text-rose-700 dark:text-rose-500 mb-2 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6" />
              Danger Zone
            </h3>
            <p className="text-sm text-rose-600/80 dark:text-rose-400/80 mb-6 font-medium">
              Permanently wipe all shop data. This will delete all products, customers, suppliers, purchases, and sales. Your shop settings will be preserved.
            </p>

            {!showResetConfirm ? (
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 px-4 bg-white dark:bg-slate-900 border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-500 font-bold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors flex items-center justify-center gap-2"
              >
                <TrashIcon className="w-5 h-5" />
                Factory Reset
              </button>
            ) : (
              <div className="space-y-3 animate-slide-up">
                <label className="text-xs font-bold text-rose-600 uppercase">Type DELETE to confirm</label>
                <input 
                  type="text" 
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white outline-none focus:border-rose-500 font-bold placeholder:font-normal placeholder:text-slate-300"
                  placeholder="DELETE"
                />
                <div className="flex gap-2">
                  <Button variant="danger" className="flex-1" onClick={handleFactoryReset}>Confirm</Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
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
          <div className="card-premium p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <ArchiveBoxArrowDownIcon className="w-6 h-6 text-primary-600" />
              Data Management
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Backup */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center mb-3">
                  <ArchiveBoxArrowDownIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Backup Database</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-10">
                  Download a complete copy of your database to secure your records.
                </p>
                <Button variant="primary" className="w-full text-sm py-2" onClick={handleBackup} loading={loading}>
                  Generate Backup
                </Button>
              </div>

              {/* Restore */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <ArrowUpTrayIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Restore Database</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-10">
                  Upload a previously generated backup file to restore your system.
                </p>
                <input 
                  type="file" 
                  ref={restoreInputRef} 
                  className="hidden" 
                  accept=".dump"
                  onChange={handleRestore}
                />
                <button 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                  onClick={() => restoreInputRef.current?.click()}
                  disabled={loading}
                >
                  Select Backup File
                </button>
              </div>
            </div>
          </div>

          {/* General Details Form */}
          <div className="card-premium p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <BuildingStorefrontIcon className="w-6 h-6 text-primary-600" />
              General Details
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Shop Name</label>
                <div className="relative">
                  <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="shop_name"
                    value={formData.shop_name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-primary-500 outline-none font-semibold transition-colors"
                    placeholder="E.g. SuperMart"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Physical Address</label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-primary-500 outline-none font-semibold transition-colors resize-none"
                    placeholder="123 Main Street, City"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Phone Number</label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-primary-500 outline-none font-semibold transition-colors"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-primary-500 outline-none font-semibold transition-colors"
                      placeholder="contact@shop.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Currency Symbol</label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-primary-500 outline-none font-semibold transition-colors"
                    placeholder="PKR, USD, EUR..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Default Printer Layout</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.printer_type === 'thermal' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'}`}>
                    <input 
                      type="radio" 
                      name="printer_type" 
                      value="thermal" 
                      checked={formData.printer_type === 'thermal'} 
                      onChange={handleChange}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Thermal (80mm)</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">Best for point-of-sale receipts and compact printing.</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.printer_type === 'standard' ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'}`}>
                    <input 
                      type="radio" 
                      name="printer_type" 
                      value="standard" 
                      checked={formData.printer_type === 'standard'} 
                      onChange={handleChange}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Standard (A4)</p>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">Professional invoices for long-term records and business accounts.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="px-8 py-3 font-bold flex items-center gap-2"
                  loading={loading}
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
