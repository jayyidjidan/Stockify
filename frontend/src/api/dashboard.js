import api from './axios';

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getStockChart: (params) => api.get('/dashboard/stock-chart', { params }),
  getCategoryDistribution: () => api.get('/dashboard/category-distribution'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
  getLowStock: () => api.get('/dashboard/low-stock'),
};
