import React from 'react';

export function SearchInput({ value, onChange, placeholder = 'Cari...', className = '', ...props }) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="absolute left-3 pointer-events-none text-[#9A9AA5]">
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full h-8 pl-8 pr-3 text-[12px] text-[#1A1A1F] bg-[#EFEFF2] border border-[#E8E8EC] rounded-[6px]
          placeholder:text-[#9A9AA5]
          focus:outline-none focus:border-[#5B3FD6] focus:ring-2 focus:ring-[#5B3FD6]/20 transition-colors"
        {...props}
      />
    </div>
  );
}
