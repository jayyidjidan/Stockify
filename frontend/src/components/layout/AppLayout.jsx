import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const titleMap = {
    '/dashboard': 'Dashboard Inventaris',
    '/products': 'Manajemen Produk',
    '/categories': 'Kategori Produk',
    '/suppliers': 'Daftar Supplier',
    '/stock-in': 'Transaksi Barang Masuk',
    '/stock-in/create': 'Catat Barang Masuk',
    '/stock-out': 'Transaksi Barang Keluar',
    '/stock-out/create': 'Catat Barang Keluar',
    '/stock-movements': 'Riwayat Pergerakan Stok',
    '/reports': 'Laporan Inventaris',
    '/users': 'Manajemen Pengguna',
    '/profile': 'Profil Pengguna',
    '/settings': 'Pengaturan Sistem',
  };

  const getPageTitle = (pathname) => {
    if (titleMap[pathname]) return titleMap[pathname];
    if (pathname.startsWith('/products/')) return 'Detail Produk';
    if (pathname.startsWith('/suppliers/')) return 'Detail Supplier';
    if (pathname.startsWith('/stock-in/')) return 'Detail Barang Masuk';
    if (pathname.startsWith('/stock-out/')) return 'Detail Barang Keluar';
    if (pathname.startsWith('/stock-movements/')) return 'Detail Pergerakan Stok';
    return 'Stockify';
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1A1A1F] flex">
      {/* Sidebar (fixed left) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container (offset 232px on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[232px]">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          pageTitle={currentTitle}
        />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
