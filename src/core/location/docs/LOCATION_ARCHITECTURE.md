# Location & Address Architecture — SSOT

## Tipos de entidade com localização

| Tipo | Coleta | Exibição pública | Mapa |
|---|---|---|---|
| `user_gps` | GPS do dispositivo, com permissão | Bairro/Cidade | Nenhum |
| `verified_resident` | Endereço estruturado | Bairro/Cidade | Nenhum |
| `physical_business` | Endereço e coordenadas | Endereço publicado | Pin exato |
| `mobile_service` | Área de cobertura | Áreas atendidas | Área |
| `territorial` | `location_id` canônico | Nome do território | Polígono |

## Regras de privacidade

- morador: nunca expor rua, número, complemento ou CEP publicamente;
- empresa física: pode publicar endereço comercial conforme contrato do domínio;
- serviço móvel: representa cobertura, não inventa endereço fixo;
- localização de usuário comum é contexto operacional, não dado público de GPS.

## GPS e fallback

O sistema não depende exclusivamente de GPS:

1. quando autorizado, `src/shared/services/GeolocationService.ts` resolve a posição do dispositivo;
2. hooks React genéricos usam `useRobustGeolocation` como camada de estado sobre esse service;
3. sem GPS, a experiência usa fallback IP apenas nos fluxos que aceitam aproximação ou o território resolvido/canônico quando o domínio exige contexto territorial;
4. qualquer fallback visual deve ser explícito e não pode ser persistido como coordenada real do usuário.

`GeolocationService` é o owner de infraestrutura para Browser Geolocation API, cache, timeout, retry, permissão, watch e fallback IP. Páginas, componentes e hooks de domínio não devem recriar `navigator.geolocation` para consultas genéricas.

## Geocoding + território

`src/core/location/services/LocationGeocodingService.ts` é a boundary usada por
fluxos de domínio que precisam transformar CEP/endereço/coordenada **e**
reconciliar o resultado com o SSOT `locations`.

Ele usa `core/geocoding` como engine/provider e mantém separadas duas coisas:

- informação retornada pelo provider (`providerAddress`);
- território/endereço reconciliado pelo sistema (`territory` / `systemAddress`).

Texto livre retornado por provider nunca substitui `location_id` como autoridade
territorial.

## Endereço residencial

Fluxo atual:

1. CEP via `LocationGeocodingService.lookupPostalCode()`;
2. reconciliação com estado/cidade/bairro oficiais em `locations`;
3. usuário completa número/complemento quando necessário;
4. `ResidentAddressService.registerResidentAddress()` valida e normaliza o
   payload de Address;
5. `AddressService` persiste o endereço;
6. `ResidenceService` mantém o vínculo usuário ↔ endereço ↔ território.

O antigo `CepService` não é owner ativo e não deve ser recriado.

## Mapa e “perto de mim”

- pin exato: entidade cuja política permite coordenada pública, como empresa
  física publicada;
- cobertura: serviço móvel/área de atendimento;
- polígono: território;
- usuário/morador: sem pin público de residência/GPS.

Busca espacial e containment pertencem a `core/geospatial`; renderização e
interação pertencem a `core/maps`.

## Arquivos-chave

| Arquivo | Responsabilidade |
|---|---|
| `shared/services/GeolocationService.ts` | Browser geolocation, cache, retries, watch e fallback IP |
| `shared/hooks/useRobustGeolocation.ts` | Estado React sobre o service canônico |
| `shared/config/geolocation.ts` | Política única de timeout/cache/precisão |
| `core/location/services/LocationGeocodingService.ts` | Geocoding reconciliado com `locations` |
| `core/location/services/UserLocationResolver.ts` | Resolução de posição/contexto do usuário |
| `core/location/hooks/useResolvedUserLocation.ts` | Hook de posição resolvida |
| `core/location/utils/entityLocationDisplay.ts` | Projeção pública por tipo de entidade |
| `core/address/services/ResidentAddressService.ts` | Orquestração de endereço residencial |
| `core/address/services/AddressPrivacyGuard.ts` | Boundary de privacidade de Address |
| `core/geocoding` | Providers de CEP/geocoding/reverse geocoding |
| `core/geospatial` | Bounds, containment e operações espaciais |

## Proibições

- acesso direto ao Supabase em UI;
- provider de geocoding chamado diretamente por componente;
- novo `navigator.geolocation` em página/componente/hook genérico fora do owner compartilhado;
- novo hook paralelo `useGeolocation` para casos que `useRobustGeolocation` ou `GeolocationService` já atendem;
- bairro/cidade digitados ou retornados por provider virarem SSOT territorial;
- endereço residencial completo em superfície pública;
- pin de serviço móvel fingindo estabelecimento físico;
- duplicar geocoding, containment ou identidade territorial em módulos de UI.
