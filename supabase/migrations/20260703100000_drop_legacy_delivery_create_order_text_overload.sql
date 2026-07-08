-- Remove a sobrecarga legada baseada em TEXT para evitar ambiguidade no PostgREST.
-- O frontend envia payload JSON textual, entao a coexistencia com a assinatura
-- canonica baseada em enums faz o RPC `delivery_create_order` retornar 300 Multiple Choices.

DROP FUNCTION IF EXISTS public.delivery_create_order(
  UUID,
  UUID,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  DECIMAL,
  DECIMAL,
  DECIMAL,
  DECIMAL,
  DECIMAL,
  DECIMAL,
  DECIMAL,
  TEXT,
  TEXT,
  TEXT,
  JSONB,
  JSONB,
  TEXT,
  TEXT,
  TEXT,
  UUID
);
DROP FUNCTION IF EXISTS public.delivery_transition_logistics_status(
  UUID,
  TEXT,
  UUID,
  TEXT,
  JSONB
);
DROP FUNCTION IF EXISTS public.delivery_transition_financial_status(
  UUID,
  TEXT,
  UUID,
  TEXT,
  JSONB
);
DROP FUNCTION IF EXISTS public.delivery_report_occurrence(
  UUID,
  TEXT,
  TEXT,
  UUID,
  TEXT,
  JSONB
);
