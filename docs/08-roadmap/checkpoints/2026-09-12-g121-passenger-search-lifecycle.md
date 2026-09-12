# G121 — Passenger Search Lifecycle

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problemas

A tela `BuscandoMotoristaPage` ainda tinha uma state machine local diferente da authority compartilhada:

- `driver_assigned` era considerado sucesso e fazia a tela sair da busca antes do aceite do motorista;
- estados terminais eram enumerados localmente;
- o `useQuery` usado pela página não fazia polling, porém a navegação dependia do `status` desse snapshot inicial;
- o realtime atualizava apenas `PassengerSearchStatus`, sem dirigir a navegação da página;
- `PassengerSearchStatus` exigia `passengerProfileId`, mas a página passava `user.id` de autenticação; em subscription ride-scoped esse ID não participa do filtro;
- `MobilidadeRightSidebar` contava somente `pending` como pedido ativo e tratava `driver_assigned` como corrida em andamento;
- o diálogo de cancelamento afirmava consequências como “sem penalidades” e “pode afetar avaliação” sem uma policy comprovada nessa camada.

## Correções

### Realtime ride-scoped

`useRideRealtime` agora exige uma scope válida, não obrigatoriamente `userId`:

- com `rideId`, usa `mobility.ride-by-id` e filtro `{ rideId }`;
- sem `rideId`, os tópicos por passageiro/motorista continuam exigindo `userId/profileId`.

Assim uma subscription ride-scoped não precisa receber um identificador de perfil fictício apenas para ficar habilitada.

### Authority de busca

`useRideSearch` passou a classificar o lifecycle com:

- `isPreAcceptRideStatus`;
- `isDriverOwnedOpenRideStatus`;
- `isCancelledRideStatus`;
- `RIDE_STATE` apenas para estados cuja apresentação precisa ser distinguida.

`driver_assigned` é apresentado como `driver_found`/aguardando confirmação e **não** como aceite.

O hook também:

- expõe `rideState` bruto para consumidores que precisam do status atual;
- usa `onStatusChangeRef`, evitando que callbacks inline recriem `updateStatus` e reexecutem a carga inicial em ciclo;
- usa a mesma classificação para carga inicial e eventos realtime;
- modela `failed` explicitamente em vez de encaixá-lo em cancelamento/expiração.

### Navegação da tela

`BuscandoMotoristaPage` não possui mais `successStatuses`/`terminalStatuses` locais.

A navegação passa a responder ao callback realtime de `PassengerSearchStatus`:

- `driver_found` permanece na busca;
- `driver_accepted` e estados operacionais saem da busca;
- estados encerrados também retornam ao fluxo do passageiro.

O último `rideState` recebido em realtime também alimenta `CancelRideConfirmDialog`, evitando que a mensagem de cancelamento use o snapshot inicial quando a corrida já avançou para `driver_assigned`.

### Sidebar

`MobilidadeRightSidebar` agora usa:

- `isOpenRideStatus` para “Pedidos Ativos”;
- `isDriverOwnedOpenRideStatus` para “Em Andamento”.

Atribuição pré-aceite não entra mais em “Em Andamento”.

### Cancelamento

`CancelRideConfirmDialog` passou a descrever apenas o lifecycle observável e usa `getRideStatusLabel` para o rótulo atual.

Foram removidas afirmações locais não comprovadas sobre:

- cancelamento “sem penalidades”;
- impacto na avaliação;
- penalidades por estado.

A autorização/regra final continua server-side.

## Ratchet

`src/modules/mobility/__tests__/PassengerSearchLifecycleG121.test.ts`

Protege:

- subscription ride-scoped sem profile ID artificial;
- ausência de `passengerProfileId` em `useRideSearch`/`PassengerSearchStatus`;
- uso dos classifiers compartilhados;
- `driver_assigned` como `driver_found`, não aceite;
- navegação pelo callback realtime;
- ausência de arrays locais na página;
- sidebar derivada do lifecycle compartilhado;
- ausência das antigas mensagens de penalidade inventadas.

## Validação

Os commits e contratos foram inspecionados após as escritas. Este checkpoint **não declara suite/CI verde** sem execução confiável do runner.
