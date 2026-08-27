# Modulo de Empresas

**Status:** HARDENING — NAO MVP CERTIFICADO  
**Owner de UI/aplicacao:** `src/modules/business`  
**Owner de dominio, persistencia e integracoes:** `src/core/business`

Empresas e o bounded context base para perfis comerciais. Gastronomy e Education especializam esse dominio, mas nao substituem o modulo geral.

## Escopo funcional atual

- cadastro e edicao de empresa;
- pagina publica e identidade/slug canonicos;
- endereco e territorio;
- contatos e canais publicos;
- horario de funcionamento;
- secoes de servicos, produtos, portfolio, promocoes e cardapio;
- cobertura/area de atendimento;
- gestao de imagens e galeria;
- favoritos, reviews e metricas publicas;
- integracao com verticais especializadas;
- hooks e paginas de gestao/edicao.

## Fronteira arquitetural

Codigo em `src/modules/business` nao deve acessar `@/integrations/*` nem `@supabase/supabase-js` em runtime. Persistencia, RPCs, repositories e integracoes pertencem a `src/core/business` ou a outro owner `core` explicito.

`tools/architecture/validate-business-module-boundaries.ts` protege essa regra para todo o modulo, incluindo Gastronomy e Education. Imports estritamente `type` nao sao tratados como acesso runtime.

Os snapshots publicos usam contracts em `src/core/business/types/publicSnapshots.ts` e RPC boundary em `src/core/business/services/PublicSnapshotRpcService.ts`; os antigos paths em `src/modules/business/public` sao bridges de compatibilidade.

## SSOTs principais

- `src/core/business/services/BusinessService.ts`: facade publica do dominio;
- `src/core/business/services/business.queries.ts`: read model;
- `src/core/business/services/business.mutations.ts`: write model;
- `src/core/business/services/BusinessManagementService.ts`: gestao operacional;
- `src/core/business/services/BusinessOwnershipService.ts`: ownership/autorizacao de dominio;
- `src/core/business/services/BusinessUrlService.ts`: URL/slug;
- `src/core/business/types`: contratos canonicos;
- `src/core/public-identity`: identidade publica;
- `src/core/billing`: billing/assinaturas canonicas (`user_subscriptions`).

## Bloqueadores conhecidos para certificacao MVP

1. **Atomicidade de criacao:** a criacao de empresa envolve profile, membership, business_data, stats, endereco, horarios e contatos em operacoes sequenciais. Falha intermediaria pode deixar estado parcial; o fluxo deve convergir para uma operacao transacional/idempotente ou compensacao comprovada.
2. **Dois caminhos de criacao:** existe `BusinessService.createBusiness` e um fluxo multi-profile que cria perfil e depois completa Business. Os callers precisam ser reconciliados para uma unica regra operacional.
3. **Autorizacao de subrecursos:** `business_data` usa `private.can_operate_business_profile`, mas policies historicas de produtos/servicos/galeria/stats/views ainda usam predicates diferentes. Roles operacionais precisam de comportamento consistente.
4. **Legados de dados:** `businesses` e `business_subscriptions` ainda existem no banco; billing atual usa `user_subscriptions` como SSOT. Legados devem ser reconciliados e removidos/isolados sem perda de dados.
5. **Higiene de dados:** existem perfis business sem `business_data` e registros sem `business_stats`; grande parte tem assinatura de fixture/teste, mas limpeza deve usar provenance explicita, nunca heuristica destrutiva.
6. **API de estatisticas antiga:** `BusinessService.getStats()` ainda possui campos incompletos e nao deve ser usada como prova de metricas corretas enquanto nao for reconciliada/removida.
7. **Certificacao executavel:** lint, typecheck, testes, E2E, RLS/grants e deployment do mesmo SHA precisam executar com evidencia atual. Resultados historicos nao certificam o HEAD atual.

## Criterio de pronto

Empresas so pode ser marcado como MVP certificado quando houver, no mesmo SHA:

1. um unico fluxo canonico de create/update/delete, com atomicidade ou compensacao comprovada;
2. RLS/grants coerentes para owner/admin/manager/moderator e negativos para terceiros;
3. nenhum acesso runtime direto a infraestrutura em `src/modules/business`;
4. schemas, RPCs e migrations reconciliados com o banco alvo;
5. criacao -> edicao -> pagina publica -> gestao funcionando com dados reais;
6. estados loading/empty/error/auth corretos;
7. E2E sem fixtures confundidas com dados reais;
8. higiene/provenance de dados tecnicos comprovada;
9. lint/typecheck/test/build/security executados de verdade;
10. deployment do mesmo SHA comprovado.

O checkpoint tecnico detalhado fica em `VALIDATION.md`; o SSOT global de execucao permanece em `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`.
