import api from './api'

const saleService = {
  getAll: (params = {}) =>
    api.get('/sales', { params }),

  create: (data) =>
    api.post('/sales', data),
}

export default saleService
