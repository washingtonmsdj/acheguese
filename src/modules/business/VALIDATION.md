# Validacao atual — Modulo de Empresas

**Data do checkpoint:** 2026-08-29  
**Checkpoint tecnico:** `6722cf2f8878059022bc5f1f7715e998e1c79bb1`  
**Status:** G4 SSOT SOURCE CLOSED — NAO MVP CERTIFICADO

Este arquivo registra o estado tecnico atual de Business. Fechar G4 significa que ownership, contratos e boundaries de source apontam para owners canonicos e que o estado remoto conhecido nao contradiz essa autoridade. Isso **nao** certifica atomicidade, banco completo, E2E, deploy ou MVP; essas provas pertencem a G5/G6/G7.

## Arquitetura / ownership

- UI/aplicacao permanece em `src/modules/business`.
- Dominio, persistencia e integracoes pertencem a `src/core/business`.
- `tools/architecture/validate-business-module-boundaries.ts` exige zero acesso runtime direto a `@/integrations/*` e `@supabase/supabase-js` em `src/modules/business`.
- `BusinessService.createBusiness()` e a autoridade de criacao geral. `useBusinessCreateMultiProfile` passou a ser apenas compatibility hook de UI e o caminho administrativo ja delegava ao mesmo owner.
- mutacoes runtime de `business_data` fora de `src/core/business` sao bloqueadas pelo validator. `NetworkService` permanece dentro do mesmo owner de dominio e cuida especificamente do lifecycle de rede/filiais.
- `AdminService.toggleBusinessStatus()` deixou de escrever `business_data` diretamente e delega ao Business owner.
- a facade antiga `BusinessService.getStats()` foi retirada depois de confirmar zero callers TypeScript; ela devolvia valores incompletos/fixos e nao era contrato confiavel.

## RLS e autoridade conhecida no banco alvo

A revalidacao remota de 2026-08-29 confirmou RLS nas tabelas centrais verificadas e o mesmo contrato de gestao para os subrecursos:

- `business_data`: `private.can_operate_business_profile(profile_id)`;
- `business_products`: `private.can_manage_profile(profile_id)`;
- `business_services`: `private.can_manage_profile(business_id)`;
- `business_gallery`: resolve o `profile_id` via `business_data` e usa `private.can_manage_profile`;
- `business_stats`: `private.can_manage_profile(profile_id)`.

`private.can_operate_business_profile(uuid)` foi revalidada no banco e delega diretamente a `private.can_manage_profile(uuid)`. `can_manage_profile` reconhece o dono direto de `profiles.user_id` ou membership ativa `owner/admin`; `member` nao recebe autoridade de gestao.

`business_views` ficou fora desse contrato: a tabela ainda existe e possui policies historicas, mas o runtime de Business nao deve mais depender dela. Sua classificacao/remocao pertence a G5.

## Analytics

O antigo read model paralelo foi aposentado no runtime:

- `business-analytics.service.ts` nao consulta mais `analytics_events.event_name` nem `business_views`; ele delega a `AnalyticsService.getMetrics()`;
- `business.admin.ts` passou a obter total/7 dias/30 dias pelo mesmo Analytics SSOT;
- Gastronomy deixou de chamar `get_business_views_summary` e `get_business_views_last_7_days`; usa `AnalyticsService.getMetrics()` e `getDailyMetrics()`;
- a dashboard deixou de exibir "agendamentos" como metrica porque esse evento nao existe no contrato canonico atual; a UI mostra apenas metricas sustentadas pelo Analytics SSOT;
- o validator bloqueia a reintroducao de `business_views`/RPCs `get_business_views_*` no runtime de `src/core/business` e exige delegacao do adapter de Business ao `AnalyticsService`.

## Fluxo de criacao

A regra de **quem cria Business** esta consolidada, mas a confiabilidade operacional ainda nao esta certificada.

O fluxo geral sincroniza, em sequencia, endereco, profile, membership, `business_data`, `business_stats`, horarios e contatos. Uploads de logo/banner ocorrem depois da criacao canonica. Como isso nao esta encapsulado numa unica transacao, falhas intermediarias ainda podem exigir compensacao/retentativa.

Isso nao reabre um segundo SSOT: e um blocker de confiabilidade do fluxo e deve ser provado/corrigido antes da certificacao do modulo em G6.

## Legado / dados

Continuam fora do fechamento G4 e devem ser tratados com provenance em G5:

- tabela `businesses` legada;
- `business_subscriptions` legada, enquanto Billing atual usa `user_subscriptions`;
- `business_views` e RPCs historicos de views, agora sem dependencia runtime de Business conhecida;
- possiveis profiles business sem `business_data` e `business_data` sem `business_stats` observados em checkpoints anteriores.

Contagens historicas nao autorizam exclusao automatica. Antes de qualquer DROP/DELETE, revalidar o ambiente alvo e provar provenance/dependencias.

## O que ainda bloqueia MVP / modulo READY

- atomicidade ou compensacao/idempotencia comprovada no create/update/delete relevante;
- drift completo de migrations/schema/RLS/grants e legados fechado em G5;
- limpeza de dados tecnicos somente com provenance explicita;
- fluxos reais create -> edit -> pagina publica -> gestao certificados;
- casos negativos de autorizacao executados no ambiente alvo;
- lint/typecheck/test/security/E2E/build executados de verdade no mesmo SHA;
- deployment e smoke do mesmo SHA.

## Conclusao

**Business pode ser considerado fechado para G4 (SSOT/ownership de source), mas nao esta MVP certificado.** O proximo trabalho global do plano deve avancar para `Territory/location`. Os riscos de atomicidade, legado, dados e runtime permanecem abertos nas fases G5/G6/G7 e nao devem ser reinterpretados como resolvidos por este checkpoint.
