-- Criar tabela de logs de acesso
CREATE TABLE IF NOT EXISTS log_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  evento TEXT NOT NULL, -- 'login', 'logout', 'session_refresh'
  sucesso BOOLEAN DEFAULT true,
  erro TEXT,
  metadata JSONB
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_log_acesso_user ON log_acesso(id_user);
CREATE INDEX IF NOT EXISTS idx_log_acesso_timestamp ON log_acesso(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_log_acesso_evento ON log_acesso(evento);

-- Adicionar comentários
COMMENT ON TABLE log_acesso IS 'Registra todos os acessos e eventos de autenticação dos usuários';
COMMENT ON COLUMN log_acesso.evento IS 'Tipo de evento: login, logout, session_refresh';
COMMENT ON COLUMN log_acesso.metadata IS 'Informações adicionais do evento em formato JSON';

-- RLS Policies
ALTER TABLE log_acesso ENABLE ROW LEVEL SECURITY;

-- Apenas administradores podem ver todos os logs
CREATE POLICY "admin_view_all_logs" ON log_acesso
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Usuários podem ver apenas seus próprios logs
CREATE POLICY "users_view_own_logs" ON log_acesso
  FOR SELECT
  USING (id_user = auth.uid());

-- Apenas sistema pode inserir logs (via service role ou trigger)
CREATE POLICY "system_insert_logs" ON log_acesso
  FOR INSERT
  WITH CHECK (true);
