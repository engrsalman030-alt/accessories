import api from './api'

const purchaseService = {
  getAll: (params = {}) =>
    api.get('/purchases', { params }),

  create: (data) =>
    api.post('/purchases', data),

  update: (id, data) =>
    api.put(`/purchases/${id}`, data),

  delete: (id) =>
    api.delete(`/purchases/${id}`),
}

export default purchaseService
