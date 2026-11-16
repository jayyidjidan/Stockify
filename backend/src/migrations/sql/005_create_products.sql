CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id),
  sku VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  unit VARCHAR(30) NOT NULL,
  purchase_price NUMERIC(15,2) DEFAULT 0 CHECK (purchase_price >= 0),
  selling_price NUMERIC(15,2) DEFAULT 0 CHECK (selling_price >= 0),
  current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock INTEGER DEFAULT 0 CHECK (minimum_stock >= 0),
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
