# 🎯 Instruções para Aplicar a Correção

## O Que Foi Feito

Identifiquei e corrigi **na raiz** o bug do seletor que mudava aleatoriamente entre páginas.

**Causa**: Módulos `gastronomy`, `events` e `jobs` não tinham rollouts no banco de dados.

**Solução**: Criada migration profissional para adicionar os rollouts faltantes.

---

## ⚡ Como Aplicar (ESCOLHA UMA OPÇÃO)

### Opção 1: Via Supabase CLI (Mais Rápido)

```bash
# No terminal do projeto
supabase db push
```

Isso aplicará automaticamente a migration:
- `supabase/migrations/20260402000001_add_gastronomy_events_jobs_modules.sql`

---

### Opção 2: Via Supabase Studio (Manual)

1. Abra o Supabase Studio: https://supabase.com/dashboard
2. Vá em "SQL Editor"
3. Cole e execute este SQL:

```sql
-- 1. Atualizar constraint da tabela
ALTER TABLE module_rollouts DROP CONSTRAINT IF EXISTS module_rollouts_module_key_check;

ALTER TABLE module_rollouts ADD CONSTRAINT module_rollouts_module_key_check 
  CHECK (module_key IN (
    'community',
    'business',
    'services',
    'mobility',
    'classifieds',
    'ads',
    'gastronomy',
    'events',
    'jobs'
  ));

-- 2. Inserir rollouts para os novos módulos
INSERT INTO module_rollouts (module_key, location_id, status, config)
VALUES
  ('gastronomy',  '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('events',      '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('jobs',        '00000000-0000-0000-0000-000000000010', 'active', NULL)
ON CONFLICT (module_key, location_id) DO NOTHING;

-- 3. Atualizar comentário
COMMENT ON COLUMN module_rollouts.module_key IS 'Módulo: community, business, services, mobility, classifieds, ads, gastronomy, events, jobs';
```

4. Clique em "Run" ou pressione Ctrl+Enter

---

## ✅ Como Validar Que Funcionou

### 1. Verificar no Banco

Execute no SQL Editor:

```sql
SELECT module_key, status 
FROM module_rollouts 
WHERE location_id = '00000000-0000-0000-0000-000000000010'
ORDER BY module_key;
```

**Resultado esperado**: Deve mostrar 9 linhas (todos os módulos com status 'active')

```
community    | active
business     | active
services     | active
mobility     | active
classifieds  | active
ads          | active
gastronomy   | active  ← NOVO
events       | active  ← NOVO
jobs         | active  ← NOVO
```

---

### 2. Testar no App

1. Acesse: `/ba/salvador/complexo-do-nordeste-de-amaralina`
2. Verifique que o seletor mostra "Complexo do Nordeste de Amaralina"
3. Clique em "Gastronomia" na sidebar
4. **ANTES**: Seletor mudava para "Salvador" ❌
5. **DEPOIS**: Seletor permanece em "Complexo do Nordeste de Amaralina" ✅
6. Repita para "Eventos" e "Vagas"

---

### 3. Verificar Logs do Console

Abra o DevTools (F12) e navegue entre páginas.

**ANTES** (errado):
```
[useTerritoryFilter] GROUP: {activeMemberIds: Array(0), scope: 'none'}
```

**DEPOIS** (correto):
```
[useTerritoryFilter] GROUP: {activeMemberIds: Array(4), scope: 'group'}
```

---

## 📁 Arquivos Criados/Modificados

### Criados:
- ✅ `supabase/migrations/20260402000001_add_gastronomy_events_jobs_modules.sql`
- ✅ `CORRECAO_RAIZ_ROLLOUTS_FALTANTES.md` (documentação detalhada)
- ✅ `RESUMO_CORRECAO_PROFISSIONAL.md` (resumo executivo)
- ✅ `INSTRUCOES_APLICAR_CORRECAO.md` (este arquivo)

### Modificados:
- ✅ `src/core/rollout/sql/003_rollout_seed.sql` (seed atualizado)
- ✅ `src/core/rollout/sql/001_rollout_table.sql` (schema atualizado)
- ✅ `src/core/rollout/types/index.ts` (enums já corrigidos antes)
- ✅ `src/core/routing/components/TerritorialLayout.tsx` (mapeamento já corrigido antes)

---

## 🎉 Resultado Final

Após aplicar a migration:

✅ Seletor permanece estável ao navegar entre TODAS as páginas  
✅ Gastronomia, Eventos e Vagas funcionam corretamente  
✅ Filtros territoriais aplicados corretamente  
✅ Banner de "módulo indisponível" não aparece mais  
✅ Queries retornam dados filtrados por território  

---

## 🆘 Problemas?

Se após aplicar a migration o problema persistir:

1. **Limpe o cache do navegador**: Ctrl+Shift+R (hard refresh)
2. **Verifique os logs**: Abra DevTools e procure por `[useTerritoryFilter]`
3. **Confirme no banco**: Execute a query de validação acima
4. **Reinicie o dev server**: Pare e inicie novamente

---

## 📞 Próximos Passos

Após aplicar a correção, podemos:

1. ✅ Validar que o bug foi corrigido
2. ✅ Corrigir os 16 problemas de hardcoded pendentes (ver `AUDITORIA_COMPLETA_HARDCODED_SSOT.md`)
3. ✅ Fazer testes completos de navegação

---

**Data**: 2026-04-02  
**Status**: 🔴 AGUARDANDO APLICAÇÃO DA MIGRATION  
**Ação**: Execute `supabase db push` ou aplique o SQL manualmente
