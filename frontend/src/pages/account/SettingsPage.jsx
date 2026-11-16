import React from 'react';
import { Card } from '../../components/ui/Card';

export function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-page-title m-0 text-[#1A1A1F]">Pengaturan Sistem</h2>
        <p className="text-caption mt-0.5 mb-0">Informasi konfigurasi aplikasi dan standar parameter operasional</p>
      </div>

      <Card title="Informasi Aplikasi">
        <div className="grid grid-cols-2 gap-4 text-[12px]">
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Nama Aplikasi</span>
            <span className="font-semibold text-[#1A1A1F]">Stockify</span>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Versi Rilis</span>
            <span className="font-mono text-[#5B3FD6]">v2.0-local</span>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Lingkungan Eksekusi</span>
            <span className="font-medium text-[#1A1A1F]">Local Windows Environment</span>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Mesin Database</span>
            <span className="font-medium text-[#1A1A1F]">PostgreSQL 18.x</span>
          </div>
        </div>
      </Card>

      <Card title="Preferensi Regional & Waktu">
        <div className="flex flex-col gap-4 text-[12px]">
          <div className="flex items-center justify-between py-2 border-b border-[#E8E8EC]">
            <div>
              <span className="font-semibold text-[#1A1A1F] block">Zona Waktu Default</span>
              <span className="text-[#6B6B76]">Semua transaksi dan riwayat mutasi stok dicatat dalam zona waktu ini</span>
            </div>
            <span className="font-mono bg-[#FAFAFB] px-2.5 py-1 rounded border border-[#E8E8EC] font-medium text-[#1A1A1F]">
              Asia/Jakarta (WIB, UTC+7)
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#E8E8EC]">
            <div>
              <span className="font-semibold text-[#1A1A1F] block">Mata Uang Standar</span>
              <span className="text-[#6B6B76]">Format kalkulasi dan pelaporan harga transaksi inventaris</span>
            </div>
            <span className="font-mono bg-[#FAFAFB] px-2.5 py-1 rounded border border-[#E8E8EC] font-medium text-[#1A1A1F]">
              IDR (Rupiah Indonesia)
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-semibold text-[#1A1A1F] block">Kebijakan Batas Minimum Stok</span>
              <span className="text-[#6B6B76]">Peringatan stok menipis dikonfigurasi mandiri untuk tiap produk</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Per-Product Policy
            </span>
          </div>
        </div>
      </Card>

      <Card title="Batasan Akses DevOps & Kontainerisasi">
        <div className="p-3.5 bg-[#EDE9FE]/50 rounded-[8px] border border-[#DDD6FB] text-[12px] text-[#3A2792] leading-relaxed">
          <p className="m-0 mb-1 font-semibold">Catatan Arsitektur:</p>
          <p className="m-0">
            Aplikasi dirancang modular dengan pemisahan penuh antara backend REST API dan frontend React SPA.
            Konfigurasi kontainerisasi (Docker, Docker Compose, Kubernetes, CI/CD) dikerjakan secara independen oleh
            pemilik proyek sesuai batasan spesifikasi.
          </p>
        </div>
      </Card>
    </div>
  );
}
