import api from './axios';

export const usersApi = {
  getRoles: () => api.get('/users/roles'),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  resetPassword: (id, new_password) => api.patch(`/users/${id}/reset-password`, { new_password }),
  updateProfile: (data) => api.patch('/users/profile', data),
};
