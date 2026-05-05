import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import customerService from '../../services/customerService';
import toast from 'react-hot-toast';

const AddEditCustomerModal = ({ isOpen, onClose, customer = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    business_name: customer?.business_name || '',
    type: customer?.type || 'retail',
    address: customer?.address || '',
    credit_limit: customer?.credit_limit || 0
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.type) newErrors.type = 'Type is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (customer) {
        await customerService.update(customer.id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customerService.create(formData);
        toast.success('Customer registered successfully');
      }
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to save customer');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Edit Customer' : 'Register New Customer'}
      size="md"
    >
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Customer Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            error={errors.name}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Customer Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-500"
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="distributor">Distributor</option>
              </select>
            </div>
          </div>
          <Input
            label="Business Name (Optional)"
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
          />
          <Input
            label="Mailing Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
          <Input
            label="Credit Limit ($)"
            name="credit_limit"
            type="number"
            value={formData.credit_limit}
            onChange={handleChange}
          />
        </div>
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" className="flex-1" loading={isSubmitting}>
            {customer ? 'Update' : 'Register'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditCustomerModal;
