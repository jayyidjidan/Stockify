import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { usersApi } from '../../api/users';

export function UserFormModal({ isOpen, onClose, onSubmit, initialData = null, loading = false }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role_id: '',
  });
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await usersApi.getRoles();
        if (res.data?.success) {
          setRoles(res.data.data.map((r) => ({ value: r.id, label: r.name })));
        }
      } catch {
        // Ignore
      }
    }

    if (isOpen) {
      loadRoles();
      if (initialData) {
        setFormData({
          full_name: initialData.full_name || '',
          email: initialData.email || '',
          password: '',
          confirm_password: '',
          role_id: initialData.role_id || '',
        });
      } else {
        setFormData({
          full_name: '',
          email: '',
          password: '',
          confirm_password: '',
          role_id: '',
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
    if (!formData.full_name.trim()) newErrors.full_name = 'Nama lengkap wajib diisi';
    if (!formData.email.trim()) {
      newErrors.email = 'Alamat email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    if (!formData.role_id) newErrors.role_id = 'Pilih hak akses (role) pengguna';

    if (!initialData) {
      if (!formData.password) {
        newErrors.password = 'Kata sandi wajib diisi';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Kata sandi minimal 6 karakter';
      }
      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Konfirmasi kata sandi tidak cocok';
      }
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
      title={initialData ? 'Perbarui Data Pengguna' : 'Tambah Pengguna Baru'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Input
          label="Nama Lengkap"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="Contoh: Ahmad Fauzan"
          error={errors.full_name}
          required
        />

        <Input
          label="Alamat Email (Login)"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="nama@stockify.com"
          error={errors.email}
          required
        />

        <Select
          label="Peran Pengguna (Role)"
          name="role_id"
          value={formData.role_id}
          onChange={handleChange}
          options={roles}
          placeholder="Pilih Role Pengguna..."
          error={errors.role_id}
          required
        />

        {!initialData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Kata Sandi Awal"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 6 karakter"
              error={errors.password}
              required
            />
            <Input
              label="Konfirmasi Sandi"
              name="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Ulangi sandi"
              error={errors.confirm_password}
              required
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E8EC] mt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {initialData ? 'Simpan Perubahan' : 'Tambah Pengguna'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
