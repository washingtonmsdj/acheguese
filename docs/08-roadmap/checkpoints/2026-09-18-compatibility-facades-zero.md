# Checkpoint — Compatibility facades zero

**Data:** 2026-09-18  
**Hora de execução:** 11:25 BRT (UTC-03)  
**Branch:** `cleanup/retire-live-compatibility-facades-20260918`

## Objetivo

Fechar as facades de compatibilidade ainda vivas sem criar aliases substitutos,
mantendo cada domínio apontado diretamente para seu owner canônico.

## Remoções físicas

- `src/modules/guide/hooks/useGuideUrls.ts`;
- `src/core/profiles/services/multi-profile/businessService.ts`;
- `src/core/business/services/gastronomy.mutations.ts`;
- método `MobilityRuntimeService.getRideWithAddresses()`;
- teste de orçamento temporário
  `tests/architecture/live-compatibility-facade-budget.test.ts`.

## Callers migrados

### Guide

`GuideSidebarItem`, `TouristPointsPage` e `TouristPointDetailPage` usam
diretamente:

`src/core/guide/tourist-points/routes/useTouristPointPublicUrls.ts`.

O barrel do módulo deixou de exportar `useGuideUrls`/`TOURIST_POINTS_SLUG`
como alias de compatibilidade.

### Profiles / Business

O editor multi-profile e `profileDomainRules` usam diretamente:

`src/core/business/services/business.profile-extension.ts`.

O owner Business foi corrigido para respeitar seu próprio contrato nullable:
`getBusinessProfileExtension()` agora usa `maybeSingle()`.

Campos server-owned/imutáveis continuam removidos defensivamente no boundary de
update.

### Mobility

`BuscandoMotoristaPage` usa diretamente
`mobility.ride-read-queries.getRideWithAddresses()`.

O tipo local duplicado da tela foi removido; a inferência vem de
`RideSearchSnapshotRow`.

`MobilityRuntimeService` não importa nem encaminha mais essa leitura.

### Gastronomy

O setup já usava `GastronomyProfileService` diretamente. A API histórica
`gastronomy.mutations.ts`, sem caller runtime, foi removida junto com seus
exports.

## Registry

`docs/03-architecture/COMPATIBILITY_BRIDGES.md` agora registra:

**zero live runtime compatibility facades**.

Checkpoints anteriores continuam preservados como evidência histórica; eles não
autorizam recriar os paths aposentados.

## Ratchets

Criado:

`tests/architecture/compatibility-facade-retirement.test.ts`.

Atualizados:

- `tests/architecture/gastronomy-write-ssot.test.ts`;
- `tests/architecture/mobility-query-surface-integrity.test.ts`;
- `src/modules/mobility/__tests__/PassengerSearchSnapshotBoundaryG140.test.ts`.

Os guards exigem ausência física das facades e imports diretos dos owners.

## Validação desta sessão

Validação estrutural via GitHub no próprio branch confirmou:

- facades removidas = ausentes;
- consumers Guide sem `useGuideUrls`;
- multi-profile sem `BusinessService` de compatibilidade;
- Mobility sem `mobilityService.getRideWithAddresses` e sem forwarder runtime;
- Gastronomy barrel sem `gastronomy.mutations`;
- registry sem tabela de dívida viva.

Uma tentativa de clonar o branch para executar Vitest local falhou porque o
executor desta sessão não possui resolução DNS para `github.com`. Portanto,
**não há PASS local inventado**.

GitHub Actions também possui o blocker já conhecido de jobs que podem encerrar
antes de executar steps. O PR não deve ser considerado certificado até os gates
do mesmo SHA executarem de fato.
