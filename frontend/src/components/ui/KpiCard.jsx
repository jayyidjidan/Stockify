import React from 'react';

export function KpiCard({ title, value, delta, deltaType = 'positive', helperText, className = '' }) {
  const deltaColor = {
    positive: 'text-positive',
    negative: 'text-negative',
    warning: 'text-amber-600',
    neutral: 'text-secondary',
  }[deltaType] || 'text-positive';

  return (
    <div className={`p-4 bg-white rounded-[10px] border border-[#E8E8EC] shadow-[0_1px_2px_rgba(16,16,24,0.04)] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-caption text-[#6B6B76] font-medium">{title}</span>
        {delta && <span className={`text-[11px] font-medium ${deltaColor}`}>{delta}</span>}
      </div>
      <div className="text-kpi text-[#1A1A1F]">{value}</div>
      {helperText && <p className="text-[11px] text-[#9A9AA5] mt-1 mb-0">{helperText}</p>}
    </div>
  );
}
