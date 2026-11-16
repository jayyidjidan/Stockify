import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { categoriesApi } from '../../api/categories';
import { useAuth } from '../../hooks/useAuth';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatIDR } from '../../utils/formatters';

export function ProductListPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState({ isOpen: false, product: null, newStatus: '' });

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      if (res.data?.success) {
        setCategories(res.data.data.map((c) => ({ value: c.id, label: c.name })));
      }
    } catch {
      // Ignore
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        q: search || undefined,
        category_id: selectedCategory || undefined,
        status: selectedStatus || undefined,
        stock_status: stockStatus || undefined,
      };
      const res = await productsApi.getAll(params);
      if (res.data?.success) {
        setProducts(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil daftar produk.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, selectedStatus, stockStatus]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setModalLoading(true);
      if (editingProduct) {
        await productsApi.update(editingProduct.id, formData);
      } else {
        await productsApi.create(formData);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan produk.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusConfirm.product) return;
    try {
      await productsApi.updateStatus(statusConfirm.product.id, statusConfirm.newStatus);
      setStatusConfirm({ isOpen: false, product: null, newStatus: '' });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status produk.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-page-title m-0 text-[#1A1A1F]">Katalog Produk</h2>
          <p className="text-caption mt-0.5 mb-0">Kelola master data produk, SKU, dan batas minimum stok</p>
        </div>
        {isAdmin() && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
          >
            + Tambah Produk
          </Button>
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
          placeholder="Cari SKU atau nama produk..."
          className="w-full sm:w-64"
        />

        <div className="w-full sm:w-44">
          <Select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            options={categories}
            placeholder="Semua Kategori"
          />
        </div>

        <div className="w-full sm:w-36">
          <Select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'active', label: 'Status: Aktif' },
              { value: 'inactive', label: 'Status: Nonaktif' },
            ]}
            placeholder="Semua Status"
          />
        </div>

        <div className="w-full sm:w-40">
          <Select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'low_stock', label: 'Stok Menipis' },
              { value: 'out_of_stock', label: 'Stok Habis' },
            ]}
            placeholder="Kondisi Stok"
          />
        </div>
      </div>

      {/* Table Data */}
      {loading ? (
        <Spinner message="Memuat daftar produk..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          title="Tidak ada produk ditemukan"
          description={search ? 'Tidak ada produk yang cocok dengan pencarian Anda.' : 'Belum ada produk yang terdaftar di sistem.'}
          actionText={isAdmin() ? '+ Tambah Produk Pertama' : undefined}
          onAction={isAdmin() ? () => setIsModalOpen(true) : undefined}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>NAMA PRODUK</th>
                <th>KATEGORI</th>
                <th>STOK</th>
                <th>MIN</th>
                <th>HARGA BELI</th>
                <th>HARGA JUAL</th>
                <th>STATUS</th>
                <th className="text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-[11px] font-semibold text-[#5B3FD6]">
                    <Link to={`/products/${p.id}`} className="hover:underline">
                      {p.sku}
                    </Link>
                  </td>
                  <td className="font-medium text-[#1A1A1F]">
                    <Link to={`/products/${p.id}`} className="hover:text-[#5B3FD6]">
                      {p.name}
                    </Link>
                  </td>
                  <td className="text-[#6B6B76]">{p.category_name}</td>
                  <td className="font-bold text-[#1A1A1F]">
                    {p.current_stock}{' '}
                    <span className="font-normal text-[11px] text-[#6B6B76]">{p.unit}</span>
                  </td>
                  <td className="text-[#6B6B76]">{p.minimum_stock}</td>
                  <td className="text-[#6B6B76]">{formatIDR(p.purchase_price)}</td>
                  <td className="font-medium text-[#1A1A1F]">{formatIDR(p.selling_price)}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <Link
                        to={`/products/${p.id}`}
                        className="px-2 py-1 text-[11px] text-[#5B3FD6] hover:bg-[#EDE9FE] rounded font-medium transition-colors"
                      >
                        Detail
                      </Link>
                      {isAdmin() && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setIsModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] text-[#6B6B76] hover:bg-[#EFEFF2] rounded font-medium transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setStatusConfirm({
                                isOpen: true,
                                product: p,
                                newStatus: p.status === 'active' ? 'inactive' : 'active',
                              })
                            }
                            className={`px-2 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                              p.status === 'active'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {p.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
        </div>
      )}

      {/* Add / Edit Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingProduct}
        loading={modalLoading}
      />

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        isOpen={statusConfirm.isOpen}
        onClose={() => setStatusConfirm({ isOpen: false, product: null, newStatus: '' })}
        onConfirm={handleToggleStatus}
        title={statusConfirm.newStatus === 'inactive' ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}
        message={`Apakah Anda yakin ingin mengubah status produk "${statusConfirm.product?.name}" (${statusConfirm.product?.sku}) menjadi ${statusConfirm.newStatus}?`}
        confirmText={statusConfirm.newStatus === 'inactive' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        confirmVariant={statusConfirm.newStatus === 'inactive' ? 'danger' : 'primary'}
      />
    </div>
  );
}
