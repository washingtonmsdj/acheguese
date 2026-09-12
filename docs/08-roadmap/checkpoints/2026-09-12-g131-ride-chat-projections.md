# G131 — Ride Chat Projections

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`chat.queries.ts` ainda usava `select("*")` para:

- `ride_chats`;
- `ride_chat_messages`.

Chat de corrida contém conteúdo de usuário e identificadores de participantes; o cliente deve receber apenas o contrato necessário para renderização e estado de leitura.

## Correção

Foram introduzidas projeções explícitas:

- `RideChat`: `id, ride_id, created_at, updated_at`;
- `ChatMessage`: `id, chat_id, sender_profile_id, message, is_system_message, read_at, created_at`.

A ordenação cronológica das mensagens foi preservada.

## Ratchet

`src/modules/mobility/__tests__/RideChatProjectionG131.test.ts`

Protege:

- ausência de `select("*")` nessa fronteira;
- projeções explícitas dos dois read models;
- ordenação por `created_at` crescente.

## Validação

O source foi inspecionado após o write e o ratchet foi versionado. Este checkpoint **não declara suite/CI verde** sem execução confiável.