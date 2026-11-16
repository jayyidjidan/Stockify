import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <div className="w-12 h-12 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#5B3FD6] mb-3 text-lg font-bold">
        404
      </div>
      <h1 className="text-[18px] font-bold text-[#1A1A1F] m-0 mb-1">Halaman Tidak Ditemukan</h1>
      <p className="text-[12px] text-[#6B6B76] max-w-sm m-0 mb-6">
        Alamat halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">Kembali ke Dashboard</Button>
      </Link>
    </div>
  );
}
