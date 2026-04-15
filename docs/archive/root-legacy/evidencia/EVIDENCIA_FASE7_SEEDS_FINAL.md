# EVIDÊNCIA FASE 7 — SEEDS
**Sprint 2 - Posts (SSOT Territorial)**  
**Data**: 2026-04-05  
**Padrão**: AAA

---

## A. ARQUIVO FINAL

`supabase/migrations/20260405000027_seed_fase7_fixtures_completo.sql`

Migrations `000025` e `000026` foram deletadas — eram tentativas locais/manuais aplicadas diretamente no banco linked via `npx supabase db query --linked -f`, nunca commitadas no git. A deleção não reescreveu histórico compartilhado.

---

## B. HISTÓRICO DE CORREÇÃO DE ORDEM

| Versão | Problema | Ação |
|---|---|---|
| `000025` + `000026` | Posts rodavam antes do profile fixture — quebrava em ambiente novo | Deletadas |
| `000027` | Profile fixture + posts em sequência única e determinística | ✅ Ativa |

---

## C. ESTRUTURA DA MIGRATION 000027

Executa em 4 passos sequenciais dentro de um único arquivo:

1. **User fixture** — `INSERT INTO auth.users` com `id = f0000000-...`, `ON CONFLICT DO NOTHING`
2. **Profile fixture** — `UPDATE profiles SET location_id = ...` no profile criado pelo trigger; falha explícita se não existir
3. **Posts seed** — 3 posts com IDs fixos, `author_profile_id` resolvido via `WHERE user_id = 'f0000000-...'`; `ON CONFLICT DO UPDATE` para corrigir runs anteriores com profile errado
4. **Validação final** — confirma 3/3 posts e que todos têm `user_id = f0000000-...`; falha explícita se não

---

## D. SIMULAÇÃO DE AMBIENTE NOVO

Para validar portabilidade, os dados foram deletados e a migration executada do zero:

```sql
-- Reset
DELETE FROM posts WHERE id IN ('10000000-...-001', '10000000-...-002', '10000000-...-003');
DELETE FROM profiles WHERE user_id = 'f0000000-0000-0000-0000-000000000000';
DELETE FROM auth.users WHERE id = 'f0000000-0000-0000-0000-000000000000';

-- Executar apenas 000027
npx supabase db query --linked -f 20260405000027_seed_fase7_fixtures_completo.sql
```

Resultado:

```
┌──────────────────────────────────────┬──────────────────────────────────────────────────────────┬──────────────────────────────────────┬──────────────┬──────────────┬──────────────────────────────────────┬──────────────────────────────────────┬────────────────────────┬───────────────┐
│                  id                  │                         content                          │             location_id              │    reach     │ is_published │          author_profile_id           │               user_id                │     location_name      │ location_type │
├──────────────────────────────────────┼──────────────────────────────────────────────────────────┼──────────────────────────────────────┼──────────────┼──────────────┼──────────────────────────────────────┼──────────────────────────────────────┼────────────────────────┼───────────────┤
│ 10000000-0000-0000-0000-000000000001 │ Post seed — Barra Teste Fase2 (bairro, reach neighborhood)│ 00000000-0000-0000-0000-000000000002 │ neighborhood │ true         │ d95a996b-6bc4-4943-a9f8-01482f0a7f56 │ f0000000-0000-0000-0000-000000000000 │ Barra Teste Fase2      │ district      │
│ 10000000-0000-0000-0000-000000000002 │ Post seed — Salvador Teste Fase2 (cidade, reach city)    │ 00000000-0000-0000-0000-000000000001 │ city         │ true         │ d95a996b-6bc4-4943-a9f8-01482f0a7f56 │ f0000000-0000-0000-0000-000000000000 │ Salvador Teste Fase2   │ city          │
│ 10000000-0000-0000-0000-000000000003 │ Post seed — Pelourinho Teste Fase2 (bairro, reach street) │ 00000000-0000-0000-0000-000000000003 │ street       │ true         │ d95a996b-6bc4-4943-a9f8-01482f0a7f56 │ f0000000-0000-0000-0000-000000000000 │ Pelourinho Teste Fase2 │ district      │
└──────────────────────────────────────┴──────────────────────────────────────────────────────────┴──────────────────────────────────────┴──────────────┴──────────────┴──────────────────────────────────────┴──────────────────────────────────────┴────────────────────────┴───────────────┘
```

`user_id = f0000000-0000-0000-0000-000000000000` em todos os posts. `author_profile_id` gerado pelo trigger — varia entre ambientes, mas é sempre resolvido pelo `user_id` fixo.

---

## E. NOTA SOBRE PORTABILIDADE

O `user_id` âncora é fixo (`f0000000-...`). O `author_profile_id` é gerado pelo trigger `auto_create_personal_profile` e varia entre ambientes. Testes que precisam do autor devem usar a query canônica:

```sql
SELECT id FROM profiles
WHERE user_id = 'f0000000-0000-0000-0000-000000000000'
  AND profile_type = 'personal';
```

A seed falha explicitamente (sem fallback silencioso) se o profile não existir após o passo 2.

---

**Status**: ✅ FASE 7 APROVADA — migration consolidada em ordem correta, portabilidade validada com simulação de ambiente novo, histórico git limpo (000025/000026 eram tentativas locais nunca commitadas).
