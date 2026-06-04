# Implementacao de Identidade Publica Canonica

Atualizado: 2026-06-04
Status: consolidado

Este relatorio historico foi substituido pelo contrato vivo em `docs/ROTAS_PUBLICAS_CANONICAS.md`.

## Resultado Atual

- Perfil pessoal usa `/u/:username`.
- Comunidade usa `/:communitySlug` quando o alias publico e unico.
- Empresas da comunidade usam `/:communitySlug/empresas`.
- Gastronomia da comunidade usa `/:communitySlug/gastronomia`.
- Empresa e restaurante usam `/:communitySlug/:slug` quando existe alias publico de comunidade.
- `/empresas/:state/:city/:district/:slug` permanece como fallback tecnico/legado para empresa.
- `/gastronomia/:state/:city/:district/:slug` permanece apenas como legado de detalhe gastronomico e canonicaliza para empresa.
- `/p/:slug` e mini-site premium; nao e URL publica geral da empresa.
- Profissional usa `/profissionais/:state/:city/:slug`.
- Motorista nao tem pagina publica generica.

## Implementacao

- `ProfilePublicRoute` trata `/u/:username` como perfil pessoal.
- Business usa `BusinessUrlService`.
- Gastronomia delega detalhe publico para `BusinessUrlService` via `GastronomyUrlService`.
- Profissionais usam `ProfessionalUrlService`.
- Rotas legadas redirecionam/canonicalizam quando existe URL publica preferencial.

## Validacao

- `npm run validate:ssot`
- `npm run validate:url:ssot`
- Testes de rotas em `src/core/routing/components/__tests__`
- Testes de URL em `src/core/business` e `src/core/verticals/gastronomy`
