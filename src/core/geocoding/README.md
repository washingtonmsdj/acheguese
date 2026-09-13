# Core Geocoding

Status: **ATIVO / SSOT DE GEOCODING**  
Owner: `src/core/geocoding`

## Responsabilidade

`core/geocoding` transforma referências postais e coordenadas sem assumir responsabilidades de outros domínios:

- CEP → dados postais;
- endereço/texto → coordenadas;
- coordenadas → endereço;
- normalização e fallback entre providers;
- estado, métricas e hooks da operação de geocoding.

Não pertence a este módulo:

- persistência/lifecycle de endereço: `src/core/address`;
- containment, bounds, polígonos e busca espacial: `src/core/geospatial`;
- renderização/interação de mapas: `src/core/maps`;
- identidade/hierarquia territorial: `src/core/location` e `src/core/territorial`.

## Estrutura atual

```text
src/core/geocoding/
├── hooks/useGeocoding.ts
├── providers/BaseGeocodingProvider.ts
├── providers/NominatimProvider.ts
├── providers/ViaCepProvider.ts
├── services/GeocodingService.ts
├── types/
├── instance.ts
└── index.ts
```

Os antigos `src/core/address/services/CepService.ts` e
`src/core/maps/services/GeocodingService.ts` não são owners ativos e não devem
ser recriados como bridges.

## API pública

Consumidores usam o barrel `@/core/geocoding`:

```ts
import {
  geocodingService,
  usePostalCodeLookup,
  useReverseGeocoding,
} from "@/core/geocoding";
```

Principais operações do service:

```ts
await geocodingService.lookupPostalCode({ postalCode: "40000-000" });
await geocodingService.geocode({ query: "Avenida Paulista, 1000" });
await geocodingService.reverseGeocode({ latitude: -12.97, longitude: -38.50 });
```

O barrel também expõe configuração/observabilidade (`initializeGeocodingService`,
`isGeocodingAvailable`, `getGeocodingStatus`, `getGeocodingMetrics`) e os tipos
canônicos definidos em `types/`.

## Providers

- `ViaCepProvider`: lookup de CEP brasileiro;
- `NominatimProvider`: geocoding e reverse geocoding;
- `BaseGeocodingProvider`: contrato/base comum de provider.

Providers são implementação interna. Novos consumidores devem depender do
service/hook canônico, não do provider concreto.

## Regras

1. Não criar outro service de geocoding em Address, Maps ou módulos de UI.
2. Não usar fallback para owner legado removido.
3. Operações espaciais pertencem a `core/geospatial`; não duplicá-las aqui.
4. UI consome hooks/service; provider concreto não vira autoridade de domínio.
5. Mudanças de provider não devem alterar o contrato público sem migração explícita.

## Histórico

O antigo guia de migração de 2026-04-06 foi retirado da árvore de source após a
aposentadoria dos services legados que ele descrevia. Ele permanece apenas como
evidência histórica em:

`docs/10-archive/architecture-legacy/GEOCODING_MIGRATION_GUIDE_2026-04-06.md`
