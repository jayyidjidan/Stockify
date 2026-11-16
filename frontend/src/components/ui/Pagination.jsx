import React from 'react';
import { Button } from './Button';

export function Pagination({ pagination, onPageChange, className = '' }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-1 ${className}`}>
      <span className="text-[11px] text-[#6B6B76]">
        Menampilkan <span className="font-medium text-[#1A1A1F]">{startItem}</span> -{' '}
        <span className="font-medium text-[#1A1A1F]">{endItem}</span> dari{' '}
        <span className="font-medium text-[#1A1A1F]">{total}</span> data
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Halaman sebelumnya"
        >
          Sebelumnya
        </Button>
        <span className="text-[11px] font-medium text-[#1A1A1F] px-2">
          {page} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Halaman selanjutnya"
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  );
}
