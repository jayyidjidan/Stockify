import React from 'react';

export function Badge({ children, variant = 'neutral', className = '' }) {
  const variantClass = {
    success: 'badge--success',
    danger: 'badge--danger',
    warning: 'badge--warning',
    info: 'badge--info',
    neutral: 'badge--neutral',
  }[variant] || 'badge--neutral';

  return <span className={`badge ${variantClass} ${className}`}>{children}</span>;
}
