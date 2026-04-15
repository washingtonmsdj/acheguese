# ⚡ APLICAR MIGRATION AGORA (Manual - 2 minutos)

## ❌ Por Que Não Funcionou Automaticamente?

O Supabase **não permite ALTER TABLE via API** por segurança. Operações DDL (Data Definition Language) como ALTER TABLE, CREATE TABLE, etc. só podem ser executadas via:
- SQL Editor do Supabase Studio
- psql (linha de comando)
- Supabase CLI com `db push`

## ✅ SOLUÇÃO RÁPIDA (2 minutos)

### Passo 1: Abrir SQL Editor

Clique aqui: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor

### Passo 2: Clicar em "SQL Editor"

No menu lateral esquerdo, clique em **SQL Editor**

### Passo 3: Copiar e Colar o SQL

Cole este SQL completo:

```sql
-- Passo 1: Remover constraint antigo
ALTER TABLE module_rollouts DROP CONSTRAINT IF EXISTS module_rollouts_module_key_check;

-- Passo 2: Adicionar novo constraint
ALTER TABLE module_rollouts ADD CONSTRAINT module_rollouts_module_key_check 
  CHECK (module_key IN (
    'community', 'business', 'services', 'mobility', 'classifieds', 'ads',
    'gastronomy', 'events', 'jobs'
  ));

-- Passo 3: Inserir rollouts
INSERT INTO module_rollouts (module_key, location_id, status, config)
VALUES
  ('gastronomy', '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('events', '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('jobs', '00000000-0000-0000-0000-000000000010', 'active', NULL)
ON CONFLICT (module_key, location_id) DO NOTHING;

-- Passo 4: Verificar
SELECT module_key, status FROM module_rollouts 
WHERE location_id = '00000000-0000-0000-0000-000000000010'
ORDER BY module_key;
```

### Passo 4: Clicar em "Run"

Clique no botão **Run** (ou pressione Ctrl+Enter)

### Passo 5: Verificar Resultado

Você deve ver uma tabela com 9 linhas:

```
module_key   | status
-------------|--------
ads          | active
business     | active
classifieds  | active
community    | active
events       | active  ← NOVO
gastronomy   | active  ← NOVO
jobs         | active  ← NOVO
mobility     | active
services     | active
```

## ✅ PRONTO!

Se você viu as 9 linhas, **SUCESSO!** 🎉

O bug do seletor está corrigido na raiz!

---

## 🔍 Testar no App

1. Acesse: `/ba/salvador/complexo-do-nordeste-de-amaralina`
2. Clique em "Gastronomia" na sidebar
3. **ANTES**: Seletor mudava para Salvador ❌
4. **DEPOIS**: Seletor permanece no Complexo ✅

---

## 📁 Arquivos Disponíveis

- `APLICAR_MIGRATION_ROLLOUTS.sql` - SQL completo
- `COMO_APLICAR_NO_REMOTO.md` - Instruções detalhadas
- `scripts/applyRolloutMigration.ts` - Script Node (não funciona para ALTER TABLE)

---

**Tempo estimado**: 2 minutos  
**Dificuldade**: Fácil (copiar e colar)  
**Resultado**: Bug corrigido na raiz! 🎯
