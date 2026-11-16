import React, { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../../api/users';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { UserFormModal } from './UserFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate, formatDateTime } from '../../utils/formatters';

export function UserListPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Status toggle
  const [statusConfirm, setStatusConfirm] = useState({ isOpen: false, user: null, newStatus: '' });

  // Reset password modal
  const [resetModal, setResetModal] = useState({ isOpen: false, user: null, newPassword: '', loading: false });

  const fetchRoles = async () => {
    try {
      const res = await usersApi.getRoles();
      if (res.data?.success) {
        setRoles(res.data.data.map((r) => ({ value: r.id, label: r.name })));
      }
    } catch {
      // Ignore
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await usersApi.getAll({
        page,
        limit: 10,
        q: search || undefined,
        role_id: selectedRole || undefined,
        status: selectedStatus || undefined,
      });
      if (res.data?.success) {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data pengguna.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setModalLoading(true);
      if (editingUser) {
        await usersApi.update(editingUser.id, formData);
      } else {
        await usersApi.create(formData);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusConfirm.user) return;
    try {
      await usersApi.updateStatus(statusConfirm.user.id, statusConfirm.newStatus);
      setStatusConfirm({ isOpen: false, user: null, newStatus: '' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status pengguna.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModal.newPassword || resetModal.newPassword.length < 6) {
      alert('Kata sandi baru minimal 6 karakter.');
      return;
    }
    try {
      setResetModal((prev) => ({ ...prev, loading: true }));
      await usersApi.resetPassword(resetModal.user.id, resetModal.newPassword);
      alert('Kata sandi berhasil direset.');
      setResetModal({ isOpen: false, user: null, newPassword: '', loading: false });
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mereset kata sandi.');
      setResetModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-page-title m-0 text-[#1A1A1F]">Manajemen Akun Pengguna</h2>
          <p className="text-caption mt-0.5 mb-0">Kelola hak akses sistem untuk Admin, Warehouse Staff, dan Manager</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingUser(null);
            setIsModalOpen(true);
          }}
        >
          + Tambah Pengguna
        </Button>
      </div>

      {/* Toolbar */}
      <div className="p-3 bg-white rounded-[10px] border border-[#E8E8EC] flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari nama atau email..."
          className="w-full sm:w-64"
        />

        <div className="w-full sm:w-44">
          <Select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            options={roles}
            placeholder="Semua Hak Akses"
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
      </div>

      {/* Table Data */}
      {loading ? (
        <Spinner message="Memuat daftar pengguna..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState
          title="Pengguna tidak ditemukan"
          description={search ? 'Tidak ada akun pengguna yang sesuai dengan pencarian.' : 'Belum ada akun pengguna terdaftar.'}
          actionText="+ Tambah Pengguna Baru"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Table>
            <thead>
              <tr>
                <th>NAMA LENGKAP</th>
                <th>EMAIL</th>
                <th>HAK AKSES (ROLE)</th>
                <th>STATUS</th>
                <th>TERAKHIR MASUK</th>
                <th>TERDAFTAR</th>
                <th className="text-right">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold text-[#1A1A1F]">{u.full_name}</td>
                  <td className="text-[#6B6B76] text-[11px]">{u.email}</td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#EDE9FE] text-[#5B3FD6]">
                      {u.role_name}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="text-[#6B6B76] text-[11px]">{u.last_login_at ? formatDateTime(u.last_login_at) : 'Belum pernah'}</td>
                  <td className="text-[#6B6B76] text-[11px]">{formatDate(u.created_at)}</td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(u);
                          setIsModalOpen(true);
                        }}
                        className="px-2 py-1 text-[11px] text-[#5B3FD6] hover:bg-[#EDE9FE] rounded font-medium transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetModal({ isOpen: true, user: u, newPassword: '', loading: false })}
                        className="px-2 py-1 text-[11px] text-[#6B6B76] hover:bg-[#EFEFF2] rounded font-medium transition-colors cursor-pointer"
                      >
                        Reset Sandi
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStatusConfirm({
                            isOpen: true,
                            user: u,
                            newStatus: u.status === 'active' ? 'inactive' : 'active',
                          })
                        }
                        className={`px-2 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                          u.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {u.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
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
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingUser}
        loading={modalLoading}
      />

      {/* Reset Password Modal */}
      <Modal
        isOpen={resetModal.isOpen}
        onClose={() => setResetModal({ isOpen: false, user: null, newPassword: '', loading: false })}
        title={`Reset Kata Sandi: ${resetModal.user?.full_name}`}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
          <Input
            label="Kata Sandi Baru"
            type="password"
            value={resetModal.newPassword}
            onChange={(e) => setResetModal((prev) => ({ ...prev, newPassword: e.target.value }))}
            placeholder="Minimal 6 karakter"
            required
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E8EC] mt-2">
            <Button
              variant="secondary"
              onClick={() => setResetModal({ isOpen: false, user: null, newPassword: '', loading: false })}
              disabled={resetModal.loading}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={resetModal.loading}>
              Reset Kata Sandi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivation Confirm Dialog */}
      <ConfirmDialog
        isOpen={statusConfirm.isOpen}
        onClose={() => setStatusConfirm({ isOpen: false, user: null, newStatus: '' })}
        onConfirm={handleToggleStatus}
        title={statusConfirm.newStatus === 'inactive' ? 'Nonaktifkan Akun Pengguna' : 'Aktifkan Akun Pengguna'}
        message={`Apakah Anda yakin ingin mengubah status akun "${statusConfirm.user?.full_name}" (${statusConfirm.user?.email}) menjadi ${statusConfirm.newStatus}?`}
        confirmText={statusConfirm.newStatus === 'inactive' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        confirmVariant={statusConfirm.newStatus === 'inactive' ? 'danger' : 'primary'}
      />
    </div>
  );
}
