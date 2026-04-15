# Instruções para Aplicar Migração de Alertas Comunitários

## Problema
A página de administração de alertas comunitários está falhando porque as colunas `report_count` e `under_review` não existem na tabela `community_alerts`.

## Solução
Execute o SQL abaixo no **SQL Editor** do Supabase Dashboard:

### Passo 1: Acesse o Supabase Dashboard
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em "SQL Editor" no menu lateral

### Passo 2: Execute o SQL

```sql
-- ============================================================================
-- Adiciona colunas de moderação à tabela community_alerts
-- ============================================================================

-- Adicionar colunas de moderação
ALTER TABLE community_alerts
ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS under_review BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS removal_reason TEXT,
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

-- Criar tabela de reports se não existir
CREATE TABLE IF NOT EXISTS community_alert_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES community_alerts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',
    'inappropriate',
    'false_information',
    'duplicate',
    'resolved',
    'other'
  )),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevenir reports duplicados do mesmo usuário
  UNIQUE(alert_id, reporter_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_community_alert_reports_alert_id 
  ON community_alert_reports(alert_id);
CREATE INDEX IF NOT EXISTS idx_community_alert_reports_reporter_id 
  ON community_alert_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_community_alerts_under_review 
  ON community_alerts(under_review) WHERE under_review = TRUE;
CREATE INDEX IF NOT EXISTS idx_community_alerts_report_count 
  ON community_alerts(report_count) WHERE report_count > 0;

-- RLS para community_alert_reports
ALTER TABLE community_alert_reports ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode reportar
CREATE POLICY "Users can report alerts" 
  ON community_alert_reports FOR INSERT 
  TO authenticated 
  WITH CHECK (reporter_id = auth.uid());

-- Usuários podem ver seus próprios reports
CREATE POLICY "Users can view own reports" 
  ON community_alert_reports FOR SELECT 
  TO authenticated 
  USING (reporter_id = auth.uid());

-- Admins podem ver todos os reports
CREATE POLICY "Admins can view all reports" 
  ON community_alert_reports FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- Função para atualizar report_count e under_review
CREATE OR REPLACE FUNCTION fn_update_alert_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_alerts
    SET
      report_count = report_count + 1,
      under_review = CASE
        WHEN report_count + 1 >= 3 THEN true
        ELSE under_review
      END,
      updated_at = NOW()
    WHERE id = NEW.alert_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementa o contador mas NÃO limpa under_review
    UPDATE community_alerts
    SET
      report_count = GREATEST(report_count - 1, 0),
      updated_at = NOW()
    WHERE id = OLD.alert_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar report_count
DROP TRIGGER IF EXISTS trg_alert_report_count ON community_alert_reports;
CREATE TRIGGER trg_alert_report_count
AFTER INSERT OR DELETE ON community_alert_reports
FOR EACH ROW EXECUTE FUNCTION fn_update_alert_report_count();

-- Criar tabela de termos bloqueados se não existir
CREATE TABLE IF NOT EXISTS alert_blocked_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca de termos
CREATE INDEX IF NOT EXISTS idx_alert_blocked_terms_term 
  ON alert_blocked_terms(term) WHERE is_active = TRUE;

-- RLS para alert_blocked_terms
ALTER TABLE alert_blocked_terms ENABLE ROW LEVEL SECURITY;

-- Todos podem ler termos bloqueados ativos
CREATE POLICY "Anyone can view active blocked terms" 
  ON alert_blocked_terms FOR SELECT 
  TO authenticated 
  USING (is_active = TRUE);

-- Apenas admins podem gerenciar termos bloqueados
CREATE POLICY "Admins can manage blocked terms" 
  ON alert_blocked_terms FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_alert_blocked_terms_updated_at 
  BEFORE UPDATE ON alert_blocked_terms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Passo 3: Verificar
Após executar o SQL, verifique se as colunas foram criadas:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'community_alerts' 
AND column_name IN ('report_count', 'under_review', 'removal_reason', 'removed_at');
```

### Passo 4: Testar
Recarregue a página de administração de alertas comunitários. Os erros 400 devem desaparecer.

## O que foi corrigido

1. **Erro do SelectItem**: Corrigido no arquivo `AdminCommunityAlerts.tsx` - valores vazios foram substituídos por "all"
2. **Erro 400 nas queries**: Será corrigido após aplicar esta migração SQL

## Arquivos Modificados

- `src/modules/admin/pages/AdminCommunityAlerts.tsx` - Corrigido SelectItem com valores vazios
- `supabase/migrations/20260405000001_add_community_alerts_moderation.sql` - Nova migração criada
