# Checkpoint — catálogo de apresentação no lifecycle canônico (2026-09-24)

O catálogo `src/app/config/modules.ts` deixa de usar a fachada de compatibilidade `launchScope.ts` para decidir se uma entrada está ativa.

## Decisão

- metadados visuais continuam em `modules.ts`;
- domínios de produto usam `isProductModuleEnabled(...)`;
- capabilities horizontais usam `isPlatformCapabilityEnabled(...)`;
- `launchScope.ts` permanece somente onde sua compatibilidade específica ainda é necessária, incluindo a interpretação centralizada de `VITE_PRELAUNCH_LOCKDOWN`;
- Mapa, Perto de mim e Busca continuam capabilities horizontais, não módulos de domínio;
- Business permanece o único domínio público ativo do MVP.

## Ratchet

`tests/architecture/mvp-core-module-boundary.test.ts` agora exige que `modules.ts`:

- não importe `launchScope`;
- não use `isLaunchSurfaceEnabled`;
- derive Business pelo lifecycle de produto;
- derive Map, Nearby e Search pelo lifecycle de capabilities.

Nenhum módulo pós-MVP foi ativado e nenhuma rota foi adicionada.
