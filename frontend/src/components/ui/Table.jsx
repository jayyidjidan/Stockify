import React from 'react';

export function Table({ children, className = '' }) {
  return (
    <div className="w-full overflow-x-auto rounded-[10px] border border-[#E8E8EC] bg-white">
      <table className={`table w-full text-left border-collapse ${className}`}>{children}</table>
    </div>
  );
}
