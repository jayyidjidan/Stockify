# Migrations

This directory contains database migration scripts.

## Running migrations

```bash
npm run migrate
```

The migration runner (`src/migrations/run.js`) will be implemented in Phase 02 — Database Schema. It applies migrations in sequence, tracking applied migrations in a `schema_migrations` table.

## Migration file naming

```
YYYYMMDDHHMMSS_description_of_change.js
```

Example: `20240101120000_create_users_table.js`
