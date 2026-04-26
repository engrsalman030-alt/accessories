import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import supplierService from '../../services/supplierService';

const AddEditSupplierModal = ({ isOpen, onClose, supplier = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    phone: supplier?.phone || '',
    company: supplier?.company || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    notes: supplier?.notes || ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      email: formData.email.trim() === '' ? null : formData.email,
      phone: formData.phone.trim() === '' ? null : formData.phone,
      company: formData.company.trim() === '' ? null : formData.company,
      address: formData.address.trim() === '' ? null : formData.address,
      notes: formData.notes.trim() === '' ? null : formData.notes,
    };

    setIsSubmitting(true);
    try {
      if (supplier) {
        await supplierService.update(supplier.id, payload);
      } else {
        await supplierService.create(payload);
      }
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving supplier:', error);
      let errorMsg = 'Failed to save supplier';
      
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        errorMsg = detail.map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        errorMsg = detail;
      }
      
      setErrors({ submit: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'Update Supplier Profile' : 'Register New Supplier'}
      subtitle={supplier ? 'Modify the existing supplier records' : 'Enter the details of your new business partner'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="Supplier Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Global Tech Solutions"
            required
            error={errors.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 0300-1234567"
              type="tel"
            />
            <Input
              label="Company (Optional)"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. GT Solutions Ltd"
            />
          </div>

          <Input
            label="Email Address"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="support@globaltech.com"
            type="email"
            error={errors.email}
          />

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
              Mailing Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter the full physical address..."
              rows="3"
              className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl outline-none transition-all duration-300 placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
              Internal Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any specific instructions or remarks..."
              rows="2"
              className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-2xl outline-none transition-all duration-300 placeholder:text-slate-400"
            />
          </div>
        </div>

        {errors.submit && (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-bold animate-pulse">
            {errors.submit}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 order-2 sm:order-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Discard
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 order-1 sm:order-2"
            loading={isSubmitting}
          >
            {supplier ? 'Save Changes' : 'Register Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditSupplierModal;