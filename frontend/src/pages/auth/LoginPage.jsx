import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message || 'Email atau kata sandi tidak valid');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal masuk ke sistem. Periksa koneksi dan coba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#E8E8EC] shadow-[0_20px_50px_rgba(16,16,24,0.08)] p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded-[8px] bg-[#5B3FD6] flex items-center justify-center text-white font-bold text-lg mb-3">
            S
          </div>
          <h1 className="text-[18px] font-bold text-[#1A1A1F] m-0">Stockify</h1>
          <p className="text-[12px] text-[#6B6B76] mt-1 mb-0">Sistem Manajemen Inventaris Terpusat</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[6px] text-[12px] text-red-700 font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Alamat Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            required
            autoComplete="email"
          />

          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Kata Sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-8 text-[11px] text-[#6B6B76] hover:text-[#1A1A1F] cursor-pointer"
            >
              {showPassword ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>

          <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
            Masuk
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E8E8EC]">
          <p className="text-[11px] text-[#6B6B76] font-medium mb-2 text-center">Akun Demo Pengujian:</p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@stockify.com', 'admin123')}
              className="text-left text-[11px] p-2 rounded bg-[#FAFAFB] border border-[#E8E8EC] hover:bg-[#EDE9FE]/50 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-[#1A1A1F] block">Admin</span>
              <span className="text-[#6B6B76]">admin@stockify.com / admin123</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('staff@stockify.com', 'staff123')}
              className="text-left text-[11px] p-2 rounded bg-[#FAFAFB] border border-[#E8E8EC] hover:bg-[#EDE9FE]/50 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-[#1A1A1F] block">Warehouse Staff</span>
              <span className="text-[#6B6B76]">staff@stockify.com / staff123</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('manager@stockify.com', 'manager123')}
              className="text-left text-[11px] p-2 rounded bg-[#FAFAFB] border border-[#E8E8EC] hover:bg-[#EDE9FE]/50 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-[#1A1A1F] block">Manager</span>
              <span className="text-[#6B6B76]">manager@stockify.com / manager123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
