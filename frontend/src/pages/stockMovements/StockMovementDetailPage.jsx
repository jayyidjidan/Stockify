import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { stockMovementsApi } from '../../api/stockMovements';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatDateTime, formatDate } from '../../utils/formatters';

export function StockMovementDetailPage() {
  const { id } = useParams();
  const [movement, setMovement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await stockMovementsApi.getById(id);
      if (res.data?.success) {
        setMovement(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail pergerakan stok.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) return <Spinner message="Mengambil audit trail..." />;
  if (error) return <ErrorState message={error} onRetry={fetchDetail} />;
  if (!movement) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link to="/stock-movements" className="text-[12px] text-[#5B3FD6] hover:underline block mb-1">
          &larr; Kembali ke Riwayat Mutasi
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-[18px] font-bold text-[#1A1A1F] m-0">Detail Pergerakan Stok</h1>
          <StatusBadge status={movement.movement_type} />
        </div>
      </div>

      {/* Movement Details Card */}
      <Card title="Rincian Audit Trail">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Waktu Eksekusi</span>
            <span className="font-medium text-[#1A1A1F]">{formatDateTime(movement.created_at)}</span>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Petugas Penanggung Jawab</span>
            <span className="font-semibold text-[#1A1A1F]">{movement.created_by_name}</span>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Nomor Referensi Transaksi</span>
            <Link
              to={
                movement.movement_type === 'stock_in'
                  ? `/stock-in/${movement.transaction_id}`
                  : `/stock-out/${movement.transaction_id}`
              }
              className="font-mono font-semibold text-[#5B3FD6] hover:underline block"
            >
              {movement.transaction_number}
            </Link>
          </div>
          <div>
            <span className="text-[#9A9AA5] block mb-0.5">Tanggal Dokumen Transaksi</span>
            <span className="font-medium text-[#1A1A1F]">{formatDate(movement.transaction_date)}</span>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-[#E8E8EC] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-[#FAFAFB] rounded-[6px] border border-[#E8E8EC]">
            <span className="text-[11px] text-[#6B6B76] block mb-1">Produk Terkait</span>
            <Link to={`/products/${movement.product_id}`} className="font-bold text-[#1A1A1F] hover:text-[#5B3FD6] block">
              {movement.product_name}
            </Link>
            <span className="font-mono text-[11px] text-[#6B6B76]">{movement.product_sku}</span>
          </div>

          <div className="p-3 bg-[#FAFAFB] rounded-[6px] border border-[#E8E8EC]">
            <span className="text-[11px] text-[#6B6B76] block mb-1">Perubahan Kuantitas</span>
            <div className="text-[18px] font-bold">
              {movement.movement_type === 'stock_in' ? (
                <span className="text-emerald-600">+{movement.quantity_in} {movement.product_unit}</span>
              ) : (
                <span className="text-red-600">-{movement.quantity_out} {movement.product_unit}</span>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#FAFAFB] rounded-[6px] border border-[#E8E8EC]">
            <span className="text-[11px] text-[#6B6B76] block mb-1">Kalkulasi Saldo Stok</span>
            <div className="text-[12px] font-medium text-[#1A1A1F]">
              Saldo Awal: <strong className="text-[#6B6B76]">{movement.previous_stock}</strong> &rarr; Saldo Akhir:{' '}
              <strong className="text-[#5B3FD6]">{movement.current_stock}</strong> {movement.product_unit}
            </div>
          </div>
        </div>

        {(movement.destination || movement.reason || movement.notes) && (
          <div className="mt-4 pt-4 border-t border-[#E8E8EC] text-[12px]">
            {movement.destination && (
              <p className="m-0 mb-1">
                <span className="text-[#9A9AA5] mr-2">Tujuan / Penerima:</span>
                <span className="font-medium text-[#1A1A1F]">{movement.destination}</span>
              </p>
            )}
            {movement.reason && (
              <p className="m-0 mb-1">
                <span className="text-[#9A9AA5] mr-2">Alasan Pengeluaran:</span>
                <span className="font-medium text-[#1A1A1F]">{movement.reason}</span>
              </p>
            )}
            {movement.notes && (
              <p className="m-0">
                <span className="text-[#9A9AA5] mr-2">Catatan:</span>
                <span className="text-[#3A3A44]">{movement.notes}</span>
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
