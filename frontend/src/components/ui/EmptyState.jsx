import React from 'react';
import { Button } from './Button';

export function EmptyState({
  title = 'Belum ada data',
  description = 'Data tidak ditemukan untuk kriteria saat ini.',
  actionText,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 bg-white rounded-[10px] border border-[#E8E8EC] ${className}`}>
      <div className="w-10 h-10 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#5B3FD6] mb-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-[13px] font-semibold text-[#1A1A1F] m-0 mb-1">{title}</h3>
      <p className="text-[12px] text-[#6B6B76] max-w-sm m-0 mb-4">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
