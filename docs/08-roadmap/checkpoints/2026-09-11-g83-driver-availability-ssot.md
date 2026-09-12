# G83 — Mobilidade: presença operacional em `driver_availability`

Data: 2026-09-11

## Problema confirmado

A `main` já declarava `driver_availability` como SSOT de presença/disponibilidade, porém ainda existiam consumidores e bridges que tratavam `driver_data.is_online`, `driver_data.is_available` e `driver_data.last_location_update` como estado operacional.

Isso produzia três classes de defeito:

1. writes self-service silenciosamente descartados pelo sanitizador do frontend;
2. telas lendo snapshots potencialmente stale de `driver_data`;
3. Admin tentando colocar outro motorista online/offline por um caminho owner-bound que corretamente não autoriza impersonação operacional.

## Correção de raiz integrada na `main`

- `mobility.mutations.updateDriverOnlineStatus()` passou a usar `DriverAvailabilityService.goOnline/goOffline`;
- `useDriverOperationalStatus` removeu o espelho `persistSnapshot` para `driver_data` e refaz o fetch da authority real após cada transição;
- `useDriverProfileIdentity` hidrata `is_online`, `is_available` e `last_location_update` via `DriverAvailabilityService.getStatus()`;
- `MobilityRuntimeService` passou a ler presença em `driver_availability` para status/verificação/estatísticas e a escrever presença via `MobilityRpcService.updateDriverAvailability`;
- `DriverService.impl` deixou de derivar `is_active` de `driver_data.is_online` e removeu o creator morto que tentava gravar `is_online`/`is_verified` por self-service; criação real continua no broker `MobilityRpcService.createDriverProfile`;
- Admin não possui mais ação de `Colocar Online/Offline`; moderação e presença física são authorities distintas;
- `AdminDriverPresenceReadService` foi criado como read model canônico, usando a policy existente owner-or-admin de `driver_availability` sem ampliar grants;
- cards Admin e snapshot/mapa operacional agora recebem presença de `driver_availability`; `driver_data` fornece apenas cadastro/capacidades;
- `MobilityDriverPresenceSSOTG83.test.ts` impede regressão para espelho de presença, impersonação Admin e leitura operacional pela tabela errada.

## Commits do corte

- `0736060c65a0fe7f11da09c1da3147e96683f095` — route driver presence through availability authority;
- `e34019466d8c3bd5260ca4b1bc6983770c6d586e` — remove driver_data presence mirror do hook operacional;
- `f2b3d2fb3eb329fc7f36e68794743105a8a4f55e` — hidrata identidade do motorista pela availability SSOT;
- `aaa7c470469f891fe896d8ea2d6cbf51459d8b50` — consolida presença runtime em `driver_availability`;
- `4233eb3e857d651d6dc66c1d93f1022a86e25ec8` — remove impersonação de presença da moderação Admin;
- `9b9aa86bb1835abf73aba1d104c27bf1a789d996` — torna presença read-only nas actions Admin;
- `c97b6fdc1d36152e68703156aeeacf856e208164` — remove controle inválido de presença da página Admin;
- `54960b2293335a966839c32d5f5360c016312a56` — mantém online apenas como indicador no card Admin;
- `65578dd4514290b4931fa6c48d600effe9419324` — remove bridge Admin morto de mutação de presença;
- `e497d6bfe13e3694e87c68311cb3d9a5c3df5aa9` — adiciona read model canônico de presença Admin;
- `eb6d6c5eb974c2b47e07f552d6f53e462de755a2` — hidrata cards Admin pela availability authority;
- `83713a811f8d80fc601ee9149f807dc9efa07d42` — move snapshot/mapa Admin para availability;
- `1aa1c1f8fc0b39818b39f668aa5cc47bf4bcf74d` — aposenta creator/mirror morto em `DriverService.impl`;
- `c1d78c7a012b7bfdf32e83381a92a5e52e9d9fe2` — ratchet de regressão G83.

## Autoridade comprovada no source

`20260909162500_harden_driver_availability_authority_g8.sql` mantém DML direto de `driver_availability` revogado para `authenticated`; o command `mobility_update_driver_availability` valida ownership pelo `profile.user_id = p_actor_user_id` e é executável apenas por `service_role`.

`20260825214750_harden_driver_availability_read_privacy.sql` mantém leitura privada com `driver_availability_owner_or_admin_read` usando `private.auth_can_access_profile(profile_id)` e revoga SELECT de `anon`.

## Drift residual — runtime/schema

O RPC histórico `public.update_owned_driver_data(uuid,jsonb)`, criado em G7, ainda aceita no banco os campos `is_online`, `is_available`, `last_location_update` e `current_location`. O frontend atual não os envia mais, mas um cliente autenticado proprietário poderia chamar o RPC diretamente.

Portanto G83 fica:

- **SOURCE/UI READY** para o SSOT de presença;
- **RUNTIME HARDENING PENDING** até retirar esses quatro campos da whitelist server-side de `update_owned_driver_data` por migration canônica e comprovar o remoto;
- sem alteração de grants públicos, sem force-push, sem merge bruto de `module/mobilidade` e sem habilitar o launch público.

## Certificação

Este checkpoint não declara build verde. A Vercel permanece sujeita ao blocker externo de build-rate-limit observado nesta linha. Também não foi feito cutover DDL neste passo porque a alteração deve seguir o fluxo canônico de migration + verificação remota, e o canal SQL remoto apresentou timeout durante a inspeção anterior.

## Próximo gate

1. fechar server-side o legado de presença aceito por `update_owned_driver_data` e verificar o remoto;
2. endurecer as ações administrativas sensíveis de `mobility-rpc` com a policy canônica de MFA/AAL2, sem exigir AAL2 para o uso comum de Mobilidade pelo mesmo usuário Admin;
3. executar os gates de segurança/arquitetura/E2E no mesmo SHA antes de qualquer mudança em `PUBLIC_LAUNCH_SURFACES.mobility`.
