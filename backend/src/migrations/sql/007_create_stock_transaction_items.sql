CREATE TABLE IF NOT EXISTS stock_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES stock_transactions(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15,2) DEFAULT 0 CHECK (unit_price >= 0),
  subtotal NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sti_transaction ON stock_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sti_product ON stock_transaction_items(product_id);
