import React from 'react';

export function Select({
  id,
  name,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih opsi...',
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const selectId = id || name;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-caption font-medium text-[#1A1A1F]">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
        className={`h-9 px-3 text-[12px] text-[#1A1A1F] bg-[#EFEFF2] border rounded-[6px] transition-colors cursor-pointer
          ${error ? 'border-red-500 bg-red-50/30' : 'border-[#E8E8EC]'}
          focus:outline-none focus:border-[#5B3FD6] focus:ring-2 focus:ring-[#5B3FD6]/20
          disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error && (
        <span id={`${selectId}-error`} className="text-[11px] text-red-600 font-medium">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={`${selectId}-helper`} className="text-[11px] text-[#6B6B76]">
          {helperText}
        </span>
      )}
    </div>
  );
}
