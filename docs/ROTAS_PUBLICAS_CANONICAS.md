# Rotas Publicas Canonicas

Atualizado: 2026-07-05
Status: ativo em migracao
SSOT alvo: `docs/architecture/COMMUNITY_PORTAL_PUBLIC_ENTITY_SSOT.md`

Este guia resume as URLs que o usuario deve ver no site publico. Comunidade e
site publico sao contextos diferentes.

## Contrato Publico

| Entidade | URL canonica publica | Contexto comunitario explicito |
| --- | --- | --- |
| Perfil pessoal | `/u/:username` | - |
| Comunidade | `/comunidade/:communitySlug` | mesma rota |
| Empresas | `/empresas/:state/:city/:territory/:slug` | `/comunidade/:communitySlug/empresas/:slug` |
| Gastronomia | `/gastronomia/:state/:city/:territory/:slug` quando houver detalhe proprio; caso contrario usa a URL publica da empresa | `/comunidade/:communitySlug/gastronomia/:slug` |
| Educacao | `/educacao/:state/:city/:territory/:slug` | `/comunidade/:communitySlug/educacao/:slug`, apenas quando houver acao comunitaria |
| Servicos | `/servicos/:state/:city/:territory/:slug` | `/comunidade/:communitySlug/servicos/:slug`, apenas quando houver acao comunitaria |
| Classificados | rota canonica do modulo de classificados | rota comunitaria apenas quando o classificado nasce do portal |
| Mini-site premium | `/p/:slug` | - |
| Profissional | `/profissionais/:state/:city/:slug` | contexto comunitario somente por acao explicita |

Exemplos publicos:

```text
/empresas/ba/salvador/santa-cruz/padaria-do-joao
/gastronomia/ba/salvador/santa-cruz/pizzaria-estrela
/p/padaria-do-joao
```

Exemplos comunitarios:

```text
/comunidade/santa-cruz
/comunidade/santa-cruz/feed
/comunidade/santa-cruz/empresas/padaria-do-joao
/comunidade/santa-cruz/gastronomia/pizzaria-estrela
```

## Regras

- Empresa, restaurante, escola, servico e classificado nao redirecionam
  automaticamente para comunidade.
- `/:communitySlug/:slug` nao e URL publica canonica de entidade.
- URLs comunitarias so nascem dentro do portal de comunidade ou de uma acao
  comunitaria explicita.
- Paginas publicas de entidades sao indexaveis e usam canonical publico.
- Paginas comunitarias de entidade devem apontar canonical SEO para a entidade
  publica correspondente.
- `/p/:slug` e somente mini-site premium. Nao usar como URL publica geral da
  empresa.
- Perfil publico usa `username`. Nunca passe `id`, `profileId` ou UUID para
  `buildPublicProfileUrl()`.
- Nunca montar URL manualmente em componente; usar os services/helper SSOT.

## Services SSOT

```ts
import { buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { GastronomyUrlService } from '@/core/verticals/gastronomy/services/GastronomyUrlService';
import { ProfessionalUrlService } from '@/core/professional/services/ProfessionalUrlService';
import {
  buildCommunityPortalUrl,
  buildCommunityScopedEntityUrl,
  buildPublicEntityUrl,
} from '@/core/routing/policies';
```

Uso esperado:

```ts
BusinessUrlService.getCanonicalUrl({
  id: 'business-1',
  slug: 'padaria-do-joao',
  geographic_path: '/br/ba/salvador/santa-cruz',
});
// /empresas/ba/salvador/santa-cruz/padaria-do-joao

BusinessUrlService.getCommunityScopedUrl(
  {
    id: 'business-1',
    slug: 'padaria-do-joao',
    geographic_path: '/br/ba/salvador/santa-cruz',
  },
  'santa-cruz',
);
// /comunidade/santa-cruz/empresas/padaria-do-joao
```

## Rotas Antigas

Rotas curtas antigas nao devem ser usadas em codigo novo e nao devem
redirecionar automaticamente para uma superficie canonica. Como o projeto ainda
esta em desenvolvimento, a politica atual e falhar visivelmente quando a URL
nao for canonica.

```text
/santa-cruz/empresas/padaria-do-joao    -> nao usar
/santa-cruz/gastronomia/pizzaria-x      -> nao usar
/santa-cruz/padaria-do-joao             -> nao usar
```

## Checklist Para Codigo Novo

- Use `BusinessUrlService.getCanonicalUrl()` para detalhe publico de empresa.
- Use `BusinessUrlService.getCommunityScopedUrl()` somente dentro do portal de
  comunidade.
- Use `GastronomyUrlService.getTerritoryUrl()` apenas para listagens de
  gastronomia.
- Use `/p/:slug` apenas quando a regra premium permitir mini-site.
- Use `buildPublicProfileUrl(username)` somente com `username` publico carregado
  do perfil.
- Atualize testes quando uma rota antiga for removida ou passar a retornar
  NotFound explicito.
