# ADR-001: SSOT de Entrega Motoboy — ride_requests

**Data:** 2026-04-19
**Status:** APROVADO
**Autores:** Equipe de Mobilidade

---

## Contexto

O projeto tinha dois fluxos paralelos e funcionais para entregas via motoboy:

- **Fluxo A (Mobilidade):** `ride_requests` com `ride_mode='motoboy'` via `RideOperationalService`
- **Fluxo B (Gastronomia):** `delivery_requests` via `DeliveryService` (gastronomia)

Essa coexistência gerava:
- Dupla fonte de verdade operacional
- Analytics divergente entre módulos
- Admin fragmentado (sem console único)
- Impossibilidade de enforcement centralizado de permissões

---

## Decisão

**`ride_requests` com `ride_mode='motoboy'` é o SSOT canônico para toda entrega via rede de motoboys da plataforma.**

- `RideOperationalService.createDelivery()` é o único ponto de criação de entregas motoboy
- `useDelivery()` é o hook oficial para todos os atores (passageiro, empresa, gastronomia, serviço)
- `MotoboyAuthorizationService` é o guard central de permissões por `source_type/source_id`
- `AdminMotoboyOperations` é o console operacional único para admin

---

## Destino do módulo `delivery_requests`

`delivery_requests` permanece como fluxo **legado/frota própria** com escopo restrito:
- Pedidos de gastronomia com frota própria (não rede motoboy da plataforma)
- Não compete com `ride_requests` para rede motoboy
- Não deve ser expandido com novas features de rede motoboy

---

## Consequências

### Positivas
- Uma fonte de verdade para analytics, admin e permissões
- `MotoboyAuthorizationService` pode enforçar regras por `source_type/source_id` sem ambiguidade
- `AdminMotoboyOperations` cobre 100% das entregas da rede
- Realtime, dispatch e state machine unificados

### Negativas / Mitigações
- `DeliveryManagementPage` (gastronomia) agora usa `useDelivery` para criar novas entregas
  - Mitigação: `CreateDeliveryModal` conectado na página com `sourceType='gastronomy'`
- Dados históricos em `delivery_requests` não migram automaticamente
  - Mitigação: `delivery_requests` permanece para consulta histórica, sem novas escritas de rede motoboy

---

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/modules/mobility/services/MotoboyAuthorizationService.ts` | CRIADO — guard central |
| `src/modules/mobility/core/RideOperationalService.ts` | ATUALIZADO — integra authorization |
| `src/modules/mobility/hooks/useDelivery.ts` | ATUALIZADO — passa requestingUserId |
| `src/modules/gastronomy/pages/DeliveryManagementPage.tsx` | ATUALIZADO — usa useDelivery para criar |
| `src/modules/admin/pages/AdminMotoboyOperations.tsx` | CRIADO — console operacional |
| `src/app/routes/AppRoutes.tsx` | ATUALIZADO — rota /admin/motoboy-operacoes |

---

## Referências

- `docs/MOBILIDADE_MOTOBOY_RELATORIO_E_TASKS.md` — Diagnóstico e plano de implementação
- `src/modules/mobility/core/RideOperationalService.ts` — Motor operacional SSOT
- `src/core/billing/entitlements.ts` — Entitlements de plano para motoboy
