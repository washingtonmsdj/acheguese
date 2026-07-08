# Motoboy Na Mobilidade

## Escopo

Motoboy faz parte do dominio de mobilidade. Nao e um modulo separado: entregas usam `ride_requests` com `ride_mode = 'motoboy'` e compartilham dispatch, auditoria, tracking e estados operacionais com corridas.

Pedidos com pagamento direto ao estabelecimento e frota propria pertencem ao dominio de delivery/order, nao ao dispatch de motoboy da plataforma.

## Modelo Canonico

Fonte de schema: `supabase/migrations`.

Campos principais em `ride_requests`:

```text
ride_mode: 'ride' | 'motoboy'
source_type: 'passenger' | 'business' | 'gastronomy' | 'service'
source_id: uuid
recipient_name: text
recipient_phone: text
delivery_notes: text
package_description: text
package_size: 'small' | 'medium' | 'large'
proof_of_delivery: jsonb
pickup_confirmed_at: timestamptz
delivered_at: timestamptz
failed_delivery_at: timestamptz
failed_delivery_reason: text
```

Capacidades do motorista ficam em `driver_data`:

```text
can_do_delivery: boolean
can_do_rides: boolean
```

## Fluxo Operacional

```text
requested/searching_driver
  -> driver_assigned
  -> driver_accepted
  -> driver_arriving
  -> pickup_confirmed
  -> in_delivery
  -> delivered
  -> completed
```

Falha de entrega:

```text
in_delivery -> failed_delivery -> failed | cancelled_by_driver
```

## Entrypoints De Runtime

- `useMotoboy`: integracao publica para solicitar entrega a partir de gastronomia, empresa ou servico.
- `useDelivery`: fluxo de criacao/acompanhamento de entrega.
- `CreateDeliveryModal`: formulario controlado para solicitar motoboy.
- `MotoboyDeliveryActions`: acoes operacionais do motorista/motoboy.
- `MobilityOfferService`: aceite atomico de ofertas via `mobility-rpc`.

## Regras

- Dispatch de motoboy filtra motoristas com `driver_data.can_do_delivery = true`.
- Pricing usa modo `motoboy` no catalogo central de precificacao.
- Aceite de corrida/entrega passa por `mobility-rpc`; o helper canonico
  `accept_ride_atomic` permanece versionado em `supabase/migrations` e
  executavel diretamente apenas pelo caminho servidor.
- Scripts one-off de migracao nao fazem parte do runtime nem do fluxo oficial de schema.
