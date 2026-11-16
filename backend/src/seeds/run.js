require('dotenv').config();
const pool = require('../config/db');
const { seed: seedRoles } = require('./01_roles');
const { seed: seedUsers } = require('./02_users');
const { seed: seedDemo } = require('./03_demo_data');

async function run() {
  try {
    await seedRoles();
    await seedUsers();
    await seedDemo();
    console.log('All seeds completed.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
