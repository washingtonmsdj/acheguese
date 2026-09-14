# G174 — Global Geolocation SSOT and Address Cleanup

Data: 2026-09-14  
Status: implementado em `main`; runner/build/deploy ainda não certificados

## Objetivo

Fechar o ownership global da Browser Geolocation API e eliminar os últimos caminhos de UI conhecidos que ainda acessavam GPS ou provider de CEP diretamente. A rodada preserva a distinção entre GPS preciso solicitado pelo usuário, cache e aproximação por IP, sem criar facade ou hook paralelo.

Baseline documental: G173.

## Owners canônicos

- `src/shared/services/GeolocationService.ts` — owner único da Browser Geolocation API, cache, permissão, retries, watch e fallback IP;
- `src/shared/config/geolocation.ts` — política/tempos compartilhados de geolocalização;
- `src/shared/hooks/useRobustGeolocation.ts` — camada React genérica sobre o service, sem segundo owner de infraestrutura;
- `src/core/location/services/LocationGeocodingService.ts` — owner de geocoding/reverse geocoding/CEP reconciliado com o SSOT territorial.

Regra: componentes, páginas e hooks de domínio não chamam `navigator.geolocation` diretamente. Fluxos explicitamente intitulados “usar minha localização” usam GPS preciso e não degradam silenciosamente para aproximação por IP.

## Fechamentos desta rodada

### AddressEditor

`src/core/business/components/settings/AddressEditor.tsx` deixou de:

- chamar ViaCEP diretamente via `fetch`;
- chamar `navigator.geolocation` diretamente;
- tratar latitude/longitude `0` como valor ausente.

Agora:

- CEP passa por `locationGeocodingService.lookupPostalCode()`;
- localização atual passa por `GeolocationService.getCurrentLocation()` em modo preciso, sem cache e sem fallback IP;
- coordenadas usam semântica nullish, preservando `0` como valor válido;
- coordenadas retornadas pelo lookup de CEP são aproveitadas quando disponíveis.

### CreateRideModal

`src/modules/mobility/components/CreateRideModal.tsx` deixou de abrir a Browser Geolocation API diretamente. A captura interativa de origem agora usa o owner compartilhado em modo preciso e continua fazendo reverse geocoding/reconciliação territorial pelo caminho canônico.

Também foi corrigida a persistência de coordenadas `0`: `createAddress()` passou a validar com `Number.isFinite()` e usar `?? null`, em vez de truthiness/`|| null`.

### CreateDeliveryModal

`src/modules/mobility/components/CreateDeliveryModal.tsx` migrou a captura GPS do destino para o mesmo owner compartilhado, com GPS preciso e `allowIpFallback: false`, mantendo reverse geocoding e reconciliação territorial existentes.

## Ratchet arquitetural

Foi criado `tests/architecture/geolocation-ssot-boundary.test.ts`.

O teste:

- percorre `src/**/*.ts(x)` e rejeita qualquer `navigator.geolocation` fora de `src/shared/services/GeolocationService.ts`;
- impede retorno de ViaCEP direto ao `AddressEditor`;
- exige que os fluxos interativos de ride/delivery usem `GeolocationService.getCurrentLocation()` com `gpsMode: "precise"` e `allowIpFallback: false`;
- protege a semântica zero-safe dos campos de coordenada e da persistência de corrida.

## Sequência de commits desta continuação

- `139597edf36480ffbebb30d597b798041c90b327` — `Route business address lookup through location SSOT`;
- `e7296a2cab9047c4db68543eb65cc5307dfb4d03` — `Route ride modal GPS through shared geolocation SSOT`;
- `5bda9971cbd451c7e89763874c0842176bbbcc7b` — `Route delivery modal GPS through shared geolocation SSOT`;
- `f4a319dd696041a608325f7451ff3b5752fea725` — `Guard shared browser geolocation ownership`.

A `main` recebeu commits concorrentes de autenticação entre alguns desses commits. Eles foram preservados; não houve force-push nem reescrita de histórico.

## Validação disponível

Foi consultado o estado remoto do SHA `f4a319dd696041a608325f7451ff3b5752fea725`:

- GitHub Actions associado ao SHA: nenhum workflow run retornado;
- status Vercel: `failure`, com destino de `build-rate-limit`;
- portanto o vermelho atual representa indisponibilidade/rate limit do provider e **não** prova falha de compilação;
- também não pode ser usado como aprovação de build/deploy.

Nesta rodada não houve runner capaz de executar Vitest, typecheck ou build contra o checkout final. Consequentemente, este checkpoint declara consolidação estrutural no source, mas não certificação executável.

## Estado após G174

- os últimos três consumidores de código conhecidos que acessavam `navigator.geolocation` diretamente foram migrados;
- Browser Geolocation fica sob um único owner compartilhado;
- CEP do `AddressEditor` não contorna mais o SSOT de localização;
- zero continua coordenada válida;
- cache/IP não devem ser interpretados como concessão de permissão GPS;
- ações explícitas de GPS não usam fallback IP silencioso;
- existe ratchet para impedir regressão estrutural.

## Próximo gate

1. executar `tests/architecture/geolocation-ssot-boundary.test.ts` em runner real;
2. executar typecheck e build no mesmo SHA/descendente sem mudança funcional desta área;
3. quando o provider liberar builds, obter prova de deploy do mesmo SHA;
4. continuar a auditoria global de localização procurando ownership duplicado por semântica — geocoding, território, endereço e cache — sem recriar facades ou compatibilidade legada.
