-- Таблица запросов в поддержку (PostgreSQL)
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(500) NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_requests_user_id_idx ON support_requests(user_id);
CREATE INDEX IF NOT EXISTS support_requests_created_at_idx ON support_requests(created_at);
