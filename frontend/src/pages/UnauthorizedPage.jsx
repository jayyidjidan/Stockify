import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function UnauthorizedPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3 text-lg font-bold">
        403
      </div>
      <h1 className="text-[18px] font-bold text-[#1A1A1F] m-0 mb-1">Akses Terbatas</h1>
      <p className="text-[12px] text-[#6B6B76] max-w-sm m-0 mb-6">
        Peran (role) akun Anda tidak memiliki hak akses untuk membuka halaman ini.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">Kembali ke Dashboard</Button>
      </Link>
    </div>
  );
}
