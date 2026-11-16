import api from './axios';

export const reportsApi = {
  getInventory: (params) => api.get('/reports/inventory', { params }),
  getStockIn: (params) => api.get('/reports/stock-in', { params }),
  getStockOut: (params) => api.get('/reports/stock-out', { params }),
  getLowStock: (params) => api.get('/reports/low-stock', { params }),
  getExportUrl: (type, params = {}) => {
    const query = new URLSearchParams({ type, ...params }).toString();
    const base = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${base}/reports/export?${query}`;
  },
  downloadExport: async (type, params = {}) => {
    const response = await api.get('/reports/export', {
      params: { type, ...params },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  },
};
