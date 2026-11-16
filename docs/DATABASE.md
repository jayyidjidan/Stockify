# Stockify Database Schema

> **Engine:** PostgreSQL 15+  
> **Connection:** Set `DATABASE_URL` in `backend/.env`

---

## Entity Relationship Overview

```
users ──< orders >── products ──< categories
users ──< inventory_adjustments
products ──< inventory
suppliers ──< products
```

---

## Tables

### `users`

| Column        | Type                     | Constraints                         |
|---------------|--------------------------|-------------------------------------|
| id            | UUID                     | PRIMARY KEY, DEFAULT gen_random_uuid() |
| email         | VARCHAR(255)             | NOT NULL, UNIQUE                    |
| password_hash | VARCHAR(255)             | NOT NULL                            |
| full_name     | VARCHAR(255)             | NOT NULL                            |
| role          | VARCHAR(50)              | NOT NULL, DEFAULT 'staff'           |
| is_active     | BOOLEAN                  | NOT NULL, DEFAULT true              |
| created_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()             |
| updated_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()             |

**Roles:** `admin`, `manager`, `staff`

---

### `categories`

| Column        | Type                     | Constraints                         |
|---------------|--------------------------|-------------------------------------|
| id            | UUID                     | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name          | VARCHAR(100)             | NOT NULL, UNIQUE                    |
| description   | TEXT                     |                                     |
| created_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()             |

---

### `suppliers`

| Column        | Type                     | Constraints                         |
|---------------|--------------------------|-------------------------------------|
| id            | UUID                     | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name          | VARCHAR(255)             | NOT NULL                            |
| contact_name  | VARCHAR(255)             |                                     |
| email         | VARCHAR(255)             |                                     |
| phone         | VARCHAR(50)              |                                     |
| address       | TEXT                     |                                     |
| created_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()             |
| updated_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()             |

---

### `products`

| Column           | Type                     | Constraints                                     |
|------------------|--------------------------|--------------------------------------------------|
| id               | UUID                     | PRIMARY KEY, DEFAULT gen_random_uuid()           |
| sku              | VARCHAR(100)             | NOT NULL, UNIQUE                                 |
| name             | VARCHAR(255)             | NOT NULL                                         |
| description      | TEXT                     |                                                  |
| category_id      | UUID                     | REFERENCES categories(id) ON DELETE SET NULL     |
| supplier_id      | UUID                     | REFERENCES suppliers(id) ON DELETE SET NULL      |
| unit_price       | NUMERIC(12, 2)           | NOT NULL, DEFAULT 0                              |
| cost_price       | NUMERIC(12, 2)           | NOT NULL, DEFAULT 0                              |
| reorder_point    | INTEGER                  | NOT NULL, DEFAULT 10                             |
| is_active        | BOOLEAN                  | NOT NULL, DEFAULT true                           |
| created_at       | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()                          |
| updated_at       | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()                          |

---

### `inventory`

| Column           | Type                     | Constraints                                     |
|------------------|--------------------------|--------------------------------------------------|
| id               | UUID                     | PRIMARY KEY, DEFAULT gen_random_uuid()           |
| product_id       | UUID                     | NOT NULL, UNIQUE, REFERENCES products(id)        |
| quantity_on_hand | INTEGER                  | NOT NULL, DEFAULT 0                              |
| quantity_reserved| INTEGER                  | NOT NULL, DEFAULT 0                              |
| updated_at       | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()                          |

**Computed:** `quantity_available = quantity_on_hand - quantity_reserved`

---

### `inventory_adjustments`

| Column        | Type                     | Constraints                                     |
|---------------|--------------------------|--------------------------------------------------|
| id            | UUID                     | PRIMARY KEY, DEFAULT gen_random_uuid()           |
| product_id    | UUID                     | NOT NULL, REFERENCES products(id)               |
| adjusted_by   | UUID                     | NOT NULL, REFERENCES users(id)                  |
| delta         | INTEGER                  | NOT NULL (positive = in, negative = out)        |
| reason        | TEXT                     |                                                  |
| created_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()                         |

---

### `orders`

| Column        | Type                     | Constraints                                     |
|---------------|--------------------------|--------------------------------------------------|
| id            | UUID                     | PRIMARY KEY, DEFAULT gen_random_uuid()           |
| order_number  | VARCHAR(50)              | NOT NULL, UNIQUE                                |
| created_by    | UUID                     | NOT NULL, REFERENCES users(id)                  |
| status        | VARCHAR(50)              | NOT NULL, DEFAULT 'pending'                     |
| priority      | VARCHAR(50)              | NOT NULL, DEFAULT 'low'                         |
| total_amount  | NUMERIC(12, 2)           | NOT NULL, DEFAULT 0                             |
| notes         | TEXT                     |                                                  |
| created_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()                         |
| updated_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW()                         |

**Status values:** `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`  
**Priority values:** `low`, `medium`, `high`

---

### `order_items`

| Column        | Type                     | Constraints                                     |
|---------------|--------------------------|--------------------------------------------------|
| id            | UUID                     | PRIMARY KEY, DEFAULT gen_random_uuid()           |
| order_id      | UUID                     | NOT NULL, REFERENCES orders(id) ON DELETE CASCADE|
| product_id    | UUID                     | NOT NULL, REFERENCES products(id)               |
| quantity      | INTEGER                  | NOT NULL                                        |
| unit_price    | NUMERIC(12, 2)           | NOT NULL                                        |
| subtotal      | NUMERIC(12, 2)           | NOT NULL (quantity * unit_price)                |

---

### `schema_migrations`

| Column        | Type                     | Constraints      |
|---------------|--------------------------|------------------|
| version       | VARCHAR(255)             | PRIMARY KEY      |
| applied_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() |

Tracks which migration files have been applied.

---

## Indexes

```sql
CREATE INDEX idx_products_category_id    ON products(category_id);
CREATE INDEX idx_products_supplier_id    ON products(supplier_id);
CREATE INDEX idx_inventory_product_id    ON inventory(product_id);
CREATE INDEX idx_orders_created_by       ON orders(created_by);
CREATE INDEX idx_orders_status           ON orders(status);
CREATE INDEX idx_order_items_order_id    ON order_items(order_id);
CREATE INDEX idx_adjustments_product_id  ON inventory_adjustments(product_id);
```
