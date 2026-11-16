CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id),
  user_id UUID NOT NULL REFERENCES users(id),
  transaction_number VARCHAR(60) UNIQUE NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('stock_in','stock_out')),
  destination VARCHAR(150),
  reason VARCHAR(100),
  transaction_date DATE NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_st_type ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_st_date ON stock_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_st_number ON stock_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_st_supplier ON stock_transactions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_st_user ON stock_transactions(user_id);
