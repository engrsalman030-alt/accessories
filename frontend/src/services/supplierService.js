import api from './api'

const supplierService = {
  getAll: (params = {}) =>
    api.get('/suppliers', { params }),

  getById: (id) =>
    api.get(`/suppliers/${id}`),

  getSummary: () =>
    api.get('/suppliers/summary'),

  create: (data) =>
    api.post('/suppliers', data),

  update: (id, data) =>
    api.put(`/suppliers/${id}`, data),

  delete: (id) =>
    api.delete(`/suppliers/${id}`),

  getLedger: (id, params = {}) =>
    api.get(`/suppliers/${id}/ledger`, { params }),

  recordPayment: (id, paymentData) =>
    api.post('/payments', {
      party_type: 'supplier',
      party_id: id,
      ...paymentData
    })
}

export default supplierService