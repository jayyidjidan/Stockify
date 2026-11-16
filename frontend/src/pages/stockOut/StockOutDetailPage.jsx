import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { stockOutApi } from '../../api/stockOut';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDate } from '../../utils/formatters';

export function StockOutDetailPage() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await stockOutApi.getById(id);
      if (res.data?.success) {
        setTransaction(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail transaksi barang keluar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) return <Spinner message="Mengambil informasi transaksi..." />;
  if (error) return <ErrorState message={error} onRetry={fetchDetail} />;
  if (!transaction) return null;

  const totalQuantity = transaction.items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <Link to="/stock-out" className="text-[12px] text-[#5B3FD6] hover:underline block mb-1">
            &larr; Kembali ke Daftar Barang Keluar
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-bold text-[#1A1A1F] m-0 font-mono">
              {transaction.transaction_number}
            </h1>
            <StatusBadge status={transaction.status} />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card title="Rincian Pengeluaran Barang">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Tujuan / Penerima</span>
            <span className="font-semibold text-[#1A1A1F]">{transaction.destination}</span>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Alasan Pengeluaran</span>
            <span className="font-medium text-[#1A1A1F]">{transaction.reason}</span>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Tanggal Pengeluaran</span>
            <span className="font-medium text-[#1A1A1F]">{formatDate(transaction.transaction_date)}</span>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Petugas Pencatat</span>
            <span className="font-medium text-[#1A1A1F]">{transaction.created_by_name}</span>
          </div>
        </div>
        {transaction.notes && (
          <div className="mt-4 pt-4 border-t border-[#E8E8EC] text-[12px]">
            <span className="text-[#9A9AA5] block mb-0.5">Catatan / No. Referensi Dokumen:</span>
            <p className="text-[#3A3A44] m-0">{transaction.notes}</p>
          </div>
        )}
      </Card>

      {/* Items Table */}
      <Card title="Daftar Barang yang Dikeluarkan" subtitle={`${transaction.items?.length || 0} jenis produk dengan total kuantitas -${totalQuantity} unit`}>
        <Table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>NAMA PRODUK</th>
              <th>KUANTITAS KELUAR</th>
              <th>SATUAN</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items?.map((item) => (
              <tr key={item.id}>
                <td className="font-mono text-[11px] font-medium text-[#5B3FD6]">{item.sku}</td>
                <td className="font-medium text-[#1A1A1F]">{item.product_name}</td>
                <td className="font-bold text-red-600">-{item.quantity}</td>
                <td className="text-[#6B6B76]">{item.unit}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#FAFAFB] border-t-2 border-[#E8E8EC] font-bold text-[#1A1A1F]">
              <td colSpan="2" className="py-3 px-4">TOTAL UNIT KELUAR</td>
              <td className="py-3 px-4 text-red-600 text-[14px]">-{totalQuantity} unit</td>
              <td className="py-3 px-4"></td>
            </tr>
          </tfoot>
        </Table>
      </Card>
    </div>
  );
}
