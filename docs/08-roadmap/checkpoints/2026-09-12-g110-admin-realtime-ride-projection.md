# G110 — Admin Realtime Ride Projection

Data: 2026-09-12
Status: **SOURCE-CLOSED / REMOTE SCHEMA PREFLIGHT PENDENTE**

## Problema

O dashboard administrativo em tempo real ainda dependia de `getAllRides()` com leitura ampla de `ride_requests`. Embora algumas métricas atuais sejam all-time e portanto não possam ser janeladas sem alterar a semântica do produto, não havia motivo para baixar a linha inteira da corrida.

## Correção

Foi criada a fronteira:

`src/core/admin/services/AdminMobilityRealtimeRideReadService.ts`

O `AdminMobilityService.getAllRides()` passou a delegar para `AdminMobilityRealtimeRideReadService.listMetricRows()` e o reader antigo `MobilityAdminQueryService.getAllRides()` foi removido.

A projeção realtime foi reduzida aos campos de lifecycle, identidade mínima e valor atualmente consumidos pelo dashboard:

- `id`;
- `status`;
- `passenger_profile_id`;
- `driver_profile_id`;
- `origin`;
- `destination`;
- `created_at`;
- `updated_at`;
- `completed_at`;
- `cancelled_at`;
- `final_price`;
- `actual_fare`;
- `suggested_price`;
- `driver_assigned_at`;
- `driver_accepted_at`.

Ficam fora dessa leitura, entre outros:

- telefone/nome do destinatário;
- notas de entrega;
- prova de entrega;
- metadata de falha/custódia;
- coordenadas;
- observação;
- descrição de pacote.

## Semântica all-time

Este gate não aplicou janela arbitrária ao realtime. `completionRate` e `avgResponseTime` continuam com a semântica all-time que a superfície já expõe.

A redução aqui é de **largura/exposição do payload**, não uma mudança silenciosa de período. A remoção do custo de crescimento por número de linhas exige agregação server-side em gate posterior.

## Divergência de schema detectada

Durante a validação, o snapshot versionado `src/integrations/supabase/types.generated.ts` mostrou que `ride_requests.Row` não expõe:

- `estimated_duration`;
- `actual_fare`.

`estimated_duration` não teve authority de schema encontrada para `ride_requests` e foi removido do novo reader.

`actual_fare` é diferente: migrations mais novas, incluindo G73/G74, referenciam explicitamente `ride.actual_fare` em `public.ride_requests`. Portanto existe uma divergência conhecida entre o snapshot TypeScript gerado e os SQLs versionados.

A implementação mantém essa divergência **explícita** em um contrato local, em vez de fingir que o campo existe no `Pick<Tables<"ride_requests">,...>`.

Nenhuma conclusão sobre o schema remoto foi inventada. O próximo preflight SQL deve confirmar se `actual_fare` existe no ambiente remoto e regenerar os tipos quando a introspecção voltar a funcionar.

## Ratchet

`src/modules/mobility/__tests__/AdminRealtimeRideProjectionG110.test.ts`

O ratchet bloqueia:

- retorno ao reader global antigo;
- `select("*")` na leitura realtime;
- retorno de campos sensíveis/desnecessários ao payload;
- reintrodução de `estimated_duration` como coluna de `ride_requests`.

## Validação

Os diffs e o contrato versionado foram inspecionados após as escritas. Este checkpoint não declara suite verde nem schema remoto certificado: o teste foi versionado, mas não houve execução de CI confiável neste gate e a divergência `actual_fare` ainda requer preflight remoto.
