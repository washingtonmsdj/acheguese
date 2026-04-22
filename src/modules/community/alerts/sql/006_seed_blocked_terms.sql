-- ============================================================================
-- COMMUNITY ALERTS — Fase 1: Seed de termos proibidos
-- Padrões são regex (case-insensitive via lower() na RPC)
-- ============================================================================

INSERT INTO alert_blocked_terms (pattern, active) VALUES
  -- Operações policiais / fiscalização
  ('blitz',                    true),
  ('viatura',                  true),
  ('fiscaliza[cç][aã]o',       true),
  ('lei seca',                 true),
  ('opera[cç][aã]o',           true),
  ('guarnição',                true),
  ('guarni[cç][aã]o',          true),
  ('abordagem',                true),
  ('persegui[cç][aã]o',        true),
  ('rota policial',            true),
  ('polic[ií]a',               true),
  ('pm ',                      true),
  ('\bpm\b',                   true),
  ('bope',                     true),
  ('caveira',                  true),
  ('drone policial',           true),
  ('agente.{0,10}p[uú]blico',  true),

  -- Identificação de pessoas / acusações
  ('suspeito chamado',         true),
  ('placa.{0,5}[a-z]{3}[0-9]', true),  -- padrão de placa
  ('endere[cç]o exato',        true),
  ('mora em',                  true),
  ('trabalha em',              true),

  -- Conteúdo de ódio / discriminatório
  ('negro',                    false),  -- desativado — pode ser contexto legítimo
  ('favelado',                 true)
ON CONFLICT DO NOTHING;
