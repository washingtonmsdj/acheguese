# Deploy: Territorialização de Business e Professional

Guia operacional para executar as migrations de `location_id` em produção e fechar a vitrine territorial.

---

## Pré-requisitos

- Extensão `unaccent` instalada no Postgres (padrão no Supabase — verificar com `SELECT * FROM pg_extension WHERE extname = 'unaccent';`)
- Acesso ao Supabase SQL Editor ou psql com permissão de DDL
- Scripts em `supabase/scripts/` disponíveis

---

## Ordem de execução

### Etapa 1 — Adicionar colunas e rodar backfill

Executar em sequência:

```
supabase/migrations/20260324000010_add_location_id_to_business_data.sql
supabase/migrations/20260324000011_add_location_id_to_professional_data.sql
```

O que cada migration faz:
- Adiciona coluna `location_id UUID REFERENCES locations(id)`
- Cria índices para filtro territorial e featured
- Roda backfill em 3 passos (neighborhood+city+state → neighborhood+city → neighborhood único)
- Emite `RAISE NOTICE` com contagem de resolvidos e pendentes

Após executar, verificar o output do `RAISE NOTICE` no log do Supabase.

---

### Etapa 2 — Auditar pendentes

Executar no SQL Editor:

```
supabase/scripts/audit_pending_location_id.sql
```

O script retorna:
- Resumo geral (total, com location_id, sem location_id, ativos sem location_id)
- Lista de business pendentes com candidato de match quando possível
- Lista de professionals pendentes com candidato de match
- Tabela de locations disponíveis para referência

---

### Etapa 3 — Corrigir pendentes

Usar o script de correção:

```
supabase/scripts/fix_pending_location_id.sql
```

Fluxo de decisão para cada registro pendente:

```
Tem candidato_location_id no audit?
  ├── SIM → Confirmar que o candidato está correto → descomentar UPDATE individual
  └── NÃO → Não há match possível
              ├── Registro é importante? → Corrigir manualmente (buscar location_id na seção 4 do audit)
              └── Registro pode esperar? → Mover para status='pending' (business) ou is_accepting_clients=false (professional)
```

O script tem 3 opções por domínio:
1. Correção individual (um registro por vez)
2. Aceitar candidato automático em lote (para registros com match claro)
3. Mover ativos sem match para status não-ativo (último recurso)

Sempre executar dentro de `BEGIN/COMMIT` e verificar o resultado antes de commitar.

---

### Etapa 4 — Validar antes da constraint

Executar:

```
supabase/scripts/validate_territorial_readiness.sql
```

Critério para prosseguir:
- CHECK 1: `0` (business ativos sem location_id)
- CHECK 2: `0` (professionals aceitando clientes sem location_id)

Se qualquer check retornar valor > 0, voltar para a Etapa 3.

---

### Etapa 5 — Aplicar constraint

Somente após CHECK 1 e CHECK 2 retornarem `0`:

```
supabase/migrations/20260324000012_location_id_integrity_policy.sql
```

O que a migration faz:
- Adiciona `CHECK (status != 'active' OR location_id IS NOT NULL)` em `business_data`
- Adiciona `CHECK (is_accepting_clients = false OR location_id IS NOT NULL)` em `professional_data`

Se a migration falhar, significa que ainda há registros violando a constraint. Voltar para Etapa 3.

---

### Etapa 6 — Validar vitrine

Executar novamente:

```
supabase/scripts/validate_territorial_readiness.sql
```

Verificar o CHECK 6 (vitrine): deve mostrar businesses e professionals por location.

A landing territorial em `/br/ba/salvador/nordeste-de-amaralina` (ou qualquer bairro com dados) deve exibir os blocos de negócios e serviços com dados reais.

---

## Se a constraint falhar

```sql
-- Identificar o que está bloqueando
SELECT profile_id, status, location_id
FROM business_data
WHERE status = 'active' AND location_id IS NULL;

SELECT id, is_accepting_clients, location_id
FROM professional_data
WHERE is_accepting_clients = true AND location_id IS NULL;
```

Opções:
1. Preencher `location_id` manualmente nos registros identificados
2. Mover para status não-ativo temporariamente, aplicar constraint, corrigir depois

---

## Política de location_id (referência)

| Entidade | Condição | location_id |
|---|---|---|
| `business_data` | `status = 'active'` | obrigatório |
| `business_data` | `status != 'active'` | opcional (draft) |
| `professional_data` | `is_accepting_clients = true` | obrigatório |
| `professional_data` | `is_accepting_clients = false` | opcional |

Novos registros: `location_id` é injetado automaticamente pelo `useBusinessCreate` e `CadastrarServicoPage` a partir do `locationContextStore`. Registros criados sem território ativo ficam com `location_id = null` e não aparecem na vitrine.

---

## Arquivos relevantes

```
supabase/migrations/
  20260324000010_add_location_id_to_business_data.sql
  20260324000011_add_location_id_to_professional_data.sql
  20260324000012_location_id_integrity_policy.sql

supabase/scripts/
  audit_pending_location_id.sql      ← rodar após migrations 10 e 11
  fix_pending_location_id.sql        ← corrigir pendentes
  validate_territorial_readiness.sql ← validar antes da constraint
```
