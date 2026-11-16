import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

export function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role;

  const isAccessible = (allowedRoles) => {
    if (!allowedRoles) return true;
    return allowedRoles.includes(role);
  };

  const navSections = [
    {
      title: 'UTAMA',
      items: [
        {
          name: 'Dashboard',
          to: '/dashboard',
          roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.MANAGER],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'INVENTARIS',
      items: [
        {
          name: 'Produk',
          to: '/products',
          roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.MANAGER],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          name: 'Kategori',
          to: '/categories',
          roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.MANAGER],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          ),
        },
        {
          name: 'Supplier',
          to: '/suppliers',
          roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.MANAGER],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'OPERASIONAL STOK',
      items: [
        {
          name: 'Barang Masuk',
          to: '/stock-in',
          roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.MANAGER],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          ),
        },
        {
          name: 'Barang Keluar',
          to: '/stock-out',
          roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.MANAGER],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          ),
        },
        {
          name: 'Pergerakan Stok',
          to: '/stock-movements',
          roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.MANAGER],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'LAPORAN',
      items: [
        {
          name: 'Laporan Inventaris',
          to: '/reports',
          roles: [ROLES.ADMIN, ROLES.MANAGER],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'PENGATURAN',
      items: [
        {
          name: 'Manajemen Pengguna',
          to: '/users',
          roles: [ROLES.ADMIN],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          name: 'Profil Saya',
          to: '/profile',
          roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.MANAGER],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
        },
        {
          name: 'Pengaturan Sistem',
          to: '/settings',
          roles: [ROLES.ADMIN],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-[232px] bg-[#F5F5F7] border-r border-[#E8E8EC] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigasi Utama"
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-[#E8E8EC]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#5B3FD6] flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <div>
              <span className="font-bold text-[13px] text-[#1A1A1F] tracking-tight block">
                STOCKIFY
              </span>
              <span className="text-[10px] text-[#6B6B76] block leading-none">
                Inventory System
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu navigasi"
            className="ml-auto p-1 text-[#6B6B76] lg:hidden cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => isAccessible(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <div className="text-[10px] font-medium tracking-[0.04em] text-[#9A9AA5] px-2 mb-1">
                  {section.title}
                </div>
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2.5 h-8 px-2.5 rounded-[6px] text-[12px] font-medium transition-colors ${
                        isActive
                          ? 'text-[#1A1A1F] bg-white border border-[#E8E8EC] shadow-[0_1px_2px_rgba(16,16,24,0.04)] before:content-[""] before:absolute before:left-[-12px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#5B3FD6] before:rounded-[2px]'
                          : 'text-[#6B6B76] hover:bg-[#EFEFF2] hover:text-[#1A1A1F]'
                      }`
                    }
                  >
                    <span className="text-current flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User Badge Footer */}
        <div className="p-3 border-t border-[#E8E8EC] bg-white/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#EDE9FE] text-[#5B3FD6] flex items-center justify-center text-xs font-semibold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[#1A1A1F] truncate m-0">
                {user?.full_name || 'Pengguna'}
              </p>
              <p className="text-[10px] text-[#6B6B76] truncate m-0">{role || 'Staff'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
