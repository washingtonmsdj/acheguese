# Implementacao do ProfessionalUrlService

Atualizado: 2026-07-05
Status: consolidado

`ProfessionalUrlService` e o SSOT para URLs publicas de profissionais.

## Contrato

| Entidade | URL publica |
| --- | --- |
| Profissional | `/profissionais/:state/:city/:slug` |

Profissional nao usa `/u/:username`, nao usa `/p/:slug` e nao compartilha o caminho publico de empresa/restaurante.

## Comparacao Com Empresa

| Caracteristica | Empresa/restaurante | Profissional |
| --- | --- | --- |
| URL preferencial | `/empresas/:state/:city/:territory/:slug` | `/profissionais/:state/:city/:slug` |
| Contexto comunitario | `/comunidade/:communitySlug/empresas/:slug` | apenas quando houver acao comunitaria explicita |
| Mini-site premium | `/p/:slug` quando habilitado | Nao possui |
| Bairro obrigatorio | Sim | Nao |
| SSOT | `BusinessUrlService` | `ProfessionalUrlService` |

## Uso

```ts
const ctx = await ProfessionalUrlService.resolveById(profileId);
const url = ctx ? ProfessionalUrlService.getCanonicalUrl(ctx) : null;
```

Para o contrato completo de rotas publicas, veja `docs/ROTAS_PUBLICAS_CANONICAS.md`.
