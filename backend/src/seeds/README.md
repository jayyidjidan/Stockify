# Seeds

This directory contains database seed scripts for populating initial/demo data.

## Running seeds

```bash
npm run seed
```

The seed runner (`src/seeds/run.js`) will be implemented in Phase 02 — Database Schema.

## Demo credentials (seeded automatically)

| Email                      | Password  | Role    |
|----------------------------|-----------|---------|
| admin@stockify.com         | admin123  | admin   |
| manager@stockify.com       | manager123| manager |
| staff@stockify.com         | staff123  | staff   |

## Seed file naming

```
01_seed_users.js
02_seed_categories.js
03_seed_products.js
```
