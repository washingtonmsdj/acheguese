# FEED.P0.C - Review

Data: 2026-07-25

## Escopo Da Review

Auditoria exclusiva da Sprint FEED.P0.C, sem implementacao e sem alteracao de codigo.

Documentos comparados:

- `docs/feed/FEED-GOVERNANCE.md`
- `docs/feed/FEED-ROADMAP.md`
- `docs/feed/FEED-EXECUTION-PLAN.md`
- `docs/feed/FEED-P0.C-REPORT.md`

Objetivo auditado: toda criacao publica de post deve passar por `FeedService.createItem()` com `ResolvedTerritory`, `TerritoryFilter`, `Rollout` e `AccessPolicy`, sem fallback silencioso para bairro do perfil quando houver Territory resolvido pela rota.

## Resultado Executivo

A implementacao fechou corretamente o caminho principal de criacao usado por:

- `CreatePostModal`;
- `useCreatePost`;
- `ComunidadePage`;
- `NovoPostPage`;
- `CidadeLandingPage`;
- `UnifiedComposer`.

Porem a sprint ainda nao pode ser considerada oficialmente concluida porque a auditoria encontrou caminhos publicos/verticais que ainda criam posts diretamente por `postService.createPost()`, fora de `FeedService.createItem()`.

Tambem ha lacuna de testes: os testes de criacao cobrem contexto ausente, access policy e target invalido, mas nao cobrem diretamente criacao com rollout bloqueado nem mismatch de `TerritoryFilter` na operacao `createItem`.

## Findings

### P0.C-REV-01 - Ainda existem caminhos publicos/verticais criando posts fora do FeedService

Status: bloqueador.

Evidencia:

- `src/modules/mobility/hooks/useCommunityPosts.ts:52` chama `postService.createPost()`.
- `src/modules/mobility/components/community/CommunityRideFeed.tsx:51` chama `createPost()` do hook de Mobility.
- `src/core/work-opportunities/services/WorkOpportunitiesService.ts:552` chama `postService.createPost()`.
- `src/core/verticals/jobs/services/VagaPublicationDistributionService.ts:102` chama `postService.createPost()`.

Impacto:

- Essas criacoes nao passam por `FeedService.createItem()`.
- Essas criacoes nao recebem `FeedContext` canonico.
- Rollout e AccessPolicy nao sao validados pelo boundary do Feed antes da criacao.
- A regra da GOVERNANCE "Feed e a unica porta publica para criacao" ainda nao esta satisfeita globalmente.

Nuance de escopo:

- Mobility foi explicitamente excluido da implementacao da P0.C pelo prompt da sprint.
- Mesmo assim, a pergunta de review exige responder se existe algum caminho publico que ainda cria post fora de `FeedService.createItem()`.
- A resposta e sim. Portanto o relatorio `FEED-P0.C-REPORT.md` esta correto para o composer principal, mas exagera ao afirmar que nenhuma criacao publica restante bypassa o Feed.

Conclusao:

- P0.C nao pode ser encerrada oficialmente enquanto esses caminhos nao forem migrados ou registrados como excecoes formais fora do escopo da P0.C.

### P0.C-REV-02 - Cobertura de testes da criacao ainda nao cobre todos os cenarios criticos

Status: bloqueador de conclusao por criterio de governanca.

Coberto:

- Criacao com contexto pronto: `src/core/feed/__tests__/FeedService.spec.ts:184`.
- Criacao sem `ResolvedTerritory`: `src/core/feed/__tests__/FeedService.spec.ts:216`.
- AccessPolicy sem permissao de criacao: `src/core/feed/__tests__/FeedService.spec.ts:232`.
- Target invalido: `src/core/feed/__tests__/FeedService.spec.ts:268`.
- TerritoryGroup com multiplos membros sem target: `src/core/feed/__tests__/FeedService.spec.ts:302`.

Parcialmente coberto por outros fluxos:

- `rollout_pending` e coberto em `useFeedTimeline`, mas nao diretamente em `FeedService.createItem`.
- `territory_filter_mismatch` e coberto em detalhe/timeline, mas nao diretamente em `FeedService.createItem`.

Nao coberto diretamente na criacao:

- criacao com rollout bloqueado/inativo;
- criacao com `TerritoryFilter` divergente do `ResolvedTerritory`.

Impacto:

- O comportamento do codigo parece correto porque `createItem` chama `validateFeedContext()` antes da mutation.
- Ainda assim, a estrategia oficial da P0.C exigia teste de "bairro bloqueado" e "rollout bloqueado" para criacao.
- A suite nao prova diretamente que a mutation de criacao nao chama repository nesses cenarios.

Conclusao:

- A cobertura ainda e insuficiente para declarar conclusao oficial.

### P0.C-REV-03 - TerritoryGroup com multiplos bairros escolhe o primeiro membro como target

Status: precisa de decisao antes do Freeze; nao e o principal bloqueador da P0.C.

Evidencia:

- `src/core/community/utils/communityRouteTerritory.ts:32` retorna `activeMemberIds[0] ?? resolved.group.members[0]?.id`.
- `src/core/community/pages/ComunidadePage.tsx:137` passa esse target para o modal.
- `src/app/pages/CidadeLandingPage.tsx:1640` passa esse target para o modal.

Analise:

- Isso nao e fallback para bairro do perfil.
- O target continua restrito ao TerritoryGroup resolvido.
- Porem, em grupo com multiplos bairros, a criacao pode cair no primeiro bairro do grupo sem uma selecao explicita do usuario.

Risco:

- Para Complexo do Nordeste de Amaralina, uma publicacao feita no contexto do grupo pode ser persistida no primeiro membro do grupo, nao necessariamente no bairro pretendido pelo usuario.
- `FeedService.createItem()` tem protecao para exigir target quando grupo tem multiplos membros e nenhum target e enviado, mas os callers enviam um target default derivado do primeiro membro.

Conclusao:

- Nao viola a regra especifica de "sem fallback para bairro do perfil".
- Ainda assim, deveria ser tratado como decisao de produto/UX ou teste explicito de comportamento para TerritoryGroup antes do Freeze.

## Respostas Obrigatorias

### 1. Todo o escopo da P0.C foi implementado?

Parcialmente.

O caminho principal de criacao do composer foi migrado para `FeedService.createItem()`. Porem ainda existem caminhos publicos/verticais de criacao de post fora do Feed Service.

### 2. Existe algo implementado que pertence a P0.D, P0.E ou superior?

Nao foi identificado uso funcional novo de comentarios, reacoes, saves, share, busca, realtime ou moderacao.

O ajuste em `UnifiedComposer` e compatibilidade de criacao, nao antecipacao de P0.D.

O escopo de Mobility nao foi implementado, mas um bypass de Mobility permanece existente e precisa ser resolvido em P0.E ou formalmente reconhecido como excecao.

### 3. Existe alguma violacao da GOVERNANCE?

Sim.

Violacao ainda ativa:

- caminhos publicos/verticais chamam `postService.createPost()` diretamente.

Violacao residual ja conhecida e fora da P0.C:

- `CreatePostModal` ainda chama `postService.updatePost()` para edicao, operacao que a GOVERNANCE tambem exige via Feed no futuro. Isso pertence a sprint posterior, nao a P0.C.

### 4. Existe algum caminho publico que ainda permita criar posts sem passar pelo FeedService.createItem()?

Sim.

Caminhos encontrados:

- Mobility: `src/modules/mobility/hooks/useCommunityPosts.ts:52`.
- Work Opportunities: `src/core/work-opportunities/services/WorkOpportunitiesService.ts:552`.
- Jobs/Vagas: `src/core/verticals/jobs/services/VagaPublicationDistributionService.ts:102`.

### 5. Existe algum fallback para o bairro do perfil ainda ativo?

No caminho migrado da P0.C, nao.

Evidencia:

- `CreatePostModal` nao usa mais `useTerritoryFilter()` nem `profile.locationId` para definir `location_id`.
- `useCreatePost` nao usa mais `activeProfile.locationId`.

Nos bypasses externos encontrados, a criacao usa `location_id` recebido por prop/input/dado da vaga/oportunidade, nao o bairro do perfil. O problema desses caminhos e bypass do Feed, nao fallback do perfil.

### 6. O Territory da rota sempre prevalece sobre qualquer outro contexto?

Parcialmente.

Nos callers migrados:

- `ComunidadePage` e `CidadeLandingPage` passam contexto derivado do Territory resolvido.
- `NovoPostPage` redireciona para onboarding quando nao ha Territory resolvido.

Nao globalmente:

- Mobility, Work Opportunities e Jobs criam por `location_id` direto, sem `ResolvedTerritory` de rota validado pelo Feed.
- TerritoryGroup com multiplos bairros usa o primeiro membro como target default, o que e restrito ao grupo, mas ainda pode nao representar uma escolha explicita do usuario.

### 7. AccessPolicy e Rollout sao sempre validados antes da criacao?

No caminho via `FeedService.createItem()`, sim.

Globalmente, nao.

Os caminhos que chamam `postService.createPost()` diretamente nao passam pela validacao de Rollout e AccessPolicy do Feed antes da criacao.

### 8. Existe algum caller publico que ainda utilize PostService ou PostsFacade diretamente para criacao?

Sim para `PostService`/`postService`.

Nao foi encontrado `PostsFacade.mutations.createPost()` em caller publico de community/composer apos a migracao.

Callers diretos restantes:

- `src/modules/mobility/hooks/useCommunityPosts.ts:52`.
- `src/core/work-opportunities/services/WorkOpportunitiesService.ts:552`.
- `src/core/verticals/jobs/services/VagaPublicationDistributionService.ts:102`.

### 9. Os testes cobrem os cenarios criticos da governanca?

Parcialmente.

Cobrem:

- territorio ausente na criacao;
- AccessPolicy sem permissao de criacao;
- target invalido;
- grupo com multiplos membros sem target.

Nao cobrem diretamente em `FeedService.createItem()`:

- rollout bloqueado/inativo;
- mismatch entre `TerritoryFilter` e `ResolvedTerritory`.

Portanto a cobertura ainda nao satisfaz completamente o criterio de review.

### 10. O rollback descrito restaura o comportamento anterior sem afetar P0.A e P0.B?

Parcialmente sim.

O rollback descrito e local aos arquivos da P0.C e, se aplicado com cuidado, nao deve desfazer P0.A/P0.B.

Limite:

- Ele restaura o comportamento anterior do composer, mas nao considera os bypasses externos que permaneceram fora da migracao.
- Como a P0.C ainda nao cobre todos os caminhos de criacao, o rollback e suficiente para o escopo implementado, mas nao para uma garantia global do dominio Feed.

## Auto-Review Contra O Relatorio Da Sprint

Declaracoes corretas do `FEED-P0.C-REPORT.md`:

- `CreatePostModal` publica via `useCreateFeedItem`.
- `useCreatePost` nao chama mais `PostsFacade.mutations.createPost`.
- `FeedService.createItem` valida contexto antes da mutation.
- `FeedRepository` encapsula `postService.createPost()` e `postService.createPostWithImages()`.
- `/novo-post` sem Territory resolvido redireciona para onboarding.

Declaracoes que precisam ser corrigidas ou restringidas:

- "Nenhum componente publico cria post diretamente por PostService" so e verdadeiro dentro do composer/community migrado. Nao e verdadeiro globalmente.
- "Nenhuma criacao publica usa bypass ao Feed" nao se sustenta diante dos paths de Mobility, Work Opportunities e Jobs.
- "Testes cobrem os criterios da governanca" precisa ser restrito porque falta teste direto de rollout/mismatch em `createItem`.

## Decisao

A Sprint FEED.P0.C ainda nao atende aos criterios da governanca.

Criterios pendentes:

1. Eliminar ou formalizar excecao para caminhos publicos/verticais que criam posts por `postService.createPost()` fora de `FeedService.createItem()`.
2. Adicionar cobertura direta em `FeedService.createItem()` para rollout bloqueado/inativo e mismatch entre `TerritoryFilter` e `ResolvedTerritory`.
3. Definir se TerritoryGroup com multiplos bairros pode escolher o primeiro membro automaticamente ou se deve exigir selecao explicita de bairro.
