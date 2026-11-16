import api from './axios';

export const stockOutApi = {
  getAll: (params) => api.get('/stock-out', { params }),
  getById: (id) => api.get(`/stock-out/${id}`),
  create: (data) => api.post('/stock-out', data),
};
