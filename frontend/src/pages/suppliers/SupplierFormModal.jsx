import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';

export function SupplierFormModal({ isOpen, onClose, onSubmit, initialData = null, loading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          contact_person: initialData.contact_person || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || '',
          description: initialData.description || '',
        });
      } else {
        setFormData({
          name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
          description: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama supplier wajib diisi';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Perbarui Data Supplier' : 'Tambah Supplier Baru'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Input
          label="Nama Perusahaan / Supplier"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Contoh: PT Sumber Pangan Makmur"
          error={errors.name}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Nama Kontak (PIC)"
            name="contact_person"
            value={formData.contact_person}
            onChange={handleChange}
            placeholder="Contoh: Budi Santoso"
          />
          <Input
            label="Nomor Telepon / WhatsApp"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Contoh: 08123456789"
          />
        </div>

        <Input
          label="Email Perusahaan"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="supplier@perusahaan.co.id"
          error={errors.email}
        />

        <Textarea
          label="Alamat Lengkap Kantor / Gudang"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Alamat fisik supplier..."
          rows={2}
        />

        <Textarea
          label="Keterangan / Catatan Tambahan"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Kategori pasokan utama atau syarat kerja sama..."
          rows={2}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E8EC] mt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {initialData ? 'Simpan Perubahan' : 'Tambah Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
