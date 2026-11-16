import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { KpiCard } from '../../components/ui/KpiCard';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatNumber, formatDateTime } from '../../utils/formatters';

export function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], stockIn: [], stockOut: [] });
  const [categoryDist, setCategoryDist] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [daysFilter, setDaysFilter] = useState('7');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, catRes, actRes, lowRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getCategoryDistribution(),
        dashboardApi.getRecentActivities(),
        dashboardApi.getLowStock(),
      ]);

      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (catRes.data?.success) setCategoryDist(catRes.data.data || []);
      if (actRes.data?.success) setRecentActivities(actRes.data.data || []);
      if (lowRes.data?.success) setLowStockProducts(lowRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat ringkasan dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChart = async (days) => {
    try {
      setChartLoading(true);
      const res = await dashboardApi.getStockChart({ days });
      if (res.data?.success) {
        setChartData(res.data.data || { labels: [], stockIn: [], stockOut: [] });
      }
    } catch {
      // Keep existing chart data
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchChart(daysFilter);
  }, [daysFilter]);

  if (loading) {
    return <Spinner message="Memuat informasi inventaris..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  const maxVal = Math.max(
    ...chartData.stockIn,
    ...chartData.stockOut,
    10
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Low Stock Alert Banner if there are items */}
      {Number(summary?.lowStock || 0) > 0 && (
        <div className="alert-banner" role="alert">
          <svg className="w-4 h-4 alert-banner__icon flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-[12px]">
            <span className="alert-banner__title mr-1">Peringatan Stok Menipis:</span>
            <span>Terdapat {summary.lowStock} produk yang berada di bawah batas minimum stok.</span>
          </div>
          <Link to="/reports" className="alert-banner__action text-[11px] font-semibold text-[#5B3FD6] hover:underline ml-auto">
            Lihat Laporan
          </Link>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Total Produk Aktif"
          value={formatNumber(summary?.totalProducts || 0)}
          helperText="Produk aktif dalam katalog"
        />
        <KpiCard
          title="Total Unit Fisik"
          value={formatNumber(summary?.totalStock || 0)}
          helperText="Unit barang tersedia"
        />
        <KpiCard
          title="Stok Menipis"
          value={formatNumber(summary?.lowStock || 0)}
          deltaType="warning"
          delta={summary?.lowStock > 0 ? "Perlu restok" : undefined}
          helperText="Stok <= minimum batas"
        />
        <KpiCard
          title="Stok Habis"
          value={formatNumber(summary?.outOfStock || 0)}
          deltaType="negative"
          delta={summary?.outOfStock > 0 ? "Kritis" : undefined}
          helperText="Unit berjumlah 0"
        />
      </div>

      {/* Analytics Row: Stock Movement & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (2 spans) */}
        <Card
          title="Tren Pergerakan Stok"
          subtitle={`Aktivitas ${daysFilter} hari terakhir`}
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-1 bg-[#EFEFF2] p-0.5 rounded-[6px]">
              {['7', '30', '90'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaysFilter(d)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded-[4px] transition-colors cursor-pointer ${
                    daysFilter === d ? 'bg-white text-[#1A1A1F] shadow-xs' : 'text-[#6B6B76] hover:text-[#1A1A1F]'
                  }`}
                >
                  {d} Hari
                </button>
              ))}
            </div>
          }
        >
          {chartLoading ? (
            <div className="h-56 flex items-center justify-center">
              <Spinner message="Memperbarui grafik..." />
            </div>
          ) : chartData.labels.length === 0 ? (
            <EmptyState description="Belum ada transaksi stok pada rentang tanggal ini." className="h-56 border-none shadow-none" />
          ) : (
            <div className="mt-4">
              <div className="flex items-center gap-4 mb-4 text-[11px] text-[#6B6B76]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#5B3FD6]" aria-hidden="true"></span>
                  <span>Barang Masuk (Stock In)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#E5484D]" aria-hidden="true"></span>
                  <span>Barang Keluar (Stock Out)</span>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-48 flex items-end gap-2 border-b border-[#E8E8EC] pb-2 pt-4 px-2">
                {chartData.labels.map((lbl, idx) => {
                  const inQty = chartData.stockIn[idx] || 0;
                  const outQty = chartData.stockOut[idx] || 0;
                  const inHeight = Math.max(4, Math.round((inQty / maxVal) * 160));
                  const outHeight = Math.max(4, Math.round((outQty / maxVal) * 160));

                  return (
                    <div key={lbl} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full flex justify-center items-end gap-1 h-40">
                        {/* Stock In Bar */}
                        <div
                          style={{ height: `${inHeight}px` }}
                          className="w-2 sm:w-3 bg-[#5B3FD6] rounded-t-sm transition-all hover:bg-[#4A31B8]"
                          title={`Masuk: ${inQty}`}
                        />
                        {/* Stock Out Bar */}
                        <div
                          style={{ height: `${outHeight}px` }}
                          className="w-2 sm:w-3 bg-[#E5484D] rounded-t-sm transition-all hover:bg-[#D92D3A]"
                          title={`Keluar: ${outQty}`}
                        />
                      </div>
                      <span className="text-[10px] text-[#9A9AA5] truncate w-full text-center">
                        {lbl.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Category Distribution */}
        <Card title="Distribusi Stok per Kategori" subtitle="Persentase jumlah unit">
          {categoryDist.length === 0 ? (
            <EmptyState description="Belum ada data kategori." className="h-56 border-none shadow-none" />
          ) : (
            <div className="flex flex-col gap-3.5 mt-2">
              {categoryDist.slice(0, 5).map((cat) => {
                const totalAll = summary?.totalStock || 1;
                const percentage = Math.min(100, Math.round((Number(cat.total_stock) / totalAll) * 100));

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <span className="font-medium text-[#1A1A1F] truncate">{cat.category}</span>
                      <span className="text-[#6B6B76]">{formatNumber(cat.total_stock)} unit ({percentage}%)</span>
                    </div>
                    <div className="progress">
                      <div
                        className="progress__fill bg-[#5B3FD6]"
                        style={{ width: `${percentage}%` }}
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Lower Row: Low Stock Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Table (2 spans) */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-card-title m-0 text-[#1A1A1F]">Produk Stok Kritis</h2>
            <Link to="/stock-in/create" className="text-[11px] font-semibold text-[#5B3FD6] hover:underline">
              + Catat Barang Masuk
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="p-8 bg-white rounded-[10px] border border-[#E8E8EC] text-center text-[#6B6B76] text-[12px]">
              Semua persediaan produk aman di atas batas minimum.
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>NAMA PRODUK</th>
                  <th>KATEGORI</th>
                  <th>STOK SAAT INI</th>
                  <th>MINIMUM</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.slice(0, 6).map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-[11px] font-medium text-[#5B3FD6]">{item.sku}</td>
                    <td className="font-medium text-[#1A1A1F]">{item.name}</td>
                    <td className="text-[#6B6B76]">{item.category}</td>
                    <td className="font-bold text-[#1A1A1F]">
                      {item.current_stock} <span className="font-normal text-[11px] text-[#6B6B76]">{item.unit}</span>
                    </td>
                    <td className="text-[#6B6B76]">{item.minimum_stock}</td>
                    <td>
                      <StatusBadge status={item.current_stock === 0 ? 'out_of_stock' : 'low_stock'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        {/* Recent Activities */}
        <div>
          <h2 className="text-card-title m-0 text-[#1A1A1F] mb-2">Aktivitas Terkini</h2>
          <div className="bg-white rounded-[10px] border border-[#E8E8EC] p-4 divide-y divide-[#E8E8EC]">
            {recentActivities.length === 0 ? (
              <p className="text-[12px] text-[#6B6B76] text-center py-4 m-0">Belum ada aktivitas tercatat.</p>
            ) : (
              recentActivities.slice(0, 6).map((act, i) => (
                <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      act.type === 'stock_in'
                        ? 'bg-emerald-500'
                        : act.type === 'stock_out'
                        ? 'bg-red-500'
                        : 'bg-[#5B3FD6]'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1A1A1F] m-0 leading-tight">
                      {act.description}
                    </p>
                    <p className="text-[11px] text-[#9A9AA5] m-0 mt-0.5">
                      {act.actor ? `${act.actor} • ` : ''}
                      {formatDateTime(act.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
