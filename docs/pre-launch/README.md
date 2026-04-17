# 🛡️ Pré-Lançamento Ordax

Documentação de preparação para produção do SaaS Ordax.

## ⚠️ Status atual: NÃO PRONTO PARA PRODUÇÃO

Ver [`PRE_LAUNCH_AUDIT.md`](./PRE_LAUNCH_AUDIT.md) para o relatório completo.

## Ordem de execução

| Fase | Doc | Bloqueador? | Estimativa |
|------|-----|:-----------:|:----------:|
| 1. Banco (schema + RLS) | `FASE_1_BANCO.md` | 🔴 SIM | 1-2 sem |
| 2. Autenticação | `FASE_2_AUTH.md` | 🔴 SIM | 3-5 dias |
| 3. Edge Functions & Stripe | `FASE_3_EDGE_FUNCTIONS.md` | 🔴 SIM | 1 sem |
| 4. LGPD & Privacidade | `FASE_4_LGPD.md` | 🔴 SIM | 1 sem |
| 5. Qualidade & Testes | `FASE_5_QUALIDADE.md` | 🟡 Recomendado | 1 sem |
| 6. Performance & Observabilidade | `FASE_6_PERFORMANCE.md` | 🟡 Recomendado | 3-5 dias |
| 7. Pré-Produção | `FASE_7_PRE_PROD.md` | 🟢 Lançamento | 3 dias |

## Princípios

1. **SSOT (Single Source of Truth)** — Database → Service → Hook → Component
2. **Defense in depth** — RLS no banco + validação no service + validação no client
3. **Privacy by default** — PII mascarada por padrão, exposição é exceção
4. **Auditável** — toda ação crítica registrada
5. **Reversível** — toda migration tem rollback documentado

## Como usar

1. Leia `PRE_LAUNCH_AUDIT.md` inteiro
2. Execute fases na ordem (não pule)
3. Ao final de cada fase, valide o checklist antes de avançar
4. Não marque "go-live" sem o checklist final completo
