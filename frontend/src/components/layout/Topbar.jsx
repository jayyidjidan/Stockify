import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

export function Topbar({ onToggleSidebar, pageTitle }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-[#E8E8EC] px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Buka menu navigasi"
          className="p-1.5 -ml-1 text-[#6B6B76] hover:text-[#1A1A1F] hover:bg-[#EFEFF2] rounded-[6px] lg:hidden cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-page-title text-[#1A1A1F] m-0 font-semibold">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#6B6B76] bg-[#FAFAFB] px-2.5 py-1 rounded-[6px] border border-[#E8E8EC]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
          <span>WIB (Asia/Jakarta)</span>
        </div>

        <div className="flex items-center gap-2 border-l border-[#E8E8EC] pl-3">
          <Link
            to="/profile"
            className="text-[12px] font-medium text-[#1A1A1F] hover:text-[#5B3FD6] transition-colors"
          >
            {user?.full_name?.split(' ')[0] || 'Akun'}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-[11px] text-[#6B6B76] hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
            aria-label="Keluar dari sistem"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
