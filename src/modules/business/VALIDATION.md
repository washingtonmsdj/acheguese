# Validacao atual — Modulo de Empresas

**Data do checkpoint:** 2026-09-04  
**Checkpoint tecnico:** `b3591b819e4292e4953c0a4b2f1708ae5d402a82`  
**Status:** G6 EM CERTIFICACAO — NAO MVP CERTIFICADO

Este arquivo registra o estado atual de Business durante G6. O ownership/SSOT de source foi fechado em G4 e os blockers historicos de G5 foram encerrados conforme `docs/03-architecture/G5_CLOSURE_G6_CONTINUATION_2026-09-04.md`. O trabalho ativo agora e certificacao funcional e operacional do modulo.

## Autoridade / ownership

- UI e aplicacao permanecem em `src/modules/business`.
- Dominio, persistencia, contratos canonicos e integracoes pertencem a `src/core/business`.
- `BusinessService.createBusiness()` permanece a autoridade geral de criacao.
- `NetworkService` permanece o owner especializado do lifecycle de redes/filiais dentro de `core/business`.
- mutacoes de `business_data` fora de `src/core/business` continuam bloqueadas pelo validator arquitetural.
- URLs/slugs continuam sob `BusinessUrlService` + `PublicIdentityService`; fixtures de demo nao fazem mais parte dessa autoridade runtime.

## G6 — confiabilidade de mutacoes ja fechada

Slices #90–#92:

- falha em `business_stats` durante create agora fecha o fluxo e impede horas/contatos posteriores;
- preflight de slug (safety -> cooldown -> availability) ocorre antes da primeira mutacao persistente;
- rename sincroniza `profiles.name` e `business_data.business_name`;
- testes focados preservam as regressões desses tres contratos.

Slices #93–#98:

- CRUD/admin legado sem rota/caller foi retirado;
- save real e aguardado antes de sinalizar sucesso;
- mutacao browser de plano incompatível com Billing SSOT foi removida;
- dashboard Business ativo passou a usar metricas reais de Analytics, incluindo serie diaria real.

## G6 — consolidacao estrutural de 2026-09-04

Os seguintes cortes foram concluidos na `main`:

- `435da7f8ee670d7246620ac24a29502405f25569`: remove dashboard Business duplicado;
- `1f39f45fbae2f0fb91a6b9a38ef6d5ad8f1ed3fc`: promove Analytics real ao owner ativo;
- `755d8fcdbdb7b5a6688204ab7fd1b5c0a8a70a7d`: mantem cupons fail-closed sem inventar business identity;
- `d1671fd47e5aef51cdad76dc658fca1fa3abe7f2`: usa catalogo Billing real para planos;
- `db1cc3e6ce2250b55584b8917fff5992ddd18295`: remove bridge legado de `NetworkTab`;
- `73fb8142839fc624ed560a8365dbbda3bfbf369a`: remove superficie de agendamento que simulava sucesso sem persistencia;
- `d2b48cf7516fc01b4dc5fa5efe43eea6c8371404`: remove stack de tabs Business orfao e CTAs inertes;
- `2c9e45899a5f6d991d1f4e7085fd9a3645975f6f`: move a antiga empresa demo Toné Pizzaria para fixture exclusivamente de Playwright e remove atalhos/fixtures/assets do runtime;
- `b3591b819e4292e4953c0a4b2f1708ae5d402a82`: remove componentes Business base sem caller e limpa barrels publicos.

Ratchets arquiteturais foram adicionados para impedir recriacao das superficies aposentadas.

## Fixtures e dados de teste

A antiga excecao runtime `tone-cos-loja`/Toné Pizzaria foi removida de:

- `BusinessUrlService`;
- `PublicBusinessSnapshotService`;
- `EmpresaDetailLandingPage`;
- fixtures e assets em `src/` / `public/images/mock-tone-pizzaria`.

Os E2E que precisam de uma empresa deterministica agora instalam `tests/e2e/support/businessRouteFixtures.ts`, que intercepta somente requisicoes do navegador durante Playwright. O build de producao nao recebe esses dados.

## Confiabilidade residual — create/update/delete

A matriz de estado parcial de #90/#91 continua valida:

### create

Sequencia: address -> profile -> membership -> business_data -> business_stats -> hours -> contacts.

Falha tardia pode deixar etapas anteriores persistidas. Nao existe atualmente RPC/transacao Business canonica para compensacao total, e nenhum delete compensatorio ad hoc deve ser criado.

### update

Depois do preflight de slug: address -> profile -> business_data -> hours -> contacts.

Falha em etapa posterior pode manter mutacoes anteriores. O preflight evita apenas rejeicoes previsiveis antes da primeira escrita; nao transforma o fluxo em transacao.

### soft delete

`business_data.status=deleted` ocorre antes de `profile.is_active=false`. Se a segunda escrita falhar, Business fica soft-deleted enquanto o profile pode permanecer ativo.

**Decisao:** so implementar compensacao/transacao se aparecer um owner canonico seguro e provavel. Nao criar RPC, delete ou bypass apenas para fechar checklist.

## Banco / RLS

O checkpoint de G5 permanece a referencia para schema/RLS/grants/legados. Em particular:

- o snapshot oficial Supabase foi sincronizado integralmente, sem patch manual;
- drift de source revelado pelo snapshot foi corrigido;
- blockers B0–B3 estao fechados;
- novo drift deve ser tratado como regressao focada, sem reabrir a campanha global de G5.

## Validacao observada

Ultima prova hosted ampla com steps reais antes da degradacao de alocacao: `f92bee10a3133c56d37d34949a750429dfe24f73`.

Nesse SHA passaram:

- Lint + TypeScript;
- No Hardcoded Credentials;
- Maps Architecture;
- Phase Core Gate;
- Runtime Vitest;
- E2E fixture-backed;
- Account E2E autenticado;
- Regression Check.

Nos SHAs G6 mais recentes, GitHub Actions voltou a encerrar jobs antes de qualquer step (`steps = null`). Isso e falha de infraestrutura/pre-step, nao prova de source failure.

Vercel fornece sinal de build independente:

- `db1cc3e6ce2250b55584b8917fff5992ddd18295`: READY;
- `d2b48cf7516fc01b4dc5fa5efe43eea6c8371404`: READY;
- no ultimo snapshot deste checkpoint, `2c9e45899a5f6d991d1f4e7085fd9a3645975f6f` estava BUILDING e `b3591b819e4292e4953c0a4b2f1708ae5d402a82` QUEUED.

Queue/cancel por commits supersedidos nao deve ser classificado como falha de source.

## O que ainda bloqueia Business READY / MVP

- prova funcional create -> edit -> pagina publica -> gestao com dados reais/fixture tecnica autorizada;
- casos negativos de autorizacao no ambiente alvo;
- estrategia aprovada para partial state (transacao, compensacao segura ou idempotencia/retry comprovada) sem segunda autoridade;
- contrato de business identity para cupons antes de CRUD por empresa;
- lint/typecheck/test/security/E2E/build com steps reais no mesmo SHA;
- deploy e smoke do mesmo SHA.

## Proximo passo

1. obter a proxima execucao hosted com steps reais e classificar qualquer falha do HEAD atual;
2. executar/certificar o fluxo Business ponta a ponta sem mock runtime;
3. revisar partial-state somente se houver owner transacional/compensatorio canonico ou desenhar retry/idempotencia sem destruicao ad hoc;
4. manter cupons fail-closed ate contrato de identidade aprovado;
5. so marcar Business READY quando os criterios de G6/G7 do plano raiz estiverem comprovados.

## Do not repeat

- nao recriar Toné Pizzaria ou outra empresa demo dentro de `src/`;
- nao restaurar `BusinessTabs`, fluxo fake de agendamento, tabs legados ou componentes base sem caller;
- nao reintroduzir bridges core↔module aposentados;
- nao inventar writer/RPC/delete compensatorio para mascarar falta de transacao;
- nao interpretar `steps = null` como falha de lint/test/source;
- nao declarar MVP antes de same-SHA release/deploy/smoke.
