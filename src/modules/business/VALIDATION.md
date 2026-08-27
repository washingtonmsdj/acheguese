# Validacao atual — Modulo de Empresas

**Data do checkpoint:** 2026-08-26  
**Baseline inicial auditado:** `702012411cba62b019da89d79597e7d903ed6af4`  
**Status:** HARDENING — NAO MVP CERTIFICADO

Este arquivo substitui a validacao historica de 2026-07-04. Resultados antigos de lint/test/E2E nao devem ser usados como certificacao do HEAD atual.

## Pente-fino realizado

### Arquitetura

- UI/aplicacao permanece em `src/modules/business`.
- Domain/read-write/integrations pertencem a `src/core/business`.
- O acesso runtime direto encontrado no modulo geral estava em `public/services/PublicSnapshotRpcService.ts`; ownership foi movido para core e o path antigo virou bridge.
- `tools/architecture/validate-business-module-boundaries.ts` exige zero acesso runtime direto a `@/integrations/*` e `@supabase/supabase-js` em todo `src/modules/business`.

### RLS e autorizacao no banco alvo

RLS esta habilitado nas tabelas centrais verificadas: `business_data`, `profiles`, `profile_members`, `business_gallery`, `business_hours`, `business_services` e `business_stats`.

A constraint real de `profile_members.role` permite somente `owner`, `admin` e `member`. No checkpoint, todas as memberships existentes estavam ativas e com role `owner`.

O contrato de gestao foi reconciliado para um unico significado: dono direto de `profiles.user_id` ou membership ativa `owner/admin`. `member` nao possui autoridade de gestao. `private.can_operate_business_profile` permanece apenas como compatibilidade para policies existentes e delega a `private.can_manage_profile`.

As policies de `business_gallery`, `business_products`, `business_services` e `business_stats` foram reconciliadas para a mesma autoridade, com `USING` e `WITH CHECK` explicitos. `BusinessOwnershipService` foi alinhado ao mesmo contrato e agora exige membership ativa, alem de reconhecer o dono direto do profile.

`business_views` permanece fora dessa reconciliacao porque o pente-fino provou que nao existe writer runtime atual para a tabela; ela nao deve ser promovida como SSOT de analytics.

### Billing

`src/core/billing/SubscriptionService.ts` declara `user_subscriptions` como SSOT. A tabela `business_subscriptions` ainda existe com registros legados, mas nao possui caller runtime no source atual. Sua policy historica de owner nao deve ser tratada como contrato canonico.

### Integridade de dados observada

No banco alvo durante o checkpoint:

- `business_data`: 100 registros;
- `businesses` legado: 3 registros;
- `business_products`: 0;
- `business_services`: 0;
- `business_gallery`: 3;
- `business_stats`: 0;
- `business_subscriptions` legado: 5;
- `business_views`: 0;
- perfis `profile_type='business'`: 186;
- perfis business sem `business_data`: 89;
- desses 89, 80 possuem nome com padrao tecnico e 83 possuem nome/identificador com padrao tecnico de teste/fixture/auditoria;
- `business_data` sem profile: 0;
- `business_data` sem `business_stats`: 100.

Esses numeros nao autorizam remocao automatica. Provenance deve ser comprovada antes de qualquer limpeza destrutiva.

### Fluxo de criacao

O write model geral cria/sincroniza multiplos recursos: endereco, profile, profile_members, business_data, business_stats, horarios e contatos. Essas operacoes nao aparecem encapsuladas em uma unica transacao SQL no client source atual.

O self-service de `CriarEmpresaPage` usa `useBusinessCreateMultiProfile`; `BusinessService.createBusiness` permanece utilizado pela superficie administrativa. Eles atendem superficies diferentes, mas ainda precisam compartilhar uma unica regra transacional/compensatoria para evitar divergencia e estado parcial.

### Analytics e estatisticas

A Central usa `BusinessManagementService.getBusinessStats`, que le `business_data`/Business atual. A API separada `BusinessService.getStats()` permanece incompleta (`active`/`by_category`) e deve ser reconciliada ou removida antes de ser considerada contrato confiavel.

O servico `business-analytics.service.ts` ainda possui drift de schema: le `business_views` (sem writer runtime e vazia) e consulta `analytics_events.event_name`, coluna que nao existe no banco atual. O SSOT canonico de analytics e `src/core/analytics/AnalyticsService.ts`, que usa `analytics_events.event_type`, `entity_type` e `entity_id` via RPCs canonicas. Essa duplicacao deve ser eliminada.

## Bloqueadores abertos

- consolidar a regra de criacao entre self-service/admin e garantir atomicidade/compensacao;
- migrar `business-analytics.service.ts` para o Analytics SSOT e apos prova remover/isolar `business_views`;
- reconciliar/remover tabelas legadas (`businesses`, `business_subscriptions`) com prova de nao uso/perda;
- classificar e limpar dados tecnicos por provenance explicita;
- reconciliar `business_stats` ou remover a dependencia morta;
- corrigir/remover a API antiga `BusinessService.getStats()`;
- executar lint/typecheck/test/E2E/security/build no HEAD atual;
- validar deployment do mesmo SHA.

## Conclusao

O modulo de Empresas possui implementacao ampla e uma base de seguranca relevante, mas **nao esta comprovadamente completo nem sem erros**. A fronteira de integracao e a matriz de autoridade foram endurecidas; os maiores riscos restantes sao atomicidade do fluxo de criacao, analytics duplicado/quebrado, legado de schema/dados e ausencia de certificacao executavel atual.
