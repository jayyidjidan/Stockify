import React from 'react';

export function Input({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  min,
  max,
  step,
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-caption font-medium text-[#1A1A1F]">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        step={step}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        className={`h-9 px-3 text-[12px] text-[#1A1A1F] bg-[#EFEFF2] border rounded-[6px] transition-colors
          ${error ? 'border-red-500 bg-red-50/30' : 'border-[#E8E8EC]'}
          focus:outline-none focus:border-[#5B3FD6] focus:ring-2 focus:ring-[#5B3FD6]/20
          disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="text-[11px] text-red-600 font-medium">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={`${inputId}-helper`} className="text-[11px] text-[#6B6B76]">
          {helperText}
        </span>
      )}
    </div>
  );
}
