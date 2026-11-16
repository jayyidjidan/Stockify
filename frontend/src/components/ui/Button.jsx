import React from 'react';

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  'aria-label': ariaLabel,
  ...props
}) {
  const variantClass = {
    primary: 'btn--primary',
    secondary: 'btn--secondary',
    ghost: 'btn--ghost',
    link: 'btn--link',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  }[variant] || 'btn--primary';

  const sizeClass = {
    sm: 'btn--sm',
    md: 'btn--md',
    icon: 'btn--icon',
  }[size] || 'btn--md';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      className={`btn ${variantClass} ${sizeClass} min-h-[36px] sm:min-h-[32px] ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-1.5">
          <svg
            className="animate-spin h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Memproses...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
