import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { stockInApi } from '../../api/stockIn';
import { suppliersApi } from '../../api/suppliers';
import { productsApi } from '../../api/products';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { formatIDR } from '../../utils/formatters';

export function CreateStockInPage() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState([
    { product_id: '', sku: '', unit: '', quantity: 1, unit_price: 0, subtotal: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInitial() {
      try {
        const [supRes, prodRes] = await Promise.all([
          suppliersApi.getAll({ status: 'active', limit: 100 }),
          productsApi.getAll({ status: 'active', limit: 200 }),
        ]);

        if (supRes.data?.success) {
          setSuppliers(supRes.data.data.map((s) => ({ value: s.id, label: s.name })));
        }
        if (prodRes.data?.success) {
          setProductsList(prodRes.data.data);
        }
      } catch {
        setError('Gagal memuat master supplier atau produk.');
      }
    }
    loadInitial();
  }, []);

  const handleProductSelect = (index, prodId) => {
    const selected = productsList.find((p) => p.id === prodId);
    setItems((prev) => {
      const next = [...prev];
      if (selected) {
        const pPrice = Number(selected.purchase_price) || 0;
        next[index] = {
          ...next[index],
          product_id: selected.id,
          sku: selected.sku,
          unit: selected.unit,
          unit_price: pPrice,
          subtotal: next[index].quantity * pPrice,
        };
      } else {
        next[index] = {
          ...next[index],
          product_id: '',
          sku: '',
          unit: '',
          unit_price: 0,
          subtotal: 0,
        };
      }
      return next;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], [field]: value };

      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? parseInt(value, 10) || 0 : current.quantity;
        const price = field === 'unit_price' ? parseFloat(value) || 0 : current.unit_price;
        current.subtotal = qty * price;
      }

      next[index] = current;
      return next;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { product_id: '', sku: '', unit: '', quantity: 1, unit_price: 0, subtotal: 0 },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalQuantity = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!supplierId) {
      setError('Silakan pilih supplier pemasok barang.');
      return;
    }

    if (!transactionDate) {
      setError('Silakan tentukan tanggal transaksi.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].product_id) {
        setError(`Baris #${i + 1}: Silakan pilih produk.`);
        return;
      }
      if (items[i].quantity <= 0) {
        setError(`Baris #${i + 1}: Kuantitas barang harus lebih dari 0.`);
        return;
      }
      if (items[i].unit_price < 0) {
        setError(`Baris #${i + 1}: Harga beli tidak boleh bernilai negatif.`);
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        supplier_id: supplierId,
        transaction_date: transactionDate,
        notes: notes.trim(),
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: parseInt(it.quantity, 10),
          unit_price: parseFloat(it.unit_price),
        })),
      };

      const res = await stockInApi.create(payload);
      if (res.data?.success) {
        navigate(`/stock-in/${res.data.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan transaksi barang masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <Link to="/stock-in" className="text-[12px] text-[#5B3FD6] hover:underline block mb-1">
            &larr; Kembali ke Daftar Barang Masuk
          </Link>
          <h1 className="text-[18px] font-bold text-[#1A1A1F] m-0">Catat Penerimaan Barang Masuk</h1>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[6px] text-[12px] text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Header Form */}
      <Card title="Informasi Faktur & Supplier">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Supplier Pemasok"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            options={suppliers}
            placeholder="Pilih Supplier..."
            required
          />
          <Input
            label="Tanggal Penerimaan"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
          />
        </div>
        <div className="mt-3">
          <Textarea
            label="Catatan Transaksi / No. Surat Jalan"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Keterangan tambahan atau nomor faktur dari supplier..."
            rows={2}
          />
        </div>
      </Card>

      {/* Items Table */}
      <Card
        title="Daftar Produk Masuk"
        subtitle="Masukkan produk, kuantitas penerimaan, dan harga beli"
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
                <th className="py-2 px-2 min-w-[200px]">PRODUK</th>
                <th className="py-2 px-2 w-28">SKU</th>
                <th className="py-2 px-2 w-28">KUANTITAS</th>
                <th className="py-2 px-2 w-20">SATUAN</th>
                <th className="py-2 px-2 min-w-[140px]">HARGA BELI (RP)</th>
                <th className="py-2 px-2 w-32 text-right">SUBTOTAL</th>
                <th className="py-2 pl-2 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8EC]">
              {items.map((row, index) => (
                <tr key={index} className="hover:bg-[#FAFAFB]">
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
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 px-2 font-mono text-[11px] text-[#6B6B76]">{row.sku || '-'}</td>
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                      className="w-full h-8 px-2 text-[12px] bg-[#EFEFF2] border border-[#E8E8EC] rounded-[4px] focus:outline-none focus:border-[#5B3FD6]"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-[#6B6B76]">{row.unit || '-'}</td>
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={row.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      required
                      className="w-full h-8 px-2 text-[12px] bg-[#EFEFF2] border border-[#E8E8EC] rounded-[4px] focus:outline-none focus:border-[#5B3FD6]"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-right font-medium text-[#1A1A1F]">
                    {formatIDR(row.subtotal)}
                  </td>
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
              ))}
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
              <span className="text-[#9A9AA5] block">Total Kuantitas Fisik</span>
              <span className="font-bold text-[#1A1A1F] text-[14px]">{totalQuantity} Unit</span>
            </div>
            <div>
              <span className="text-[#9A9AA5] block">Total Nilai Pembelian</span>
              <span className="font-bold text-[#5B3FD6] text-[16px]">{formatIDR(totalAmount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/stock-in">
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
