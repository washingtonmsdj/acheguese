# G88 — Driver stats semantics

Data: 2026-09-12

## Problemas encontrados

A revisão dos consumidores de `getDriverStatsDetailed()` revelou três erros semânticos no frontend de Mobilidade:

1. `DriverStatsCompact` e `DriverStatsCard` chamavam `profileService.getProfileByType()` passando `activeProfile.id`, embora o contrato do método receba `userId`;
2. ambos exibiam `acceptance_rate` como se fosse `completion_rate`;
3. ambos inventavam localmente `priority_score = 100 - cancellation_rate * 2` e apresentavam esse número como prioridade no sistema de match, sem autoridade de dispatch correspondente.

`DriverSuspensionAlert` também mantinha uma política local de UI que afirmava suspensão automática acima de 30% de cancelamento. A busca no projeto não encontrou essa regra em authority server-side; o limiar aparecia apenas em componentes de apresentação.

## Correção de raiz

### Identidade do driver

Os dois cards agora resolvem o driver a partir do shape real de sessão `SessionProfileView`:

- se `activeProfile.profileType === "driver"`, usam diretamente `activeProfile.id`;
- caso contrário, chamam `getProfileByType(activeProfile.userId, "driver")`.

### Métricas verdadeiras

A taxa de conclusão é derivada de dados realmente existentes:

`total_rides_completed / total_rides * 100`

`acceptance_rate` deixa de ser renomeada como conclusão.

O `priority_score` local foi removido integralmente. O frontend não afirma mais que uma fórmula inventada define prioridade de matching.

A consulta de ganhos dos últimos 30 dias existente em `DriverStatsCard` também foi removida porque o valor era buscado mas nunca renderizado.

### Suspensão

`DriverSuspensionAlert` agora:

- mostra alerta apenas quando o perfil está realmente `is_suspended`;
- não inventa política de suspensão por taxa de cancelamento;
- suporta suspensão sem `suspended_until` e exibe “Sem prazo definido”;
- usa rótulo `corridas registradas` em vez de chamar `total_rides` de “aceitas”;
- busca estatísticas somente para uma suspensão real;
- move `checkSuspensionExpiry()` para `useEffect`, evitando mutação/efeito assíncrono durante render.

## Evidência

- `4ad340a7ed286df0f09967eebe37dbc50d128075` — compact stats;
- `43278d12ef3f3d89428db3544ace19fae7ecce9c` — card completo;
- `c406c9aa229000fa19b6836f7f538566a334e048` — suspensão;
- `b7ecc88f571ea766ade7d7faa72eb2917f0b8b86` — ratchet estrutural G88.

## Validação executável

Os workflows observados no head anterior G87 falharam antes de executar steps (`steps=[]`, `runner_id=0`). Portanto não existe certificação verde executada e também não existe evidência de falha de código proveniente desses jobs.

## Estado

G88 SOURCE-CLOSED.

Mobilidade continua launch-paused: `PUBLIC_LAUNCH_SURFACES.mobility=false`.

Próximo corte: reconciliar superfícies secundárias que ainda tratam campos legados de `driver_data` como presença operacional, começando pelo exportador LGPD/user-export-data.
