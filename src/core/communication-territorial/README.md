# Communication Territorial

Dominio canonico para canais comunitarios institucionais em `/comunicacao`.

Decisao de produto:

- `/comunicacao` e a listagem/descoberta de agentes de comunicacao do territorio.
- Canal de comunicacao nao e `business`; e `communication_channel`.
- A pagina do canal concentra o feed editorial canonico do agente.
- Publicacoes dos canais devem ser distribuidas para a comunidade relacionada em aba/bloco `Comunicacao`.
- Materia/reportagem deve apontar para canonical em `/comunicacao/...`.
- Postagem comum com texto/fotos pode ser consumida inline na comunidade.

Regras do MVP:

- UI em `src/modules/communication-territorial` nao acessa Supabase diretamente.
- Todo acesso ao banco passa por `CommunicationTerritorialService`, `AdminCommunicationTerritorialService` ou `CommunicationDistributionService`.
- `location_id` e obrigatorio para publicacoes.
- Publicacao so e permitida em territorio autorizado por `communication_channel_territories.can_publish = true`.
- Canais sao perfis de tipo `communication_channel`, separados de usuarios comuns, empresas e orgaos oficiais.
- `/comunicacao` e separado de `/comunidade`; se conteudo aparecer em feed comunitario, o canonical deve apontar para `/comunicacao`.
- `/comunidade` consome distribuicao contextual; nao deve duplicar publicacoes como posts sociais comuns.
- Alertas push, `urgent_alert` e `moderated_alert` ficam fora do MVP ativo.
- Relevancia inicial e ranking territorial sao SSOT interno do banco via `communication_distribution_relevance_score` e `communication_distribution_rank_score`.
- `communication_upsert_default_distribution` e funcao interna; nao deve ser chamada por UI nem exposta como RPC publica.

Status de execucao do plano (MVP seguro):

- [x] Schema + RLS + RPCs de Comunicacao Territorial criados e aplicados.
- [x] Dominio core `communication-territorial` implementado com services canonicos.
- [x] Rotas publicas `/comunicacao` (landing, solicitar, cidade, territorio, canal) implementadas.
- [x] Central operacional `/central/comunicacao` implementada (rascunho + publicacao).
- [x] Admin `/admin/comunicacao` implementado (aprovacao/rejeicao/status/territorios/auditoria).
- [x] Admin com aprovacao parametrizavel (slug/nome legal/nota) e ajuste de `territory_role` por territorio.
- [x] Reserved names e identidade publica para `communication_channel` integrados.
- [x] Boundary validator de modulo implementado (`validate:architecture:communication`).
- [x] E2E do modulo implementado (`test:e2e:communication-territorial`).
- [x] Mensagens de erro UX para fluxos criticos (territorio nao autorizado, permissao, etc.) implementadas.
- [x] Central exibe bloqueio explicito quando canal nao possui territorio autorizado para publicar.
- [x] Correcao de slugify em migration incremental (`20260515103000_fix_communication_slugify.sql`).
- [x] `content_format` (`article`/`update`) e distribuicao para aba `Comunicacao` na comunidade iniciados.
- [x] `CommunicationDistributionService` e tabela `communication_publication_distribution` implementados.
- [x] E2E operacional da aba comunitaria `Comunicacao` implementado.
- [x] E2E transacional com publicacao distribuida mockada implementado.
- [x] Hardening: upsert interno de distribuicao sem grant para `anon`/`authenticated`.
- [x] SSOT: score inicial de distribuicao centralizado em funcao SQL.
- [x] SSOT: ranking territorial materializado em `rank_score`/`rank_reason`.
- [x] Validator de arquitetura bloqueia reexposicao de funcoes internas de distribuicao.
- [x] E2E autenticado real condicional (publicando pela Central sem mock REST) implementado.
- [ ] E2E autenticado real deterministico com fixture seedada ainda pendente.
- [ ] Relevancia local/trending territorial ainda pendente.
- [ ] Gate global `typecheck` da raiz ainda depende de hardening adicional do monolito (fora do escopo exclusivo do modulo).
- [ ] Gate global `validate:architecture:governance` ainda possui violacoes legadas em outros dominios (estado atual: `db-boundary` 2, `cross-module-import` 29, `parallel-service` 1).

Documentos canonicos:

- `docs/COMUNICACAO_TERRITORIAL_ARCHITECTURE.md`
- `docs/COMUNICACAO_DISTRIBUICAO_TERRITORIAL_PLANO.md`
