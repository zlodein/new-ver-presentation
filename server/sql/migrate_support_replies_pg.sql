-- Ответы в тикетах поддержки (PostgreSQL)
CREATE TABLE IF NOT EXISTS support_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_request_id UUID NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_replies_request_id_idx ON support_replies(support_request_id);
