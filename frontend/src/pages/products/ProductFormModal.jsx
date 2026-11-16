import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { categoriesApi } from '../../api/categories';
import { PRODUCT_UNITS } from '../../utils/constants';

export function ProductFormModal({ isOpen, onClose, onSubmit, initialData = null, loading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    unit: 'pcs',
    purchase_price: '0',
    selling_price: '0',
    minimum_stock: '5',
    description: '',
    image_url: '',
  });
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await categoriesApi.getAll();
        if (res.data?.success) {
          setCategories(res.data.data.map((c) => ({ value: c.id, label: c.name })));
        }
      } catch {
        // Handle error silently
      }
    }
    if (isOpen) {
      fetchCats();
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          sku: initialData.sku || '',
          category_id: initialData.category_id || '',
          unit: initialData.unit || 'pcs',
          purchase_price: String(initialData.purchase_price || 0),
          selling_price: String(initialData.selling_price || 0),
          minimum_stock: String(initialData.minimum_stock || 0),
          description: initialData.description || '',
          image_url: initialData.image_url || '',
        });
      } else {
        setFormData({
          name: '',
          sku: '',
          category_id: '',
          unit: 'pcs',
          purchase_price: '0',
          selling_price: '0',
          minimum_stock: '5',
          description: '',
          image_url: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama produk wajib diisi';
    if (!formData.sku.trim()) newErrors.sku = 'SKU unik wajib diisi';
    if (!formData.category_id) newErrors.category_id = 'Pilih kategori produk';
    if (!formData.unit.trim()) newErrors.unit = 'Satuan wajib dipilih';
    if (Number(formData.purchase_price) < 0) newErrors.purchase_price = 'Harga beli tidak boleh negatif';
    if (Number(formData.selling_price) < 0) newErrors.selling_price = 'Harga jual tidak boleh negatif';
    if (Number(formData.minimum_stock) < 0) newErrors.minimum_stock = 'Batas minimum tidak boleh negatif';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      purchase_price: Number(formData.purchase_price),
      selling_price: Number(formData.selling_price),
      minimum_stock: parseInt(formData.minimum_stock, 10),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Perbarui Data Produk' : 'Tambah Produk Baru'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Nama Produk"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Contoh: Laptop ASUS VivoBook"
            error={errors.name}
            required
          />
          <Input
            label="SKU (Kode Unik)"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="Contoh: ELEC-001"
            error={errors.sku}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label="Kategori"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            options={categories}
            placeholder="Pilih Kategori..."
            error={errors.category_id}
            required
          />
          <Select
            label="Satuan (Unit)"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            options={PRODUCT_UNITS}
            placeholder="Pilih Satuan..."
            error={errors.unit}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Input
            label="Harga Beli (Rp)"
            name="purchase_price"
            type="number"
            min="0"
            step="1000"
            value={formData.purchase_price}
            onChange={handleChange}
            error={errors.purchase_price}
            required
          />
          <Input
            label="Harga Jual (Rp)"
            name="selling_price"
            type="number"
            min="0"
            step="1000"
            value={formData.selling_price}
            onChange={handleChange}
            error={errors.selling_price}
            required
          />
          <Input
            label="Batas Minimum Stok"
            name="minimum_stock"
            type="number"
            min="0"
            value={formData.minimum_stock}
            onChange={handleChange}
            error={errors.minimum_stock}
            helperText="Peringatan saat stok di bawah nilai ini"
            required
          />
        </div>

        <Textarea
          label="Deskripsi / Spesifikasi Produk"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Keterangan tambahan mengenai produk..."
          rows={2}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E8EC] mt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {initialData ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
