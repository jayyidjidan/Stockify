import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { suppliersApi } from '../../api/suppliers';
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
import { SupplierFormModal } from './SupplierFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export function SupplierListPage() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState({ isOpen: false, supplier: null, newStatus: '' });

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await suppliersApi.getAll({
        page,
        limit: 10,
        q: search || undefined,
        status: statusFilter || undefined,
      });
      if (res.data?.success) {
        setSuppliers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data supplier.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setModalLoading(true);
      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.id, formData);
      } else {
        await suppliersApi.create(formData);
      }
      setIsModalOpen(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data supplier.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusConfirm.supplier) return;
    try {
      await suppliersApi.updateStatus(statusConfirm.supplier.id, statusConfirm.newStatus);
      setStatusConfirm({ isOpen: false, supplier: null, newStatus: '' });
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status supplier.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-page-title m-0 text-[#1A1A1F]">Daftar Supplier</h2>
          <p className="text-caption mt-0.5 mb-0">Kelola informasi mitra pemasok barang inventaris</p>
        </div>
        {isAdmin() && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingSupplier(null);
              setIsModalOpen(true);
            }}
          >
            + Tambah Supplier
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="p-3 bg-white rounded-[10px] border border-[#E8E8EC] flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari nama, kontak, email..."
          className="w-full sm:w-72"
        />
        <div className="w-full sm:w-40">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'active', label: 'Status: Aktif' },
              { value: 'inactive', label: 'Status: Nonaktif' },
            ]}
            placeholder="Semua Status"
          />
        </div>
      </div>

      {/* Table Data */}
      {loading ? (
        <Spinner message="Memuat daftar supplier..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSuppliers} />
      ) : suppliers.length === 0 ? (
        <EmptyState
          title="Supplier tidak ditemukan"
          description={search ? 'Tidak ada supplier yang cocok dengan kata kunci.' : 'Belum ada data supplier terdaftar.'}
          actionText={isAdmin() ? '+ Tambah Supplier Pertama' : undefined}
          onAction={isAdmin() ? () => setIsModalOpen(true) : undefined}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Table>
            <thead>
              <tr>
                <th>NAMA SUPPLIER</th>
                <th>KONTAK PIC</th>
                <th>EMAIL</th>
                <th>TELEPON</th>
                <th>TOTAL TRANSAKSI</th>
                <th>STATUS</th>
                <th className="text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-[#1A1A1F]">
                    <Link to={`/suppliers/${s.id}`} className="hover:text-[#5B3FD6]">
                      {s.name}
                    </Link>
                  </td>
                  <td className="text-[#6B6B76]">{s.contact_person || '-'}</td>
                  <td className="text-[#6B6B76] text-[11px]">{s.email || '-'}</td>
                  <td className="text-[#6B6B76] text-[11px]">{s.phone || '-'}</td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAFAFB] border border-[#E8E8EC] text-[#1A1A1F]">
                      {s.total_transactions} pasokan
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <Link
                        to={`/suppliers/${s.id}`}
                        className="px-2 py-1 text-[11px] text-[#5B3FD6] hover:bg-[#EDE9FE] rounded font-medium transition-colors"
                      >
                        Detail
                      </Link>
                      {isAdmin() && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSupplier(s);
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
                                supplier: s,
                                newStatus: s.status === 'active' ? 'inactive' : 'active',
                              })
                            }
                            className={`px-2 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                              s.status === 'active'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {s.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
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

      {/* Form Modal */}
      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingSupplier}
        loading={modalLoading}
      />

      {/* Status Toggle Dialog */}
      <ConfirmDialog
        isOpen={statusConfirm.isOpen}
        onClose={() => setStatusConfirm({ isOpen: false, supplier: null, newStatus: '' })}
        onConfirm={handleToggleStatus}
        title={statusConfirm.newStatus === 'inactive' ? 'Nonaktifkan Supplier' : 'Aktifkan Supplier'}
        message={`Apakah Anda yakin ingin mengubah status supplier "${statusConfirm.supplier?.name}" menjadi ${statusConfirm.newStatus}? Supplier nonaktif tidak dapat dipilih dalam transaksi baru.`}
        confirmText={statusConfirm.newStatus === 'inactive' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        confirmVariant={statusConfirm.newStatus === 'inactive' ? 'danger' : 'primary'}
      />
    </div>
  );
}
