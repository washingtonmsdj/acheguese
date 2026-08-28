# Gastronomy Consolidation SSOT

Status: CANONICO — ownership atualizado durante G2  
Origem da consolidacao: 2026-04-22  
Ownership revisado: 2026-08-28

## 1. Decisao oficial atual

- `src/core/gastronomy` continua descontinuado e nao deve ser recriado.
- `src/modules/gastronomy` (topo legado) continua descontinuado e nao deve ser recriado.
- A superficie de produto da vertical continua em `src/modules/business/gastronomy/**`.
- Persistencia, queries e contratos de negocio reutilizaveis da vertical sao canonicos em `src/core/business/**`.
- O modulo pode consumir e reexportar contratos/servicos canonicos de Core, mas nao deve manter uma segunda implementacao de persistencia.
- Bridges `src/modules/business/gastronomy/** -> src/core/business/**` sao temporarios e devem desaparecer quando seus callers migrarem.

A arquitetura atual e, portanto, dividida por responsabilidade e nao por duplicacao:

| Responsabilidade | Owner canonico |
| --- | --- |
| Pages, components, hooks e UX da vertical | `src/modules/business/gastronomy/**` |
| Taxonomia e contratos estritamente locais de produto | `src/modules/business/gastronomy/**` |
| Persistencia Supabase e services compartilhados de negocio | `src/core/business/**` |
| Queries/read models compartilhados | `src/core/business/services/**` |
| Contratos de dominio reutilizados por outras superficies | `src/core/business/types/**` e `src/core/business/niches/**` |

## 2. Evolucao de ownership

### 2.1 Consolidacao historica de namespaces

| Origem antiga | Destino de produto | Estado atual |
| --- | --- | --- |
| `src/modules/gastronomy/**` | `src/modules/business/gastronomy/**` | origem removida; modulo de produto preservado |
| `src/core/gastronomy/**` | inicialmente absorvido pela vertical | namespace antigo removido; ownership compartilhavel evoluiu para `src/core/business/**` |

A remocao de `src/core/gastronomy` nao significa que persistencia de Gastronomy deve viver em UI/module. O namespace legado era incorreto; o owner transversal atual e `src/core/business`.

### 2.2 Owners canonicos de persistencia e dominio

| Superficie | Owner canonico atual | Compatibilidade durante G2 |
| --- | --- | --- |
| Perfil gastronomico | `src/core/business/services/GastronomyProfileService.ts` | bridge modular temporario enquanto houver caller legado |
| Menu mutations/service | `src/core/business/services/MenuService.ts` | bridge modular temporario enquanto houver caller legado |
| Menu queries | `src/core/business/services/menu.queries.ts` | bridge modular ja aposentado |
| Gastronomy queries | `src/core/business/services/gastronomy.queries.ts` | bridge modular ja aposentado |
| Runtime queries | `src/core/business/services/gastronomy-runtime.queries.ts` | bridge modular temporario enquanto houver caller legado |
| Delivery area | `src/core/business/services/GastronomyDeliveryAreaService.ts` | bridge modular ja aposentado |
| Reviews/favorites/activity | `src/core/business/services/gastronomy.*.queries.ts` | bridges modulares ja aposentados |
| Niche contracts compartilhados | `src/core/business/niches/**` | bridges temporarios apenas onde ainda registrados |
| Pizza admin persistence | `src/core/business/niches/pizzaria/PizzaAdminService.ts` | bridge modular temporario enquanto houver caller legado |

## 3. Superficies que permanecem legitimamente no modulo

Nem todo arquivo que reutiliza Core e um bridge. Permanecem owners de produto no modulo, entre outros:

- `src/modules/business/gastronomy/types/gastronomy/index.ts` — taxonomia `CuisineType` e superficie de produto;
- `src/modules/business/gastronomy/types/menu.ts` — contratos de cart/checkout do modulo;
- `src/modules/business/gastronomy/niches/pizzaria/types.ts` — composicao de build/snapshot/validacao da experiencia de pizza;
- pages, components, hooks, billing UX e helpers de apresentacao da vertical.

Essas superficies podem reutilizar contratos canonicos de `src/core/business/**` sem transferir seu ownership de produto para Core.

## 4. Regras de fronteira

1. O modulo nao deve importar `@supabase/supabase-js` diretamente em runtime.
2. O baseline de acesso runtime direto a `@/integrations/**` dentro de Gastronomy deve permanecer zero.
3. Persistencia nova deve nascer no owner de Core apropriado, nao em page/component/hook.
4. Bridge modular deve ser apenas reexport/import unidirecional para Core, sem logica independente.
5. Quando o ultimo caller de um bridge migrar, o bridge deve ser removido e adicionado ao ratchet de caminhos aposentados.
6. Core nunca deve importar de volta um bridge modular.

## 5. Blindagem executavel

- `tools/architecture/validate-gastronomy-module-boundaries.ts` valida runtime integrations, bridges temporarios, superficies contratuais locais e bridges aposentados.
- `tests/architecture/gastronomy-module-boundary-ratchet.test.ts` impede regressao da fronteira.
- `tests/architecture/gastronomy-write-ssot.test.ts` confirma que persistencia de perfil permanece no service canonico de Core.
- `tools/architecture/validate-project-taxonomy.ts` bloqueia reintroducao dos namespaces removidos `src/modules/gastronomy` e `src/core/gastronomy`.

## 6. Criterio de consolidacao G2

Gastronomy nao esta consolidado apenas porque os owners canonicos existem. Para fechar sua parte do G2:

- callers devem consumir os owners canonicos diretamente ou por uma superficie modular legitima;
- bridges temporarios restantes devem chegar a zero;
- o validator e o ratchet devem bloquear recriacao dos paths aposentados;
- nenhum owner em `src/core/business/**` pode depender de bridge em `src/modules/business/gastronomy/**`;
- testes de fronteira e regressao devem passar no mesmo SHA quando houver ambiente de execucao disponivel.
