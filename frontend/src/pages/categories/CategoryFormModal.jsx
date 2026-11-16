import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';

export function CategoryFormModal({ isOpen, onClose, onSubmit, initialData = null, loading = false }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      setError('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama kategori wajib diisi');
      return;
    }
    onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Kategori' : 'Tambah Kategori Baru'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Input
          label="Nama Kategori"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          placeholder="Contoh: Elektronik, Pakaian, Bahan Pokok"
          error={error}
          required
        />

        <Textarea
          label="Deskripsi Kategori"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Penjelasan ringkas mengenai kelompok produk ini..."
          rows={3}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E8EC] mt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {initialData ? 'Simpan Perubahan' : 'Tambah Kategori'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
