import api from './axios';

export const stockInApi = {
  getAll: (params) => api.get('/stock-in', { params }),
  getById: (id) => api.get(`/stock-in/${id}`),
  create: (data) => api.post('/stock-in', data),
};
