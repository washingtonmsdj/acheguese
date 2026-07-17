# Community Direct Messaging SSOT

Status: canonico
Data: 2026-07-15
Finding encerrado: CP-015

## 1. Decisao

Mensagem privada iniciada por um Post da Comunidade pertence ao agregado
Community Direct Messaging. Ela nao e conversa de Classificado, chat de
corrida nem mensagem de grupo.

Os quatro agregados podem implementar ports estruturais de inbox/thread e usar
o mesmo transporte Realtime, mas conservam persistencia, elegibilidade,
participantes, moderacao e retencao proprios. Nao existe tabela ou facade de
chat universal que escolha o dominio em runtime.

## 2. Owners

| Responsabilidade      | Owner                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| Adapter publico       | `src/core/messaging/services/CommunityDirectMessagingService.ts`       |
| Contratos estruturais | `src/core/messaging/contracts.ts`                                      |
| Estado e comandos     | RPCs `*_community_direct_*` server-owned                               |
| UI comunitaria        | `src/core/community/hooks/useDirectMessages.ts`                        |
| Realtime              | `src/core/realtime/services/RealtimeService.ts`                        |
| Enforcement           | RLS, grants e funcoes das migrations `20260715092000`/`20260715093000` |

`currentProfileId` e a identidade operacional. `auth.uid()` e sempre derivado
do JWT pelo backend; o browser nao pode declarar User, destinatario efetivo ou
papel administrativo.

## 3. Modelo canonico

| Tabela                                       | Responsabilidade                                               |
| -------------------------------------------- | -------------------------------------------------------------- |
| `community_direct_threads`                   | contexto Community/Post, par de participantes e estado fechado |
| `community_direct_thread_participants`       | leitura, bloqueio e arquivo por participante                   |
| `community_direct_messages`                  | mensagens texto e remocao por moderacao                        |
| `community_direct_message_reports`           | denuncia, alvo derivado e resolucao                            |
| `private.community_direct_message_audit_log` | eventos metadata-only append-only                              |

O par de participantes e ordenado e unico por Comunidade + Post. O contexto
publico continua em `posts` e `community_entity_links`; nenhum titulo, autor ou
territorio e duplicado como segunda fonte de verdade.

## 4. Lifecycle e autorizacao

Criar uma thread exige, na mesma transacao:

1. JWT e Profile ativo pertencente ao User autenticado;
2. Post publicado, visivel e nao removido;
3. link ativo do Post para a `territory_community` informada;
4. ator e autor do Post como membros ativos da mesma Comunidade;
5. destinatario igual ao autor do Post e diferente do ator.

Somente participantes podem ler por RLS. O browser possui `SELECT` limitado
por policy e nenhum grant de `INSERT`, `UPDATE` ou `DELETE`. Criacao, envio,
receipt, bloqueio e denuncia passam por RPC. Um bloqueio de qualquer lado
interrompe novos envios. Moderacao exige `private.is_admin_user(auth.uid())` e
nao possui adapter de UI ate existir uma superficie administrativa aprovada.

## 5. Leitura, carga e Realtime

- inbox e historico usam keyset pareado `(timestamp,id)`;
- paginas usam `limit + 1`, com maximo de 50 itens retornados;
- cada pagina executa um RPC, sem consulta por item;
- criacao limita 10 threads por hora/Profile;
- envio limita 30 mensagens por minuto/Profile;
- denuncia limita 10 eventos por dia/Profile e deduplica pendencia;
- comandos e read models usam `statement_timeout = 3s`;
- indices cobrem inbox, historico, nao lidas, rate limit e fila de reports;
- Realtime usa `messaging.community-thread-messages`, filtrado por `thread_id`.

Realtime reduz latencia da interface, mas Postgres continua sendo o SSOT. RLS
continua obrigatoria para toda linha entregue pelo socket.

## 6. Privacidade e moderacao

O escopo atual aceita somente texto de 1 a 4000 caracteres. Localizacao exata,
anexos e midia nao sao simulados nem descartados silenciosamente; cada um exige
policy de dado e preset MediaAsset antes de entrar no contrato.

O corpo privado:

- nao entra em telemetria;
- nao e copiado para metadata de notificacao ou auditoria;
- e substituido por texto generico na notificacao;
- so pode ser lido pelos participantes ou removido pelo comando administrativo.

Denunciar deriva o outro participante/alvo no banco, pode apontar uma mensagem
do interlocutor e bloqueia imediatamente o denunciante. A auditoria privada
registra apenas IDs, acao, motivo enumerado e contexto necessario.

Exclusao do Profile remove threads e mensagens associadas por FK. Politica de
retencao temporal/anonymizacao para contas ainda ativas pertence a fase comum
de Audit/Privacy e precisa de decisao LGPD antes de habilitar uma rotina de
expurgo; nao existe TTL arbitrario escondido neste agregado.

## 7. Evidencias

- `npm run test:messaging:ssot`: adapter, parser, cursor, fronteira e privacidade;
- `npm run test:realtime:ssot`: filtro e lifecycle do canal;
- `npm run security:community-dm:authz-probe`: 16 casos remotos positivos e
  negativos com identidades temporarias e cleanup;
- `npm run validate:architecture:core-platform`: cinco tabelas e oito RPCs no
  manifest de ownership;
- migrations `20260715092000` e `20260715093000`, aplicadas no remoto de
  desenvolvimento.

O probe comprova comportamento de autorizacao, nao capacidade. Concorrencia,
quota de sockets e p50/p95/p99 continuam obrigatorios em staging antes do
lancamento.

## 8. Rollback

O botao comunitario pode ser desabilitado sem migrar dados entre agregados. O
consumer deve ser removido antes dos RPCs e tabelas. Reapontar para
`conversations.classified_id`, manter dual-write ou tratar falha de autorizacao
como conversa vazia nao sao rollbacks aceitos.
