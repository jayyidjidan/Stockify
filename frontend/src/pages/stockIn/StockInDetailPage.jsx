import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { stockInApi } from '../../api/stockIn';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatIDR, formatDate } from '../../utils/formatters';

export function StockInDetailPage() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await stockInApi.getById(id);
      if (res.data?.success) {
        setTransaction(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail transaksi barang masuk.');
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

  const totalAmount = transaction.items?.reduce((sum, item) => sum + Number(item.subtotal), 0) || 0;
  const totalQuantity = transaction.items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <Link to="/stock-in" className="text-[12px] text-[#5B3FD6] hover:underline block mb-1">
            &larr; Kembali ke Daftar Barang Masuk
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-bold text-[#1A1A1F] m-0 font-mono">
              {transaction.transaction_number}
            </h1>
            <StatusBadge status={transaction.status} />
          </div>
        </div>
      </div>

      {/* Header Info Card */}
      <Card title="Rincian Transaksi">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Supplier Pemasok</span>
            <span className="font-semibold text-[#1A1A1F]">{transaction.supplier_name || '-'}</span>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Tanggal Penerimaan</span>
            <span className="font-medium text-[#1A1A1F]">{formatDate(transaction.transaction_date)}</span>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Petugas Pencatat</span>
            <span className="font-medium text-[#1A1A1F]">{transaction.created_by_name}</span>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Total Nilai Pembelian</span>
            <span className="font-bold text-[#5B3FD6]">{formatIDR(totalAmount)}</span>
          </div>
        </div>
        {transaction.notes && (
          <div className="mt-4 pt-4 border-t border-[#E8E8EC] text-[12px]">
            <span className="text-[#9A9AA5] block mb-0.5">Catatan Faktur:</span>
            <p className="text-[#3A3A44] m-0">{transaction.notes}</p>
          </div>
        )}
      </Card>

      {/* Items Table */}
      <Card title="Daftar Barang Diterima" subtitle={`${transaction.items?.length || 0} jenis barang diterima dengan total ${totalQuantity} unit`}>
        <Table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>NAMA PRODUK</th>
              <th>KUANTITAS</th>
              <th>SATUAN</th>
              <th>HARGA BELI SATUAN</th>
              <th className="text-right">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items?.map((item) => (
              <tr key={item.id}>
                <td className="font-mono text-[11px] font-medium text-[#5B3FD6]">{item.sku}</td>
                <td className="font-medium text-[#1A1A1F]">{item.product_name}</td>
                <td className="font-bold text-[#1A1A1F]">{item.quantity}</td>
                <td className="text-[#6B6B76]">{item.unit}</td>
                <td className="text-[#6B6B76]">{formatIDR(item.unit_price)}</td>
                <td className="text-right font-semibold text-[#1A1A1F]">{formatIDR(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#FAFAFB] border-t-2 border-[#E8E8EC] font-bold text-[#1A1A1F]">
              <td colSpan="2" className="py-3 px-4">TOTAL</td>
              <td className="py-3 px-4">{totalQuantity} unit</td>
              <td colSpan="2"></td>
              <td className="py-3 px-4 text-right text-[#5B3FD6] text-[14px]">{formatIDR(totalAmount)}</td>
            </tr>
          </tfoot>
        </Table>
      </Card>
    </div>
  );
}
