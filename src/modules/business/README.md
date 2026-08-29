# Modulo de Empresas

**Status:** G4 SSOT SOURCE CLOSED — NAO MVP CERTIFICADO  
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

`tools/architecture/validate-business-module-boundaries.ts` protege essa regra para todo o modulo, incluindo Gastronomy e Education. O mesmo validator:

- exige que o cadastro delegue a `BusinessService.createBusiness()`;
- bloqueia recriacao do antigo fluxo profile-first via `MultiProfileService`;
- impede mutacoes runtime de `business_data` fora de `src/core/business`;
- bloqueia a volta de `business_views` e dos RPCs `get_business_views_*` no runtime do owner;
- exige que o adapter de analytics de Business delegue ao `AnalyticsService`.

## SSOTs principais

- `src/core/business/services/BusinessService.ts`: facade publica do dominio;
- `src/core/business/services/business.queries.ts`: read model geral;
- `src/core/business/services/business.mutations.ts`: mutations gerais;
- `src/core/business/services/NetworkService.ts`: lifecycle especializado de rede/filiais dentro do mesmo owner `core/business`;
- `src/core/business/services/BusinessManagementService.ts`: gestao operacional;
- `src/core/business/services/BusinessOwnershipService.ts`: ownership/autorizacao de dominio;
- `src/core/business/services/BusinessUrlService.ts`: URL/slug;
- `src/core/business/types`: contratos canonicos;
- `src/core/public-identity`: identidade publica;
- `src/core/analytics/AnalyticsService.ts`: analytics canonico;
- `src/core/billing`: billing/assinaturas canonicas (`user_subscriptions`).

## Hardening concluido em G4

- membership de criacao passou pelo owner `ProfileMembersService`;
- `BusinessService.getStats()` incompleto foi aposentado depois de confirmar zero callers TypeScript;
- `useBusinessCreateMultiProfile` deixou de criar Profile separadamente e passou a delegar a `BusinessService.createBusiness()`;
- `AdminBusinessService.createBusinessProfile()` ja delegava ao mesmo owner, consolidando uma unica autoridade de criacao geral;
- `AdminService.toggleBusinessStatus()` deixou de executar `UPDATE business_data` diretamente e passou pelo Business owner;
- RLS remoto conhecido de `business_data`, produtos, servicos, galeria e stats foi revalidado contra a mesma autoridade `can_manage_profile`/wrapper compativel;
- `business-analytics.service.ts`, `business.admin.ts` e Gastronomy deixaram de depender de `business_views`/RPCs legados de views e passaram ao Analytics SSOT;
- a dashboard deixou de exibir agendamentos como metrica porque esse evento nao existe no contrato canonico atual;
- ratchets impedem regressao dessas decisoes.

## O que G4 NAO certifica

Fechar Business em G4 significa ownership/SSOT de source reconciliado. Ainda permanecem blockers reais para G5/G6/G7:

1. **Atomicidade/confiabilidade:** create sincroniza endereco, profile, membership, `business_data`, stats, horarios e contatos em sequencia; uploads de midia ocorrem depois. Falhas intermediarias precisam de compensacao/idempotencia comprovada.
2. **Legados de banco:** `businesses`, `business_subscriptions`, `business_views` e RPCs historicos precisam de classificacao/provenance antes de qualquer retirada.
3. **Higiene de dados:** profiles business sem `business_data` e outros residuos observados em checkpoints anteriores nao podem ser removidos por heuristica.
4. **Certificacao funcional:** create -> edit -> pagina publica -> gestao, autorizacao negativa, E2E, mobile e smoke precisam ser provados.
5. **Certificacao same-SHA:** lint/typecheck/test/security/build/deploy precisam executar de verdade; falha de runner/provider nao e PASS nem source failure.

## Criterio de MVP READY do modulo

Empresas so pode ser marcado como MVP certificado quando houver, no mesmo SHA:

1. atomicidade ou compensacao/idempotencia comprovada para fluxos mutaveis relevantes;
2. drift de migrations/schema/RLS/grants fechado no ambiente alvo;
3. nenhum acesso runtime fora dos owners canonicos;
4. fluxo create -> edit -> pagina publica -> gestao funcionando com dados reais;
5. estados loading/empty/error/auth corretos;
6. E2E sem fixtures confundidas com dados reais;
7. higiene/provenance de dados tecnicos comprovada;
8. casos negativos de autorizacao executados;
9. lint/typecheck/test/build/security executados de verdade;
10. deployment e smoke do mesmo SHA comprovados.

O checkpoint tecnico detalhado fica em `VALIDATION.md`; o SSOT global de execucao permanece em `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` e o plano permanente em `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`.
