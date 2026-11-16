import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { suppliersApi } from '../../api/suppliers';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatIDR, formatDate } from '../../utils/formatters';

export function SupplierDetailPage() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await suppliersApi.getById(id);
      if (res.data?.success) {
        setSupplier(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail supplier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) return <Spinner message="Mengambil informasi supplier..." />;
  if (error) return <ErrorState message={error} onRetry={fetchDetail} />;
  if (!supplier) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <Link to="/suppliers" className="text-[12px] text-[#5B3FD6] hover:underline block mb-1">
            &larr; Kembali ke Daftar Supplier
          </Link>
          <h1 className="text-[18px] font-bold text-[#1A1A1F] m-0">{supplier.name}</h1>
        </div>
        <StatusBadge status={supplier.status} />
      </div>

      {/* Info & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Informasi Kontak & Perusahaan" className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
            <div>
              <span className="text-[#9A9AA5] block mb-0.5">Kontak Person (PIC)</span>
              <span className="font-medium text-[#1A1A1F]">{supplier.contact_person || '-'}</span>
            </div>
            <div>
              <span className="text-[#9A9AA5] block mb-0.5">Nomor Telepon</span>
              <span className="font-medium text-[#1A1A1F]">{supplier.phone || '-'}</span>
            </div>
            <div>
              <span className="text-[#9A9AA5] block mb-0.5">Alamat Email</span>
              <span className="font-medium text-[#1A1A1F]">{supplier.email || '-'}</span>
            </div>
            <div>
              <span className="text-[#9A9AA5] block mb-0.5">Terdaftar Sejak</span>
              <span className="font-medium text-[#1A1A1F]">{formatDate(supplier.created_at)}</span>
            </div>
          </div>
          {supplier.address && (
            <div className="mt-4 pt-4 border-t border-[#E8E8EC] text-[12px]">
              <span className="text-[#9A9AA5] block mb-0.5">Alamat Fisik</span>
              <p className="text-[#3A3A44] m-0">{supplier.address}</p>
            </div>
          )}
          {supplier.description && (
            <div className="mt-3 text-[12px]">
              <span className="text-[#9A9AA5] block mb-0.5">Catatan Kerjasama</span>
              <p className="text-[#3A3A44] m-0">{supplier.description}</p>
            </div>
          )}
        </Card>

        {/* Stats Column */}
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-white rounded-[10px] border border-[#E8E8EC] shadow-xs">
            <span className="text-caption text-[#6B6B76] font-medium block mb-1">Total Pasokan Barang Masuk</span>
            <div className="text-kpi text-[#1A1A1F]">{supplier.stats?.total_transactions || 0} Transaksi</div>
          </div>
          <div className="p-4 bg-white rounded-[10px] border border-[#E8E8EC] shadow-xs">
            <span className="text-caption text-[#6B6B76] font-medium block mb-1">Total Unit Diterima</span>
            <div className="text-kpi text-[#5B3FD6]">{supplier.stats?.total_quantity_received || 0} Unit</div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <Card title="Riwayat Pasokan Barang Masuk" subtitle="Daftar penerimaan barang dari supplier ini">
        {supplier.transactions?.length === 0 ? (
          <p className="text-[12px] text-[#6B6B76] m-0">Belum ada transaksi barang masuk dari supplier ini.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>NO. TRANSAKSI</th>
                <th>TANGGAL</th>
                <th>JUMLAH JENIS</th>
                <th>TOTAL KUANTITAS</th>
                <th>TOTAL NOMINAL</th>
                <th>DIBUAT OLEH</th>
                <th className="text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {supplier.transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-[11px] font-semibold text-[#5B3FD6]">
                    <Link to={`/stock-in/${tx.id}`} className="hover:underline">
                      {tx.transaction_number}
                    </Link>
                  </td>
                  <td className="text-[#6B6B76]">{formatDate(tx.transaction_date)}</td>
                  <td>{tx.total_items} barang</td>
                  <td className="font-bold text-[#1A1A1F]">{tx.total_quantity} unit</td>
                  <td className="font-medium text-[#1A1A1F]">{formatIDR(tx.total_amount)}</td>
                  <td className="text-[#6B6B76] text-[11px]">{tx.created_by_name}</td>
                  <td className="text-right">
                    <Link
                      to={`/stock-in/${tx.id}`}
                      className="px-2 py-1 text-[11px] text-[#5B3FD6] hover:bg-[#EDE9FE] rounded font-medium transition-colors"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
