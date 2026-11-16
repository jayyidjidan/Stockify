CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  transaction_id UUID NOT NULL REFERENCES stock_transactions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('stock_in','stock_out')),
  quantity_in INTEGER DEFAULT 0,
  quantity_out INTEGER DEFAULT 0,
  previous_stock INTEGER NOT NULL,
  current_stock INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sm_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_sm_transaction ON stock_movements(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sm_created ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_sm_type ON stock_movements(movement_type);
