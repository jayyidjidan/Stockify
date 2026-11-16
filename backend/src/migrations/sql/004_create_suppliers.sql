CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(150),
  email VARCHAR(150),
  phone VARCHAR(30),
  address TEXT,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
