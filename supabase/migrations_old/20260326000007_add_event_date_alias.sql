-- Migration: Add event_date as alias for date column in events
-- Description: Compatibilidade com código que usa event_date
-- Date: 2026-03-26

-- Adiciona coluna computed event_date que aponta para date
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ 
  GENERATED ALWAYS AS (date) STORED;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date DESC);

-- Comentário
COMMENT ON COLUMN events.event_date IS 'Alias para date - compatibilidade com código';
