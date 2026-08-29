# Audit e Moderation SSOT

Data-base: 2026-08-29
Status: G4 source/authority fechado; retencao, drift exaustivo e certificacao permanecem em G5/G7

## 1. Decisao arquitetural

O Core compartilha contratos de denuncia, triagem e auditoria. Ele nao possui
uma tabela universal de reports nem um log universal de auditoria.

- cada dominio continua owner do status e da acao corretiva de seu report;
- `list_federated_moderation_queue` e somente uma projecao read-only;
- `src/core/trust` e o owner de eventos, policies, bans e comandos horizontais
  de confianca operacional;
- `AuditEvent`, `AuditEventReader` e `AuditEventSink` sao protocolos em
  `src/core/audit`;
- sinks sao backend-only e expoem apenas `append`; update/delete nao fazem
  parte do contrato;
- readers do browser sao limitados, autorizados e especificos do dominio;
- apresentacao React reutilizavel nao pertence ao Core.

## 2. Owners canonicos

| Responsabilidade | Owner |
| --- | --- |
| Protocolo/taxonomia de reason options | `src/core/moderation/reportReasons.ts` |
| Dialog generico de motivo de denuncia | `src/shared/components/moderation/ReportReasonDialog.tsx` |
| Escrita de reports da Comunidade | `src/core/community/moderation/CommunityReportService.ts` |
| Review da fila de conteudo comunitario | `src/core/community/moderation/CommunityContentModerationService.ts` + comando server-owned |
| Warnings/suspensoes comunitarias | comando server-owned `apply_community_user_moderation_action` |
| Projecao federada read-only | `src/core/moderation/services/FederatedModerationQueueService.ts` |
| UI/hook da projecao federada | `src/modules/admin/components/moderation/FederatedModerationQueue.tsx` + `src/modules/admin/hooks/useFederatedModerationQueue.ts` |
| Contratos append-only | `src/core/audit/contracts.ts` |
| Leitura do audit social comunitario | `CommunitySocialAuditReader.ts` |
| Ban ativo de plataforma | `src/core/trust/services/ActiveBanReader.ts` + `has_current_active_ban` |
| Comandos de feedback operacional | `src/core/trust/services/OperationalTrustCommandService.ts` |
| Incidentes de Trust/Messaging | `src/core/trust/services/TrustIncidentService.ts` |
| Review/acoes administrativas de Trust | `src/core/trust/services/TrustAdminService.ts` |
| Policy/score de Trust | `TrustPolicyService.ts` + `TrustPolicyReadService.ts` |
| Formulario reutilizavel de feedback | `src/shared/components/trust/TrustFeedbackForm.tsx` |

O barrel `src/core/trust/index.ts` pode reexportar o formulario compartilhado
como bridge de compatibilidade, mas a implementacao React nao pode voltar a
`src/core/trust/components`.

O path historico
`src/core/moderation/components/ReportReasonDialog.tsx` permanece somente como
bridge one-way para o owner em `shared`; ele nao pode conter implementacao React.

`community_reports` e o unico agregado de denuncia para conteudo comunitario.
Seus alvos canonicos sao `post`, `comment`, `profile`, `lost_found_post`,
`lost_found_comment`, `question` e `answer`. O banco resolve o autor de cada
alvo; o browser nunca envia reporter ou autor denunciado.

A criacao da denuncia continua sendo o unico acesso runtime direto a
`community_reports` no source. Review e decisao administrativa passam por
`review_community_content_reports` / `private.review_community_content_reports`.
A migration `20260829192000_harden_moderation_table_authority.sql` removeu do
browser o UPDATE/DELETE direto e aposentou as policies administrativas que
criavam uma segunda autoridade de escrita.

`community_user_moderation_actions` e append-only e especifica de Community.
Nao existe facade generica/client-side para warnings: aplicacao de acao passa
pelo comando autorizado do dominio. A mesma migration de 2026-08-29 removeu o
SELECT direto de `authenticated`; leitura futura exige read model limitado.

`banned_users` tambem nao e read model do browser. O Profile consulta somente
`has_current_active_ban`, sem parametro, que deriva `auth.uid()` e retorna um
booleano. Motivo, moderador e demais metadados permanecem backend-only.

## 3. Fila federada

A fila une metadados de nove dominios: Community Content, Classified, Vaga,
Review, Ride, Group Message, Community Direct, Community Alert e Community
Issue. A projecao nao persiste status e nao executa moderacao. Cada acao volta
ao comando do dominio que possui o status mestre.

O retorno exclui reporter, descricao, nota administrativa, corpo de mensagem,
conteudo e midia. A consulta exige admin, usa cursor keyset, timeout de tres
segundos e no maximo 51 linhas para implementar `limit + 1`.

A UI da fila foi retirada de `core/moderation` e pertence ao modulo Admin. O
service de leitura permanece em Core; isso preserva a separacao domain/service
vs apresentacao.

As views `admin_pending_post_reports` e `admin_pending_comment_reports` sao read
models administrativos. A migration
`20260829193600_harden_admin_moderation_view_grants.sql` removeu grants DML de
`anon`/`authenticated`; no browser, `authenticated` conserva somente `SELECT`.
As duas views continuam filtradas por `private.is_admin_user(auth.uid())`.

## 4. Auditoria comunitaria

`community_social_audit_log` e append-oriented e privado. Escritas sao feitas
por triggers/RPCs server-owned. `authenticated` nao possui `SELECT` direto; o
painel usa `list_community_social_audit_events`, que exige admin e pagina por
`(created_at,id)`.

O reader retorna IDs pseudonimos e metadata plana. Texto de post/comentario,
mensagem e URLs de midia nao pertencem ao log. Acoes usam nomes canonicos como
`insert`, `delete` ou `moderation.suspend_7d`.

## 5. Dados e retencao

| Stream/agregado | Classe | Dados pessoais | Retencao atual |
| --- | --- | --- | --- |
| `community_social_audit_log` | `security` / `pseudonymous` | User/Profile IDs | sem TTL aprovado |
| reports de dominio | `moderation` / `restricted` | reporter, alvo, motivo e texto opcional | sem TTL aprovado |
| `billing_audit_log` | `security` / `pseudonymous` | `user_id` relacional nullable | sem TTL aprovado |
| legal hold | `legal_hold` / `restricted` | conforme caso autorizado | sem exclusao automatica |

Ausencia de TTL aprovado e um bloqueio de lancamento, nao uma politica ideal.
Privacidade/DPO deve aprovar finalidade, prazo, anonimizacao e legal hold antes
de qualquer job de purge. Ate la, nenhum agente pode inventar duracoes.

`billing_audit_log` armazena a identidade somente na coluna relacional. Os
snapshots JSON existentes foram saneados e o writer remove `user_id`; hard
delete de assinatura nao recria uma referencia durante exclusao do usuario.

## 6. Regras obrigatorias

- nao copiar status de report para uma tabela federada;
- nao criar facade universal de acao corretiva;
- nao retornar texto livre na fila federada;
- nao acessar `community_social_audit_log` diretamente pelo browser;
- nao acessar `banned_users` diretamente nem expor identidade de moderador no
  contexto de Profile;
- nao reintroduzir UPDATE/DELETE browser em `community_reports`;
- nao reintroduzir leitura browser direta de `community_user_moderation_actions`;
- views administrativas de moderacao sao read-only no browser;
- apresentacao React horizontal fica em `modules` ou `shared`, nunca como
  implementacao dentro de `core/moderation`/`core/trust`;
- nao capturar erro de autorizacao e retornar lista vazia;
- nao duplicar User/Profile ID dentro de JSON quando existe coluna relacional;
- toda nova origem federada precisa de owner, cursor, limite e probe negativo;
- toda nova metadata de auditoria precisa de classificacao de dado.

## 7. Evidencias

- migrations `20260715100000` ate `20260715107000`;
- migration `20260829192000_harden_moderation_table_authority.sql`;
- migration `20260829193600_harden_admin_moderation_view_grants.sql`;
- `tools/security/moderation-audit-authz-probe.mjs`;
- `tools/security/trust-operational-authz-probe.mjs`;
- `tests/architecture/audit-moderation-ssot.test.ts`;
- `tests/architecture/moderation-trust-boundary.test.ts`;
- `tests/security/trust-operational-commands-security.test.ts`;
- `docs/architecture/core-platform-ownership.json`: ownership executavel.

Revalidacao remota em 2026-08-29 confirmou RLS habilitado nos agregados
sensíveis observados, ausencia de grants browser diretos em `trust_events`,
`trust_admin_actions`, `banned_users`, `community_social_audit_log` e
`community_user_moderation_actions`, `community_reports` limitado a
`INSERT`/`SELECT` para `authenticated`, views admin limitadas a `SELECT` e RPCs
criticos sem EXECUTE anonimo no conjunto auditado.

Isso fecha G4 de source/authority conhecido. Nao substitui a reconciliacao
exaustiva de migrations/schema/RLS, retencao LGPD ou certificacao same-SHA de
G5/G7.
