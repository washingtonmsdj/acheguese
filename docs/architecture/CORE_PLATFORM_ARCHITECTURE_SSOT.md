# Core Platform Architecture SSOT

Status: arquitetura aprovada; migracao incremental em andamento
Data: 2026-07-15
Escopo: capacidades compartilhadas por Comunidades, Empresas, Classificados,
Eventos, Gastronomia, Mobilidade, Perfis e dominios futuros.

## 1. Decisao

O Achegue-se tera um `Core Platform`, mas ele nao sera um modulo central que
concentra toda a regra do produto.

- O core domain do produto continua sendo `Comunidade Local`, conforme a
  arquitetura Community First.
- Empresa, Classificado, Evento, Pedido e Corrida continuam independentes e
  donos de suas regras.
- O Core Platform possui contratos e infraestrutura realmente reutilizaveis:
  identidade, autorizacao, midia, notificacoes, busca, realtime, auditoria e
  primitivas sociais aprovadas.
- Uma capacidade so entra no Core quando tem semantica estavel em pelo menos
  dois bounded contexts, ou quando e obrigacao global de seguranca ou
  infraestrutura.
- Compartilhar interface nao obriga compartilhar tabela. Ciclos de vida,
  autorizacao e retencao diferentes justificam persistencias diferentes.

Este documento define ownership por capacidade. `CORE_LAYER_SSOT.md` continua
descrevendo a taxonomia fisica de `src/core`, mas nao pode ser usado sozinho
para declarar que uma implementacao e canonica.

## 2. O que Core Platform nao significa

Ficam proibidos:

- um `EntityService` generico com nomes de tabela recebidos da UI;
- uma tabela polimorfica para qualquer conteudo sem invariantes e RLS claros;
- um servico de autorizacao no navegador tratado como autoridade de seguranca;
- um `SocialService` que misture posts, comentarios, grupos, chat e favoritos;
- mover codigo para `core` apenas porque mais de uma tela o importa;
- manter duas implementacoes mutaveis sobre a mesma tabela;
- dual write sem idempotencia, reconciliacao e retirada documentada.

## 3. Niveis de SSOT

Uma capacidade so esta consolidada quando estes niveis concordam:

1. **Persistencia:** migrations, constraints, RLS, grants, RPCs e triggers.
2. **Dominio:** um unico owner de escrita por agregado ou tabela.
3. **Aplicacao:** facades, hooks e componentes consomem o owner e nao repetem
   a regra nem acessam Supabase diretamente.
4. **Governanca:** documentacao, testes de contrato e validadores apontam para
   o mesmo owner.

Leitores especializados podem existir como read models declarados. Eles nao
podem se tornar um segundo owner de escrita.

## 4. Regra de dependencias

```text
UI/Page/Component
        |
        v
Module use case / domain facade
        |
        v
Core Platform contract or domain-owned service
        |
        v
Repository / RPC broker / Edge Function
        |
        v
Supabase (RLS, functions, storage, realtime)
```

- `modules/*` pode depender de contratos publicos de `core/*`.
- `core/*` nao pode importar implementacoes internas de `modules/*`.
- Integracao entre dominios usa port tipado, evento de dominio ou read model.
- A composition root registra adapters; o Core nao conhece todos os dominios
  por um `switch` crescente.
- Hooks controlam cache e estado visual. Regra, ator e autorizacao de escrita
  permanecem fora deles.

## 5. Entidades canonicas principais

| Contexto      | Entidade canonica       | SSOT atual ou alvo                                    | Observacao                                          |
| ------------- | ----------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| Identidade    | User                    | `auth.users` + `core/auth`/`core/session`             | Conta autenticada; nao e autor social               |
| Identidade    | Profile                 | `profiles` + `core/profiles`                          | Identidade de atuacao; um User pode ter N Profiles  |
| Territorio    | Location                | `locations` + `core/location`                         | Labels publicos sao derivados                       |
| Comunidade    | TerritoryCommunity      | `territory_communities` + `core/community-experience` | Contexto local, nao copia entidades publicas        |
| Comunidade    | CommunityMembership     | `community_memberships`                               | Participacao e papel do Profile                     |
| Comunidade    | CommunityEntityLink     | `community_entity_links`                              | Vincula entidades independentes sem duplicar mestre |
| Comunidade    | CommunityGroup          | owner `community-groups`                              | Grupo, membership, regras e mensagens contextuais   |
| Social        | Post                    | `posts` + `core/posts`                                | Publicacao reutilizavel e contextualizavel          |
| Social        | PostComment             | `comments` + `core/comments`                          | Comentario de Post, nao comentario universal        |
| Social        | PostReaction            | `post_likes_new`                                      | Reacao com ator derivado e contador atomico         |
| Social        | CommentReaction         | `comment_likes`                                       | Reacao pertencente ao agregado Comment              |
| Social        | PostShareEvent          | `post_share_events` + `core/posts`                    | Evento limitado; Web Share e efeito de UI           |
| Empresa       | Business                | `business_data` + owner de Business                   | Existe independentemente da Comunidade              |
| Empresa       | BusinessClaim/Ownership | owner de Business                                     | Vinculo operacional e autorizacao                   |
| Gastronomia   | Menu/MenuItem/Order     | owner de Gastronomia                                  | Vertical de Business, nao subtipo de Post           |
| Avaliacoes    | Review                  | `reviews` + `core/reviews`                            | Base comum; politica comercial usa adapter          |
| Classificados | ClassifiedListing       | `classifieds` + owner de Classificados                | Listing nao e Post                                  |
| Classificados | ClassifiedConversation  | `conversations`/`messages`                            | Chat de marketplace atualmente com nome generico    |
| Eventos       | Event                   | `events` + owner de Eventos                           | Existe fora da Comunidade; link fornece contexto    |
| Mobilidade    | Ride/Delivery           | owner de Mobilidade                                   | Estado e autorizacao proprios                       |
| Plataforma    | MediaAsset              | `core/media` + Storage                                | Referencia e lifecycle, nao apenas URL              |
| Plataforma    | Notification            | `notifications` + `core/notifications`                | Caixa de entrada da conta                           |
| Plataforma    | SearchDocument          | `core/search`                                         | Read model federado, nunca mestre do dominio        |
| Plataforma    | AuditEvent              | contrato de `core/audit` alvo                         | Envelope comum; sinks podem ser de dominio          |

`Marketplace` nao aparece hoje como agregado canonico independente. No codigo
atual ele e composicao de Classificados, conversas, catalogos e pedidos. Criar
uma entidade `Marketplace` agora duplicaria responsabilidades; isso so deve
ocorrer se surgir ciclo de vida proprio documentado.

## 6. Achados priorizados

| ID     | Risco                                                   | Achado                                                                                                                               | Prioridade |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| CP-001 | notificacoes cross-user podem nao ser criadas           | resolvido: outbox cobre Community, Work, Vagas, Trust, Mobility, Orders, Admin e Safety; dispatcher e rollback comprovados no remoto | Resolvida  |
| CP-002 | seguranca podia depender de decisao do cliente          | resolvido: `CapabilityPreviewService` e UI-only; mapa liga cada acao a RLS/RPC/Edge                                                  | Resolvida  |
| CP-003 | identidade administrativa fornecida pelo cliente        | resolvido em Classified/Review/Vaga/Ride por comandos server-owned                                                                   | Resolvida  |
| CP-004 | perda de campos em updates parciais                     | resolvido: owner unico e patch server-owned preservativo para `notification_preferences`                                             | Resolvida  |
| CP-005 | divergencia de favoritos                                | resolvido: storage em `core/favorites`, adapter Business, comandos auth-derived e legado removido                                    | Resolvida  |
| CP-006 | bucket, quota e lifecycle errados                       | resolvido: Review/Menu usam presets, referencia, quota e cleanup proprios de MediaAsset                                              | Resolvida  |
| CP-007 | conexoes sem registry e cleanup uniforme                | resolvido: registry fechado e lifecycle unico para Changes, Broadcast e Presence                                                     | Resolvida  |
| CP-008 | contratos e cursores concorrentes                       | resolvido: Post CRUD/cursor somente em `core/posts`; Feed conserva apenas composicao/cache                                           | Resolvida  |
| CP-009 | fan-out e comportamento divergente                      | resolvido: busca global/comunitaria usa o mesmo orquestrador e providers                                                             | Resolvida  |
| CP-010 | facade sem ownership                                    | resolvido: facade/hooks antigos removidos e owners separados por agregado                                                            | Resolvida  |
| CP-011 | acoplamento runtime a tabela/coluna                     | resolvido: registry interno allowlisted e adapters tipados por dominio                                                               | Resolvida  |
| CP-012 | N+1 e ownership incompleto                              | resolvido: owner de Classificados explicito e inbox em RPC keyset unico                                                              | Resolvida  |
| CP-013 | dois owners declarados e escrita client-side auxiliar   | resolvido: `reviews` e `core/reviews` sao canonicos; Business e policy adapter e legados foram removidos                             | Resolvida  |
| CP-014 | ator, alvo, papel e contexto ainda confiados ao cliente | resolvido: comandos Trust especificos derivam identidade/contexto e efeitos administrativos no banco                                 | Resolvida  |
| CP-015 | conector apontava para agregado incorreto               | resolvido: direct message de Post usa agregado Community Direct proprio                                                              | Resolvida  |
| CP-016 | uploads anteriores sem metadata/lifecycle uniforme      | Avatar, Business, Classified, Professional e Site ainda usam contratos de bucket anteriores                                          | Alta       |

### 6.1 Guardrail executavel

O manifest `core-platform-ownership.json` congela os acessos atuais de 34
tabelas, 51 RPCs e 24 callsites incrementais. O validador AST bloqueia novo
writer/reader nos recursos controlados, aumento de chamadas allowlisted,
acesso dinamico a tabela, canal/Storage direto, import de `core/interaction` e
novo alias `feedService`. Reducoes sao reportadas para retirada da excecao no
mesmo PR.

## 7. Auditoria por capacidade

As subsecoes seguintes registram o que existe, a duplicacao, o que permanece
no dominio, o owner alvo e a migracao compativel.

### 7.1 Posts e Feed

**Existe:** `core/posts` e o owner real de `posts`, mutacoes, consultas,
paginacao e compartilhamentos.

**Consolidado:** `FeedService`, o alias `feedService`, os tipos paralelos e a
segunda consulta territorial foram removidos depois de comprovado zero
consumidor. O runtime usa uma unica consulta `getFeed` em `core/posts`.

**Permanece no dominio:** filtros, elegibilidade e composicao da experiencia
comunitaria. Evento ou Classificado mostrado no feed continua mestre do seu
dominio.

**Core vigente:** `core/posts` possui Post. Sem federacao real, `core/feed`
contem somente chaves de cache de composicao e nao possui CRUD ou tipos de
Post. Contrato em `POSTS_FEED_SSOT.md`.

**Migracao concluida:** consumidores apontam para `postService`; nenhum
reexport deprecated foi necessario porque o inventario encontrou zero uso.

### 7.2 Comentarios

**Existe:** `core/comments` possui comentarios e likes de comentarios de Post.

**Semelhante:** Classificados possui `classified_comments`; Q&A, Lost Found e
outros dominios possuem respostas com semantica propria.

**Permanece no dominio:** status, moderacao, prazo, visibilidade e autorizacao
especificos de pergunta, review, classificado ou incidente.

**Core alvo:** thread, paginacao e renderizacao podem compartilhar contrato.
A tabela `comments(post_id)` nao vira tabela polimorfica por conveniencia.

**Migracao:** extrair DTOs e ports primeiro; adapters de dominio continuam
donos de suas tabelas. Unificacao fisica exige ADR, benchmark e modelo RLS.

### 7.3 Reacoes, itens salvos e compartilhamentos

**Existe:** `PostEngagementService` escreve likes/saves de Post;
`CommentService` escreve likes de Comment; `core/posts` registra shares;
`core/favorites` e adapters tipados atendem outros alvos.

**Consolidado:** `core/interaction`, `InteractionService`,
`SocialInteractionsService`, seis hooks sem consumidores e o `BlockService`
sem schema foram removidos. Grupo usa `SocialGroupInteractionsService` e nao
faz parte do contrato de reacao de Post.

**Consolidado:** Favoritos de Empresa usam `BusinessFavoriteStore` como unico
owner de persistencia. Business e o adapter de dominio; Gastronomia apenas
compoe dados especificos. O browser usa cinco RPCs derivadas de `auth.uid()`,
sem acesso direto a tabela. Set e patch sao idempotente/preservativo, cache
possui raiz unica e a tabela/RPCs antigas foram removidas. Contrato em
`BUSINESS_FAVORITES_SSOT.md`.

**Permanece no dominio:** elegibilidade, unicidade, contador e visibilidade de
cada agregado.

**Core vigente:** `core/engagement` publica somente
`PostEngagementService`. `ProfileSavedEntityService` e infraestrutura interna
com registry fechado para Classificado, Evento, Ponto Turistico e Vaga; os
adapters publicos pertencem aos dominios. A UI nao fornece tabela, coluna ou
identidade de ator. Contrato em `SOCIAL_ENGAGEMENT_SSOT.md`.

**Migracao concluida:** writers e hooks apontam diretamente para seus owners.
As tabelas especificas foram preservadas porque lifecycle e RLS diferem; nao
foi criada tabela generica.

### 7.4 Notificacoes

**Existe:** `NotificationService` possui inbox, leitura, exclusao e Realtime.
Criacao no navegador permite apenas notificar o proprio User. O Core tambem
possui `private.notification_outbox`, materializador unico, dispatcher
concorrente, backoff, DLQ, health e retencao.

**Consolidado:** `NotificationPreferencesService` e o owner unico de
`notification_preferences`. O tipo vem do schema gerado; get e patch derivam
o User do JWT; canais, topicos, frequencia e horario podem ser alterados sem
sobrescrever colunas omitidas. Os dois services antigos foram removidos,
inclusive o adapter Push que tipava colunas inexistentes. O contrato esta em
`NOTIFICATION_PREFERENCES_SSOT.md`. Professional Leads usa broker server-side
dedicado e permanece valido ate consolidacao futura de canais. Safety foi
normalizado: schema reproduzivel, RLS por perfil/viagem, auditoria backend,
rate limit, RPC publico por token e notificacao derivada no outbox.

**Permanece no dominio:** template, motivo do evento e selecao de audiencia.

**Core alvo:** um `NotificationPreferencesService`; inbox separada de delivery;
eventos cross-user usam outbox server-side idempotente, dispatcher,
retentativas, DLQ e observabilidade. Push e e-mail sao canais.

**Migracao:** preferencias e CP-004 estao concluidos. A outbox e os produtores de Community, Work Opportunities,
Vagas, Trust, Mobility, Orders, Business Claims e Safety foram implementados e
aplicados no ambiente remoto de desenvolvimento. A Edge de emergencia aceita
somente IDs e carrega contato/alerta canonicos no backend. O probe transacional
remoto comprovou destinatario, deduplicacao, preferencias, retry, DLQ, requeue
e health, sem persistir dados de teste. O cron de 500
itens/minuto e safety net inicial; throughput maior exige workers concorrentes
e carga em staging.

### 7.5 Busca

**Existe:** `core/search/SearchService` e o orquestrador unico e
`searchProviders.ts` e a composition root dos dominios pesquisaveis.

**Consolidado:** o hook comunitario que fazia cinco consultas de Post por tipo,
ordenava no browser e duplicava historico/debounce foi removido junto do modal
sem consumidores. `SearchService` nao importa services de dominio diretamente.

**Permanece no dominio:** consulta eficiente, filtros, ranking, visibilidade e
URL canonica de cada entidade.

**Core vigente:** providers tipados retornam `SearchDocument` e payloads de
apresentacao. O escopo comunitario usa links ativos e falha fechado; historico
e separado por escopo; falha de um provider nao apaga os demais. Cancelamento
e cooperativo e os limites sao fixos.

**Performance:** o contrato atual retorna top-N limitado e nao possui pagina
seguinte. Keyset federado e indice dedicado so entram com superficie paginada,
merge estavel, p95, volume e planos medidos. A telemetria nao registra o texto
pesquisado. Contrato completo em `SEARCH_SSOT.md`.

### 7.6 Midia e upload

**Existe:** `core/media/MediaService` centraliza transporte. `MediaAssetRef`, o
bucket `media-assets`, metadata, links, presets v1 e cleanup agendado formam o
contrato canonico para imagens publicas aprovadas.

**Consolidado:** Review e Item de cardapio nao usam mais `uploadPostImage` nem
aceitam URL arbitraria. O broker autentica, valida JPEG/dimensao/owner, remove
metadata, gera path, reserva quota atomica e retorna referencia `storage://`.

**Permanece no dominio:** quem anexa, quantidade, finalidade, retencao e
associacao ao agregado.

**Core vigente:** transporte, presets imutaveis, `MediaAssetRef`, ownership,
quota, lifecycle, resolucao de CDN e cleanup. O dominio escolhe preset
allowlisted; UI nao escolhe bucket/path arbitrario. Contrato completo em
`MEDIA_ASSET_SSOT.md`.

**Residual:** uploads anteriores de Avatar, Business, Classified,
Professional e Site ainda nao usam metadata/lifecycle de MediaAsset. CP-016
impede novos consumidores e rastreia a migracao incremental sem misturar
documentos privados com o bucket publico.

### 7.7 Autorizacao e permissoes

**Existe:** RLS/RPC/Edge Function sao a autoridade real.
`CapabilityPreviewService` calcula apenas visibilidade conservadora da UI a
partir do owner canonico de Profile e do broker de Roles.

**Consolidado:** o `AuthorizationEngine`, seus hooks sem consumidores e o
diretorio paralelo `core/permissions` foram removidos. O preview nao consulta
Posts, Comments, Messages, Business nem tabelas comunitarias para provar
ownership.

**Permanece no dominio:** ownership e regras de Business, Community, Event,
Classified e Mobility.

**Core alvo:** `ActorContext`, `ResourceRef`, `CapabilityDecision` e reason
codes. Frontend recebe hints; toda escrita e revalidada no backend.

**Contrato vigente:** `authorization-enforcement-map.json` mapeia cada acao
visual para owner do comando, enforcement e evidencia. O teste
`authorization-capability-preview.test.ts` cobre anonimo, inativo, suspenso,
bloqueado, owner, non-owner, moderator e admin. O SQL
`authorization-enforcement-remote-audit.sql` audita RLS e privilegios no
catalogo remoto sem alterar dados.

### 7.8 Denuncias, moderacao e auditoria

**Consolidado:** cada dominio continua owner de seu report, status, SLA e acao
corretiva. `src/core/moderation` compartilha apenas o protocolo de razoes, o
dialog e a projecao federada read-only. Nao existe tabela universal de report.
`list_federated_moderation_queue` agrega metadados limitados de nove dominios,
exige admin, usa keyset e nunca copia ou altera o status mestre.

`community_reports` e o SSOT de denuncias do conteudo comunitario e aceita os
alvos `post`, `comment`, `profile`, `lost_found_post`, `lost_found_comment`,
`question` e `answer`. `CommunityReportService` e o writer do browser; reporter
e autor do alvo sao derivados no banco. A revisao pertence a
`CommunityContentModerationService` e permanece atomica.

`classified_reports`, `vaga_reports`, `review_reports` e `ride_reports`
continuam fisicamente separados e usam comandos server-owned. O browser nao
envia reporter, reviewer ou admin; os comandos derivam ator pelo JWT/Profile
ativo, bloqueiam escrita direta, aplicam limites/deduplicacao e geram auditoria
privada sem texto livre. Contrato: `SENSITIVE_REPORT_COMMANDS.md`.

Incidentes de comentario, mensagem e conversa de Classificado usam
`TrustIncidentService`. Ator, alvo, papel e contexto sao derivados; denuncia de
conversa bloqueia a conversa atomicamente e texto de mensagem/comentario nao e
copiado para evidence/auditoria. Contrato: `TRUST_MESSAGING_COMMANDS.md`.

`src/core/audit` define `AuditEvent`, `AuditEventReader` e `AuditEventSink`
append-only. Sinks sao backend-only e especificos do dominio. A leitura de
`community_social_audit_log` ocorre somente por
`CommunitySocialAuditReader`/`list_community_social_audit_events`, exige admin,
usa keyset e nao permite `SELECT` direto ao browser. Ban ativo e lido por
`ActiveBanReader`/`has_current_active_ban` no dominio Trust, sem parametro,
metadata de moderacao ou dependencia circular com Profile. `banned_users` nao
possui leitura direta pelo navegador.

**CP-014 resolvido:** feedback operacional usa comandos por dominio; rating e
review possuem projecao transacional; late cancellation nasce da transicao
canonica; politica e admin actions sao server-owned. `trust_events` e
`trust_admin_actions` nao possuem acesso direto pelo browser. Contrato:
`TRUST_OPERATIONAL_COMMANDS.md`.

**CP-015 resolvido:** direct message de Post comunitario usa o agregado
`community_direct_*`, com participantes, lifecycle, reports, auditoria, RLS e
comandos proprios. Nenhum ID de Post e persistido como `classified_id`.

**Permanece no dominio:** razoes adicionais, SLA, acao corretiva e evidencia
do agregado.

**Pendente:** prazos de retencao/anonymizacao de reports e auditoria dependem
de aprovacao de Privacidade/DPO e sao bloqueio de lancamento;
nenhum agente pode inventar TTL. Contrato completo:
`AUDIT_MODERATION_SSOT.md`.

### 7.9 Realtime

**Existe:** `core/realtime/RealtimeService` e `realtimeRegistry.ts` sao o SSOT
executavel de canais.

**Consolidado:** Messaging, Notification, Tracking, Family, Metrics,
Gastronomia e Try-on delegam ao Core. `.channel(` existe apenas no owner e um
teste arquitetural bloqueia regressao. A assinatura global de `messages` e os
broadcasts de Dispatch sem consumidor foram removidos.

**Permanece no dominio:** normalizacao do payload, invalidacao de cache e
reacao de produto. Tabela, evento e coluna de filtro pertencem ao registry.

**Core entregue:** Postgres Changes, Broadcast e Presence tipados; UUID antes
do connect, cleanup idempotente, limite de canais/payload/estado, deduplicacao
limitada, status e telemetria. Reconnect/backoff pertencem ao SDK Supabase.

**Evidencia restante:** perda de rede real, quota, carga e p95/p99 devem ser
medidos em staging. Contrato detalhado: `REALTIME_SSOT.md`.

### 7.10 Mensageria e chat

**Existe:** `ClassifiedMessagingService` atende exclusivamente Classificados;
`CommunityDirectMessagingService` atende conversa privada iniciada em Post;
Mobilidade usa `ride_chat_messages`; grupos usam `group_messages_new`.

**Consolidado:** o alias generico foi removido. As inboxes de Classificados e
Community Direct usam RPC limitado, cursor `(last_message_at,id)` e indices
aderentes, sem consulta adicional por conversa. Historico comunitario usa
cursor `(created_at,id)`. Os adapters Realtime delegam ao Core e assinam
somente a conversa/thread aberta.

**Permanece no dominio:** participantes, elegibilidade, bloqueio, retencao,
moderacao e vinculo com listing/ride/group.

**Core entregue:** contratos estruturais de inbox/thread sem campos de dominio,
paginacao e Realtime. Cada dominio conserva adapter e enforcement proprios.
Contratos detalhados: `CLASSIFIED_MESSAGING_SSOT.md` e
`COMMUNITY_DIRECT_MESSAGING_SSOT.md`.

**Migracao restante:** Ride e Group estao catalogados e permanecem especificos;
so devem implementar um port comum quando existir consumidor transversal real.
Retencao temporal de mensagens sera alinhada ao contrato comum de Audit/Privacy.
Nao fundir tabelas em big bang.

### 7.11 Reviews

**Consolidado:** `public.reviews` e a unica fonte de verdade para reviews cujo
alvo e Profile. `core/reviews` possui tipos, mapeamento, leitura, comandos de
Profissional, report e helpfulness. `BusinessReviewService` e o adapter de
policy comercial e Gastronomia apenas compoe a experiencia.

As tabelas remotas `business_reviews_new` e `professional_reviews_new` foram
migradas, verificadas e removidas. O browser nao possui escrita direta;
identidade, elegibilidade, voto e denuncia sao validados por RPC/Edge. Admin
possui somente read models explicitamente allowlisted.

**Permanece no dominio:** elegibilidade/resposta por pedido e apresentacao de
Gastronomia. `event_reviews` permanece no dominio de Eventos por ter alvo e
lifecycle diferentes. Midia usa o contrato comum MediaAsset.

Contrato e evidencias: `REVIEWS_SSOT.md`.

## 8. Backend versus interface

### Obrigatoriamente backend

- derivar User/Profile ator do JWT e membership aplicavel;
- autorizar escrita por RLS, RPC ou Edge Function;
- validar ownership, role, rate limit, idempotency e transicao de estado;
- manter contadores atomicos, auditoria e notification outbox;
- validar MIME real, tamanho, quota, path e ownership de MediaAsset;
- aplicar moderacao, bloqueio e visibilidade;
- fornecer paginacao keyset, ranking reproduzivel e limites maximos;
- filtrar Realtime por politica e impedir leitura de outro contexto.

### Pode permanecer frontend

- estado visual, modal, tabs, ordenacao escolhida e filtros locais;
- debounce, cancelamento e cache via React Query;
- optimistic update com rollback e reconciliacao pelo servidor;
- pre-validacao de arquivo para UX, sem substituir backend;
- hints de capacidade para apresentar controles;
- Web Share API e composicao visual de read models.

## 9. Escalabilidade

- Escritas com efeitos colaterais usam transacao e outbox, nao cascata de
  requests do navegador.
- Listas usam keyset cursor e limites server-side; nao ordenam grandes datasets
  no cliente.
- Feed e busca evoluem por read models/indices medidos, sem copiar mestres dos
  dominios para a Comunidade.
- Mensageria elimina N+1 com RPC/read model agregado e pagina mensagens.
- Media usa CDN, variantes e cleanup assincrono com referencia canonica.
- Realtime usa registry, backoff, deduplicacao e quota por tela/usuario.
- Comandos repetiveis possuem idempotency key quando a rede puder duplicar o
  efeito.
- Logs e auditoria usam metadados limitados, sem texto integral ou PII
  desnecessaria.
- Declarar milhares de requisicoes por segundo exige carga em staging, SLO,
  p95/p99, pool/concurrency e capacidade confirmada do plano Supabase.

## 10. Estrutura alvo conservadora

O repositorio mantera `src/core`; nao sera criado outro top-level `platform`.

```text
src/core/
  authorization/   # contratos e capability preview; enforcement no backend
  media/           # assets, presets, transporte e lifecycle
  notifications/   # inbox, preferences, outbox contracts e delivery ports
  search/          # federacao de SearchProviders
  realtime/        # registry e subscriptions
  posts/           # agregado Post
  comments/        # agregado Comment de Post
  engagement/      # reaction/save ports; sem tabela arbitraria publica
  feed/            # agregacao/ranking; sem CRUD de Post
  moderation/      # protocolo e fila federada
  audit/            # envelope e ports append-only
  messaging/        # somente contratos compartilhados

src/modules/<domain>/
  services/        # regras e adapters especificos
  hooks/           # orquestracao e cache
  components/      # apresentacao
```

Movimentos fisicos so ocorrem depois de ownership e imports estabilizados.

## 11. Estrategia de migracao

Usar strangler incremental:

1. registrar owner atual e bloquear novos writers/canais diretos;
2. criar ou corrigir contrato canonico sem mudar consumidores;
3. adicionar adapter estreito e deprecated quando compatibilidade for exigida;
4. migrar consumidores em lotes pequenos com testes de contrato;
5. observar erros, latencia e divergencia;
6. remover writer/wrapper antigo e seu allowlist;
7. atualizar este SSOT, o plano e o inventario gerado.

Cada etapa preserva rollback de codigo. Mudanca destrutiva de schema so ocorre
depois que todos os leitores/escritores antigos forem removidos.

## 12. Definicao de pronto por capacidade

- um owner de escrita declarado;
- nenhum acesso direto paralelo a mesma tabela/RPC/bucket;
- ator derivado server-side em comandos sensiveis;
- RLS/grants/constraints testados por anon, autenticado, owner e nao owner;
- contrato, adapter e cache cobertos por testes;
- paginacao, limites, erro e observabilidade definidos;
- compatibilidade temporaria tem condicao de remocao;
- documentacao e manifest de ownership atualizados;
- validadores impedem reintroducao da duplicacao removida.

## 13. Referencias

- `docs/architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`
- `docs/architecture/CORE_LAYER_SSOT.md`
- `docs/COMMUNITY_TRANSVERSAL_ARCHITECTURE.md`
- `docs/CURRENT_RULES.md`
- `docs/DATA_MODELING.md`
- `docs/audits/PROJECT_INVENTORY.md`
- `docs/architecture/core-platform-ownership.json`
- `docs/architecture/REVIEWS_SSOT.md`
- `plans/CORE_PLATFORM_CONSOLIDATION_PLAN.md`
