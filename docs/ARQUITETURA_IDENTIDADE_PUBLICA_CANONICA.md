# Arquitetura de Identidade Publica Canonica

Atualizado: 2026-06-05
Status: consolidado

Este documento substitui o plano historico de identidade publica. O contrato vivo de URLs esta em `docs/ROTAS_PUBLICAS_CANONICAS.md`.

## Contrato Atual

| Entidade | URL publica preferencial | Fallback tecnico |
| --- | --- | --- |
| Perfil pessoal | `/u/:username` | - |
| Comunidade | `/:communitySlug` | `/comunidade/:state/:city/:territorySlug` |
| Empresas da comunidade | `/:communitySlug/empresas` | `/empresas/:state/:city/:territorySlug` |
| Gastronomia da comunidade | `/:communitySlug/gastronomia` | `/gastronomia/:state/:city/:territorySlug` |
| Empresa ou restaurante | `/:communitySlug/:slug` | `/empresas/:state/:city/:district/:slug` |
| Mini-site premium | `/p/:slug` | - |
| Profissional | `/profissionais/:state/:city/:slug` | - |

## Regras

- `/u/:username` e apenas perfil pessoal.
- `/u/:username` deve receber `username` publico. IDs/UUIDs de perfil nao sao URL publica.
- Empresa e restaurante nao usam `/u/:username`.
- Empresa e restaurante compartilham o detalhe publico `/:communitySlug/:slug` quando existe alias de comunidade unico.
- `/empresas/:state/:city/:district/:slug` e fallback tecnico/legado para detalhe de empresa.
- `/gastronomia/:state/:city/:district/:slug` e legado para detalhe de restaurante e deve canonicalizar para a URL publica de empresa.
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
