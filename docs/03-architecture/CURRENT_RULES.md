# Regras Vigentes do Sistema

Data-base: 2026-07-15
Status: ativo
Versao documental: 4.5

## 1. Regras de identidade e ownership

- `user_id` identifica autenticacao e contexto administrativo.
- `profile_id` identifica a entidade operacional do usuario no ecossistema.
- ownership social usa colunas explicitas do tipo `*_profile_id`.
- ownership administrativo usa colunas explicitas do tipo `*_user_id`.
- username, handle e slug nao podem representar a mesma coisa em rotas diferentes sem contrato unico.

## 2. Regras de fronteira arquitetural

- Acesso ao Supabase fica restrito a `services/`, `repositories/`, `migrations/`, `scripts/` e `supabase/functions/`.
- Paginas e hooks nao devem conter regra de negocio; fazem apenas orquestracao de estado, fetch e render.
- Cada dominio deve ter um service canonico por responsabilidade. Wrappers de compatibilidade sao permitidos apenas quando explicitamente documentados.
- Cada tabela mutavel deve ter um unico owner de escrita. Consultas adicionais
  so podem existir como read models declarados e sem mutacao paralela.
- Tipos canonicos nao podem ser duplicados entre `shared/`, `core/` e `modules/` quando ja existir fonte oficial.
- Modulos nao podem importar implementacoes internas uns dos outros. Integracao cruzada passa por `core/`, adapters formais ou contratos compartilhados.
- `core/admin` agrega dominios; ele nao deve depender de implementacoes internas de `modules/*`.
- Rotas publicas devem ter namespace unico por entidade. O mesmo padrao nao pode servir a tipos diferentes ao mesmo tempo.
- `Core Platform` compartilha contratos e infraestrutura; nao absorve regras
  especificas de dominio apenas para reduzir o numero de arquivos.
- A decisao de autorizacao no navegador e somente hint de UI. RLS, RPC e Edge
  Function sao a autoridade obrigatoria para toda escrita.
- `CapabilityPreviewService` pode apenas controlar visibilidade. O mapa
  `docs/architecture/authorization-enforcement-map.json` deve cobrir toda acao
  declarada e apontar owner, enforcement backend e evidencia.
- Criacao de notificacao para outro User nao pode partir de API client-side
  self-service; deve usar trigger, RPC/Edge confiavel ou outbox server-side.
- O contrato cross-user canonico e `private.notification_outbox`; destinatario
  vem do agregado no backend, payload e texto sao limitados, HTML e URL
  scheme-relative sao rejeitados e a chave idempotente e obrigatoria.
- Preferencias de notificacao usam somente
  `NotificationPreferencesService`. O browser nao envia `user_id`, nao escreve
  a tabela diretamente e patches omitidos preservam o estado atual. Entrega
  transacional permanece obrigatoria; contrato em
  `NOTIFICATION_PREFERENCES_SSOT.md`.
- Favoritos de Empresa usam `BusinessFavoriteStore` como owner de persistencia
  e `BusinessFavoriteService` como adapter de dominio. O browser nao envia
  `user_id`, nao acessa `user_favorite_businesses` diretamente e define estado
  por comando idempotente, nunca por toggle read-then-write. Gastronomia nao
  possui writer proprio. Contrato em `BUSINESS_FAVORITES_SSOT.md`.
- `core/posts` e o unico owner de Post, CRUD, leitura territorial e cursor.
  `core/feed` nao exporta service ou tipos de Post; enquanto nao existir
  federacao real, ele contem somente chaves de cache da composicao. Contrato
  em `POSTS_FEED_SSOT.md`.
- Likes e saves de Post usam somente `PostEngagementService`; likes de Comment
  usam `core/comments`; grupos usam `SocialGroupInteractionsService`; shares
  usam `core/posts`. A API nao recebe identidade de ator. Saves de outros
  dominios conservam tabelas proprias por adapters allowlisted; tabela/coluna
  arbitraria nao e contrato publico. Contrato em `SOCIAL_ENGAGEMENT_SSOT.md`.
- Busca publica global e comunitaria usa somente `SearchService` e os providers
  registrados em `core/search`. Dominios conservam consulta, ranking e URL;
  Community apenas filtra por `communityId`, territorio e vinculos ativos.
  Escopo incompleto falha fechado, limites ficam em `searchConfig.ts` e a
  telemetria nunca registra o texto pesquisado. Contrato em `SEARCH_SSOT.md`.
- Dominios de imagem publica, incluindo Posts e Achados/Perdidos, persistem
  somente `MediaAssetRef` no formato
  `storage://media-assets/{profile}/{preset}/v{version}/{asset}.jpg`. Upload
  passa por `media-assets`; browser nao escolhe bucket/path, nao escreve
  metadata e nao envia URL externa. MIME por bytes, dimensao, Profile owner,
  quota, link e cleanup sao server-owned. `media-assets` e apenas para imagens
  publicas; documentos privados permanecem fora. Contrato em
  `MEDIA_ASSET_SSOT.md`. Buckets privados de documentos e evidencias possuem
  contratos separados e nao podem ser usados para descoberta publica.
- Em Safety, o navegador nunca escreve `safety_audit_log` ou
  `emergency_delivery_log`. Alertas, incidentes, evidencias e shares validam o
  perfil/viagem por RLS; status, revogacao, notificacao e auditoria sao
  comandos ou produtores server-side.
- Denuncias de Classificado, Vaga, Avaliacao e Corrida usam exclusivamente os
  comandos de `docs/architecture/SENSITIVE_REPORT_COMMANDS.md`. Reporter e
  moderador sao derivados no banco; escrita direta nas quatro tabelas e
  proibida para o navegador.
- O protocolo visual/taxonomia base de denuncia fica em `core/moderation`, mas
  status, SLA e acao corretiva permanecem no dominio. A fila federada e somente
  read model administrativo; nao persiste nem altera status mestre.
- Denuncias comunitarias usam somente `CommunityReportService` e
  `community_reports`, com alvos `post`, `comment`, `profile`,
  `lost_found_post`, `lost_found_comment`, `question` e `answer`. Reporter e
  autor do alvo sao derivados no banco; IDs ou texto sensivel nao podem ser
  copiados para a projecao federada.
- Auditoria compartilhada usa os contratos append-only de `core/audit`; sinks
  continuam backend-only e especificos do dominio. O browser nao le
  `community_social_audit_log` diretamente e usa somente o reader admin
  paginado. Contrato em `AUDIT_MODERATION_SSOT.md`.
- O contexto de Profile verifica ban somente por `ActiveBanReader` e
  `has_current_active_ban`. O RPC deriva `auth.uid()`, nao recebe User ID e
  retorna apenas booleano; `banned_users` nao e legivel diretamente pelo
  navegador, inclusive em sessao admin.
- TTL, anonimizacao e legal hold de reports/auditoria exigem aprovacao de
  Privacidade/DPO. Ausencia de prazo aprovado e bloqueio de lancamento, nao
  autorizacao para inventar uma duracao.
- `trust_events` e `trust_admin_actions` sao agregados append-only sem acesso
  direto pelo navegador. Incidentes usam `TrustIncidentService`; feedback,
  rating, late cancellation, politica e acao admin usam comandos especificos
  server-owned. Ator, alvo, papel, contexto, admin e evidencia canonica sao
  derivados no banco. Contratos em `TRUST_MESSAGING_COMMANDS.md` e
  `TRUST_OPERATIONAL_COMMANDS.md`.
- Reviews cujo alvo e Profile usam exclusivamente `public.reviews` e
  `src/core/reviews`. `BusinessReviewService` e adapter de policy; Gastronomia
  nao e owner de persistencia. Review de Profissional, helpfulness e report
  passam por comandos server-owned, sem selector de tabela ou escrita direta.
  `event_reviews` permanece no dominio de Eventos. Contrato em
  `REVIEWS_SSOT.md`.
- `conversations`/`messages` sao exclusivamente o agregado de Messaging de
  Classificados e seu unico adapter publico e `ClassifiedMessagingService`.
  Direct message iniciado por Post usa exclusivamente `community_direct_*` e
  `CommunityDirectMessagingService`. Ambos usam read models keyset
  server-owned; loops de consultas por conversa sao proibidos. Ride e Group
  conservam agregados proprios. Compartilhar port ou Realtime nao autoriza
  compartilhar tabela, lifecycle ou enforcement. Contratos em
  `CLASSIFIED_MESSAGING_SSOT.md` e `COMMUNITY_DIRECT_MESSAGING_SSOT.md`.
- Em Community Direct Messaging, ator e destinatario efetivo sao derivados de
  JWT, Profile, membership e autoria do Post no backend. Escrita direta e
  proibida; bloqueio de qualquer participante interrompe envio; denuncia
  deriva o alvo, deduplica pendencia e usa auditoria privada sem corpo da
  mensagem. Localizacao/midia nao podem ser simuladas fora do contrato.
- Toda subscription Realtime passa por `core/realtime` e por topico fechado em
  `realtimeRegistry.ts`. Apenas o owner pode chamar `.channel(`. Filtro nao
  substitui RLS; UUID e validado antes do connect, cleanup e obrigatorio e o
  SDK Supabase e o owner de reconnect/backoff. Broadcast nao e persistencia.
  Contrato em `REALTIME_SSOT.md`.
- O ownership transversal vigente esta em
  `docs/architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md`.
- O manifest executavel fica em
  `docs/architecture/core-platform-ownership.json`; toda alteracao de callsite
  controlado exige `npm run validate:architecture:core-platform` e revisao da
  reducao/aumento da allowlist.

## 2.1 Regras de taxonomia (vertical vs horizontal)

- `business`/`empresas` e dominio base horizontal das entidades empresariais.
- `business` nao e vertical.
- Vertical empresarial oficial existe somente quando declarado em `src/core/verticals/config.ts`.
- Estado oficial atual: apenas `gastronomy` esta formalizada como vertical.
- Capacidade implementada em codigo nao implica reconhecimento oficial de vertical sem declaracao no SSOT.

## 2.2 Regras de roteamento publico e comunitario

- Entidades publicas usam namespace publico canonico:
  `/empresas/:state/:city/:territory/:slug`,
  `/gastronomia/:state/:city/:territory/:slug` e equivalentes por modulo.
- O portal comunitario usa contexto explicito em `/comunidade/...`; rotas publicas
  de entidade nao devem redirecionar automaticamente para comunidade.
- Rotas comunitarias de entidade podem renderizar a entidade dentro do contexto
  comunitario e devem oferecer saida explicita para o site publico quando houver
  equivalente publico.
- Aliases comunitarios antigos nao devem redirecionar automaticamente. Quando a
  URL nao for canonica, a rota deve falhar visivelmente em vez de preservar uma
  segunda superficie publica.
- Acoes comunitarias que criam ou alteram conteudo local exigem perfil autenticado
  e residencia canonica verificada no territorio aplicavel. Enderecos completos
  de residencia nao podem aparecer em superficies publicas.

## 3. Regras documentais

- Documento global vivo fica em `docs/`.
- Documento tecnico de dominio fica no proprio dominio.
- Historico, snapshots e relatorios de sessao nao devem permanecer no repositorio principal.
- `supabase/migrations/` e a unica fonte de schema versionado.
- O indice mestre da documentacao e `docs/INDEX_CANONICO.md`.
- O relatorio executivo vigente de organizacao e blindagem e `docs/audits/MASTER_REPORT.md`.
- A Security Authority vigente fica em `docs/governance/security/SECURITY_AUTHORITY.md`
  e deve ser consultada antes de mudancas Critical/High em seguranca.
- Documentos fora do indice canonico (principalmente historico/sessao) nao substituem status oficial.

## 4. Gates obrigatorios

Execute antes de consolidacoes estruturais e antes de build:

```bash
npm run audit:architecture
npm run validate:architecture:governance
npm run validate:taxonomy
npm run validate:ssot
npm run validate:docs-structure
```

## 5. Proibicoes explicitas

- Nao criar novo service paralelo para dominio que ja possui service canonico.
- Nao acessar `supabase.from(...)` em page, hook, component ou utilitario de UI.
- Nao mover regra de negocio para hook de pagina por conveniencia.
- Nao criar nova pagina administrativa sem owner de dominio, contrato de dados e cobertura documental.
- Nao introduzir nova rota publica de identidade sem decidir o namespace oficial.
- Nao fornecer `user_id`, `profile_id` privilegiado, `admin_id`, tabela,
  bucket ou coluna pela UI quando o backend puder deriva-los do contexto.

## 6. Prioridade atual de blindagem

- consolidar identidade publica e rotas de perfil
- retirar imports cruzados entre modulos
- consolidar wrappers e services duplicados
- padronizar front-end base em hero, filtros, cards, estados e tabelas admin
- fechar lacunas administrativas, especialmente em notifications, profile e map
