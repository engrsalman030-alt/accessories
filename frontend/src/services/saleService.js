import api from './api'

const saleService = {
  getAll: (params = {}) =>
    api.get('/sales', { params }),

  create: (data) =>
    api.post('/sales', data),

  update: (id, data) =>
    api.put(`/sales/${id}`, data),

  delete: (id) =>
    api.delete(`/sales/${id}`),
}

export default saleService
