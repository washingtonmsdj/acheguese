# Validacao atual — Modulo de Empresas

**Data do checkpoint:** 2026-09-06  
**Checkpoint tecnico:** `4b90fa64ff22cd12513982815df6415ab33f0dba`  
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

## G6 — autorizacao, lifecycle e confiabilidade de mutacoes

### Autorizacao negativa

A fronteira RLS de Business foi provada no Supabase canonico com
`tests/security/business-data-authorization-remote-probe.sql`, versionado em
`14aa448ddf634a3b55b42479c40f8754d8197621`.

O probe executa em `BEGIN ... ROLLBACK` e comprovou:

- owner: `private.can_operate_business_profile=true` e linha privada visivel;
- autenticado nao-owner: helper `false`, `read=0`, `update=0` e DELETE negado;
- nome/status preservados apos a prova;
- nenhuma mutacao persistente deixada no ambiente alvo.

### Lifecycle funcional positivo

O fluxo positivo foi tornado browser-only e usa exclusivamente a fixture Auth dedicada
`account-authenticated-e2e`; o usuario real `washingtonmsdj` nao participa do teste.

Cortes principais:

- `126da4a920cbb38da03b202b69f8e03b45808647`: cria o lifecycle
  `create -> edit -> pagina publica -> gestao -> cleanup` pela propria RLS do owner;
- `0f5ccbef165f73f3142ef69e7f0cc8549990627c`: deixa o spec mutante default-deny
  e o habilita somente pelo runner canonico
  `test:e2e:business-lifecycle-authenticated`, com `retries=0`;
- nenhum service-role e exposto ao browser job;
- cleanup aceita somente a fixture dedicada e empresas com prefixo tecnico G6.

A execucao hosted desse lifecycle ainda nao foi observada porque os jobs GitHub continuam
encerrando antes do primeiro step (`steps=null`). O Heavy Pre-Merge Certification permanece
o executor same-SHA canonico quando o runner self-hosted estiver disponivel.

### Partial state — estrategia aprovada

Nao foi criada segunda autoridade, RPC novo ou transacao artificial.

**Create — compensacao canonica**

`ad08edeaa6056df127996bb310e77ad6113bbbf8` adicionou compensacao usando somente owners
existentes:

1. se um profile Business ja foi criado, `ProfileService.deleteProfile()` e executado primeiro;
2. as FKs de `business_data`, membership, stats, horarios, contatos privados e demais
   subrecursos relevantes do create usam cascata a partir do profile/business;
3. se o fluxo criou um endereco novo, `AddressService.deleteAddress()` roda depois;
4. falha de rollback e registrada, mas nunca mascara o erro original.

O remoto confirmou DELETE de profile para o proprio owner, ownership automatico de address
e cascatas necessarias para esse lifecycle inicial.

**Update — compensacao minima + retry idempotente**

`7d7775456d4ce3105d05e7d7a23d8ca10be32fc4` fecha o unico caso nao-idempotente:
um endereco novo criado antes de `business_data` e removido se a escrita principal falhar.
Depois que `business_data` persistiu, o endereco e preservado e o retry converge porque:

- profile/business usam updates deterministas;
- horarios usam upsert por `business_id,day_of_week`;
- contatos usam RPC transacional com `ON CONFLICT` por canal.

**Soft delete — retry convergente**

A ordem continua deliberadamente segura: primeiro `business_data.status=deleted`, depois
`profiles.is_active=false`. Se a segunda escrita falhar, repetir a operacao e idempotente e
conclui a desativacao sem restaurar publicacao intermediaria.

## G6 — gestao delegada, superfícies reais e cobertura

Cortes adicionais de 2026-09-06 fecharam lacunas de produto que ainda pareciam prontas
sem estarem operacionalmente completas:

- Pessoas e acesso agora preserva falha de leitura e mostra retry, em vez de converter erro
  de autorizacao/rede em "Nenhum membro adicionado";
- transferencia estrutural de propriedade, ja existente no backend canonico, passou a ter
  caminho de produto para o Proprietario, sem UUID manual e sem segunda autoridade;
- Link premium deixou de ter CTAs cenograficos: preview abre o mini-site, QR usa
  `QrImageGenerator` canonico e copiar link usa o clipboard central;
- CTAs de "Editar dados" em Dados/Anuncios/Configuracoes convergem para
  `businessManagementRoutes.edit()`; Anuncios nao envia mais o usuario para uma tela
  somente leitura quando o territorio principal precisa ser corrigido;
- o contrato de coverage foi desambiguado de ponta a ponta: `Business.id` continua sendo
  o Profile ID para navegacao/gestao e `Business.business_data_id` e o unico
  `service_areas.entity_id` valido para `entity_type='business'`;
- editor e pagina publica usam `business_data.id` para coverage e falham de forma segura
  quando esse identificador canonico nao estiver carregado;
- Supabase remoto e source estao alinhados em
  `20260906112658_allow_delegated_business_coverage_g6.sql`: mutacao de coverage exige
  o perfil Business correspondente ativo e reutiliza `private.can_manage_profile`,
  permitindo Proprietario ou Gestor ativo sem liberar Membro comum;
- o banco tinha 0 linhas de coverage Business no momento da correcao, portanto nao houve
  backfill ou transformacao de dado existente;
- `tests/security/business-coverage-delegated-management-g6.test.ts` protege a identidade
  `business_data.id` e a autoridade delegada no mesmo ratchet.


## G6 — identidade Business, Billing e Gestor — 2026-09-06

O sweep de extensoes da empresa fechou uma ambiguidade transversal que afetava Billing,
Gastronomia, Education e o workspace privado:

- `profiles.id` permanece a identidade de rota, ownership e autoridade multi-profile;
- `business_data.id` e a identidade canonica das extensoes Business: Billing,
  Gastronomia, coverage, menus, horarios, delivery areas e source operacional de pedidos;
- o dashboard Business e seus children agora carregam explicitamente os dois IDs;
- o workspace privado preserva os dois IDs no read model, sem descartar
  `business_data.id`.

### Billing operacional vs financeiro

A leitura operacional de plano/entitlements de Business deixou de depender de SELECT
browser em `user_subscriptions`, cuja RLS e corretamente owner-only.

- `EntitlementResolver` usa `BillingEntitlementsRpcService.getBusinessSubscriptionSnapshot`
  quando `subscription_scope='business'`;
- user-scope continua lendo a assinatura do proprio usuario pelo contrato existente;
- o broker retorna apenas snapshot sanitizado: plan code, status, periodo operacional e
  contract snapshot necessario aos entitlements;
- `useBusinessSubscription` passou a ser read model operacional e nao projeta detalhes
  financeiros privados;
- `useEntitlements.can()` e `EntitlementResolver.check()` continuam tipados somente
  por `PlanEntitlements`, portanto metadados como `subscriptionStatus` nao viram
  capabilities por acidente;
- o workspace privado agora usa o mesmo `EntitlementResolver`; Gestor nao cai mais
  artificialmente para Free por causa da RLS financeira.

### Proprietario vs Gestor

`BusinessOwnershipService` agora preserva a role real:

- Proprietario estrutural: `owner`;
- Gestor delegado ativo: `admin`;
- Membro comum: sem autoridade de gestao.

O metodo historico `isOwner()` permanece bridge semantica de "pode gerenciar" para nao
quebrar callers, mas `resolveManagementRole()` e `isDirectOwner()` tornam a distincao
explicita.

Billing mutante permanece deliberadamente owner-only:

- a pagina **Planos da empresa** nao redireciona mais para `/planos` user-scope;
- checkout Business usa `business_data.id`, `subscriptionScope='business'` e
  `entityFamily='company'`;
- Gestor pode ver o plano e os recursos, mas nao alterar assinatura;
- Education preserva `education_profiles.business_id = profiles.id`, traduzindo para
  `business_data.id` apenas ao cruzar a fronteira de Billing.

### Broker remoto e prova de autorizacao

`billing-entitlements-rpc` foi publicado no Supabase canonico como **v9 ACTIVE** com
`verify_jwt=true`.

O source remoto revalidado contem:

- action `getBusinessSubscriptionSnapshot`;
- `requireOperationalAccount`;
- validacao UUID do `businessDataId`;
- autorizacao por `broker_user_can_manage_profile`;
- retorno sanitizado de `current_period_end`.

O helper `public.broker_user_can_manage_profile` continua executavel somente por
`postgres` e `service_role`; `anon` e `authenticated` nao possuem EXECUTE direto.

Probe runtime com fixtures tecnicas temporarias no perfil
`E2E Education Business RPC`:

- owner -> `private.user_can_manage_profile=true` e broker `true`;
- Gestor/admin -> `true` / `true`;
- Membro -> `false` / `false`;
- cleanup final: **0 memberships de fixture restantes**.

No momento da prova, `user_subscriptions` possuia **0 assinaturas business-scope**; portanto
nao foi fabricada assinatura paga apenas para validar UI. A prova HTTP com JWT descartavel
permanece pertencendo ao runner autenticado existente; nao foi criado endpoint de debug nem
alterado Auth para contornar essa ausencia de sessao no conector atual.

### Ratchet

`tests/architecture/business-extension-identity-g6.test.ts` protege agora:

- Profile ID vs `business_data.id`;
- workspace privado brokerado;
- Gastronomia por data ID e rotas por Profile ID;
- broker Business + metadata operacional;
- owner vs Gestor;
- mutacao financeira owner-only;
- adapter Education -> Business Billing;
- identidade de Billing no QR.

Inspecao programatica do source atual: **19/19 invariantes PASS**. Isso e evidencia dirigida
de contrato, nao substitui lint/typecheck/Vitest hosted do mesmo SHA.


## G6 — autoridade institucional publica e Claims — 2026-09-06

O fluxo de reivindicacao institucional de Business/Education foi reconciliado sem criar
um segundo ACL nem um segundo mecanismo de transferencia de ownership.

### Entrada publica

- `BusinessClaimService` deixou de aceitar `userId` vindo da UI e deriva o requerente
  da sessao canonica via `SessionService.getCurrentUser()`;
- perfis publicos de escola publica com `is_claimable=true` agora exibem
  **Solicitar administracao institucional**;
- a solicitacao exige uma referencia publica verificavel por URL
  (`official_source_url`), com no maximo 5 referencias e somente `http/https`;
- nenhum bucket de documento sensivel foi reativado. O bucket historico
  `verification-documents` permanece dormente/fail-closed conforme o SSOT de Media;
- a UI avisa explicitamente para nao enviar documentos pessoais nem dados de alunos.

### Revisao administrativa

A fila Admin agora:

- identifica claims de escola publica;
- mostra as URLs de evidencia informadas;
- exige justificativa de revisao com pelo menos 10 caracteres antes de aprovar;
- envia `reviewNotes` ao broker `admin-business-rpc`, que continua sendo a unica
  superficie client-side de resolucao administrativa.

A UI nao e a autoridade de seguranca. O banco revalida a mesma regra.

#
## G6 — Explorer Education server-side + grupo territorial — 2026-09-06

O Explorer publico de Education deixou de depender de filtragem client-side sobre paginas
parciais e passou a ter um read model publico paginado/filtrado antes do LIMIT.

### Read model publico

Migration `20260906130025_add_public_education_search_read_model_g6.sql` criou:

- `public.list_public_education_profiles`;
- `public.list_public_education_districts`.

Ambos sao `STABLE SECURITY INVOKER`, com `statement_timeout='3s'`, validacao bounded de
territorio/filtros/paginacao e EXECUTE apenas para `anon/authenticated` depois de revoke
explicito de PUBLIC.

O contrato aplica antes da paginacao:

- cidade/bairro;
- busca textual;
- niche;
- rede escolar;
- tipo de unidade;
- infraestrutura confirmada;
- `enrollment_open=true`;
- ordenacao;
- `total_count` exato do conjunto filtrado.

Probe real sob role `anon`:

- pagina 1: 5 linhas, `total_count=15`;
- municipal: 13/13;
- estadual: 2/2;
- busca `sao pedro`: 1/1, Escola Municipal Sao Pedro Nolasco;
- facetas de Salvador: 2 bairros com instituicoes, somando as 15 escolas piloto.

O frontend foi alinhado ao mesmo SSOT:

- `education.queries.ts` chama os RPCs tipados;
- `useEducationList` envia filtros ao servidor com debounce;
- `EducationExplorerPage` usa `totalCount` server-side;
- `fetchNextPage` ganhou CTA real **Carregar mais**;
- `filterEnrichedProfiles` e estados de filtro dormentes foram removidos;
- contagens de categoria deixaram de afirmar totais baseados apenas em paginas carregadas.

### Grupo territorial

O routing ja distinguia bairro de grupo por `useResolveTerritoryFromUrl`, mas o Explorer
retornava cedo o param `:district`. Como o mesmo segmento aceita slug de grupo em rotas de
modulo, `complexo-do-nordeste-de-amaralina` seria enviado ao read model como se fosse
`/br/ba/salvador/complexo-do-nordeste-de-amaralina`.

Migration `20260906133701_scope_public_education_search_to_resolved_locations_g6.sql`
corrigiu o contrato sem duplicar a autoridade territorial:

- os dois RPCs recebem `p_location_ids uuid[]` opcional;
- a cidade continua sendo o envelope obrigatorio;
- `location_ids` apenas restringe o conjunto dentro da cidade;
- maximo de 250 IDs e NULL rejeitado;
- as assinaturas antigas foram removidas, sem overload legado.

O Explorer agora reutiliza o grupo **ja resolvido** pelo routing:

- `resolved.group.members`;
- apenas membros com `status='active'`;
- grupo nao e convertido em district;
- query fica fail-closed enquanto o escopo de rota nao estiver resolvido;
- facetas de bairro recebem o mesmo `location_ids`;
- rota fixa de bairro esconde o filtro removivel de Bairro, evitando estado visual falso.

Grupo real usado no probe: **Complexo do Nordeste de Amaralina**:

- 4 membros ativos: Chapada do Rio Vermelho, Nordeste de Amaralina, Santa Cruz e
  Vale das Pedrinhas;
- grupo completo: 15/15 escolas piloto;
- somente Nordeste de Amaralina: 4/4;
- mesmos UUIDs com cidade `sp/sao-paulo`: 0;
- facetas dentro do grupo: 2 bairros que hoje possuem escolas, total 15.

Pos-condicao remota:

- existe apenas a assinatura nova de cada RPC;
- ambos `security_definer=false`;
- `anon_execute=true`;
- `authenticated_execute=true`;
- Security Advisor nao adicionou finding especifico desses RPCs.

Ratchet:
`tests/architecture/public-education-territorial-read-model-g6.test.ts`.

Isso fecha o **read model escalavel e a semantica bairro/grupo**. Nao fecha a cobertura
municipal: o banco continua com 15 escolas piloto. O proximo trabalho de dados deve ser
ingestao idempotente por INEP com baseline oficial e provenance por fato.

## Banco / RLS / ownership

Tres migrations remotas e versionadas fecham o contrato:

- `20260906123911_harden_public_education_claim_evidence_g6.sql` introduziu o
  contrato de evidencia oficial. Durante o probe, foi detectado que a primeira versao
  da policy possuia shadowing SQL em uma referencia nao qualificada; a migration foi
  preservada historicamente como aplicada, sem rewrite retroativo;
- `20260906124554_fix_business_claim_canonical_transfer_g6.sql` extraiu
  `private.profile_transfer_ownership_core` como unica mutacao estrutural de ownership.
  A facade normal `profile_transfer_ownership` chama o core com
  `keep_previous_owner_as_manager=true`; Claims de diretorio curado chamam o mesmo
  core com `false`, desativando o custodiante tecnico anterior sem apagar a trilha;
- `20260906124739_route_business_claim_requestability_through_helper_g6.sql`
  moveu a decisao RLS para o helper bounded
  `private.business_claim_is_requestable(business_data_id, documents)`, evitando
  cross-table RLS fragil e exigindo evidencia valida para Education publica.

ACL remoto revalidado:

- `profile_transfer_ownership_core`: anon=false, authenticated=false,
  service_role=true;
- `profile_transfer_ownership`: anon=false, authenticated=false,
  service_role=true;
- `admin_resolve_business_claim`: anon=false, authenticated=false,
  service_role=true;
- os dois helpers booleanos de request/evidence sao executaveis por
  `authenticated` apenas como predicados bounded de RLS e nao retornam dados privados.

A condicao antiga `owner/admin ativo => already_managed` foi corrigida. Depois da
invariante de membership owner espelho, ela tornava todo cadastro claimable com owner
placeholder impossivel de reivindicar. Agora:

- o owner estrutural placeholder e permitido enquanto o Business continua em
  custody claimable;
- qualquer Gestor `admin` adicional ativo continua bloqueando a tomada;
- a aprovacao muda `profiles.user_id` pela autoridade canonica;
- o novo owner ganha membership `owner` ativa;
- o custodiante tecnico anterior vira `admin` **inativo** no claim de diretorio;
- `business_data.metadata` passa a `custody_status='claimed'` e registra
  `claimed_user_id` + `previous_custodian_user_id`.

### Provas runtime com ROLLBACK

Target tecnico da prova: **Escola Municipal Sao Pedro Nolasco**; requerente e Admin foram
identidades E2E, nunca o usuario real como requerente.

Probe do fluxo institucional:

1. claim publica sem evidencia -> **RLS blocked**;
2. claim com `official_source_url` -> **created**;
3. runtime administrativo reproduzido como `service_role` sem `sub`,
   igual ao cliente `supabaseAdmin` -> **PASS**;
4. aprovacao com review curto -> **public_education_claim_requires_review_notes**;
5. aprovacao completa -> **canonical_transfer_ok**:
   novo `profiles.user_id`, novo owner ativo, placeholder anterior `admin/inactive`,
   custody `claimed` e claim `aprovada`.

A transferencia normal tambem foi provada separadamente com rollback:

- novo owner -> `owner/active`;
- proprietario anterior -> `admin/active`.

Pos-probe:

- **0 claims de prova persistidas**;
- escola publica original voltou ao owner placeholder e membership `owner/active`;
- nenhum dado de producao foi transferido permanentemente.

### Ratchet / limite de evidencia

`tests/security/business-claim-authority-g6.test.ts` agora protege:

- FK de Claim para `business_data.id`;
- ownership estrutural por um unico core;
- facade normal mantendo ex-owner como Gestor;
- Claim institucional desativando custodiante tecnico;
- requestability RLS por helper bounded;
- evidencia oficial em Education;
- sessao canonica no ClaimService;
- revisao humana obrigatoria no Admin;
- broker admin como unica resolucao client-side.

Inspecoes dirigidas do source/migrations fecharam **7/7** invariantes finais deste corte.
O Security Advisor nao adicionou finding especifico de Claims/ownership; debitos globais
historicos continuam fora deste corte.

Isso **nao substitui** lint/typecheck/Vitest/E2E/build/deploy same-SHA. Tambem nao resolve
a autoridade herdada/revogavel de Prefeitura/Secretaria sobre multiplas escolas: o fluxo
fechado aqui e de **uma instituicao individual por claim revisado**.

## Banco / RLS

O checkpoint de G5 permanece a referencia para schema/RLS/grants/legados. Em particular:

- o snapshot oficial Supabase foi sincronizado integralmente, sem patch manual;
- drift de source revelado pelo snapshot foi corrigido;
- blockers B0–B3 estao fechados;
- novo drift deve ser tratado como regressao focada, sem reabrir a campanha global de G5.

## Validacao observada

Ultima prova hosted ampla com steps reais antes da degradacao de alocacao:
`f92bee10a3133c56d37d34949a750429dfe24f73`.

Nesse SHA passaram lint/typecheck, hardcoded credentials, Maps Architecture, Phase Core Gate,
Runtime Vitest, E2E fixture-backed, Account E2E autenticado e Regression Check.

Nos SHAs G6 atuais, GitHub Actions continua encerrando jobs antes de qualquer step
(`steps=null`), inclusive no checkpoint `ff4fb0d9322a54d26bae3b5ea3e2ddf6a5460bda`.
Lint/typecheck, Runtime Vitest, Phase Core Gate, E2E fixture-backed e Account E2E falharam
sem `steps`, portanto continuam como blocker de infraestrutura/pre-step e nao como evidencia
de falha de source.

Vercel fornece validacao independente de source/build:

- `126da4a920cbb38da03b202b69f8e03b45808647`: READY;
- `0f5ccbef165f73f3142ef69e7f0cc8549990627c`: READY;
- `ad08edeaa6056df127996bb310e77ad6113bbbf8`: READY;
- `7d7775456d4ce3105d05e7d7a23d8ca10be32fc4`: build iniciado; security validation passou antes do checkpoint documental.

Queue/cancel por commits supersedidos nao deve ser classificado como falha de source.\n\n## O que ainda bloqueia Business READY / MVP

- executar o lifecycle autenticado `create -> edit -> pagina publica -> gestao -> cleanup`
  em runner real no mesmo SHA, com `retries=0`;
- obter lint/typecheck/unit/security/E2E com steps reais no mesmo SHA ou no Heavy Certification
  explicitamente fixado ao SHA;
- concluir deploy + smoke do mesmo SHA antes de declarar Business READY.

Cupons/promocoes nao bloqueiam Empresas base: `launchScope.coupons=false`, rotas publicas/admin
estao pausadas e a aba Business fica escondida. O contrato `business_id` de coupons permanece
divida **PAUSED** para a futura ativacao dessa feature, sem CRUD por empresa enquanto isso.

## Proximo passo

1. executar Heavy Pre-Merge Certification fixado ao HEAD G6 quando o runner self-hosted
   estiver disponivel; o script Account agora inclui o lifecycle Business;
2. classificar qualquer falha funcional real do lifecycle sem reruns amplos;
3. executar smoke pos-deploy do mesmo SHA;
4. marcar Empresas base READY somente depois dessas evidencias;
5. em seguida iniciar a certificacao do proximo modulo da ordem G6.

## Do not repeat

- nao recriar Toné Pizzaria ou outra empresa demo dentro de `src/`;
- nao restaurar `BusinessTabs`, fluxo fake de agendamento, tabs legados ou componentes base sem caller;
- nao reintroduzir bridges core↔module aposentados;
- nao inventar writer/RPC/delete compensatorio para mascarar falta de transacao;
- nao interpretar `steps = null` como falha de lint/test/source;
- nao declarar MVP antes de same-SHA release/deploy/smoke.
