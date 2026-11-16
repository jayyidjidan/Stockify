const pool = require('../config/db');

async function seed() {
  const roles = [
    { name: 'Admin', description: 'Full system access' },
    { name: 'Warehouse Staff', description: 'Manage stock in and stock out operations' },
    { name: 'Manager', description: 'View inventory data and reports' },
  ];

  for (const role of roles) {
    await pool.query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
      [role.name, role.description]
    );
  }
  console.log('Roles seeded.');
}

module.exports = { seed };
