import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  confirmVariant = 'danger',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-[#3A3A44] leading-relaxed m-0">{message}</p>
        <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[#E8E8EC]">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
