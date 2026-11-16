import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { stockOutApi } from '../../api/stockOut';
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
import { formatDate } from '../../utils/formatters';
import { STOCK_OUT_REASONS } from '../../utils/constants';

export function StockOutListPage() {
  const { isAdmin, isStaff } = useAuth();
  const canCreate = isAdmin() || isStaff();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await stockOutApi.getAll({
        page,
        limit: 10,
        q: search || undefined,
        reason: selectedReason || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      if (res.data?.success) {
        setTransactions(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat riwayat transaksi barang keluar.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedReason, fromDate, toDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-page-title m-0 text-[#1A1A1F]">Transaksi Barang Keluar (Stock Out)</h2>
          <p className="text-caption mt-0.5 mb-0">Catat pengeluaran barang dari gudang untuk distribusi, pemakaian, atau kerusakan</p>
        </div>
        {canCreate && (
          <Link to="/stock-out/create">
            <Button variant="primary">+ Catat Barang Keluar</Button>
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
          placeholder="Cari nomor transaksi / tujuan..."
          className="w-full sm:w-64"
        />

        <div className="w-full sm:w-48">
          <Select
            value={selectedReason}
            onChange={(e) => {
              setSelectedReason(e.target.value);
              setPage(1);
            }}
            options={STOCK_OUT_REASONS}
            placeholder="Semua Alasan Pengeluaran"
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
        <Spinner message="Memuat daftar barang keluar..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTransactions} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Tidak ada transaksi barang keluar"
          description={search ? 'Tidak ada transaksi yang cocok dengan filter Anda.' : 'Belum ada transaksi pengeluaran barang tercatat.'}
          actionText={canCreate ? '+ Catat Transaksi Baru' : undefined}
          onAction={canCreate ? () => (window.location.href = '/stock-out/create') : undefined}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Table>
            <thead>
              <tr>
                <th>NO. TRANSAKSI</th>
                <th>TANGGAL</th>
                <th>TUJUAN / PENERIMA</th>
                <th>ALASAN</th>
                <th>JENIS ITEM</th>
                <th>TOTAL KUANTITAS</th>
                <th>PETUGAS</th>
                <th>STATUS</th>
                <th className="text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-[11px] font-semibold text-[#5B3FD6]">
                    <Link to={`/stock-out/${tx.id}`} className="hover:underline">
                      {tx.transaction_number}
                    </Link>
                  </td>
                  <td className="text-[#6B6B76] text-[11px]">{formatDate(tx.transaction_date)}</td>
                  <td className="font-medium text-[#1A1A1F]">{tx.destination}</td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAFAFB] border border-[#E8E8EC] text-[#1A1A1F]">
                      {tx.reason}
                    </span>
                  </td>
                  <td>{tx.total_items} jenis</td>
                  <td className="font-bold text-red-600">-{tx.total_quantity} unit</td>
                  <td className="text-[#6B6B76] text-[11px]">{tx.created_by_name}</td>
                  <td>
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="text-right">
                    <Link
                      to={`/stock-out/${tx.id}`}
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
