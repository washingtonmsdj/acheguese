# Implementacao de Identidade Publica Canonica

Atualizado: 2026-07-05
Status: consolidado

Este relatorio historico foi substituido pelo contrato vivo em `docs/ROTAS_PUBLICAS_CANONICAS.md`.

## Resultado Atual

- Perfil pessoal usa `/u/:username`.
- Comunidade usa `/comunidade/:communitySlug` quando o alias publico e unico.
- Empresas da comunidade usam `/comunidade/:communitySlug/empresas`.
- Gastronomia da comunidade usa `/comunidade/:communitySlug/gastronomia`.
- Empresa e restaurante usam URL publica territorial canonica; contexto comunitario explicito usa `/comunidade/:communitySlug/<modulo>/:slug`.
- `/empresas/:state/:city/:territory/:slug` e a URL publica canonica de empresa.
- `/gastronomia/:state/:city/:territory/:slug` so permanece como detalhe
  publico quando a vertical tiver pagina propria; caso contrario canonicaliza
  para empresa.
- `/p/:slug` e mini-site premium; nao e URL publica geral da empresa.
- Profissional usa `/profissionais/:state/:city/:slug`.
- Motorista nao tem pagina publica generica.

## Implementacao

- `ProfilePublicRoute` trata `/u/:username` como perfil pessoal.
- Business usa `BusinessUrlService`.
- Gastronomia delega detalhe publico para `BusinessUrlService` via `GastronomyUrlService`.
- Profissionais usam `ProfessionalUrlService`.
- Rotas legadas redirecionam apenas para a URL publica ou comunitaria explicita definida no SSOT atual.

## Validacao

- `npm run validate:ssot`
- `npm run validate:url:ssot`
- Testes de rotas em `src/core/routing/components/__tests__`
- Testes de URL em `src/core/business` e `src/core/verticals/gastronomy`
