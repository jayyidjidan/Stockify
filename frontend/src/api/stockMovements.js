import api from './axios';

export const stockMovementsApi = {
  getAll: (params) => api.get('/stock-movements', { params }),
  getById: (id) => api.get(`/stock-movements/${id}`),
};
