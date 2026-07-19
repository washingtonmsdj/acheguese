# Realtime SSOT

Status: canonical
Owner: `src/core/realtime`
Ultima revisao: 2026-07-18

## 1. Decisao

Toda conexao Supabase Realtime do cliente pertence a `RealtimeService`.
Dominios escolhem um topico fechado em `realtimeRegistry.ts`; eles nao podem
informar tabela, evento, coluna de filtro ou nome de canal arbitrarios.

O servico suporta tres contratos:

- Postgres Changes: topico, bindings e filtros declarados no registry;
- Broadcast: topico, evento, prefixo e limite de payload declarados no registry;
- Presence: namespace, limite de estado, track, untrack, join, leave e sync.

## 2. Limite de seguranca

Filtro Realtime nao substitui autorizacao. RLS continua sendo a barreira que
define quais linhas o socket autenticado pode receber. O registry reduz ruido,
blast radius e erro de implementacao, mas cada tabela publicada precisa manter
RLS e policies corretas.

Regras obrigatorias:

1. UUIDs de escopo sao validados antes de abrir o canal.
2. Mensagens usam sempre `conversation_id`; nao existe listener global de
   `messages`.
3. Notificacoes usam `user_id` e eventos INSERT/UPDATE explicitos.
4. Grupo usa `group_id`; corrida usa ID ou perfil de passageiro/motorista.
5. Payload de Broadcast e estado de Presence possuem limite em bytes.
6. Apenas `RealtimeService.ts` pode chamar `.channel(`.
7. Dados pessoais, tokens e conteudo de payload nao entram na telemetria.

## 3. Topicos Postgres Changes

| Dominio                    | Topico                                       | Escopo                          |
| -------------------------- | -------------------------------------------- | ------------------------------- |
| Community                  | `community.group-messages`                   | `group_id`                      |
| Classified Messaging       | `messaging.classified-conversation-messages` | `conversation_id`               |
| Community Direct Messaging | `messaging.community-thread-messages`        | `thread_id`                     |
| Notifications              | `notifications.user`                         | `user_id`                       |
| Mobility                   | `mobility.ride-by-id`                        | `id`                            |
| Mobility                   | `mobility.passenger-rides`                   | `passenger_profile_id`          |
| Mobility                   | `mobility.driver-rides`                      | `driver_profile_id`             |
| Gastronomy                 | `gastronomy.order-details`                   | pedido e timeline por `orderId` |
| Gastronomy                 | `gastronomy.business-orders`                 | `orders.source_id`              |
| Gastronomy                 | `gastronomy.order-tracking`                  | `ride_requests.source_id`       |
| Tracking                   | quatro topicos de posicao                    | ID da entidade                  |
| Try-on                     | `tryon.generation`                           | `id` da geracao                 |
| Family                     | locations e alerts                           | conjunto permitido por RLS      |
| Metrics                    | profiles, rides e posts                      | painel autorizado por RLS       |

Family e Metrics sao os unicos topicos sem filtro de coluna. Isso e
intencional porque suas telas agregam o conjunto autorizado inteiro; nao e uma
permissao publica. Novos topicos sem filtro exigem revisao de RLS e deste SSOT.

## 4. Lifecycle e resiliencia

- limite local: 32 subscriptions ativas por instancia;
- IDs internos monotonicamente unicos, sem PII;
- cleanup idempotente via `supabase.removeChannel`;
- Presence executa `untrack` antes da remocao;
- Broadcast abre canal efemero, aguarda SUBSCRIBED e remove em `finally`;
- callbacks de dominio sao isolados e seus erros nao quebram o transporte;
- latencia e estados de erro sao enviados ao observability sem IDs de escopo;
- eventos repetidos com mesma linha, operacao e `commit_timestamp` sao
  deduplicados em uma janela limitada a 256 fingerprints.

Reconexao e backoff do socket pertencem ao SDK Supabase. O projeto nao cria um
segundo loop de reconexao para canais. Tracking ainda usa seu manager para fila
de operacoes pendentes, mas nao registra nem reconecta canais do Core.

Os limites de capacidade, deduplicacao e timeout pertencem a
`src/core/realtime/config/realtimeRuntimePolicy.ts`. O service apenas aplica
essa politica; alteracoes operacionais devem atualizar esse ponto canonico e as
evidencias do dominio.

## 5. Ownership

Adapters de dominio podem mapear o payload e invalidar cache, mas nao podem:

- chamar `supabase.channel` ou `removeChannel` diretamente;
- construir filtros PostgREST em strings;
- escolher tabela ou evento em runtime;
- manter um canal apos unmount;
- usar Broadcast como fonte de verdade persistente.

Postgres e os services canonicos continuam sendo a fonte de verdade. Realtime
apenas reduz a latencia de atualizacao da interface.

## 6. Evidencias

- `npm run test:realtime:ssot`: validacao de filtro, deduplicacao, lifecycle,
  reconnect status, Broadcast e Presence;
- `tests/architecture/realtime-ssot.test.ts`: impede canal fora do owner;
- `npm run validate:architecture:core-platform`: baseline reduzido de 34 para
  26 callsites incrementais;
- `npm run typecheck:app`: contratos dos consumidores validados.

Os testes locais nao simulam limites do projeto Supabase nem milhares de
conexoes reais. Carga, perda de rede real, quotas, p95/p99 e custo devem ser
medidos em staging antes do lancamento; nunca no banco remoto de producao.
