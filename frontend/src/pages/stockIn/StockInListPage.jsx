import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { stockInApi } from '../../api/stockIn';
import { suppliersApi } from '../../api/suppliers';
import { useAuth } from '../../hooks/useAuth';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatIDR, formatDate } from '../../utils/formatters';

export function StockInListPage() {
  const { isAdmin, isStaff } = useAuth();
  const canCreate = isAdmin() || isStaff();

  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchSuppliers = async () => {
    try {
      const res = await suppliersApi.getAll({ limit: 100 });
      if (res.data?.success) {
        setSuppliers(res.data.data.map((s) => ({ value: s.id, label: s.name })));
      }
    } catch {
      // Ignore
    }
  };

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await stockInApi.getAll({
        page,
        limit: 10,
        q: search || undefined,
        supplier_id: selectedSupplier || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      if (res.data?.success) {
        setTransactions(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat riwayat transaksi barang masuk.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedSupplier, fromDate, toDate]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-page-title m-0 text-[#1A1A1F]">Transaksi Barang Masuk (Stock In)</h2>
          <p className="text-caption mt-0.5 mb-0">Catat penerimaan pasokan barang dari supplier ke dalam gudang</p>
        </div>
        {canCreate && (
          <Link to="/stock-in/create">
            <Button variant="primary">+ Catat Barang Masuk</Button>
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-white rounded-[10px] border border-[#E8E8EC] flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari nomor transaksi / supplier..."
          className="w-full sm:w-64"
        />

        <div className="w-full sm:w-48">
          <Select
            value={selectedSupplier}
            onChange={(e) => {
              setSelectedSupplier(e.target.value);
              setPage(1);
            }}
            options={suppliers}
            placeholder="Semua Supplier"
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
        <Spinner message="Memuat daftar barang masuk..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTransactions} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Tidak ada transaksi barang masuk"
          description={search ? 'Tidak ada transaksi yang cocok dengan filter Anda.' : 'Belum ada transaksi penerimaan barang.'}
          actionText={canCreate ? '+ Catat Transaksi Baru' : undefined}
          onAction={canCreate ? () => (window.location.href = '/stock-in/create') : undefined}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Table>
            <thead>
              <tr>
                <th>NO. TRANSAKSI</th>
                <th>TANGGAL</th>
                <th>SUPPLIER</th>
                <th>JENIS ITEM</th>
                <th>TOTAL KUANTITAS</th>
                <th>TOTAL NOMINAL</th>
                <th>PETUGAS</th>
                <th>STATUS</th>
                <th className="text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-[11px] font-semibold text-[#5B3FD6]">
                    <Link to={`/stock-in/${tx.id}`} className="hover:underline">
                      {tx.transaction_number}
                    </Link>
                  </td>
                  <td className="text-[#6B6B76] text-[11px]">{formatDate(tx.transaction_date)}</td>
                  <td className="font-medium text-[#1A1A1F]">{tx.supplier_name || '-'}</td>
                  <td>{tx.total_items} jenis</td>
                  <td className="font-bold text-[#1A1A1F]">{tx.total_quantity} unit</td>
                  <td className="font-medium text-[#1A1A1F]">{formatIDR(tx.total_amount)}</td>
                  <td className="text-[#6B6B76] text-[11px]">{tx.created_by_name}</td>
                  <td>
                    <StatusBadge status={tx.status} />
                  </td>
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

          <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
        </div>
      )}
    </div>
  );
}
