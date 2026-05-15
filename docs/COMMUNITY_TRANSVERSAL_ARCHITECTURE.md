# Arquitetura Transversal de Comunidade

## Decisao

`community` nao deve ser tratado como modulo unico. O dominio foi decomposto em modulos transversais independentes:

- `community-feed`
- `community-alerts`
- `community-issues`
- `community-groups`
- `community-events`
- `community-recommendations`
- `community-lost-found`

Cada modulo pode ter UI propria, mas comunicacao e compartilhamento de comportamento passam apenas por `core`.

As entradas publicas de core por dominio sao:

- `core/community-feed`
- `core/community-alerts`
- `core/community-issues`
- `core/community-groups`
- `core/community-events`
- `core/community-recommendations`
- `core/community-lost-found`
- `core/nearby` para descoberta transversal

## Comunicacao Territorial

`Comunicacao Territorial` nao e submodulo social de `community`. E uma camada institucional/editorial separada, documentada em [COMUNICACAO_TERRITORIAL_ARCHITECTURE.md](./COMUNICACAO_TERRITORIAL_ARCHITECTURE.md).

Regras:

- Rotas canonicas editoriais usam `/comunicacao/...`, nao `/comunidade/...`.
- Conteudo institucional pode aparecer no feed comunitario como agregacao, mas a fonte primaria deve ser o dominio de comunicacao.
- Alertas institucionais devem consumir a infraestrutura de `core/community-alerts` e `core/notifications`, sem duplicar stack de alerta/push.
- A autorizacao territorial continua baseada em `location_id`.

## Boundaries

- Modulos transversais nao importam outros modulos `src/modules/*`.
- Modulos transversais nao acessam Supabase diretamente.
- Consumidores externos nao importam o agregador legado `@/modules/community`.
- Consumidores externos nao importam o barrel `@/core/community`; devem usar subdominios explicitos.
- Modulos transversais nao importam `@/core/community/*`; devem usar `@/core/community-*` ou outro core de dominio.
- `location_id` e o SSOT territorial para leitura, escrita, filtros, rollout e permissao.
- Cidade, bairro, UF, slug e nome publico sao campos derivados ou de apresentacao.
- Posts, comentarios, reacoes, favoritos e grupos usam `core/posts`, `core/comments`, `core/social`, `core/favorites` e `core/feed`.
- Alertas e problemas usam services especificos em `core/community/alerts` e `core/community/issues` ate a drenagem final para roots `core/community-alerts` e `core/community-issues`.

## Banco de Dados

Estado aceito por dominio:

| Dominio | Tabelas atuais | Direcao |
| --- | --- | --- |
| community-feed | `posts`, `comments`, `reactions`, `favorites`; legado `community_polls` | polls devem migrar para contrato de posts/social ou para tabelas `post_polls` |
| community-alerts | `community_alerts`, `community_alert_reports`, `community_alert_audit` | nome e responsabilidade ja sao especificos; manter `location_id` obrigatorio e planejar rename compativel se necessario |
| community-issues | `community_issues`, `community_issue_supports`, `community_issue_reports`, `community_issue_audit` | nome e responsabilidade ja sao especificos; manter `location_id` obrigatorio e planejar rename compativel se necessario |
| community-groups | `groups`, `group_members_new`, `group_messages_new` | consolidar em core/social; escopo territorial via `location_id` quando aplicavel |
| community-events | `events`, `event_participants` | separar de feed; `location_id` obrigatorio para eventos territoriais |
| community-recommendations | `community_questions`, `question_answers` | migrar nome conceitual para recommendations/qa sem misturar com feed |
| community-lost-found | `lost_found_posts`, `lost_found_comments` | ja separado por dominio; adicionar/validar `location_id` onde faltar |
| nearby/discovery | sem tabela propria | descoberta transversal vive em `core/nearby` e agrega dados de dominios via services/hooks de core |

Tabelas genericamente problematicas:

- `community_profiles`
- `community_interactions`
- `community_badges`
- `community_reports`
- `community_comments`
- `community_post_mentions`
- `community_posts` se ainda existir no ambiente remoto

Essas tabelas misturam semantica de varios dominios ou duplicam contratos de `core/social`, `core/comments`, `core/posts`, `core/gamification` e `core/moderation`. A remocao deve ser feita por migrations de compatibilidade: criar tabela/contrato canonico, backfill, atualizar services, criar view temporaria para consumidores legados e so entao dropar a tabela antiga.

## Validacao

Rodar:

```bash
npm run validate:architecture:community
```

Esse validador garante que os novos modulos transversais existem, nao importam outros modulos e nao acessam Supabase direto.
