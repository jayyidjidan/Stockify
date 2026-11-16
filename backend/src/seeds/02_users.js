const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seed() {
  const { rows: roles } = await pool.query('SELECT id, name FROM roles');
  const roleMap = Object.fromEntries(roles.map(r => [r.name, r.id]));

  const users = [
    {
      full_name: 'Super Admin',
      email: 'admin@stockify.com',
      password: 'admin123',
      role: 'Admin',
    },
    {
      full_name: 'Warehouse Staff',
      email: 'staff@stockify.com',
      password: 'staff123',
      role: 'Warehouse Staff',
    },
    {
      full_name: 'Manager',
      email: 'manager@stockify.com',
      password: 'manager123',
      role: 'Manager',
    },
  ];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 12);
    await pool.query(
      `INSERT INTO users (role_id, full_name, email, password_hash, status)
       VALUES ($1, $2, $3, $4, 'active')
       ON CONFLICT (email) DO UPDATE
         SET role_id = EXCLUDED.role_id,
             full_name = EXCLUDED.full_name,
             password_hash = EXCLUDED.password_hash,
             updated_at = NOW()`,
      [roleMap[user.role], user.full_name, user.email, hash]
    );
  }
  console.log('Users seeded.');
}

module.exports = { seed };
