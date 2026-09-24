# Checkpoint — Busca assistida com lifecycle no boundary da app (2026-09-24)

A rota ativa `/buscar` continua como capability horizontal de Search, mas o
`core/ai` deixa de conhecer o lifecycle do produto.

## Decisão

- `src/app/config/aiSearchIntentScope.ts` é o owner da composição entre intents
  da busca assistida e módulos de produto;
- `business_search` depende de Business;
- `service_search` depende de Services;
- a capability horizontal Search precisa estar ativa antes que qualquer intent
  de domínio seja liberada;
- `AIOrchestratorService` recebe `allowedIntentTypes` explicitamente e falha
  fechado quando o caller não autorizou a intent;
- `useAISearch` apenas transporta esse contrato para o core;
- `BuscarPage` resolve o escopo pelo lifecycle na camada `app`.

## Estado do MVP

Business permanece ativo, portanto `business_search` está liberada.
Services permanece pausado, portanto `service_search` continua indisponível
sem remover seu handler ou destruir a base pós-MVP.

## Ratchets

- `src/app/config/__tests__/aiSearchIntentScope.spec.ts` protege o escopo atual;
- `src/core/ai/__tests__/orchestrator.spec.ts` protege autorização explícita;
- `tests/architecture/mvp-core-module-boundary.test.ts` impede regressão
  `core/ai -> app/config`.

Reativar Services deve ser uma mudança de lifecycle certificada. Não reintroduzir
`isLaunchSurfaceEnabled` ou outro registry de aplicação dentro de `core/ai`.
