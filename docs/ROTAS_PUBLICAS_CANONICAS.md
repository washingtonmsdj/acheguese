# Rotas Publicas Canonicas

Atualizado: 2026-06-05
Status: ativo

Este guia resume as URLs que o usuario deve ver e os fallbacks tecnicos que o sistema ainda aceita. A decisao de produto/SEO completa esta em `docs/DECISAO_ROTEAMENTO_TERRITORIAL.md`.

## Contrato Publico

| Entidade | URL preferencial | Fallback tecnico |
| --- | --- | --- |
| Perfil pessoal | `/u/:username` | - |
| Comunidade | `/:communitySlug` | `/comunidade/:state/:city/:territorySlug` |
| Empresas da comunidade | `/:communitySlug/empresas` | `/empresas/:state/:city/:territorySlug` |
| Gastronomia da comunidade | `/:communitySlug/gastronomia` | `/gastronomia/:state/:city/:territorySlug` |
| Empresa ou restaurante | `/:communitySlug/:slug` | `/empresas/:state/:city/:district/:slug` |
| Mini-site premium | `/p/:slug` | - |
| Profissional | `/profissionais/:state/:city/:slug` | - |

Exemplos:

```text
/santa-cruz
/santa-cruz/empresas
/santa-cruz/gastronomia
/santa-cruz/padaria-do-joao
/santa-cruz/pizzaria-estrela
/p/padaria-do-joao
```

## Regras

- Alias curto de comunidade vem de `community_public_aliases` e so e publico quando for unico.
- Empresa e restaurante compartilham o mesmo detalhe publico: `/:communitySlug/:slug`.
- Listagem de gastronomia continua em `/:communitySlug/gastronomia` ou `/gastronomia/:state/:city/:territorySlug`.
- Detalhe antigo em `/gastronomia/:state/:city/:district/:slug` e legado e redireciona/canonicaliza para a URL publica da empresa.
- `/p/:slug` e somente mini-site premium. Nao usar como URL publica geral da empresa.
- Perfil publico usa `username`. Nunca passe `id`, `profileId` ou UUID para `buildPublicProfileUrl()`.
- Nunca montar URL manualmente em componente; usar os services/helper SSOT.

## Services SSOT

```ts
import { buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { GastronomyUrlService } from '@/core/verticals/gastronomy/services/GastronomyUrlService';
import { ProfessionalUrlService } from '@/core/professional/services/ProfessionalUrlService';
import { buildCommunityAliasUrl } from '@/core/routing/utils/territoryUrls';
```

Uso esperado:

```ts
BusinessUrlService.getCanonicalUrl({
  id: 'business-1',
  slug: 'padaria-do-joao',
  geographic_path: '/br/ba/salvador/santa-cruz',
  community_alias: 'santa-cruz',
});
// /santa-cruz/padaria-do-joao

GastronomyUrlService.getCanonicalUrl({
  id: 'business-2',
  slug: 'pizzaria-estrela',
  geographic_path: '/br/ba/salvador/santa-cruz',
  community_alias: 'santa-cruz',
});
// /santa-cruz/pizzaria-estrela
```

## Redirecionamentos Esperados

```text
/comunidade/santa-cruz                  -> /santa-cruz
/comunidade/santa-cruz/empresas         -> /santa-cruz/empresas
/santa-cruz/empresas/padaria-do-joao    -> /santa-cruz/padaria-do-joao
/santa-cruz/gastronomia/pizzaria-x      -> /santa-cruz/pizzaria-x
/empresas/ba/salvador/santa-cruz/x      -> /santa-cruz/x quando alias existir
/gastronomia/ba/salvador/santa-cruz/x   -> URL publica da empresa
```

## Checklist Para Codigo Novo

- Use `BusinessUrlService` para detalhe publico de empresa/restaurante.
- Use `GastronomyUrlService.getTerritoryUrl()` apenas para listagens de gastronomia.
- Use `GastronomyUrlService.getLegacyDetailUrlFromTerritory()` somente em rotas legadas ou testes de compatibilidade.
- Use `/p/:slug` apenas quando a regra premium permitir mini-site.
- Use `buildPublicProfileUrl(username)` somente com `username` publico carregado do perfil.
- Atualize testes quando uma rota antiga for mantida apenas como redirect/fallback.
