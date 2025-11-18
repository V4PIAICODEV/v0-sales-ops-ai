-- Add message count and individual category scores to analise table
alter table analise
  add column if not exists quantidade_mensagens int,
  add column if not exists score_conexao_rapport numeric,
  add column if not exists score_diagnostico_descoberta numeric,
  add column if not exists score_oferta_personalizada numeric,
  add column if not exists score_clareza_didatica numeric,
  add column if not exists score_conducao_fechamento numeric;
