# FASE 1+: Modelo Conceitual e Plano de Execução Completo - Monetização Multi-Vertical SSOT

**Status**: ✅ Pronto para execução pelo Kiro (com gates)
**Data de baseline**: 2026-04-21
**Origem**: consolidação de `FASE_0_AUDITORIA.md`, `F0_ADR_CONSOLIDACAO_MONETIZACAO.md`, `F0_T0-04_GATES_FRONTEND.md`, `F0_T0-05_STRIPE_INVENTARIO.md`
**Objetivo deste documento**: ser o plano oficial de implementação até conclusão, sem ambiguidade.

---

## 1. Decisões arquiteturais já fechadas (binding)

1. Webhook canônico único: `billing-webhook`.
2. Contrato canônico: evoluir `user_subscriptions` (não criar tabela nova neste ciclo).
3. Legado em sunset obrigatório: `gastronomy_subscriptions`, `stripe-webhook`, funções `gastronomy-*` de billing.
4. Catálogo alvo: `base_plan` + `vertical_package` + `addon`.
5. Resolução de entitlement centralizada no backend (nunca em componente React).

---

## 2. Correções conceituais obrigatórias (aplicadas)

1. Ordem única de precedência de entitlement:
   - `contract_override > addon > vertical_package > base_plan > fallback_default`
2. Imutabilidade de catálogo publicado:
   - Qualquer alteração de termo contratual exige nova versão.
   - Patch sem nova versão só para metadados não contratuais (ex.: copy administrativa sem impacto de cobrança/entitlement).
3. Modelo de status de assinatura para compatibilidade Stripe:
   - `active`, `trialing`, `past_due`, `incomplete`, `incomplete_expired`, `unpaid`, `canceled`.
4. Padrão financeiro:
   - armazenar valores monetários em inteiros de centavos (`*_cents`).
5. Unicidade de contrato ativo:
   - não usar constraint que dependa de `NULL` ambíguo; usar índices parciais por escopo.

---

## 3. Modelo conceitual SSOT (canônico)

### 3.1 Glossário

1. `entity_family`: `company | professional | worker`
2. `vertical`: `gastronomy | health | education | services | retail | classifieds | mobility_company | mobility_driver | mobility_courier`
3. `actor_type`: `owner | manager | operator | driver | courier | professional | customer`
4. `plan_tier`: `free | starter | pro | business | enterprise`
5. `catalog_item_type`: `base_plan | vertical_package | addon`
6. `pricing_model`: `free | subscription | transactional | hybrid`
7. `subscription_scope`: `user | business | profile | worker`
8. `transactional_scope`: `order | ride | delivery | lead | highlight | booking`

### 3.2 Invariantes

1. Catálogo sempre filtrado por `entity_family + vertical` antes de exibição/contratação.
2. `vertical_package` exige `base_plan` compatível.
3. Entitlement resolvido apenas via resolver backend.
4. Contrato ativo referencia versão de catálogo e mantém snapshot imutável.
5. Mudança de preço/limite/capacidade não altera retroativamente contrato já fechado.

### 3.3 Matrizes válidas de referência

#### Entity family x vertical

| Entity family | Verticais permitidas |
|---|---|
| `company` | `gastronomy`, `health`, `education`, `services`, `retail`, `classifieds`, `mobility_company` |
| `professional` | `health`, `education`, `services` |
| `worker` | `mobility_driver`, `mobility_courier`, `services` |

#### Item type x pricing model

| Item type | Pricing models permitidos |
|---|---|
| `base_plan` | `free`, `subscription` |
| `vertical_package` | `subscription`, `hybrid` |
| `addon` | `subscription`, `transactional`, `hybrid` |

---

## 4. Modelo físico alvo (fase de banco)

### 4.1 Tabelas novas

1. `commercial_catalog_version`
2. `catalog_item`
3. `catalog_eligibility_rule`
4. `catalog_entitlement_policy`
5. `catalog_pricing_policy`
6. `subscription_contract`
7. `subscription_item_snapshot`
8. `subscription_status_timeline`
9. `usage_event`
10. `billing_event_ledger`

### 4.2 Evolução de tabelas existentes

1. `billing_plans`
   - adicionar campos transitórios necessários para mapeamento (`stripe_price_id`, `stripe_lookup_key`) até migração plena para `catalog_*`.
2. `user_subscriptions`
   - adicionar `subscription_scope`, `entity_family`, `vertical`, `business_id`, `catalog_version_id`, `contract_snapshot`, `status` alinhado.
3. `business_subscriptions`
   - manter apenas leitura de transição; congelar novos writes de negócio.
4. `gastronomy_subscriptions`
   - somente leitura para migração e auditoria; sem novos writes após cutover.

---

## 5. Plano de execução completo (Kiro) - Fase a fase

## Fase 1.1 - Saneamento de modelagem (gate obrigatório)

**Objetivo**: eliminar ambiguidades de modelagem antes de migrations.

**Tasks**:
1. Publicar ADR resumida com os 5 pontos de correção conceitual desta página.
2. Validar listas finais de enums canônicos com produto/arquitetura.
3. Fixar contrato de precedência de entitlement em um único documento de referência.
4. Definir oficialmente política de patch sem versão (apenas metadata não contratual).

**DoD**:
1. Documento aprovado e linkado em `FASE_0_AUDITORIA.md`.
2. Sem conflito semântico entre documentos Fase 0/1.

**Aceite**:
1. Go para Fase 2 liberado por arquiteto responsável.

---

## Fase 2 - Banco, migrações e dados

**Objetivo**: criar estrutura SSOT e migrar dados sem quebra.

**Tasks**:
1. Criar migrações das 10 tabelas alvo.
2. Evoluir `user_subscriptions` com campos canônicos.
3. Criar índices parciais para contrato ativo por escopo.
4. Migrar dados de `gastronomy_subscriptions` e `business_subscriptions` para contrato canônico/snapshots.
5. Popular versionamento inicial de catálogo com estado `published`.
6. Adicionar trilha de auditoria de mudança de catálogo.

**Dependências**:
1. Fase 1.1 concluída.

**Riscos**:
1. perda de histórico contratual.
2. conflito de chaves e ids externos Stripe.

**DoD**:
1. migrações idempotentes.
2. script de backfill validado.
3. reconciliação de contagem entre origem e destino.

**Aceite**:
1. 100% contratos legados mapeados com snapshot.

---

## Fase 3 - Services, contratos e resolver

**Objetivo**: consolidar negócio em services canônicos.

**Tasks**:
1. Implementar `CatalogService.getEligibleCatalog(context)`.
2. Implementar `EntitlementResolver.resolve(contractContext)` com precedência oficial.
3. Implementar `SubscriptionContractService` (criar, atualizar, cancelar, renovar).
4. Definir DTOs canônicos compartilhados frontend/backend.
5. Descontinuar leitura de `plans.ts` e fluxo hardcoded de entitlement.
6. Criar camada anti-corruption para consumo temporário de legados.

**DoD**:
1. nenhum componente contendo regra comercial.
2. todos os checkers de entitlement consumindo resolver backend.

**Aceite**:
1. testes de contrato aprovados (resolver/elegibilidade/compatibilidade).

---

## Fase 4 - Webhooks e billing runtime (risco financeiro)

**Objetivo**: consolidar ingestão Stripe sem duplicidade.

**Tasks**:
1. Tornar `billing-webhook` pipeline único de verdade.
2. Executar janela de dual-run controlada com comparação automatizada.
3. Migrar metadata Stripe de contratos ativos para padrão canônico.
4. Desativar endpoint legado `stripe-webhook` no provedor após janela estável.
5. Garantir idempotência por `event_id` e reconciliação por invoice/subscription.

**DoD**:
1. zero processamento duplicado.
2. zero evento perdido em janela monitorada.

**Aceite**:
1. conciliação Stripe x ledger interno sem divergência crítica.

---

## Fase 5 - Admin monetization

**Objetivo**: admin editar catálogo com governança e versionamento.

**Tasks**:
1. separar CRUD de `base_plan`, `vertical_package`, `addon`.
2. workflow `draft -> review -> published -> deprecated -> archived`.
3. validação de compatibilidade antes de publish.
4. visão de impacto em contratos ativos.
5. bloquear edição destrutiva sem plano de migração.

**DoD**:
1. nenhum update direto em item publicado sem version bump.

**Aceite**:
1. auditoria de alteração com autor, timestamp e diff semântico.

---

## Fase 6 - Frontend catálogo e gates

**Objetivo**: eliminar divergência UI x backend.

**Tasks**:
1. migrar todos os gates P0/P1 de `F0_T0-04_GATES_FRONTEND.md`.
2. remover uso de `PLANS` hardcoded para pricing/upgrade.
3. adotar endpoint canônico de elegibilidade e entitlement para rendering e ação.
4. unificar mensagens de indisponibilidade por motivo de elegibilidade.

**DoD**:
1. nenhum gate crítico resolvido apenas por estado local.

**Aceite**:
1. cobertura de testes dos caminhos críticos de bloqueio/cobrança.

---

## Fase 7 - SSOT enforcement (blindagem)

**Objetivo**: impedir regressão arquitetural.

**Tasks**:
1. regras de lint/arquitetura contra acesso direto indevido ao banco de billing.
2. testes de contrato para elegibilidade, pricing e entitlement.
3. gate de CI para impedir merge com anti-pattern conhecido.
4. observabilidade de decisões do resolver e pipeline de cobrança.

**DoD**:
1. CI falha quando regra de domínio é violada.

**Aceite**:
1. regressão arquitetural bloqueada automaticamente.

---

## Fase 8 - Sunset de legado e limpeza

**Objetivo**: remover dualidade e dívida.

**Tasks**:
1. remover dependências runtime de `gastronomy_subscriptions`.
2. remover `stripe-webhook` legado e funções `gastronomy-*` de billing.
3. desativar `subscription_plans` não usada em runtime.
4. remover caminhos de compatibilidade expirados.

**DoD**:
1. nenhum fluxo de produção dependente de tabela/função legada.

**Aceite**:
1. inventário pós-limpeza sem duplicidade funcional.

---

## Fase 9 - Validação final e encerramento

**Objetivo**: fechar projeto com evidência operacional.

**Tasks**:
1. E2E de contratação, upgrade, downgrade, cancelamento, renovação.
2. reconciliação financeira completa por período de validação.
3. teste de rollback controlado e disaster drill.
4. documento final de operação e suporte.

**DoD**:
1. KPIs estáveis em janela acordada.

**Aceite (Go Live definitivo)**:
1. zero divergência financeira crítica.
2. zero bug P0 de entitlement.
3. sem dependência de legado bloqueador.

---

## 6. Backlog operacional do Kiro (sequência exata)

1. Executar Fase 1.1 e registrar aprovação.
2. Executar Fase 2 com feature flags e migração progressiva.
3. Executar Fase 3 e publicar contratos de API.
4. Executar Fase 4 com plano de cutover e rollback explícitos.
5. Executar Fase 5 e Fase 6 em paralelo controlado (sem sobreposição de write-set).
6. Executar Fase 7 antes de iniciar remoções da Fase 8.
7. Executar Fase 8 com janela de observação.
8. Executar Fase 9 e emitir relatório de encerramento.

---

## 7. Critérios globais de pronto

1. Um único caminho canônico para catálogo, contrato e webhook.
2. Entitlement resolvido e auditável no backend.
3. Catálogo versionado e contrato com snapshot imutável.
4. Frontend sem regras comerciais hardcoded.
5. Cobrança reconciliada com ledger interno.
6. Legado removido ou isolado com prazo de expiração cumprido.

---

## 8. Anti-patterns proibidos

1. criar plano por microcategoria.
2. manter webhooks paralelos sem deadline de sunset.
3. calcular entitlement em componente.
4. alterar contrato ativo retroativamente por mudança de catálogo.
5. introduzir nova tabela paralela de assinatura fora do plano aprovado.

---

## 9. Artefatos obrigatórios por fase (saídas)

1. Fase 1.1: `F1_1_SANEAMENTO_MODELAGEM.md`
2. Fase 2: `F2_MIGRATIONS_E_BACKFILL_REPORT.md`
3. Fase 3: `F3_SERVICES_CONTRACTS_REPORT.md`
4. Fase 4: `F4_WEBHOOK_CUTOVER_REPORT.md`
5. Fase 5: `F5_ADMIN_GOVERNANCA_REPORT.md`
6. Fase 6: `F6_FRONTEND_GATES_MIGRATION_REPORT.md`
7. Fase 7: `F7_SSOT_ENFORCEMENT_REPORT.md`
8. Fase 8: `F8_LEGACY_SUNSET_REPORT.md`
9. Fase 9: `F9_FINAL_ACCEPTANCE_REPORT.md`

---

## 10. Estado final esperado

Ao final da Fase 9, a plataforma deve operar monetização multi-vertical com:
1. catálogo comercial versionado,
2. contrato canônico único,
3. cobrança recorrente/transacional reconciliada,
4. resolução de entitlement centralizada,
5. zero acoplamento estrutural a gastronomia no domínio de billing.

---

**Última atualização**: 2026-04-21
**Estado**: Documento mestre de execução aprovado para Kiro
