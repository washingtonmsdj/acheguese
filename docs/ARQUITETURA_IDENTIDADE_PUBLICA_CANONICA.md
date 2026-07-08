# Arquitetura de Identidade Publica Canonica

Atualizado: 2026-07-05
Status: consolidado

Este documento substitui o plano historico de identidade publica. O contrato vivo de URLs esta em `docs/ROTAS_PUBLICAS_CANONICAS.md`.

## Contrato Atual

| Entidade | URL publica preferencial | Contexto comunitario explicito |
| --- | --- | --- |
| Perfil pessoal | `/u/:username` | - |
| Comunidade | `/comunidade/:communitySlug` | mesma rota |
| Empresas | `/empresas/:state/:city/:territorySlug/:slug` | `/comunidade/:communitySlug/empresas/:slug` |
| Gastronomia | `/gastronomia/:state/:city/:territorySlug/:slug` quando houver detalhe proprio; caso contrario usa a URL publica da empresa | `/comunidade/:communitySlug/gastronomia/:slug` |
| Mini-site premium | `/p/:slug` | - |
| Profissional | `/profissionais/:state/:city/:slug` | - |

## Regras

- `/u/:username` e apenas perfil pessoal.
- `/u/:username` deve receber `username` publico. IDs/UUIDs de perfil nao sao URL publica.
- Empresa e restaurante nao usam `/u/:username`.
- Empresa e restaurante nao redirecionam automaticamente para comunidade.
- `/empresas/:state/:city/:territorySlug/:slug` e a URL publica canonica
  padrao de empresa/restaurante.
- `/gastronomia/:state/:city/:territorySlug/:slug` so e URL publica canonica
  quando houver detalhe proprio da vertical; caso contrario a entidade usa a URL
  publica de empresa.
- `/comunidade/:communitySlug/<modulo>/:slug` existe somente para contexto e
  acoes comunitarias explicitas.
- Aliases curtos legados como `/:communitySlug/:slug` redirecionam para a rota
  comunitaria explicita e nao devem ser emitidos em codigo novo.
- `/p/:slug` e mini-site premium, separado da URL publica canonica da empresa.
- Motorista nao tem pagina publica generica.

## SSOTs

- Perfil pessoal: `src/core/profiles/utils/publicProfileUrl.ts`
- Empresa/restaurante: `src/core/business/services/BusinessUrlService.ts`
- Helpers baixos de empresa: `src/core/business/utils/businessPublicUrls.ts`
- Comunidade/territorio: `src/core/routing/utils/territoryUrls.ts`
- Alias publico de comunidade: `src/core/routing/services/CommunityPublicAliasService.ts`
- Gastronomia: `src/core/verticals/gastronomy/services/GastronomyUrlService.ts`

## Gate

`npm run validate:ssot` tambem executa `npm run validate:url:ssot`, bloqueando montagem manual de URLs publicas sensiveis como `/p/${...}`, `/empresas/${...}` e `/gastronomia/${...}` fora dos SSOTs permitidos.
