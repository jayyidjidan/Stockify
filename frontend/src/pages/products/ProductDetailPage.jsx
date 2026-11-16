import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { formatIDR, formatDateTime, formatDate } from '../../utils/formatters';

export function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsApi.getById(id);
      if (res.data?.success) {
        setProduct(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail produk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) return <Spinner message="Mengambil informasi produk..." />;
  if (error) return <ErrorState message={error} onRetry={fetchDetail} />;
  if (!product) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/products" className="text-[12px] text-[#5B3FD6] hover:underline">
              &larr; Kembali ke Katalog
            </Link>
            <span className="text-[#9A9AA5]">•</span>
            <span className="font-mono text-[12px] text-[#6B6B76]">{product.sku}</span>
          </div>
          <h1 className="text-[18px] font-bold text-[#1A1A1F] m-0 mt-1">{product.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={product.status} />
          <StatusBadge status={product.stock_status} />
        </div>
      </div>

      {/* Product Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card title="Informasi Produk" className="md:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[12px]">
            <div>
              <span className="text-[#9A9AA5] block mb-0.5">Kategori</span>
              <span className="font-medium text-[#1A1A1F]">{product.category_name}</span>
            </div>
            <div>
              <span className="text-[#9A9AA5] block mb-0.5">Satuan Ukuran</span>
              <span className="font-medium text-[#1A1A1F]">{product.unit}</span>
            </div>
            <div>
              <span className="text-[#9A9AA5] block mb-0.5">Batas Minimum Stok</span>
              <span className="font-medium text-[#1A1A1F]">{product.minimum_stock} {product.unit}</span>
            </div>
            <div>
              <span className="text-[#9A9AA5] block mb-0.5">Harga Beli Terakhir</span>
              <span className="font-medium text-[#1A1A1F]">{formatIDR(product.purchase_price)}</span>
            </div>
            <div>
              <span className="text-[#9A9AA5] block mb-0.5">Harga Jual Satuan</span>
              <span className="font-medium text-[#1A1A1F]">{formatIDR(product.selling_price)}</span>
            </div>
            <div>
              <span className="text-[#9A9AA5] block mb-0.5">Margin Keuntungan</span>
              <span className="font-semibold text-emerald-600">
                {product.purchase_price > 0
                  ? `${Math.round(((product.selling_price - product.purchase_price) / product.purchase_price) * 100)}%`
                  : '-'}
              </span>
            </div>
          </div>
          {product.description && (
            <div className="mt-4 pt-4 border-t border-[#E8E8EC] text-[12px]">
              <span className="text-[#9A9AA5] block mb-1">Deskripsi</span>
              <p className="text-[#3A3A44] m-0 leading-relaxed">{product.description}</p>
            </div>
          )}
        </Card>

        {/* Current Stock KPI Card */}
        <div className="flex flex-col gap-4">
          <div className="p-5 bg-white rounded-[10px] border border-[#E8E8EC] shadow-[0_1px_2px_rgba(16,16,24,0.04)] text-center">
            <span className="text-caption text-[#6B6B76] font-medium block mb-1">Stok Fisik Saat Ini</span>
            <div className="text-[32px] font-bold text-[#1A1A1F] leading-tight">
              {product.current_stock}{' '}
              <span className="text-[14px] font-normal text-[#6B6B76]">{product.unit}</span>
            </div>
            <div className="mt-3 flex justify-center">
              <StatusBadge status={product.stock_status} />
            </div>
          </div>

          <div className="p-4 bg-[#EDE9FE]/40 rounded-[10px] border border-[#DDD6FB] text-[12px] text-[#4A31B8]">
            <span className="font-semibold block mb-1">Catatan Operasional Stok:</span>
            <span>
              Perubahan stok hanya dapat dilakukan melalui transaksi <strong>Barang Masuk</strong> atau{' '}
              <strong>Barang Keluar</strong> untuk menjaga integritas pembukuan.
            </span>
          </div>
        </div>
      </div>

      {/* Supplier Relationships */}
      <Card title="Pemasok Terkait" subtitle="Supplier yang pernah memasok produk ini">
        {product.suppliers?.length === 0 ? (
          <p className="text-[12px] text-[#6B6B76] m-0">Belum ada riwayat penerimaan dari supplier untuk produk ini.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>NAMA SUPPLIER</th>
                <th>KONTAK</th>
                <th>TELEPON</th>
                <th>EMAIL</th>
                <th>PASOKAN TERAKHIR</th>
              </tr>
            </thead>
            <tbody>
              {product.suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-[#1A1A1F]">{s.name}</td>
                  <td className="text-[#6B6B76]">{s.contact_person || '-'}</td>
                  <td className="text-[#6B6B76]">{s.phone || '-'}</td>
                  <td className="text-[#6B6B76]">{s.email || '-'}</td>
                  <td className="text-[#6B6B76]">{formatDate(s.last_supply_date)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Recent Movements History */}
      <Card title="Riwayat Mutasi Stok Terbaru" subtitle="Pencatatan pergerakan barang masuk dan keluar">
        {product.recent_movements?.length === 0 ? (
          <p className="text-[12px] text-[#6B6B76] m-0">Belum ada mutasi stok tercatat untuk produk ini.</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>WAKTU</th>
                <th>JENIS MUTASI</th>
                <th>NO. TRANSAKSI</th>
                <th>MASUK</th>
                <th>KELUAR</th>
                <th>STOK SEBELUM</th>
                <th>STOK SESUDAH</th>
                <th>PETUGAS</th>
              </tr>
            </thead>
            <tbody>
              {product.recent_movements.map((m) => (
                <tr key={m.id}>
                  <td className="text-[#6B6B76] text-[11px]">{formatDateTime(m.created_at)}</td>
                  <td>
                    <StatusBadge status={m.movement_type} />
                  </td>
                  <td className="font-mono text-[11px] font-semibold text-[#5B3FD6]">
                    {m.transaction_number}
                  </td>
                  <td className="font-medium text-emerald-600">
                    {m.quantity_in > 0 ? `+${m.quantity_in}` : '-'}
                  </td>
                  <td className="font-medium text-red-600">
                    {m.quantity_out > 0 ? `-${m.quantity_out}` : '-'}
                  </td>
                  <td className="text-[#6B6B76]">{m.previous_stock}</td>
                  <td className="font-bold text-[#1A1A1F]">{m.current_stock}</td>
                  <td className="text-[#6B6B76] text-[11px]">{m.created_by_name}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
