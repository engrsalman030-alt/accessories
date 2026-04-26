import api from './api'

const purchaseService = {
  getAll: (params = {}) =>
    api.get('/purchases', { params }),

  create: (data) =>
    api.post('/purchases', data),
}

export default purchaseService
