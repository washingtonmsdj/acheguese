# Information Architecture — visão pós-MVP

**Status:** histórico / visão futura não executável.

O antigo `docs/06-navigation/INFORMATION-ARCHITECTURE.md` foi retirado da documentação viva em 2026-09-26. O próprio documento já se declarava **VISÃO PÓS-MVP / não executável** e descrevia modos como Hoje, Explorar, Comunidade, Resolver e Atividade, além de entidades de módulos atualmente `paused`.

Mantê-lo ao lado dos contratos ativos poderia fazer uma inspeção externa interpretar hipóteses futuras como arquitetura vigente.

A navegação atual é definida por:

- `docs/06-navigation/NAVIGATION-SYSTEM.md`;
- `docs/06-navigation/NAVIGATION-MAPPING.md`;
- `docs/SCREEN-MAP.md`;
- lifecycle executável em `src/app/config/`;
- registry de apresentação em `src/core/navigation/territoryNavigationModes.ts`.

O conteúdo completo da antiga visão de Information Architecture permanece preservado no histórico Git anterior a esta limpeza. Uma futura retomada desses modos deve passar pelo lifecycle, certificação e documentação vigente; este arquivo não é backlog.
