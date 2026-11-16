import React, { useEffect, useRef } from 'react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg', className = '' }) {
  const modalRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus the modal container
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
        tabIndex={-1}
        className={`w-full ${maxWidth} bg-white rounded-[10px] shadow-xl border border-[#E8E8EC] overflow-hidden flex flex-col max-h-[90vh] ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8EC] bg-[#FAFAFB]">
          <h2 id="modal-headline" className="text-card-title m-0 text-[#1A1A1F]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1 text-[#6B6B76] hover:text-[#1A1A1F] hover:bg-gray-100 rounded-[4px] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
