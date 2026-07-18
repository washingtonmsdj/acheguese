# Core Platform Consolidation Plan

Status: ativo
Data de abertura: 2026-07-14
Arquitetura canonica:
`docs/architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md`

## 1. Objetivo

Consolidar capacidades compartilhadas da plataforma sem transformar
Comunidades em owner de outros dominios e sem executar uma refatoracao Big
Bang.

Ao final, Posts, Comments, Reactions, Saves, Shares, Feed, Notifications,
Search, Media, Permissions, Reports, Audit, Realtime e Messaging terao:

- owner de escrita explicito;
- contrato reutilizavel quando a semantica for realmente comum;
- regras especificas preservadas nos dominios;
- backend como autoridade de seguranca;
- compatibilidade temporaria rastreada e removivel;
- testes e validadores contra regressao de SSOT.

## 2. Fora de escopo

- criar novas funcionalidades visuais de produto;
- fundir todas as tabelas de comentarios, mensagens ou reports;
- criar microservices antes de necessidade operacional medida;
- trocar Supabase por outra infraestrutura;
- reescrever todos os dominios em uma unica entrega;
- mover arquivos apenas para produzir uma arvore visualmente uniforme;
- prometer escala sem teste de carga em staging e SLO observado.

## 3. Estado inicial auditado

Concluido nesta abertura:

- [x] inventario de services, hooks, tabelas, RPCs, Storage e Realtime;
- [x] distincao entre core domain `Comunidade Local` e `Core Platform`;
- [x] entidades canonicas e fronteiras de dominio registradas;
- [x] duplicacoes e riscos CP-001 a CP-013 registrados no SSOT;
- [x] backend versus frontend definido;
- [x] estrategia incremental e definicao de pronto definidas.

Ainda nao consolidado:

- [x] chamadas de notificacao cross-user dos produtores inventariados na Fase
      1A;
- [x] dois writers de `notification_preferences` removidos;
- [x] tres writers de `user_favorite_businesses` consolidados;
- [x] `FeedService`/alias paralelos a `core/posts` removidos;
- [x] `InteractionService` e hooks antigos removidos;
- [x] busca local comunitaria paralela a `core/search` removida;
- [x] canais Supabase fora de `RealtimeService` removidos;
- [x] presets de Media para Review e Menu Item;
- [x] autorizacao client-side reclassificada como hint;
- [x] reports administrativos com ator derivado server-side;
- [x] Messaging de Classificados nomeado e paginado corretamente;
- [x] direct message comunitario separado de Classificados e protegido por
      agregado/RPC/RLS proprios;
- [x] contrato base de Review sem dois owners declarados.

## 4. Regras de execucao

1. Antes de criar service, procurar owner, tabela, RPC, hook e componente
   equivalentes no inventario.
2. Cada tabela mutavel possui um writer canonico por operacao.
3. Read models adicionais precisam ser declarados e read-only.
4. Compatibilidade usa adapter estreito, `@deprecated`, consumidor contado e
   criterio de remocao.
5. Nunca manter dual write como solucao final.
6. Identidade de ator/admin/destinatario sensivel e derivada server-side.
7. Toda mudanca de banco inclui RLS, grants, constraints, rollback logico e
   teste de abuso.
8. Toda fase atualiza este plano, o SSOT e o manifest de ownership.
9. Mudanca de comportamento sai atras de contrato/teste; feature flag e usada
   apenas quando rollback operacional exigir.
10. Arquivos nao relacionados e alteracoes existentes do usuario nao sao
    reformatados nem revertidos.

## 5. Ordem de execucao

### Fase 0 - Guardrails e ownership executavel

Objetivo: impedir aumento da divida durante a migracao.

- [x] criar manifest machine-readable com tabela/RPC/bucket/canal, owner de
      escrita, readers autorizados e adapter de compatibilidade;
- [x] gerar o manifest a partir do inventario e revisar excecoes manualmente;
- [x] criar `validate-core-platform-ownership`;
- [x] bloquear novo writer nao declarado para tabelas controladas;
- [x] bloquear novo `supabase.channel()` fora de `core/realtime`;
- [x] bloquear novos imports de `core/interaction`;
- [x] bloquear novas exportacoes alias `feedService` fora do owner aprovado;
- [x] integrar validadores a `audit:architecture`, deploy check e CI;
- [x] adicionar teste que confirma que o manifest nao aponta para arquivo
      inexistente.

Definicao de pronto:

- novas duplicacoes falham em CI;
- excecoes existentes estao allowlisted com finding e fase de retirada;
- o manifest nao e usado em runtime da aplicacao.

Fase concluida em 2026-07-14. Evidencias: 22 tabelas e 11 RPCs controlados, 40
callsites incrementais congelados, 12 testes do analisador/validador e gate
adicionado ao workflow de seguranca.

### Fase 1 - Autoridade server-side e notificacoes criticas

Objetivo: fechar CP-001, CP-002 e CP-003 antes das consolidacoes cosmeticas.

#### 1A. Notification command/outbox

- [x] catalogar cada produtor cross-user e seu evento de dominio;
- [x] definir `NotificationCommand` sem HTML e com metadata limitada;
- [x] criar outbox transacional server-side com idempotency key;
- [x] implementar dispatcher observavel, retry com backoff e DLQ;
- [x] migrar Community sem regredir atomicidade;
- [x] migrar Work Opportunities, Vagas, Trust, Mobility, Orders e Admin;
- [x] normalizar o schema de Safety e migrar seu produtor sem adapter legado;
- [x] manter `createNotification` client-side explicitamente self-only;
- [x] cobrir contrato estatico, ownership, audiencia derivada e remocao dos
      produtores client-side migrados;
- [x] aplicar as migrations da Fase 1A no ambiente remoto de desenvolvimento;
- [x] provar remotamente JWT obrigatorio na Edge de emergencia, RPC publico por
      token sem leitura direta de `ride_shares` e sincronizacao local/remota;
- [x] testar destinatario, deduplicacao, preferencias, retry, DLQ, requeue e
      health com dados isolados em transacao remota revertida.

Fase 1A concluida em 2026-07-14 para os produtores inventariados. O probe
`tests/security/notification-outbox-remote-probe.sql` comprovou o dispatcher
no remoto e terminou com `ROLLBACK`; a verificacao posterior encontrou zero
registros de probe persistidos. O cron drena no
maximo 500 comandos/minuto e funciona como safety net inicial. A funcao usa
`SKIP LOCKED` e admite workers concorrentes, mas escala acima desse patamar so
sera declarada apos teste de carga em staging.

#### 1B. Authorization capability preview

- [x] renomear/reclassificar `AuthorizationEngine` como preview de UI;
- [x] consolidar tipos vazios de `core/permissions` em `authorization`;
- [x] remover consultas a tabelas comunitarias fora do SSOT vigente;
- [x] mapear cada comando sensivel para RLS/RPC/Edge enforcement;
- [x] testar owner, non-owner, moderator, admin, suspended e anon;
- [x] impedir docs/comentarios que chamem decisao do browser de autoritativa.

Fase 1B concluida em 2026-07-14. `CapabilityPreviewService` substituiu o
engine antigo e usa apenas o owner canonico de Profile e o broker de Roles.
Consultas browser-side a Posts, Comments, Messages, Business e tabelas
comunitarias foram removidas. O mapa auditavel
`docs/architecture/authorization-enforcement-map.json` liga cada hint ao
owner do comando e ao enforcement backend. O catalogo remoto confirmou RLS
ativo nas tabelas auditadas e RPCs administrativos restritos. Review, Poll e
buckets de Media permanecem marcados como cobertura parcial nos findings de
suas fases proprias; isso nao os transforma em autorizacao client-side.

#### 1C. Reports sensiveis

- [x] criar RPC/broker de Classified Reports que deriva reporter/admin;
- [x] migrar create/review/update sem aceitar IDs privilegiados da UI;
- [x] limitar texto, rate limit, deduplicacao e trilha append-only;
- [x] repetir o padrao em Review/Vaga/Ride apenas onde a auditoria confirmar
      o mesmo risco.

Fase 1C concluida em 2026-07-14. A migration
`20260714118000_harden_sensitive_report_commands.sql` foi aplicada no remoto;
os tipos foram regenerados e o manifest passou a controlar 24 tabelas e 19
RPCs. As tabelas de dominio nao foram fundidas. O protocolo, evidencias e
residual de Trust estao em `docs/architecture/SENSITIVE_REPORT_COMMANDS.md`.

#### 1D. Trust/Messaging incident commands

- [x] inventariar produtores de `trust_events` por evento e contexto;
- [x] criar comandos especificos para denuncia de comentario de Classificado
      e conversa, derivando ator, alvo, papel e contexto no backend;
- [x] corrigir a denuncia de conversa que aponta o ator como alvo;
- [x] separar incident report de feedback operacional e eventos de sistema;
- [x] remover IDs/papeis privilegiados dos contratos dos consumidores;
- [x] limitar texto/evidence, rate limit, deduplicacao e auditoria;
- [x] manter `trust_events` como SSOT, sem tabela paralela;
- [x] provar RLS/RPC e atualizar o manifest antes de migrar outros produtores.

Fase 1D concluida em 2026-07-14 para incidentes e Classified Messaging. A
migration `20260714119000_harden_trust_messaging_incident_commands.sql` foi
aplicada no remoto e corrigiu tambem o schema remoto sem migration, identidade
`auth.users` versus Profile, escrita direta e hard delete administrativo. O
manifest controla 27 tabelas e 27 RPCs. Feedback operacional de Trust segue em
CP-014 e direct message de Post comunitario segue em CP-015; nenhum deles foi
mascarado como resolvido. Evidencias: `TRUST_MESSAGING_COMMANDS.md`.

Definicao de pronto:

- nenhum fluxo cross-user depende da API self-only;
- nenhuma decisao administrativa confia em ID passado pelo browser;
- capability preview nao e usado como prova de autorizacao;
- testes negativos remotos ou contra ambiente isolado passam.

### Fase 2 - Writers unicos nas mesmas tabelas

Objetivo: fechar CP-004 e CP-005 sem mudanca visual.

#### 2A. Notification preferences

- [x] criar um tipo canonico derivado do schema gerado;
- [x] separar `get`, `patchChannels`, `patchTopics` e `patchQuietHours`;
- [x] preservar campos nao alterados em todo patch;
- [x] adaptar os dois services antigos para o owner novo;
- [x] migrar consumidores e remover adapters;
- [x] testar concorrencia, partial update e defaults ausentes.

Fase 2A concluida em 2026-07-14. Um unico owner tipado usa dois RPCs
server-owned; parametros omitidos preservam colunas sob row lock, o save da UI
e atomico e os dois services antigos foram removidos. O remoto tinha 224 rows
validas e o probe de patch parcial terminou em rollback. O manifest controla
27 tabelas e 29 RPCs. Contrato: `NOTIFICATION_PREFERENCES_SSOT.md`.

#### 2B. Business favorites

- [x] escolher `core/favorites` como owner de storage;
- [x] manter Business como policy/URL adapter;
- [x] fazer Gastronomia consumir o adapter de Business;
- [x] retirar queries diretas duplicadas de `user_favorite_businesses`;
- [x] testar set atomico, idempotencia, owner e cache;
- [x] avaliar migracao de nome `user_*` para `profile_*` apenas em ADR futura.

Fase 2B concluida em 2026-07-14. `BusinessFavoriteStore` e o unico owner de
persistencia, Business e o adapter de dominio e Gastronomia apenas compoe seu
read model. Identidade vem de `auth.uid()`, escrita/leitura direta do browser
foi revogada, o set e idempotente sob lock e a vitrine usa batch limitado. A
tabela `business_favorites`, vazia e sem dependencias, e quatro RPCs antigos
sem consumidor foram removidos sem `CASCADE`. O probe remoto terminou em
rollback. Contrato: `BUSINESS_FAVORITES_SSOT.md`.

Definicao de pronto:

- cada tabela possui um writer canonico;
- adapters antigos nao fazem query direta;
- manifest e validadores refletem o owner final.

### Fase 3 - Social core, Feed e Search

Objetivo: consolidar interacoes usadas pela Comunidade sem torna-la owner da
plataforma.

#### 3A. Posts/Feed

- [x] contar imports de `core/feed` e do alias `feedService`;
- [x] migrar CRUD/paginacao para `core/posts`;
- [x] remover contratos paralelos de `Post`, `CreatePostData` e
      `UpdatePostData` de `core/feed/types.ts`;
- [x] remover `core/feed/types.ts` e campos obsoletos;
- [x] manter em `core/feed` apenas o contrato de composicao existente: chaves
      de cache; `FeedItem`, sources e rank aguardam uso real;
- [x] nao criar adapters de Event, Classified ou Business sem uso de produto;
- [x] testar keyset, empate, visibilidade, bloqueio de interacao e volume
      limitado por pagina.

Fase 3A concluida em 2026-07-14. `core/posts` possui o unico CRUD e cursor;
`core/feed` nao representa Post nem acessa Supabase. Contrato:
`docs/architecture/POSTS_FEED_SSOT.md`.

#### 3B. Comments/Reactions/Saves/Shares

- [x] migrar hooks antigos que usam `InteractionService`;
- [x] remover facade que apenas redelega;
- [x] separar group interactions de post reactions em contratos publicos;
- [x] tornar `ProfileSavedEntityService` infraestrutura interna com adapters
      allowlisted e tipados;
- [x] manter tabelas especificas onde lifecycle/RLS diferirem;
- [x] testar contadores atomicos, optimistic rollback e abuso concorrente.

Fase 3B concluida em 2026-07-14. Likes/saves de Post pertencem a
`PostEngagementService`; comentarios a `core/comments`; grupos a
`SocialGroupInteractionsService`; shares a `core/posts`. Atores sao derivados
do Profile ativo e o banco conserva RLS, constraints, contadores e rate limits.
Contrato: `docs/architecture/SOCIAL_ENGAGEMENT_SSOT.md`.

#### 3C. Search

- [x] definir `SearchProvider` e registrar providers na composition root;
- [x] tornar `SearchService` com `communityId` o unico contrato comunitario;
- [x] remover cinco queries por tipo e ordenacao local sem consumidores;
- [x] separar historico global, comunitario e territorial;
- [x] adicionar cancelamento cooperativo, limites e amostras de latencia;
- [x] documentar que keyset exige uma superficie paginada e merge estavel;
- [x] condicionar indice dedicado a p95, volume e planos medidos.

Fase 3C concluida em 2026-07-14. `SearchService` apenas orquestra providers;
queries, ranking e URLs permanecem nos owners de dominio. Escopo comunitario
usa `community_entity_links` e falha fechado; Oportunidades exigem territorio
quando ainda nao houver link canonico. O hook/modal paralelos sem consumidores
foram removidos. O contrato limitado nao ganhou cursor ficticio e p95 real
continua como evidencia operacional da Fase 6. Contrato:
`docs/architecture/SEARCH_SSOT.md`.

Definicao de pronto:

- Post tem um unico CRUD e cursor;
- interacoes possuem owner por agregado e contrato compartilhado sem tabela
  arbitraria exposta;
- busca global e comunitaria usam a mesma orquestracao;
- Community apenas filtra/compoe entidades canonicas.

### Fase 4 - Media e Realtime

Objetivo: fechar CP-006 e CP-007.

#### 4A. MediaAsset

- [x] definir presets versionados para avatar, post, business, review, menu,
      classified e anexos aprovados;
- [x] validar MIME por bytes, tamanho, dimensao, quota e nome server-side;
- [x] retornar `MediaAssetRef`, nao depender apenas de URL publica;
- [x] migrar Review/Menu para presets proprios;
- [x] registrar ownership/referencia e job de orfaos;
- [x] testar upload, remocao, acesso cruzado, arquivo poliglota e quota.

Fase 4A concluida em 2026-07-14 para o acoplamento CP-006. Review e Menu usam
presets proprios, `MediaAssetRef`, broker autenticado, quota atomica, metadata,
links por trigger e cleanup fisico. As migrations `20260714125000` e
`20260714126000` foram aplicadas no remoto; tres Edge Functions foram
publicadas/atualizadas. Probes reais comprovaram RLS, `403` cross-owner, `415`
para payload apos EOI, quota `P0001` com rollback, grants service-role-only,
remocao do objeto e cron `pg_net` HTTP 200. O manifest controla 29 tabelas, 37
RPCs e 34 callsites. Contrato: `docs/architecture/MEDIA_ASSET_SSOT.md`.

Presets de outros dominios foram definidos, mas seus consumidores anteriores
ainda nao usam metadata/lifecycle uniforme. Isso permanece explicitamente em
CP-016 e nao autoriza reutilizar lifecycle de Post/Review/Menu.

#### 4B. Realtime registry

- [x] suportar postgres changes, broadcast e presence por contrato tipado;
- [x] padronizar ID, filtro, cleanup, reconnect, backoff e telemetria;
- [x] migrar Notification e Messaging primeiro;
- [x] migrar Gastronomia, Tracking, Family, Metrics e Try-on em lotes;
- [x] remover canais diretos e sua allowlist;
- [x] testar mount/unmount repetido, transicao de conexao e duplicacao de evento.

Fase 4B concluida em 2026-07-15. `realtimeRegistry.ts` e
`RealtimeService.ts` sao o owner unico de Postgres Changes, Broadcast e
Presence. Mensagens deixaram de ouvir a tabela inteira e usam
`conversation_id`; Mobility usa corrida ou perfil; os adapters restantes
delegam ao Core. O reconnect/backoff permanece no SDK Supabase, com status e
latencia observados pelo Core. O teste arquitetural impede `.channel(` fora do
owner, oito testes comportamentais cobrem filtro, deduplicacao, cleanup,
transicao de status, Broadcast e Presence, e o baseline caiu de 34 para 26
callsites. Contrato: `docs/architecture/REALTIME_SSOT.md`.

Perda de rede real, quotas e p95/p99 continuam como evidencia obrigatoria de
staging na Fase 6; o teste unitario nao e apresentado como carga real.

Definicao de pronto:

- nenhum dominio escolhe bucket/path arbitrario;
- nenhum canal direto existe fora do owner;
- recursos sao liberados ao desmontar a tela.

### Fase 5 - Messaging, Reviews, Moderation e Audit

Objetivo: compartilhar contratos sem fundir agregados incompatveis.

- [x] renomear Messaging atual para owner de Classificados;
- [x] definir ports de inbox/thread sem campos de listing/ride/group;
- [x] eliminar N+1 de previews com RPC/read model e pagina keyset;
- [x] catalogar adapters de Classified, Community Direct, Ride e Group sem
      criar facade universal sem consumidor;
- [x] publicar Review base em `core/reviews` e policies de Business;
- [x] mover report/helpfulness para comandos server-owned;
- [x] compartilhar dialog/taxonomia base de Report;
- [x] criar fila federada read-only sem duplicar status mestre;
- [x] substituir `AdminAuditService` por reader comunitario explicito;
- [x] definir `AuditEvent` e ports append-only com PII/retencao explicitas.

Definicao de pronto:

- nomes publicos refletem o dominio real;
- cada adapter possui autorizacao e lifecycle proprios;
- lista de conversas nao cresce em queries por item;
- auditoria do browser permanece read-only.

Entrega 5A concluida em 2026-07-15 para Classified Messaging. O owner publico
agora e `ClassifiedMessagingService`; nao existe alias generico. A inbox usa um
RPC por pagina, cursor `(last_message_at,id)`, `limit + 1`, busca limitada e
indices aderentes. O probe remoto comprovou anonimo `401`, Profile proprio
permitido e Profile alheio `403`. O manifest controla 29 tabelas, 38 RPCs e 26
callsites. Contrato: `docs/architecture/CLASSIFIED_MESSAGING_SSOT.md`.

Na entrega 5A, CP-012 foi encerrado e CP-015 permaneceu aberto ate a entrega
5B abaixo. Ride e Group conservaram seus agregados; nenhum deles recebeu
tabela ou facade universal sem consumidor transversal real.

Entrega 5B concluida em 2026-07-15 para Community Direct Messaging. O conector
de Post agora usa `community_direct_threads`, participantes, mensagens,
reports e auditoria privada proprios. Sete RPCs de produto e um de moderacao
derivam identidade, comunidade, autor/alvo e privilegio no backend; o browser
nao possui escrita direta. Inbox/historico usam keyset, limites e indices, e o
canal Realtime e filtrado por thread. O probe remoto passou em 16 casos de
autorizacao, RLS, bloqueio, denuncia e deduplicacao. O manifest controla 34
tabelas, 46 RPCs e 26 callsites incrementais. Contrato:
`docs/architecture/COMMUNITY_DIRECT_MESSAGING_SSOT.md`.

CP-015 foi encerrado. Classified, Community Direct, Ride e Group estao
catalogados como agregados separados; apenas os dois adapters com consumidor
transversal atual implementam os ports comuns. Criar wrappers vazios para Ride
e Group nao seria consolidacao e permanece proibido.

Entrega 5C concluida em 2026-07-15 para Review Core. `public.reviews` e a unica
fonte de verdade para alvos Profile; `core/reviews` possui agregado, leitura e
engajamento, enquanto `BusinessReviewService` preserva somente a policy
comercial. Gastronomia deixou de ser owner de persistencia. Duas linhas de
`professional_reviews_new` foram migradas, nenhuma linha comercial estava
pendente e as duas tabelas legadas foram removidas com verificacao previa e
`RESTRICT`. Report e helpfulness agora passam por comandos server-owned.

As migrations `20260715094000`, `20260715095000` e `20260715096000` estao no
remoto. O probe passou em 31 casos de elegibilidade, spoof, RLS, escrita direta,
voto, denuncia e exclusao. O manifest controla 34 tabelas, 51 RPCs e 24
callsites incrementais. CP-013 foi encerrado. Contrato:
`docs/architecture/REVIEWS_SSOT.md`.

Entrega 5D concluida em 2026-07-15 para Moderation e Audit. A taxonomia base e
o dialog sao compartilhados sem fundir agregados; a fila federada agrega nove
dominios como projecao read-only, sem copiar status mestre. O antigo
`AdminAuditService`, a facade generica de moderacao e o owner comunitario com
nome generico foram removidos. `src/core/audit` publica apenas contratos
append-only e Community possui reader administrativo proprio, keyset e sem
leitura direta da tabela.

`community_reports` cobre sete alvos canonicos e deriva reporter/autor no
backend. O defeito que impedia exclusao de User por referencia recriada em
`billing_audit_log` foi corrigido; snapshots JSON deixaram de duplicar
`user_id`. As migrations `20260715100000` ate `20260715107000` estao no remoto.
O probe passou em 28 cenarios de autorizacao, RLS, taxonomia, leitura direta,
ban atual e cleanup. O manifest controla 36 tabelas, 54 RPCs e 24 callsites
incrementais.
Contrato: `docs/architecture/AUDIT_MODERATION_SSOT.md`.

No inicio da Fase 6, `UserWarningsService` tambem foi removido: nao possuia
consumidores, confundia User/Profile e convertia erro de leitura em sucesso
vazio. O comando server-owned foi preservado no dominio. O inventario foi
regenerado e os gates finais da entrega passaram; os itens globais de escala e
remocao de compatibilidade permanecem abertos ate auditoria completa/staging.
`banned_users` perdeu o `SELECT` do browser; Profile usa um RPC sem parametro
que retorna somente o booleano do User autenticado.

A entrega nao define retencao artificial: finalidade, TTL, anonimizacao e legal
hold de reports/auditoria ainda exigem decisao de Privacidade/DPO antes do
lancamento.

CP-014 foi concluido em 2026-07-15. As migrations
`20260715108000_add_professional_trust_role.sql` e
`20260715109000_consolidate_trust_commands.sql` foram aplicadas no remoto. A
migration `20260715111000_fix_trust_command_rate_limit.sql` substitui contagem
por cardinalidade de eventos por janela atomica por Profile/comando, inclusive
para atualizacoes via upsert. A migration `20260715112000` fecha entradas nulas
com erro explicito no contrato privado; ambas tambem estao aplicadas no remoto.
`TrustEventService` foi removido; feedback por dominio, rating, review, late
cancellation, politica e administracao usam comandos server-owned. O manifest
agora controla 38 tabelas e 68 RPCs. Typecheck, testes SSOT e o probe remoto de
20 cenarios de autorizacao passaram. Contrato:
`docs/architecture/TRUST_OPERATIONAL_COMMANDS.md`.

CP-016 foi concluido em 2026-07-17. As migrations `20260715113000`,
`20260717120000` e `20260717121000` estao no remoto. O backfill processou 55
referencias em 25 agregados: 49 imagens foram sanitizadas, ativadas e vinculadas;
6 URLs Unsplash com HTTP 404 foram descartadas com hash e motivo no ledger
privado. A auditoria final encontrou zero legado, zero entradas invalidas e zero
funcoes temporarias restantes. Typecheck, lint, build, dependencias, SSOT,
seguranca, testes MediaAsset/JPEG e migrations passaram. Contrato:
`docs/architecture/MEDIA_ASSET_SSOT.md`.

O corte complementar de Posts e Achados/Perdidos foi concluido em 2026-07-17
pela migration `20260717130000`. Os dois agregados agora persistem somente
`MediaAssetRef` do preset `post_image`; triggers mantem os links `post` e
`lost_found_post`, e o navegador nao escreve nem remove objetos diretamente.
O bucket vazio `post_images` foi removido pela API oficial do Storage. A
auditoria remota agregada confirmou zero referencia invalida, link ausente,
bucket, policy ou funcao legada. O probe anonimo confirmou bloqueio do insert
de Post (`42501`) e do upload direto em `media-assets` (`403`).

Checkpoint de limpeza da Fase 6 em 2026-07-17: foram removidos os metodos sem
consumidor `AuthService.deleteStorageImage`, `MediaService.uploadMultipleImages`,
`MediaService.deleteFile` e `MediaService.getPublicUrl`; tambem sairam
`ProfileFacade`, `BusinessFacade`, `ChatFacade`, `chatService` e o alias
`UnifiedMobilityService`. O relatorio estrutural historico que ainda descrevia
`profile.facade.ts` como estado atual foi removido e o inventario foi regenerado.
O baseline de Storage dinamico do `MediaService` caiu de 6 para 1 leitura e de
8 para 3 escritas. Facades com consumidores reais, como `PostsFacade`,
`ProfessionalFacade`, `GastronomyFacade` e `MobilityFacade`, foram preservadas.

### Fase 6 - Remocao de compatibilidade e escala

- [x] remover aliases, facades e tipos deprecated sem consumidores;
- [x] regenerar inventario e provar reducao de duplicacoes;
- [x] remover allowlists fechadas dos validadores;
- [ ] executar suites unitarias, integracao, RLS e E2E por dominio;
- [ ] executar carga somente em staging explicitamente autorizado;
- [ ] registrar p50/p95/p99, erros, conexoes, cache hit e custo;
- [ ] validar backup, restore, rollback e runbooks;
- [ ] atualizar status de cada finding CP-001 a CP-013;
- [ ] mover este plano para concluidos apenas quando todas as definicoes de
      pronto forem satisfeitas.

## 6. Estrategia de compatibilidade

Ordem obrigatoria para cada migracao:

```text
novo owner -> adapter antigo delega -> consumidores migram -> telemetria
-> adapter sem consumidores -> remocao -> validador endurecido
```

Nao usar:

- duplicacao de tabela como fallback;
- redirect de rota para esconder owner incorreto;
- `try/catch` que trata falha de autorizacao como sucesso vazio;
- feature flag permanente para manter duas arquiteturas;
- casts que removam a verificacao do schema gerado.

## 7. Evidencias obrigatorias por PR/EPIC

- diff de ownership antes/depois;
- tabelas, RPCs, buckets e canais afetados;
- testes positivos e negativos de autorizacao;
- teste de compatibilidade dos consumidores existentes;
- plano de rollback e remocao do adapter;
- metricas de query/request quando houver hot path;
- atualizacao do SSOT, deste plano e do status operacional;
- lista explicita do que ainda permanece duplicado.

## 8. Proxima entrega selecionada

Continuar **Fase 6 - Remocao de compatibilidade e escala**.

Checkpoint concluido em 2026-07-17: os 46 registros do lint remoto foram
classificados por owner. As migrations `20260717140000`, `20260717141000` e
`20260717142000` removeram funcoes sem callers, corrigiram todas as funcoes da
aplicacao e consolidaram Coverage. O lint agora reporta zero achados da
aplicacao; restam somente 12 nomes pertencentes ao PostGIS, registrados em
`docs/audits/SUPABASE_REMOTE_FUNCTION_LINT_2026-07-17.md`. A auditoria remota
de Coverage retornou quatro contagens zero, e o inventario foi regenerado.

Segundo checkpoint de limpeza em 2026-07-17: o facade sem consumidores
`src/modules/community-alerts`, o modelo de tipos duplicado em
`src/modules/classifieds/types/classified.ts`, APIs deprecated sem callsites e
o gerador simulado de plano SSOT foram removidos. Os validadores de taxonomia e
Community nao possuem mais allowlists de compatibilidade; o validador de
migrations passou a calcular o estado final ordenado de `GRANT`/`REVOKE`, sem
excecao nominal para `increment_vaga_view_count`. O comando
`security:privileged-rpc:browser-callers` derivou 163 nomes restritos do remoto e
encontrou zero chamada direta no browser. A auditoria tambem encontrou a chamada
quebrada para `cancel_account_deletion`: a migration `20260717143000` registrou
os ACLs historicos, substituiu o comando antigo por uma RPC exclusiva de
`service_role`, e o `privacy-rpc` v2 passou a derivar o ator do JWT. Migration e
Edge Function foram aplicadas ao remoto. A migration incremental
`20260717144000` tornou o cancelamento idempotente e serializou tentativas
concorrentes. Evidencia:
`docs/audits/COMPATIBILITY_AND_PRIVILEGED_RPC_CALLERS_2026-07-17.md`.

Terceiro checkpoint em 2026-07-17: o read model territorial de Classificados
foi consolidado. A migration `20260717150000` validou 23 registros, tornou
`location_id` obrigatorio e removeu a coluna textual `neighborhood`. Consultas
e mutations agora compartilham uma unica projecao/mapeador; builders explicitos
de escrita evitam mass assignment. Criacao, edicao, busca, perfil, vendedores,
URLs e mapa consomem `ClassifiedData.territory`. Quatro arquivos sem consumidores
foram removidos e `test:classifieds:ssot` registra 28 testes. Migration aplicada
ao remoto, tipos regenerados e amostra PostgREST com zero relacao invalida.
Evidencia: `docs/audits/CLASSIFIEDS_TERRITORY_SSOT_2026-07-17.md`.

Proxima ordem: continuar as suites unitarias, integracao, RLS e E2E dos demais
dominios, registrando qualquer gap real antes de alterar implementacao. Revisar
a exposicao de contatos de vendedores em payloads publicos de Classificados e
separar listagem publica de leitura de contato quando a politica de visibilidade
estiver definida. Documentos de verificacao, evidencias
privadas e try-on permanecem em contratos separados e nao devem ser forcados
para o MediaAsset publico. Por fim, preparar staging explicitamente autorizado
para carga, p50/p95/p99, backup/restore e rollback. A aprovacao de
retencao/anonymizacao continua aberta e nao pode ser mascarada como concluida.

## 9. Comandos de validacao base

Usar:

```bash
npm run audit:architecture
npm run validate:architecture:core-platform
npm run validate:architecture:governance
npm run validate:architecture:community
npm run validate:taxonomy
npm run test:trust:ssot
npm run security:trust:authz-probe
npm run validate:ssot
npm run security:validate
npm run typecheck
npm run test
```

Testes de carga nunca apontam implicitamente para producao.
