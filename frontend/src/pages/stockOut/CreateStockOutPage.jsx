import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { stockOutApi } from '../../api/stockOut';
import { productsApi } from '../../api/products';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { STOCK_OUT_REASONS } from '../../utils/constants';

export function CreateStockOutPage() {
  const navigate = useNavigate();

  const [productsList, setProductsList] = useState([]);
  const [destination, setDestination] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('Customer Delivery');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState([
    { product_id: '', sku: '', unit: '', available_stock: 0, quantity: 1 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await productsApi.getAll({ status: 'active', limit: 200 });
        if (res.data?.success) {
          setProductsList(res.data.data);
        }
      } catch {
        setError('Gagal memuat katalog produk aktif.');
      }
    }
    loadProducts();
  }, []);

  const handleProductSelect = (index, prodId) => {
    const selected = productsList.find((p) => p.id === prodId);
    setItems((prev) => {
      const next = [...prev];
      if (selected) {
        next[index] = {
          ...next[index],
          product_id: selected.id,
          sku: selected.sku,
          unit: selected.unit,
          available_stock: selected.current_stock,
          quantity: 1,
        };
      } else {
        next[index] = {
          ...next[index],
          product_id: '',
          sku: '',
          unit: '',
          available_stock: 0,
          quantity: 1,
        };
      }
      return next;
    });
  };

  const handleQuantityChange = (index, value) => {
    const qty = parseInt(value, 10) || 0;
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: qty };
      return next;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { product_id: '', sku: '', unit: '', available_stock: 0, quantity: 1 },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalQuantity = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!destination.trim()) {
      setError('Tujuan atau penerima barang wajib diisi.');
      return;
    }

    if (!transactionDate) {
      setError('Tanggal pengeluaran wajib diisi.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.product_id) {
        setError(`Baris #${i + 1}: Silakan pilih produk.`);
        return;
      }
      if (it.quantity <= 0) {
        setError(`Baris #${i + 1}: Kuantitas pengeluaran harus lebih dari 0.`);
        return;
      }
      if (it.quantity > it.available_stock) {
        setError(
          `Baris #${i + 1}: Kuantitas (${it.quantity}) melebihi stok gudang yang tersedia (${it.available_stock} ${it.unit}).`
        );
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        destination: destination.trim(),
        transaction_date: transactionDate,
        reason,
        notes: notes.trim(),
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: parseInt(it.quantity, 10),
        })),
      };

      const res = await stockOutApi.create(payload);
      if (res.data?.success) {
        navigate(`/stock-out/${res.data.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mencatat transaksi barang keluar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <Link to="/stock-out" className="text-[12px] text-[#5B3FD6] hover:underline block mb-1">
            &larr; Kembali ke Daftar Barang Keluar
          </Link>
          <h1 className="text-[18px] font-bold text-[#1A1A1F] m-0">Catat Pengeluaran Barang Keluar</h1>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[6px] text-[12px] text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Header Info */}
      <Card title="Informasi Tujuan & Alasan Pengeluaran">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Tujuan / Nama Penerima"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Contoh: Toko Cabang Surabaya / PT Mitra Sentosa"
            required
          />
          <Select
            label="Alasan Pengeluaran"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={STOCK_OUT_REASONS}
            required
          />
          <Input
            label="Tanggal Pengeluaran"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
          />
        </div>
        <div className="mt-3">
          <Textarea
            label="Catatan Pengeluaran / Referensi DO / Surat Jalan"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nomor dokumen pengiriman atau alasan pemakaian..."
            rows={2}
          />
        </div>
      </Card>

      {/* Items Section */}
      <Card
        title="Daftar Produk yang Dikeluarkan"
        subtitle="Pilih produk dan tentukan jumlah yang diambil dari stok gudang"
        action={
          <Button type="button" variant="secondary" size="sm" onClick={addItemRow}>
            + Tambah Baris
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E8EC] text-[#6B6B76] text-[11px] font-medium">
                <th className="py-2 pr-2">NO</th>
                <th className="py-2 px-2 min-w-[240px]">PRODUK</th>
                <th className="py-2 px-2 w-32">SKU</th>
                <th className="py-2 px-2 w-36">STOK TERSEDIA</th>
                <th className="py-2 px-2 w-32">KUANTITAS KELUAR</th>
                <th className="py-2 px-2 w-24">SATUAN</th>
                <th className="py-2 pl-2 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8EC]">
              {items.map((row, index) => {
                const isInsufficient = row.quantity > row.available_stock && row.product_id;

                return (
                  <tr key={index} className={`hover:bg-[#FAFAFB] ${isInsufficient ? 'bg-red-50/30' : ''}`}>
                    <td className="py-2.5 pr-2 font-medium text-[#6B6B76]">{index + 1}</td>
                    <td className="py-2.5 px-2">
                      <select
                        value={row.product_id}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        required
                        className="w-full h-8 px-2 text-[12px] bg-[#EFEFF2] border border-[#E8E8EC] rounded-[4px] focus:outline-none focus:border-[#5B3FD6]"
                      >
                        <option value="">Pilih Produk...</option>
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.current_stock <= 0}>
                            {p.name} ({p.sku}) — Stok: {p.current_stock} {p.unit}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[11px] text-[#6B6B76]">{row.sku || '-'}</td>
                    <td className="py-2.5 px-2">
                      <span className={`font-semibold ${row.available_stock === 0 ? 'text-red-600' : 'text-[#1A1A1F]'}`}>
                        {row.available_stock} {row.unit}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="1"
                        max={row.available_stock || 1}
                        value={row.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        required
                        className={`w-full h-8 px-2 text-[12px] rounded-[4px] border ${
                          isInsufficient
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'bg-[#EFEFF2] border-[#E8E8EC] focus:border-[#5B3FD6]'
                        } focus:outline-none`}
                      />
                      {isInsufficient && (
                        <span className="text-[10px] text-red-600 block mt-0.5">Stok kurang!</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-[#6B6B76]">{row.unit || '-'}</td>
                    <td className="py-2.5 pl-2 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          aria-label="Hapus baris"
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Submit */}
        <div className="mt-6 pt-4 border-t border-[#E8E8EC] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-[12px]">
            <div>
              <span className="text-[#9A9AA5] block">Total Jenis Produk</span>
              <span className="font-bold text-[#1A1A1F] text-[14px]">{items.length} Barang</span>
            </div>
            <div>
              <span className="text-[#9A9AA5] block">Total Kuantitas Keluar</span>
              <span className="font-bold text-red-600 text-[14px]">-{totalQuantity} Unit</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/stock-out">
              <Button type="button" variant="secondary" disabled={loading}>
                Batal
              </Button>
            </Link>
            <Button type="submit" variant="primary" loading={loading}>
              Simpan Transaksi
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
