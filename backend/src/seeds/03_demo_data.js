const pool = require('../config/db');

async function seed() {
  const categories = [
    { name: 'Electronics', description: 'Electronic devices and components' },
    { name: 'Clothing', description: 'Apparel and fashion items' },
    { name: 'Food & Beverage', description: 'Food products and drinks' },
    { name: 'Tools', description: 'Hand tools and power tools' },
    { name: 'Office Supplies', description: 'Stationery and office equipment' },
  ];

  for (const cat of categories) {
    await pool.query(
      `INSERT INTO categories (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, updated_at = NOW()`,
      [cat.name, cat.description]
    );
  }

  const { rows: catRows } = await pool.query('SELECT id, name FROM categories');
  const catMap = Object.fromEntries(catRows.map(c => [c.name, c.id]));

  const suppliers = [
    {
      name: 'PT Maju Jaya',
      contact_person: 'Budi Santoso',
      email: 'budi@majujaya.co.id',
      phone: '021-5551234',
      address: 'Jl. Maju No. 1, Jakarta',
      description: 'Main electronics supplier',
      status: 'active',
    },
    {
      name: 'CV Berkah Sejahtera',
      contact_person: 'Siti Rahayu',
      email: 'siti@berkahsejahtera.co.id',
      phone: '021-5555678',
      address: 'Jl. Berkah No. 5, Bandung',
      description: 'Clothing and textile supplier',
      status: 'active',
    },
    {
      name: 'PT Global Trade',
      contact_person: 'Ahmad Fauzi',
      email: 'ahmad@globaltrade.co.id',
      phone: '021-5559999',
      address: 'Jl. Global No. 10, Surabaya',
      description: 'Multi-category trade supplier',
      status: 'active',
    },
  ];

  for (const sup of suppliers) {
    await pool.query(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [sup.name, sup.contact_person, sup.email, sup.phone, sup.address, sup.description, sup.status]
    );
  }

  const products = [
    { sku: 'ELEC-001', name: 'Laptop ASUS VivoBook', category: 'Electronics', unit: 'unit', purchase_price: 7000000, selling_price: 8500000, current_stock: 5, minimum_stock: 3 },
    { sku: 'ELEC-002', name: 'Monitor LG 24"', category: 'Electronics', unit: 'unit', purchase_price: 2000000, selling_price: 2500000, current_stock: 2, minimum_stock: 5 },
    { sku: 'CLOTH-001', name: 'Kaos Polos Putih L', category: 'Clothing', unit: 'pcs', purchase_price: 50000, selling_price: 85000, current_stock: 100, minimum_stock: 20 },
    { sku: 'CLOTH-002', name: 'Celana Chino Coklat 32', category: 'Clothing', unit: 'pcs', purchase_price: 120000, selling_price: 185000, current_stock: 1, minimum_stock: 10 },
    { sku: 'FNB-001', name: 'Air Mineral Aqua 600ml', category: 'Food & Beverage', unit: 'karton', purchase_price: 55000, selling_price: 75000, current_stock: 0, minimum_stock: 10 },
    { sku: 'FNB-002', name: 'Mie Instan Goreng', category: 'Food & Beverage', unit: 'karton', purchase_price: 90000, selling_price: 120000, current_stock: 25, minimum_stock: 15 },
    { sku: 'TOOL-001', name: 'Obeng Set 12 pcs', category: 'Tools', unit: 'set', purchase_price: 85000, selling_price: 130000, current_stock: 8, minimum_stock: 5 },
    { sku: 'TOOL-002', name: 'Tang Kombinasi 8"', category: 'Tools', unit: 'pcs', purchase_price: 45000, selling_price: 70000, current_stock: 3, minimum_stock: 10 },
    { sku: 'OFF-001', name: 'Kertas HVS A4 80gsm', category: 'Office Supplies', unit: 'rim', purchase_price: 55000, selling_price: 70000, current_stock: 50, minimum_stock: 20 },
    { sku: 'OFF-002', name: 'Pulpen Pilot G2 Hitam', category: 'Office Supplies', unit: 'lusin', purchase_price: 60000, selling_price: 85000, current_stock: 15, minimum_stock: 5 },
  ];

  for (const p of products) {
    await pool.query(
      `INSERT INTO products (category_id, sku, name, unit, purchase_price, selling_price, current_stock, minimum_stock, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       ON CONFLICT (sku) DO UPDATE
         SET name = EXCLUDED.name,
             category_id = EXCLUDED.category_id,
             purchase_price = EXCLUDED.purchase_price,
             selling_price = EXCLUDED.selling_price,
             current_stock = EXCLUDED.current_stock,
             minimum_stock = EXCLUDED.minimum_stock,
             updated_at = NOW()`,
      [catMap[p.category], p.sku, p.name, p.unit, p.purchase_price, p.selling_price, p.current_stock, p.minimum_stock]
    );
  }

  console.log('Demo data seeded: categories, suppliers, products.');
}

module.exports = { seed };
