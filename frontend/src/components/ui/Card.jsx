import React from 'react';

export function Card({ children, title, subtitle, action, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card__header">
          <div>
            {title && <h2 className="text-card-title m-0 text-[#1A1A1F]">{title}</h2>}
            {subtitle && <p className="text-caption mt-0.5 mb-0">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
