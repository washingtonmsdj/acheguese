# Arquitetura Transversal de Comunidade

## Decisao

`community` nao deve ser tratado como modulo unico. O dominio foi decomposto em modulos transversais independentes:

- `community-feed`
- `community-issues`
- `community-groups`
- `community-events`
- `community-recommendations`
- `community-lost-found`

Cada modulo pode ter UI propria, mas comunicacao e compartilhamento de comportamento passam apenas por `core`.
Alertas comunitarios sao uma capacidade transversal sem superficie de produto
propria em `modules`; seu owner e acessado diretamente em core.

Os owners de core por dominio sao:

- `core/posts`, `core/comments`, `core/social` e `core/feed` para o feed
- `core/community/components` e `core/community/pages` para composicao visual comunitaria
- `core/community/alerts`
- `core/community-issues`
- `core/community-groups`
- `core/verticals/events`
- `core/community-recommendations`
- `core/community-lost-found`
- `core/nearby` para descoberta transversal

## Comunicacao Territorial

`Comunicacao Territorial` nao e submodulo social de `community`. E uma camada institucional/editorial separada, documentada em [COMUNICACAO_TERRITORIAL_ARCHITECTURE.md](./COMUNICACAO_TERRITORIAL_ARCHITECTURE.md).

Regras:

- Rotas canonicas editoriais usam `/comunicacao/...`, nao `/comunidade/...`.
- Conteudo institucional pode aparecer no feed comunitario como agregacao, mas a fonte primaria deve ser o dominio de comunicacao.
- Alertas institucionais devem consumir diretamente `core/community/alerts` e
  `core/notifications`, sem duplicar stack de alerta/push.
- A autorizacao territorial continua baseada em `location_id`.

## Boundaries

- Modulos transversais nao importam outros modulos `src/modules/*`.
- Modulos transversais nao acessam Supabase diretamente.
- Consumidores externos nao importam o agregador legado `@/modules/community`.
- Consumidores externos nao importam o barrel `@/core/community`; devem usar subdominios explicitos.
- Modulos transversais nao importam implementacao interna de
  `@/core/community/*`; devem usar os owners transversais explicitos.
  Superficies do app podem consumir somente os entrypoints de UI comunitaria
  aprovados pelo validador arquitetural, sem uma facade de reexports paralela.
  `core/community/alerts` e consumido diretamente pelo owner autorizado.
- `location_id` e o SSOT territorial para leitura, escrita, filtros, rollout e permissao.
- Cidade, bairro, UF, slug e nome publico sao campos derivados ou de apresentacao.
- Posts usam `core/posts`; comentarios de Post usam `core/comments`.
- `core/feed` deve apenas agregar/rankear fontes e nao repetir CRUD ou cursor
  de Post. Wrappers atuais estao em retirada pelo plano de Core Platform.
- Reacoes de Post pertencem a `core/posts`; comentarios a `core/comments`;
  grupos mantem suas interacoes no agregado de grupos; favorites especificos
  permanecem em adapters de dominio sobre a infraestrutura aprovada. O contrato
  completo esta em `architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md`.
- Alertas usam services especificos em `core/community/alerts`, sem facade;
  problemas usam owner explicito em `core/community-issues` e superficie de
  produto em `modules/community-issues`.

## Interacoes Sociais Ativas

- `core/posts` possui publicacoes, likes, favoritos e eventos de
  compartilhamento. A UI pode aplicar estado otimista, mas o resultado do
  servidor e a fonte final dos contadores e do estado do usuario.
- `core/comments` possui criacao, edicao, exclusao, arvore de respostas e likes
  de comentarios. `PostCommentsPanel` e a unica composicao de runtime para
  feed, modal de comentarios e detalhe da publicacao.
- `core/social` possui grupos, membros, mensagens e reacoes em mensagens. A UI
  nao acessa tabelas de reacao diretamente: RPCs derivam o perfil autenticado,
  validam membership/capability e retornam o contador atomico.
- `core/moderation` possui o contrato visual compartilhado de denuncia e os
  servicos de moderacao. Post, comentario e mensagem de grupo exigem motivo
  explicito; o navegador nunca escolhe denunciante, autor alvo ou decisao.
- Compartilhamento registra um evento de dominio limitado e depois usa a API
  de compartilhamento do dispositivo quando disponivel. Texto integral e PII
  nao pertencem aos metadados de auditoria.

## Banco de Dados

Estado aceito por dominio:

| Dominio | Tabelas atuais | Direcao |
| --- | --- | --- |
| community-feed | `posts`, `comments`, `post_likes_new`, `comment_likes`, `post_share_events`, `favorites`; legado `community_polls` | posts e interacoes sociais sao o contrato publicado; polls devem convergir para posts/social ou tabelas `post_polls` aprovadas |
| community-alerts | `community_alerts`, `community_alert_reports`; auditoria em `community_social_audit_log` | `location_id` obrigatorio; criacao passa pelo broker autenticado e a auditoria e gravada na mesma transacao |
| community-issues | `community_issues`, `community_issue_supports`, `community_issue_reports`; auditoria em `community_social_audit_log` | `location_id` obrigatorio; mutacoes, contadores e auditoria pertencem a RPCs/guards do banco |
| community-groups | `groups` e RPCs de participacao/publicacao | o grupo e o SSOT; membership e interacoes passam por contratos de `core/social`, sem acesso direto de UI |
| community-events | `events`, `event_participants` | separar de feed; `location_id` obrigatorio para eventos territoriais |
| community-recommendations | `community_questions`, `question_answers` | migrar nome conceitual para recommendations/qa sem misturar com feed |
| community-lost-found | `lost_found_posts`, `lost_found_comments` | ja separado por dominio; adicionar/validar `location_id` onde faltar |
| nearby/discovery | sem tabela propria | descoberta transversal vive em `core/nearby` e agrega dados de dominios via services/hooks de core |

Contratos retirados do runtime publicado:

- `community_profiles`, `community_interactions`, `community_badges` e `civic_engagement_scores` nao fazem parte do schema remoto publicado e nao podem ser consultados pela aplicacao.
- Pontos, badges e ranking individual nao possuem, nesta fase, um dominio de dados aprovado. Nenhuma acao de usuario pode atribuir pontuacao no cliente.
- `community_reports` permanece o SSOT de denuncias de posts e comentarios; a decisao de moderacao acontece exclusivamente pela RPC atomica `review_community_content_reports`.
- `community_social_audit_log` e o SSOT compartilhado de auditoria para feed,
  alertas, problemas, Q&A e acoes de moderacao. `community_alert_audit` e
  `community_issue_audit` nao sao contratos ativos e nao podem ser recriados.
- `community_posts` e outras tabelas historicas nao sao um contrato de leitura/escrita da UI. O feed social usa `posts`; Q&A usa `community_questions` e `question_answers`.

Uma futura gamificacao so pode ser adicionada por um dominio proprio, com schema remoto, RLS, regras server-side, auditoria e contrato de produto aprovados antes de qualquer superficie visual.

## Escala e Observabilidade do Broker

- `community-rpc` e o broker autenticado para a criacao privilegiada de
  alertas comunitarios. Outros subdominios usam seus brokers canonicos e nao
  devem voltar a concentrar mutacoes nessa funcao.
- `private.community_edge_rate_limits` e o storage autoritativo do limite
  distribuido do broker. Somente `service_role` acessa a tabela e a RPC
  `consume_community_edge_rate_limit`; o navegador nao possui grants.
- O contador e atomico no PostgreSQL e deriva o ator do JWT validado pela Edge
  Function. Falha do contador bloqueia a escrita; o middleware generico de IP
  e apenas defesa complementar de perimetro.
- `function_audit` e o SSOT de telemetria do broker. A trilha guarda acao,
  `request_id`, resultado, status e duracao, sem corpo de publicacao ou PII.
- A telemetria de `community-rpc` possui retencao de 90 dias. O job horario
  `acheguese-community-rpc-audit-retention` remove registros antigos em lotes
  limitados por uma funcao no schema `private`; navegadores nao podem executa-la.
- `get_community_rpc_operational_metrics` calcula p50/p95/p99 por minuto.
  `get_community_rpc_slo_status` calcula o sinal agregado da janela. Ambos
  exigem administrador no banco, independentemente da protecao da rota web.
- `CommunityRpcOperationsService` e o unico adaptador frontend desses RPCs;
  `CommunityRpcOperationsPanel` apenas apresenta o contrato administrativo.
- Carga automatizada usa `scripts/community-staging-load-test.mjs`, somente
  contra staging explicitamente declarado, HTTPS, PostgREST e requisicoes GET.
  O host remoto vinculado de producao nunca e alvo implicito.
- O sinal de SLO nao equivale a entrega externa. Canal, plantao, segredo e
  escalonamento devem ser configurados operacionalmente antes do lancamento.

## Validacao

Rodar:

```bash
npm run validate:architecture:community
```

Esse validador garante que os novos modulos transversais existem, nao importam outros modulos e nao acessam Supabase direto.
