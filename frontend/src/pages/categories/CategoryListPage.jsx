import React, { useState, useEffect } from 'react';
import { categoriesApi } from '../../api/categories';
import { useAuth } from '../../hooks/useAuth';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { CategoryFormModal } from './CategoryFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../utils/formatters';

export function CategoryListPage() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, category: null, loading: false });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await categoriesApi.getAll({ q: search || undefined });
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil data kategori.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search]);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setModalLoading(true);
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, formData);
      } else {
        await categoriesApi.create(formData);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan kategori.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.category) return;
    try {
      setDeleteConfirm((prev) => ({ ...prev, loading: true }));
      await categoriesApi.delete(deleteConfirm.category.id);
      setDeleteConfirm({ isOpen: false, category: null, loading: false });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus kategori.');
      setDeleteConfirm((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-page-title m-0 text-[#1A1A1F]">Kategori Produk</h2>
          <p className="text-caption mt-0.5 mb-0">Kelompokkan produk inventaris untuk memudahkan pelaporan dan navigasi</p>
        </div>
        {isAdmin() && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
          >
            + Tambah Kategori
          </Button>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="p-3 bg-white rounded-[10px] border border-[#E8E8EC] flex items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama kategori..."
          className="w-full sm:w-72"
        />
        <span className="text-[11px] text-[#6B6B76] hidden sm:block">
          Total: <strong className="text-[#1A1A1F]">{categories.length}</strong> kategori
        </span>
      </div>

      {/* Table Data */}
      {loading ? (
        <Spinner message="Memuat daftar kategori..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCategories} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="Kategori tidak ditemukan"
          description={search ? 'Tidak ada kategori yang cocok dengan pencarian Anda.' : 'Belum ada kategori yang dibuat.'}
          actionText={isAdmin() ? '+ Tambah Kategori Pertama' : undefined}
          onAction={isAdmin() ? () => setIsModalOpen(true) : undefined}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>NAMA KATEGORI</th>
              <th>DESKRIPSI</th>
              <th>JUMLAH PRODUK</th>
              <th>TANGGAL DIBUAT</th>
              {isAdmin() && <th className="text-right">AKSI</th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="font-semibold text-[#1A1A1F]">{cat.name}</td>
                <td className="text-[#6B6B76] max-w-xs truncate">{cat.description || '-'}</td>
                <td>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAFAFB] border border-[#E8E8EC] text-[#1A1A1F]">
                    {cat.total_products} produk
                  </span>
                </td>
                <td className="text-[#6B6B76] text-[11px]">{formatDate(cat.created_at)}</td>
                {isAdmin() && (
                  <td className="text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsModalOpen(true);
                        }}
                        className="px-2 py-1 text-[11px] text-[#5B3FD6] hover:bg-[#EDE9FE] rounded font-medium transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={cat.total_products > 0}
                        onClick={() => setDeleteConfirm({ isOpen: true, category: cat, loading: false })}
                        title={cat.total_products > 0 ? 'Kategori masih digunakan oleh produk' : 'Hapus kategori'}
                        className={`px-2 py-1 text-[11px] rounded font-medium transition-colors ${
                          cat.total_products > 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50 cursor-pointer'
                        }`}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Form Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingCategory}
        loading={modalLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, category: null, loading: false })}
        onConfirm={handleDelete}
        loading={deleteConfirm.loading}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteConfirm.category?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Permanen"
        confirmVariant="danger"
      />
    </div>
  );
}
