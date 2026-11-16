import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../api/reports';
import { categoriesApi } from '../../api/categories';
import { suppliersApi } from '../../api/suppliers';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatIDR, formatDate, formatNumber } from '../../utils/formatters';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'stock-in' | 'stock-out' | 'low-stock'
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, supRes] = await Promise.all([
          categoriesApi.getAll(),
          suppliersApi.getAll({ limit: 100 }),
        ]);
        if (catRes.data?.success) setCategories(catRes.data.data.map((c) => ({ value: c.id, label: c.name })));
        if (supRes.data?.success) setSuppliers(supRes.data.data.map((s) => ({ value: s.id, label: s.name })));
      } catch {
        // Ignore
      }
    }
    loadMeta();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      let res;
      if (activeTab === 'inventory') {
        res = await reportsApi.getInventory({
          q: search || undefined,
          category_id: selectedCategory || undefined,
        });
      } else if (activeTab === 'stock-in') {
        res = await reportsApi.getStockIn({
          q: search || undefined,
          category_id: selectedCategory || undefined,
          supplier_id: selectedSupplier || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
        });
      } else if (activeTab === 'stock-out') {
        res = await reportsApi.getStockOut({
          q: search || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
        });
      } else if (activeTab === 'low-stock') {
        res = await reportsApi.getLowStock({
          q: search || undefined,
          category_id: selectedCategory || undefined,
        });
      }

      if (res?.data?.success) {
        setReportData(res.data.data || []);
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, search, selectedCategory, selectedSupplier, fromDate, toDate]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const params = {};
      if (search) params.q = search;
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedSupplier) params.supplier_id = selectedSupplier;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      await reportsApi.downloadExport(activeTab, params);
    } catch {
      alert('Gagal mengunduh file CSV.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-page-title m-0 text-[#1A1A1F]">Laporan & Analitik Inventaris</h2>
          <p className="text-caption mt-0.5 mb-0">Rekapitulasi nilai aset persediaan, penerimaan, dan pengeluaran barang</p>
        </div>
        <Button
          variant="primary"
          onClick={handleExportCSV}
          loading={exporting}
          className="flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Ekspor CSV</span>
        </Button>
      </div>

      {/* Tabs Selection */}
      <div className="flex border-b border-[#E8E8EC] gap-6 text-[12px] font-medium">
        {[
          { key: 'inventory', label: 'Nilai Inventaris' },
          { key: 'stock-in', label: 'Rekap Barang Masuk' },
          { key: 'stock-out', label: 'Rekap Barang Keluar' },
          { key: 'low-stock', label: 'Peringatan Stok Kritis' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setSearch('');
            }}
            className={`pb-2.5 transition-colors cursor-pointer relative ${
              activeTab === tab.key
                ? 'text-[#5B3FD6] font-semibold border-b-2 border-[#5B3FD6] -mb-[1px]'
                : 'text-[#6B6B76] hover:text-[#1A1A1F]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white rounded-[10px] border border-[#E8E8EC] flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kata kunci..."
          className="w-full sm:w-60"
        />

        {(activeTab === 'inventory' || activeTab === 'stock-in' || activeTab === 'low-stock') && (
          <div className="w-full sm:w-44">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categories}
              placeholder="Semua Kategori"
            />
          </div>
        )}

        {activeTab === 'stock-in' && (
          <div className="w-full sm:w-48">
            <Select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              options={suppliers}
              placeholder="Semua Supplier"
            />
          </div>
        )}

        {(activeTab === 'stock-in' || activeTab === 'stock-out') && (
          <>
            <div className="w-full sm:w-36">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="Dari tanggal"
              />
            </div>
            <div className="w-full sm:w-36">
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="Sampai tanggal"
              />
            </div>
          </>
        )}
      </div>

      {/* Summary Highlight Card */}
      {summary && (
        <div className="p-4 bg-white rounded-[10px] border border-[#E8E8EC] flex flex-wrap gap-6 items-center">
          {summary.total_products !== undefined && (
            <div>
              <span className="text-[11px] text-[#6B6B76] block">Total Produk Terdata</span>
              <span className="text-kpi text-[#1A1A1F]">{formatNumber(summary.total_products)} Produk</span>
            </div>
          )}
          {summary.total_units !== undefined && (
            <div>
              <span className="text-[11px] text-[#6B6B76] block">Total Kuantitas Fisik</span>
              <span className="text-kpi text-[#1A1A1F]">{formatNumber(summary.total_units)} Unit</span>
            </div>
          )}
          {summary.total_valuation !== undefined && (
            <div>
              <span className="text-[11px] text-[#6B6B76] block">Total Valuasi Nilai Inventaris</span>
              <span className="text-kpi text-[#5B3FD6]">{formatIDR(summary.total_valuation)}</span>
            </div>
          )}
          {summary.total_amount !== undefined && (
            <div>
              <span className="text-[11px] text-[#6B6B76] block">Total Akumulasi Pembelian</span>
              <span className="text-kpi text-[#5B3FD6]">{formatIDR(summary.total_amount)}</span>
            </div>
          )}
          {summary.total_quantity !== undefined && activeTab === 'stock-out' && (
            <div>
              <span className="text-[11px] text-[#6B6B76] block">Total Unit Dikeluarkan</span>
              <span className="text-kpi text-red-600">-{formatNumber(summary.total_quantity)} Unit</span>
            </div>
          )}
        </div>
      )}

      {/* Report Table Display */}
      {loading ? (
        <Spinner message="Mengkalkulasi laporan..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReport} />
      ) : reportData.length === 0 ? (
        <EmptyState title="Laporan kosong" description="Tidak ada data yang memenuhi kriteria filter laporan saat ini." />
      ) : (
        <>
          {activeTab === 'inventory' && (
            <Table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>NAMA PRODUK</th>
                  <th>KATEGORI</th>
                  <th>STOK SAAT INI</th>
                  <th>MINIMUM</th>
                  <th>HARGA BELI</th>
                  <th>NILAI ASET INVENTARIS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-[11px] font-semibold text-[#5B3FD6]">{row.sku}</td>
                    <td className="font-medium text-[#1A1A1F]">{row.product_name}</td>
                    <td className="text-[#6B6B76]">{row.category_name}</td>
                    <td className="font-bold text-[#1A1A1F]">
                      {row.current_stock} <span className="font-normal text-[11px] text-[#6B6B76]">{row.unit}</span>
                    </td>
                    <td className="text-[#6B6B76]">{row.minimum_stock}</td>
                    <td className="text-[#6B6B76]">{formatIDR(row.purchase_price)}</td>
                    <td className="font-bold text-[#1A1A1F]">{formatIDR(row.inventory_value)}</td>
                    <td>
                      <StatusBadge status={row.stock_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {activeTab === 'stock-in' && (
            <Table>
              <thead>
                <tr>
                  <th>NO. TRANSAKSI</th>
                  <th>TANGGAL</th>
                  <th>SUPPLIER</th>
                  <th>SKU</th>
                  <th>PRODUK</th>
                  <th>KUANTITAS</th>
                  <th>HARGA BELI</th>
                  <th>SUBTOTAL</th>
                  <th>PETUGAS</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-[11px] font-semibold text-[#5B3FD6]">{row.transaction_number}</td>
                    <td className="text-[#6B6B76] text-[11px]">{formatDate(row.transaction_date)}</td>
                    <td className="text-[#1A1A1F] font-medium">{row.supplier_name || '-'}</td>
                    <td className="font-mono text-[11px] text-[#6B6B76]">{row.product_sku}</td>
                    <td className="font-medium text-[#1A1A1F]">{row.product_name}</td>
                    <td className="font-bold text-emerald-600">+{row.quantity} {row.unit}</td>
                    <td className="text-[#6B6B76]">{formatIDR(row.purchase_price)}</td>
                    <td className="font-bold text-[#1A1A1F]">{formatIDR(row.subtotal)}</td>
                    <td className="text-[#6B6B76] text-[11px]">{row.created_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {activeTab === 'stock-out' && (
            <Table>
              <thead>
                <tr>
                  <th>NO. TRANSAKSI</th>
                  <th>TANGGAL</th>
                  <th>TUJUAN</th>
                  <th>ALASAN</th>
                  <th>SKU</th>
                  <th>PRODUK</th>
                  <th>KUANTITAS</th>
                  <th>PETUGAS</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-[11px] font-semibold text-[#5B3FD6]">{row.transaction_number}</td>
                    <td className="text-[#6B6B76] text-[11px]">{formatDate(row.transaction_date)}</td>
                    <td className="font-medium text-[#1A1A1F]">{row.destination}</td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAFAFB] border border-[#E8E8EC] text-[#1A1A1F]">
                        {row.reason}
                      </span>
                    </td>
                    <td className="font-mono text-[11px] text-[#6B6B76]">{row.product_sku}</td>
                    <td className="font-medium text-[#1A1A1F]">{row.product_name}</td>
                    <td className="font-bold text-red-600">-{row.quantity} {row.unit}</td>
                    <td className="text-[#6B6B76] text-[11px]">{row.created_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {activeTab === 'low-stock' && (
            <Table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>NAMA PRODUK</th>
                  <th>KATEGORI</th>
                  <th>STOK FISIK</th>
                  <th>BATAS MINIMUM</th>
                  <th>DEFISIT KEKURANGAN</th>
                  <th>HARGA BELI</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-[11px] font-semibold text-[#5B3FD6]">{row.sku}</td>
                    <td className="font-medium text-[#1A1A1F]">{row.product_name}</td>
                    <td className="text-[#6B6B76]">{row.category_name}</td>
                    <td className="font-bold text-[#1A1A1F]">{row.current_stock} {row.unit}</td>
                    <td className="text-[#6B6B76]">{row.minimum_stock} {row.unit}</td>
                    <td className="font-bold text-red-600">-{row.deficit} {row.unit}</td>
                    <td className="text-[#6B6B76]">{formatIDR(row.purchase_price)}</td>
                    <td>
                      <StatusBadge status={row.stock_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
