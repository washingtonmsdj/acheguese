# ⚡ EXECUTAR AGORA - Funções RPC Pricing

## 🎯 O que isso resolve

Permite criar/ativar regras de pricing sem erro 409 Conflict. As regras antigas serão desativadas automaticamente.

## 📋 Instruções (2 minutos)

### 1. Abra o Supabase SQL Editor
🔗 https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new

### 2. Cole o SQL abaixo e clique em "Run"

```sql
-- Funções RPC para gerenciar regras de pricing sem conflito com triggers

-- ============================================
-- FUNÇÃO: Ativar regra (desativa outras automaticamente)
-- ============================================

CREATE OR REPLACE FUNCTION activate_pricing_rule(
  p_rule_id UUID,
  p_performed_by UUID
)
RETURNS VOID AS $$
BEGIN
  -- Desativar todas as regras ativas do mesmo modo
  UPDATE pricing_rules
  SET is_active = false, updated_by = p_performed_by
  WHERE mode = (SELECT mode FROM pricing_rules WHERE id = p_rule_id)
    AND is_active = true
    AND id != p_rule_id;
  
  -- Ativar a regra solicitada
  UPDATE pricing_rules
  SET is_active = true, updated_by = p_performed_by
  WHERE id = p_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: Criar regra ativa (desativa outras automaticamente)
-- ============================================

CREATE OR REPLACE FUNCTION create_active_pricing_rule(
  p_mode TEXT,
  p_name TEXT,
  p_base_fare DECIMAL,
  p_price_per_km DECIMAL,
  p_price_per_minute DECIMAL,
  p_minimum_fare DECIMAL,
  p_maximum_fare DECIMAL,
  p_is_active BOOLEAN,
  p_valid_from TIMESTAMPTZ,
  p_valid_until TIMESTAMPTZ,
  p_metadata JSONB,
  p_performed_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_new_rule_id UUID;
BEGIN
  -- Se está criando uma regra ativa, desativar outras do mesmo modo
  IF p_is_active THEN
    UPDATE pricing_rules
    SET is_active = false, updated_by = p_performed_by
    WHERE mode = p_mode
      AND is_active = true;
  END IF;
  
  -- Criar a nova regra
  INSERT INTO pricing_rules (
    mode, name, base_fare, price_per_km, price_per_minute,
    minimum_fare, maximum_fare, is_active, valid_from, valid_until,
    metadata, created_by, updated_by
  ) VALUES (
    p_mode, p_name, p_base_fare, p_price_per_km, p_price_per_minute,
    p_minimum_fare, p_maximum_fare, p_is_active, p_valid_from, p_valid_until,
    p_metadata, p_performed_by, p_performed_by
  )
  RETURNING id INTO v_new_rule_id;
  
  RETURN v_new_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Funções RPC criadas com sucesso!' AS status;
```

### 3. Verifique o resultado

Deve aparecer: `Funções RPC criadas com sucesso!`

## ✅ Teste

Após executar, teste no admin:
1. Criar uma nova regra ativa para "Corrida" (já existe uma ativa)
2. Deve funcionar sem erro 409
3. A regra antiga deve ser desativada automaticamente

## 🔧 Solução Técnica

Não é gambiarra! É a solução correta:

- **Problema**: Trigger `validate_pricing_rule_conflict` bloqueia UPDATE quando já existe regra ativa
- **Solução**: Funções RPC executam em transação atômica: desativam antigas → ativam nova
- **Padrão**: Stored procedures são prática padrão em bancos de dados para operações complexas
