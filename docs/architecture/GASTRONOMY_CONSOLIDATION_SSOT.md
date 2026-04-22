# Gastronomy Consolidation SSOT

Data de referencia: 2026-04-22

## 1. Decisao oficial
- `src/core/gastronomy` foi descontinuado.
- `src/modules/gastronomy` (topo legado) foi descontinuado.
- SSOT unico atual da vertical: `src/modules/business/gastronomy`.
- Nao existe `core` interno para "acomodar legado". Ownership real ficou distribuido por:
  - `billing`
  - `cart`
  - `components`
  - `constants`
  - `hooks`
  - `pages`
  - `services`
  - `types`
  - `utils`

## 2. Matriz de migracao (arquivo antigo -> destino final -> motivo)

### 2.1 Regra canonica principal
| Origem antiga | Destino final | Motivo |
|---|---|---|
| `src/modules/gastronomy/**` (169 arquivos) | `src/modules/business/gastronomy/**` (mesmo path relativo) | consolidacao da vertical dentro do dominio horizontal `business` |

### 2.2 Excecoes de mapeamento (core -> modulo)
| Arquivo antigo | Destino final | Motivo |
|---|---|---|
| `src/core/gastronomy/GastronomyProfileService.ts` | `src/modules/business/gastronomy/services/GastronomyProfileService.ts` | service vertical nao pertence a `core`; ownership de produto |
| `src/core/gastronomy/MenuService.ts` | `src/modules/business/gastronomy/services/MenuService.ts` | service de cardapio e de produto |
| `src/core/gastronomy/services/GastronomyMapService.ts` | `src/modules/business/gastronomy/services/GastronomyMapService.ts` | leitura de mapa especifica da vertical |
| `src/core/gastronomy/services/gastronomy-runtime.queries.ts` | `src/modules/business/gastronomy/services/gastronomy-runtime.queries.ts` | query runtime da vertical |
| `src/core/gastronomy/types.ts` | `src/modules/business/gastronomy/types/index.ts` | consolidacao de contratos em `types/index.ts` |
| `src/core/gastronomy/types/gastronomy.ts` | `src/modules/business/gastronomy/types/gastronomy.ts` | tipo de dominio vertical |
| `src/core/gastronomy/billing/*` | `src/modules/business/gastronomy/billing/*` | billing vertical fica com vertical |
| `src/core/gastronomy/components/*` | `src/modules/business/gastronomy/components/*` | UI vertical fica no modulo de produto |
| `src/core/gastronomy/hooks/*` | `src/modules/business/gastronomy/hooks/*` | hooks de produto ficam na vertical |
| `src/core/gastronomy/constants/cuisine.ts` | `src/modules/business/gastronomy/constants/cuisine.ts` | constantes de dominio vertical |
| `src/core/gastronomy/pages/GastronomySetupPage.tsx` | `src/modules/business/gastronomy/pages/GastronomySetupPage.tsx` | pagina de setup vertical |
| `src/core/gastronomy/index.ts` | `src/modules/business/gastronomy/index.ts` | ponto unico de export da vertical |

## 3. Classificacao de consolidacao
- `SSOT atual`: tudo em `src/modules/business/gastronomy/**`.
- `Duplicado removido`: espelho antigo em `src/core/gastronomy/**`.
- `Legado removido`: topo antigo `src/modules/gastronomy/**`.
- `Complementar absorvido`: contratos de `core/gastronomy` fundidos no modulo vertical sem criar nova camada paralela.

## 4. O que foi fundido, substituido e removido
- Fundido:
  - contratos e services que estavam em `core/gastronomy` foram absorvidos no SSOT da vertical.
- Substituido:
  - imports de consumo para caminhos canonicos atuais (`modules/business/gastronomy` e fachadas `shared/services/*` quando necessario).
- Removido:
  - `src/core/gastronomy` (19 arquivos removidos).
  - `src/modules/gastronomy` (169 arquivos removidos).

## 5. Validacao objetiva
- `src/core/gastronomy` inexistente.
- `src/modules/gastronomy` inexistente.
- `npm run validate:architecture:governance -- --json` sem violacoes.
- `npm run typecheck` OK.
- `npm run build` OK.

## 6. Blindagem de regressao
- `scripts/validate-project-taxonomy.ts` bloqueia reintroducao de:
  - `src/modules/gastronomy`
  - `src/core/gastronomy`
- validacao passa a inspecionar tambem `scripts/**` para impedir referencia legada em automacoes.
