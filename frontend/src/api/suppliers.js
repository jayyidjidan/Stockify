import api from './axios';

export const suppliersApi = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  updateStatus: (id, status) => api.patch(`/suppliers/${id}/status`, { status }),
};
