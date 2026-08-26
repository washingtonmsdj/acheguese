# Validacao atual — Modulo de Empresas

**Data do checkpoint:** 2026-08-26  
**Baseline de source auditado:** `702012411cba62b019da89d79597e7d903ed6af4`  
**Status:** HARDENING — NAO MVP CERTIFICADO

Este arquivo substitui a validacao historica de 2026-07-04. Resultados antigos de lint/test/E2E nao devem ser usados como certificacao do HEAD atual.

## Pente-fino realizado

### Arquitetura

- UI/aplicacao permanece em `src/modules/business`.
- Domain/read-write/integrations pertencem a `src/core/business`.
- O acesso runtime direto encontrado no modulo geral estava em `public/services/PublicSnapshotRpcService.ts`; ownership foi movido para core e o path antigo virou bridge.
- `scripts/validate-business-module-boundaries.ts` exige zero acesso runtime direto a `@/integrations/*` e `@supabase/supabase-js` em todo `src/modules/business`.

### RLS e autorizacao no banco alvo

RLS esta habilitado nas tabelas centrais verificadas: `business_data`, `profiles`, `profile_members`, `business_gallery`, `business_hours`, `business_services` e `business_stats`.

`business_data` usa `private.can_operate_business_profile(profile_id)` em `USING` e `WITH CHECK`. Esse helper aceita owner da conta e memberships ativos com roles `owner`, `admin`, `manager` e `moderator`.

A autorizacao ainda nao e uniforme nos subrecursos:

- `business_hours` usa `private.can_manage_profile`, limitado a owner/admin;
- `business_gallery`, `business_services`, `business_products`, `business_stats` e `business_views` ainda usam predicates historicos baseados diretamente em `profiles.user_id` em pelo menos parte das operacoes;
- isso precisa ser reconciliado com a matriz de roles oficial antes da certificacao.

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
- perfis `profile_type='business'`: 186;
- perfis business sem `business_data`: 89;
- desses 89, 80 possuem nome com padrao tecnico e 83 possuem nome/identificador com padrao tecnico de teste/fixture/auditoria;
- `business_data` sem profile: 0;
- `business_data` sem `business_stats`: 100.

Esses numeros nao autorizam remocao automatica. Provenance deve ser comprovada antes de qualquer limpeza destrutiva.

### Fluxo de criacao

O write model geral cria/sincroniza multiplos recursos: endereco, profile, profile_members, business_data, business_stats, horarios e contatos. Essas operacoes nao aparecem encapsuladas em uma unica transacao SQL no client source atual.

Tambem existe `useBusinessCreateMultiProfile`, que cria um profile pelo `MultiProfileService` e depois completa os dados de Business. Esse caminho deve ser reconciliado com `BusinessService.createBusiness` para impedir regras concorrentes e reduzir estados parciais.

### Estatisticas

A Central usa `BusinessManagementService.getBusinessStats`, que le `business_data`/Business atual. A API separada `BusinessService.getStats()` permanece incompleta (`active`/`by_category`) e deve ser reconciliada ou removida antes de ser considerada contrato confiavel.

## Bloqueadores abertos

- consolidar um unico fluxo de criacao e garantir atomicidade/compensacao;
- unificar policies de subrecursos com a matriz de roles oficial;
- reconciliar/remover tabelas legadas (`businesses`, `business_subscriptions`) com prova de nao uso/perda;
- classificar e limpar dados tecnicos por provenance explicita;
- reconciliar `business_stats` ou remover a dependencia morta;
- corrigir/remover a API antiga `BusinessService.getStats()`;
- executar lint/typecheck/test/E2E/security/build no HEAD atual;
- validar deployment do mesmo SHA.

## Conclusao

O modulo de Empresas possui implementacao ampla e uma base de seguranca relevante, mas **nao esta comprovadamente completo nem sem erros**. Arquitetura de integracao pode ser fechada em zero no modulo; os maiores riscos restantes sao consistencia de autorizacao, atomicidade/duplicacao do fluxo de criacao, legado de schema/dados e ausencia de certificacao executavel atual.
