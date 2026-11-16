import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usersApi } from '../../api/users';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword) {
      if (!currentPassword) {
        setErrorMsg('Kata sandi saat ini wajib diisi jika ingin mengganti kata sandi.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('Kata sandi baru minimal 6 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi baru tidak sesuai.');
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        full_name: fullName.trim(),
        email: email.trim(),
      };
      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await usersApi.updateProfile(payload);
      if (res.data?.success) {
        updateUser(res.data.data);
        setSuccessMsg('Profil dan data akun Anda berhasil diperbarui.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-page-title m-0 text-[#1A1A1F]">Profil Saya</h2>
        <p className="text-caption mt-0.5 mb-0">Kelola informasi nama pengguna, alamat email, dan kata sandi login</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[6px] text-[12px] text-emerald-800 font-medium">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[6px] text-[12px] text-red-700 font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card title="Data Pribadi & Keamanan">
          <div className="flex flex-col gap-4">
            <Input
              label="Nama Lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Alamat Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="pt-4 border-t border-[#E8E8EC] space-y-3">
              <span className="text-[12px] font-semibold text-[#1A1A1F] block">Ganti Kata Sandi (Opsional)</span>

              <Input
                label="Kata Sandi Saat Ini"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi saat ini"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Kata Sandi Baru"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
                <Input
                  label="Ulangi Sandi Baru"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi sandi baru"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E8E8EC] flex justify-end">
              <Button type="submit" variant="primary" loading={loading}>
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
