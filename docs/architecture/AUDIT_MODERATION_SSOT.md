# Audit e Moderation SSOT

Data-base: 2026-07-15
Status: ativo

## 1. Decisao arquitetural

O Core compartilha contratos de denuncia, triagem e auditoria. Ele nao possui
uma tabela universal de reports nem um log universal de auditoria.

- cada dominio continua owner do status e da acao corretiva de seu report;
- `list_federated_moderation_queue` e somente uma projecao read-only;
- `AuditEvent`, `AuditEventReader` e `AuditEventSink` sao protocolos em
  `src/core/audit`;
- sinks sao backend-only e expoem apenas `append`; update/delete nao fazem
  parte do contrato;
- readers do browser sao limitados, autorizados e especificos do dominio.

## 2. Owners canonicos

| Responsabilidade                              | Owner                                                         |
| --------------------------------------------- | ------------------------------------------------------------- |
| Dialog generico e protocolo de reason options | `src/core/moderation`                                         |
| Escrita de reports da Comunidade              | `src/core/community/moderation/CommunityReportService.ts`     |
| Review da fila de conteudo comunitario        | `CommunityContentModerationService.ts`                        |
| Warnings/suspensoes comunitarias              | comando server-owned `apply_community_user_moderation_action` |
| Projecao federada read-only                   | `FederatedModerationQueueService.ts`                          |
| Contratos append-only                         | `src/core/audit/contracts.ts`                                 |
| Leitura do audit social comunitario           | `CommunitySocialAuditReader.ts`                               |
| Ban ativo de plataforma                       | `ActiveBanReader` + `has_current_active_ban`                  |

`community_reports` e o unico agregado de denuncia para conteudo comunitario.
Seus alvos canonicos sao `post`, `comment`, `profile`, `lost_found_post`,
`lost_found_comment`, `question` e `answer`. O banco resolve o autor de cada
alvo; o browser nunca envia reporter ou autor denunciado.

`community_user_moderation_actions` e append-only e especifica de Community.
Nao existe facade generica/client-side para warnings: aplicacao de acao passa
pelo comando autorizado do dominio e leitura futura deve usar read model
limitado, nao acesso direto a tabela.

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

## 4. Auditoria comunitaria

`community_social_audit_log` e append-oriented e privado. Escritas sao feitas
por triggers/RPCs server-owned. `authenticated` nao possui `SELECT` direto; o
painel usa `list_community_social_audit_events`, que exige admin e pagina por
`(created_at,id)`.

O reader retorna IDs pseudonimos e metadata plana. Texto de post/comentario,
mensagem e URLs de midia nao pertencem ao log. Acoes usam nomes canonicos como
`insert`, `delete` ou `moderation.suspend_7d`.

## 5. Dados e retencao

| Stream/agregado              | Classe                      | Dados pessoais                          | Retencao atual          |
| ---------------------------- | --------------------------- | --------------------------------------- | ----------------------- |
| `community_social_audit_log` | `security` / `pseudonymous` | User/Profile IDs                        | sem TTL aprovado        |
| reports de dominio           | `moderation` / `restricted` | reporter, alvo, motivo e texto opcional | sem TTL aprovado        |
| `billing_audit_log`          | `security` / `pseudonymous` | `user_id` relacional nullable           | sem TTL aprovado        |
| legal hold                   | `legal_hold` / `restricted` | conforme caso autorizado                | sem exclusao automatica |

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
- nao capturar erro de autorizacao e retornar lista vazia;
- nao duplicar User/Profile ID dentro de JSON quando existe coluna relacional;
- toda nova origem federada precisa de owner, cursor, limite e probe negativo;
- toda nova metadata de auditoria precisa de classificacao de dado.

## 7. Evidencias

- migrations `20260715100000` ate `20260715107000`;
- `scripts/security/moderation-audit-authz-probe.mjs`: 28 cenarios remotos;
- `test:moderation:ssot`: 18 testes de service, reader, dialog, ban e contrato;
- hardening comunitario: 27 testes, incluindo ausencia de facades removidas;
- `docs/architecture/core-platform-ownership.json`: ownership executavel.

O probe cobre anonimo, usuario comum, service role sem identidade, admin,
cursor/filtro invalido, bloqueio de leitura direta, taxonomia invalida, os sete
tipos de alvo comunitario e ban atual positivo/negativo sem metadata. Fixtures
e identidades sao removidas; falha de cleanup faz o probe falhar.
