import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { stockMovementsApi } from '../../api/stockMovements';
import { productsApi } from '../../api/products';
import { Table } from '../../components/ui/Table';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../utils/formatters';

export function StockMovementListPage() {
  const [movements, setMovements] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [movementType, setMovementType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchProducts = async () => {
    try {
      const res = await productsApi.getAll({ limit: 200 });
      if (res.data?.success) {
        setProductsList(res.data.data.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` })));
      }
    } catch {
      // Ignore
    }
  };

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await stockMovementsApi.getAll({
        page,
        limit: 15,
        q: search || undefined,
        product_id: selectedProduct || undefined,
        movement_type: movementType || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      if (res.data?.success) {
        setMovements(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat catatan pergerakan stok.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedProduct, movementType, fromDate, toDate]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div>
        <h2 className="text-page-title m-0 text-[#1A1A1F]">Riwayat Pergerakan Stok (Audit Trail)</h2>
        <p className="text-caption mt-0.5 mb-0">Catatan kronologis mutasi kuantitas stok barang masuk dan keluar</p>
      </div>

      {/* Toolbar Filters */}
      <div className="p-3 bg-white rounded-[10px] border border-[#E8E8EC] flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari SKU, nama produk, no. transaksi..."
          className="w-full sm:w-64"
        />

        <div className="w-full sm:w-48">
          <Select
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              setPage(1);
            }}
            options={productsList}
            placeholder="Semua Produk"
          />
        </div>

        <div className="w-full sm:w-40">
          <Select
            value={movementType}
            onChange={(e) => {
              setMovementType(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'stock_in', label: 'Jenis: Barang Masuk' },
              { value: 'stock_out', label: 'Jenis: Barang Keluar' },
            ]}
            placeholder="Semua Jenis Mutasi"
          />
        </div>

        <div className="w-full sm:w-36">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            placeholder="Dari tanggal"
          />
        </div>

        <div className="w-full sm:w-36">
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            placeholder="Sampai tanggal"
          />
        </div>
      </div>

      {/* Table Data */}
      {loading ? (
        <Spinner message="Memuat mutasi stok..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchMovements} />
      ) : movements.length === 0 ? (
        <EmptyState
          title="Tidak ada pergerakan stok"
          description={search ? 'Tidak ada catatan mutasi yang cocok dengan kriteria pencarian.' : 'Belum ada transaksi mutasi stok tersimpan.'}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Table>
            <thead>
              <tr>
                <th>WAKTU</th>
                <th>JENIS</th>
                <th>NO. REFERENSI</th>
                <th>SKU</th>
                <th>PRODUK</th>
                <th>MASUK</th>
                <th>KELUAR</th>
                <th>SEBELUM</th>
                <th>SESUDAH</th>
                <th>PETUGAS</th>
                <th className="text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="text-[#6B6B76] text-[11px] whitespace-nowrap">
                    {formatDateTime(m.created_at)}
                  </td>
                  <td>
                    <StatusBadge status={m.movement_type} />
                  </td>
                  <td className="font-mono text-[11px] font-semibold text-[#5B3FD6]">
                    <Link
                      to={m.movement_type === 'stock_in' ? `/stock-in/${m.transaction_id}` : `/stock-out/${m.transaction_id}`}
                      className="hover:underline"
                    >
                      {m.transaction_number}
                    </Link>
                  </td>
                  <td className="font-mono text-[11px] text-[#6B6B76]">{m.product_sku}</td>
                  <td className="font-medium text-[#1A1A1F]">
                    <Link to={`/products/${m.product_id}`} className="hover:text-[#5B3FD6]">
                      {m.product_name}
                    </Link>
                  </td>
                  <td className="font-bold text-emerald-600">
                    {m.quantity_in > 0 ? `+${m.quantity_in}` : '-'}
                  </td>
                  <td className="font-bold text-red-600">
                    {m.quantity_out > 0 ? `-${m.quantity_out}` : '-'}
                  </td>
                  <td className="text-[#6B6B76]">{m.previous_stock}</td>
                  <td className="font-bold text-[#1A1A1F]">{m.current_stock}</td>
                  <td className="text-[#6B6B76] text-[11px]">{m.created_by_name}</td>
                  <td className="text-right">
                    <Link
                      to={`/stock-movements/${m.id}`}
                      className="px-2 py-1 text-[11px] text-[#5B3FD6] hover:bg-[#EDE9FE] rounded font-medium transition-colors"
                    >
                      Audit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
        </div>
      )}
    </div>
  );
}
