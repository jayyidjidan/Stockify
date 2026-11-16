# Stockify API Reference

> **Base URL:** `http://localhost:3000/api/v1`  
> **Auth:** All protected endpoints require `Authorization: Bearer <token>` header.

---

## Health Check

| Method | Endpoint           | Auth | Description              |
|--------|--------------------|------|--------------------------|
| GET    | `/health`          | No   | Returns server status    |

**Response:**
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

## Authentication

| Method | Endpoint           | Auth | Description              |
|--------|--------------------|------|--------------------------|
| POST   | `/auth/login`      | No   | Login and receive JWT    |
| POST   | `/auth/register`   | No   | Register new user        |
| GET    | `/auth/me`         | Yes  | Get current user profile |
| POST   | `/auth/logout`     | Yes  | Invalidate session       |

### POST `/auth/login`

**Request:**
```json
{
  "email": "admin@stockify.com",
  "password": "admin123"
}
```

**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": { "id": "uuid", "email": "admin@stockify.com", "role": "admin" }
}
```

**Error `401`:**
```json
{ "error": "Invalid email or password." }
```

---

## Users

| Method | Endpoint           | Auth    | Roles         | Description           |
|--------|--------------------|---------|---------------|-----------------------|
| GET    | `/users`           | Yes     | admin         | List all users        |
| GET    | `/users/:id`       | Yes     | admin, self   | Get user by ID        |
| POST   | `/users`           | Yes     | admin         | Create user           |
| PATCH  | `/users/:id`       | Yes     | admin, self   | Update user           |
| DELETE | `/users/:id`       | Yes     | admin         | Delete user           |

---

## Products

| Method | Endpoint           | Auth    | Roles              | Description           |
|--------|--------------------|---------|--------------------|-----------------------|
| GET    | `/products`        | Yes     | all                | List products         |
| GET    | `/products/:id`    | Yes     | all                | Get product           |
| POST   | `/products`        | Yes     | admin, manager     | Create product        |
| PATCH  | `/products/:id`    | Yes     | admin, manager     | Update product        |
| DELETE | `/products/:id`    | Yes     | admin              | Delete product        |

---

## Categories

| Method | Endpoint           | Auth    | Roles              | Description           |
|--------|--------------------|---------|--------------------|-----------------------|
| GET    | `/categories`      | Yes     | all                | List categories       |
| POST   | `/categories`      | Yes     | admin, manager     | Create category       |
| PATCH  | `/categories/:id`  | Yes     | admin, manager     | Update category       |
| DELETE | `/categories/:id`  | Yes     | admin              | Delete category       |

---

## Inventory / Stock

| Method | Endpoint                     | Auth    | Roles              | Description               |
|--------|------------------------------|---------|--------------------|---------------------------|
| GET    | `/inventory`                 | Yes     | all                | List inventory levels     |
| POST   | `/inventory/adjust`          | Yes     | admin, manager     | Adjust stock quantity     |
| GET    | `/inventory/low-stock`       | Yes     | all                | Products below threshold  |

---

## Orders

| Method | Endpoint           | Auth    | Roles              | Description           |
|--------|--------------------|---------|--------------------|-----------------------|
| GET    | `/orders`          | Yes     | all                | List orders           |
| GET    | `/orders/:id`      | Yes     | all                | Get order             |
| POST   | `/orders`          | Yes     | all                | Create order          |
| PATCH  | `/orders/:id`      | Yes     | admin, manager     | Update order status   |

---

## Suppliers

| Method | Endpoint           | Auth    | Roles              | Description           |
|--------|--------------------|---------|--------------------|-----------------------|
| GET    | `/suppliers`       | Yes     | all                | List suppliers        |
| POST   | `/suppliers`       | Yes     | admin, manager     | Create supplier       |
| PATCH  | `/suppliers/:id`   | Yes     | admin, manager     | Update supplier       |
| DELETE | `/suppliers/:id`   | Yes     | admin              | Delete supplier       |

---

## Dashboard / Reports

| Method | Endpoint               | Auth    | Roles    | Description                   |
|--------|------------------------|---------|----------|-------------------------------|
| GET    | `/dashboard/kpis`      | Yes     | all      | KPI summary (revenue, orders) |
| GET    | `/dashboard/chart`     | Yes     | all      | Revenue vs cost chart data    |
| GET    | `/reports/inventory`   | Yes     | all      | Inventory valuation report    |

---

## Error Format

All errors follow:
```json
{ "error": "Human-readable message." }
```

Validation errors (400):
```json
{
  "errors": [
    { "field": "email", "msg": "must be a valid email" }
  ]
}
```
