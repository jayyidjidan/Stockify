import React from 'react';
import { Badge } from './Badge';

export function StatusBadge({ status, className = '' }) {
  const statusConfig = {
    active: { label: 'Aktif', variant: 'success' },
    inactive: { label: 'Nonaktif', variant: 'neutral' },
    low_stock: { label: 'Stok Rendah', variant: 'warning' },
    out_of_stock: { label: 'Stok Habis', variant: 'danger' },
    in_stock: { label: 'Stok Tersedia', variant: 'success' },
    completed: { label: 'Selesai', variant: 'success' },
    stock_in: { label: 'Stok Masuk', variant: 'info' },
    stock_out: { label: 'Stok Keluar', variant: 'danger' },
  };

  const normalized = String(status || '').toLowerCase();
  const config = statusConfig[normalized] || { label: status || '-', variant: 'neutral' };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
