# Fase 1 - Integração Business: Correção Trigger e ID Canônico

**Data**: 2026-03-29  
**Status**: ✅ TRIGGER CORRETO - DOCUMENTAÇÃO CORRIGIDA

---

## 1. CORREÇÃO APLICADA OU CONFIRMAÇÃO DO TRIGGER ATUAL

### ✅ TRIGGER ESTÁ CORRETO

**Verificação da Migration** (`20260329000011_business_slug_history.sql`):

O trigger `fn_record_business_slug_history()` já implementa corretamente a regra:

```sql
-- Registra histórico quando:
IF OLD.slug IS NOT DISTINCT FROM NEW.slug
   AND OLD.location_id IS NOT DISTINCT FROM NEW.location_id
THEN
  RETURN NEW; -- Nada mudou, não registra
END IF;

-- Determinar motivo da mudança
IF OLD.slug IS DISTINCT FROM NEW.slug AND OLD.location_id IS DISTINCT FROM NEW.location_id THEN
  v_change_reason := 'both';
ELSIF OLD.slug IS DISTINCT FROM NEW.slug THEN
  v_change_reason := 'slug_changed';
ELSE
  v_change_reason := 'territory_changed'; -- ✅ Registra mudança de território
END IF;
```

**Comportamento Confirmado**:
- ✅ Registra quando `slug` muda
- ✅ Registra quando `location_id` muda (território)
- ✅ Registra quando ambos mudam
- ✅ Grava `old_canonical_url` completa
- ✅ Grava `change_reason` apropriado

**Problema**: A documentação estava ERRADA, não o código.

### Correção da Documentação

**Antes** (ERRADO):
```
Update Business - Território:
- Atualiza location_id
- NÃO toca em slug
- URL canônica muda
- NÃO cria histórico ❌ ERRADO
```

**Depois** (CORRETO):
```
Update Business - Território:
- Atualiza location_id
- NÃO toca em slug
- URL canônica muda
- ✅ CRIA histórico com change_reason='territory_changed'
- ✅ Grava old_canonical_url para redirect 308
```

### Regra Final Confirmada

O histórico de business registra quando:
1. ✅ O `slug` muda explicitamente → `change_reason='slug_changed'`
2. ✅ O `location_id` muda (território) → `change_reason='territory_changed'`
3. ✅ Ambos mudam → `change_reason='both'`

Mesmo que o slug permaneça igual, se a URL pública canônica mudou (por mudança de território), o `old_canonical_url` é registrado para preservar resolução/redirect da URL antiga.

---

## 2. VALIDAÇÃO DO ID CANÔNICO DE BUSINESS NO HISTÓRICO

### ✅ ID CANÔNICO ESTÁ CORRETO

**Verificação da Migration**:

```sql
CREATE TABLE IF NOT EXISTS business_slug_history (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- FK para business_data.id (PK real da tabela) ✅ CORRETO
  business_id       UUID        NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  -- profile_id mantido para lookup direto sem join adicional
  profile_id        UUID        NOT NULL,
  old_canonical_url TEXT        NOT NULL,
  old_slug          TEXT        NOT NULL,
  change_reason     TEXT        CHECK (change_reason IN ('slug_changed', 'territory_changed', 'both')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Confirmação**:
- ✅ `business_slug_history.business_id` referencia `business_data.id` (PK)
- ✅ FK constraint: `REFERENCES business_data(id) ON DELETE CASCADE`
- ✅ `profile_id` é mantido apenas para lookup direto (não é FK)

**Trigger**:
```sql
INSERT INTO business_slug_history (business_id, profile_id, old_canonical_url, old_slug, change_reason)
VALUES (OLD.id, OLD.profile_id, v_old_canonical, OLD.slug, v_change_reason)
```

- ✅ `business_id` recebe `OLD.id` (que é `business_data.id`)
- ✅ `profile_id` recebe `OLD.profile_id` (para lookup)

### Decisão Arquitetural Confirmada

**ID Canônico de Business**: `business_data.id`

**Relacionamentos**:
- `business_data.id` → PK da tabela (UUID)
- `business_data.profile_id` → FK para `profiles.id`
- `business_slug_history.business_id` → FK para `business_data.id` ✅
- `business_slug_history.profile_id` → Denormalizado para lookup

**Problema**: O exemplo na documentação estava ERRADO.

### Correção da Documentação

**Antes** (ERRADO):
```sql
INSERT INTO business_slug_history (
  business_id,  -- ❌ Exemplo mostrava 'profile-123'
  ...
) VALUES (
  'profile-123',  -- ❌ ERRADO
  ...
);
```

**Depois** (CORRETO):
```sql
INSERT INTO business_slug_history (
  business_id,  -- ✅ business_data.id (não profile_id)
  profile_id,   -- ✅ profile_id para lookup
  ...
) VALUES (
  'bd-uuid-123',  -- ✅ business_data.id
  'profile-123',  -- ✅ profile_id
  ...
);
```

---

## 3. RESUMO DAS CORREÇÕES

### O que estava CORRETO no código:
- ✅ Trigger registra mudança de território
- ✅ Trigger grava `old_canonical_url`
- ✅ Trigger usa `business_data.id` como `business_id`
- ✅ FK constraint está correta
- ✅ `change_reason` tem 3 valores: `slug_changed`, `territory_changed`, `both`

### O que estava ERRADO na documentação:
- ❌ Afirmava que mudança de território não cria histórico
- ❌ Exemplo mostrava `business_id = 'profile-123'` (deveria ser `business_data.id`)
- ❌ Não mencionava `change_reason='territory_changed'`

### Ação Tomada:
- ✅ Documentação corrigida
- ✅ Exemplos corrigidos
- ✅ Testes adicionados para validar comportamento

---

## 4. PRÓXIMOS PASSOS

1. ✅ Confirmar trigger correto
2. ✅ Confirmar ID canônico correto
3. ⏳ Executar testes obrigatórios
4. ⏳ Liberar fase business

**Status**: Trigger e ID canônico confirmados. Prosseguindo com testes.
