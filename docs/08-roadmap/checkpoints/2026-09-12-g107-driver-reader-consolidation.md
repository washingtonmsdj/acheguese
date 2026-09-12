# G107 — Driver reader consolidation

Status: **SOURCE-CLOSED / REMOTE CERTIFICATION PENDING**

Data: 2026-09-12

## Problema de raiz

Depois do G106, ainda existiam três caminhos paralelos para diretório/perfil resumido de motorista:

- `MobilityService.impl.ts` mantinha `getDriverProfiles()`, `getTopDrivers()` e `getDriverCompleteProfile()` próprios;
- `MobilityRuntimeService.ts` mantinha outro `getDriverProfiles()`;
- `MobilityAdminQueryService.getAllDriversComplete()` ainda fazia `driver_complete_profile.select("*")`.

As versões estática/runtime não tinham consumidores reais para esses readers de motorista; os consumidores atuais já usam as queries especializadas. Mantê-las corrigidas em paralelo criaria duas authorities para o mesmo dado.

O reader administrativo global, por outro lado, ainda é consumido por realtime e analytics enquanto o G104 de agregação server-side permanece pendente.

## Correção

### Classe estática

Removidos de `MobilityService.impl.ts`:

- `getDriverProfiles()`;
- `getTopDrivers()`;
- `getDriverCompleteProfile()`;
- tipo `DriverCompleteProfileRecord` e import associado.

Os métodos operacionais ainda consumidos — especialmente motoboy/ride — foram preservados.

### Runtime singleton

Removido de `MobilityRuntimeService.ts`:

- `getDriverProfiles()`;
- tipo local `DriverCompleteProfileRecord`.

O singleton continua responsável pelas operações runtime/self-service que possuem consumidores ativos.

### Admin analytics/realtime

`MobilityAdminQueryService.getAllDriversComplete()` deixou de consultar `driver_complete_profile` e passou a compor um read model explícito a partir de:

- `driver_data`: `profile_id`, rating, total de corridas, verificação e veículo;
- relação `profiles`: nome público e avatar.

Presença operacional não entra nesse reader. Realtime continua obtendo presença por `AdminDriverPresenceReadService` / `driver_availability`.

O DTO temporário `AdminDriverAnalyticsRow` entrega aliases explícitos durante a transição:

- `id` e `profile_id` = profile id;
- `name` e `display_name` = identidade pública resolvida;
- `rating` e `avg_rating` = mesmo rating cadastral;
- `profile` contém nome/avatar para o consumidor de analytics.

Isso corrige também o contrato quebrado de `useAdminMobilityAnalytics`, que tratava linhas da view como `{ id, name, profile }` apesar de a view entregar `{ profile_id, display_name, avatar_url }`.

## Relação com G104

`getAllDriversComplete()` continua temporariamente porque ainda há consumidores que agregam analytics/realtime no navegador. O G104 permanece responsável por mover a agregação global para uma fronteira server-side quando a conexão SQL/metadata puder ser validada.

Não foi criado nem aplicado DDL neste gate.

## Ratchet

Adicionado:

`src/modules/mobility/__tests__/DriverReaderConsolidationG107.test.ts`

Protege:

- ausência dos readers duplicados de motorista em `MobilityService.impl.ts`;
- ausência do diretório duplicado em `MobilityRuntimeService.ts`;
- ausência de `driver_complete_profile` nesses dois caminhos;
- projeção explícita e presence-free do reader administrativo temporário;
- contrato de identidade compatível enquanto G104 não é promovido.

## Validação

Diffs verificados como cirúrgicos:

- `42ccf35e6bbe6de8d338997dcdca09ef9b01aec1` — read model explícito do admin;
- `be57ea60bda50d38585521b13f1418f478d585ce` — remoção dos readers estáticos duplicados;
- `26acbd778c15d1728e8b1ce1b1e1126eae509d49` — remoção do reader duplicado do runtime;
- `a8c41e470d04a3a59d5da245895a06d360158e5c` — ratchet.

A suíte remota ainda não pode ser declarada verde. Os workflows recentes vinham falhando antes de executar steps (`runner_id=0`), e a conexão SQL/metadata do Supabase continua instável por timeout.

## Próximo corte

Auditar as métricas realtime que ainda tentam derivar fatos de campos inexistentes no driver read model, em especial `avg_response_time_*`. A fonte candidata correta é o lifecycle de `ride_requests` (`driver_accepted_at` versus criação/dispatch), não um campo fantasma de motorista.
