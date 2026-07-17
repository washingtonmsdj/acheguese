# Classified Messaging SSOT

Status: canonico
Data: 2026-07-15
Finding encerrado: CP-012
Finding relacionado encerrado: CP-015

## 1. Escopo

Este contrato governa exclusivamente conversas entre comprador e vendedor de
um Classificado. `conversations` e `messages` nao sao tabelas universais de
chat: ambas carregam lifecycle, participantes e autorizacao do agregado de
Classificados.

Chat de corrida continua em `ride_chats`/`ride_chat_messages`; mensagens de
grupo continuam em `community_groups`/`group_messages_new`. Conversa social
direta da Comunidade usa `community_direct_*`, conforme
`COMMUNITY_DIRECT_MESSAGING_SSOT.md`, e nunca usa `classified_id`.

## 2. Owners

| Responsabilidade | Owner |
| --- | --- |
| Adapter de Classificados | `src/core/messaging/services/ClassifiedMessagingService.ts` |
| Contratos estruturais compartilhados | `src/core/messaging/contracts.ts` |
| Comandos de conversa/mensagem | RPCs `*_classified_*` server-owned |
| Inbox paginada | RPC `list_classified_conversation_previews` |
| Incidentes | `src/core/trust/services/TrustIncidentService.ts` |
| Realtime | `src/core/realtime/services/RealtimeService.ts` |

Nao existe alias publico `MessagingService` ou `messagingService`. O nome do
owner deve tornar o agregado visivel no import.

## 3. Contratos compartilhados

`ConversationInboxPort` define uma pagina de previews e
`MessageThreadPort` define leitura, envio e receipt sem campos de listing,
corrida ou grupo. Eles compartilham forma, nao persistencia nem regra de
negocio.

Nenhum adapter universal escolhe tabela, coluna ou politica em runtime. Ride e
Group so devem implementar um port comum quando existir consumidor transversal
real; criar uma facade sem consumidor recriaria o problema de ownership.

## 4. Inbox e desempenho

`listConversationPreviews` executa exatamente um RPC por pagina. O backend:

- limita a pagina a 51 linhas (`limit + 1` para paginas de ate 50 itens);
- usa cursor pareado `(last_message_at, id)` e ordenacao deterministica;
- busca classificado, outro Profile, ultima mensagem e nao lidas na mesma
  consulta;
- limita busca a 100 caracteres e escapa `%`, `_` e barra invertida;
- usa timeout de statement de tres segundos;
- possui indices `(buyer_id, last_message_at DESC, id DESC)` e equivalente
  para seller.

A UI usa `useInfiniteQuery` e nao dispara consultas por conversa. O volume e a
latencia p95/p99 ainda precisam ser medidos em staging; testes locais e
indices nao equivalem a prova de milhares de requisicoes por segundo.

## 5. Seguranca

O read model e `SECURITY DEFINER`, referencia objetos qualificados e:

- exige JWT;
- valida que `p_profile_id` pertence ao User autenticado, esta ativo e nao
  suspenso;
- rejeita cursor parcial, limite e busca invalidos;
- concede execucao somente a `authenticated`;
- retorna apenas campos necessarios para a inbox;
- nao aceita buyer, seller, sender ou papel privilegiado do browser.

Comandos de criar, enviar, marcar leitura, bloquear e moderar continuam nos
RPCs dedicados descritos em `TRUST_MESSAGING_COMMANDS.md`. O browser nao possui
grant de escrita direta em `conversations` ou `messages`.

## 6. Evidencias

- `npm run test:messaging:ssot`: contrato, parser runtime, cursor, N+1 e
  comandos;
- `npm run security:messaging:authz-probe`: anonimo negado, Profile proprio
  permitido e Profile alheio negado no remoto;
- `npm run validate:architecture:core-platform`: owner e callsites;
- migrations `20260715090000` e `20260715091000`, aplicadas no remoto.

## 7. Rollback

Os indices novos podem ser removidos sem alterar dados ou comandos. O RPC de
inbox pode ser removido somente depois de retirar seu consumidor; retornar ao
fan-out client-side por conversa nao e rollback aceito. As tabelas e comandos
anteriores permanecem canonicos durante essa mudanca de read model.
