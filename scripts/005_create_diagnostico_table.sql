-- Create diagnostico table to store diagnosis history
CREATE TABLE IF NOT EXISTS diagnostico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_workspace UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score_medio NUMERIC(4,2) NOT NULL,
  volume_mensagens INTEGER NOT NULL,
  periodo_inicio TIMESTAMP WITH TIME ZONE,
  periodo_fim TIMESTAMP WITH TIME ZONE,
  url_download TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE diagnostico ENABLE ROW LEVEL SECURITY;

-- Create policy for workspace access
CREATE POLICY diagnostico_by_workspace ON diagnostico
  USING (
    id_workspace IN (
      SELECT id FROM workspace WHERE id_user = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_diagnostico_workspace ON diagnostico(id_workspace);
CREATE INDEX IF NOT EXISTS idx_diagnostico_data ON diagnostico(data_geracao DESC);
