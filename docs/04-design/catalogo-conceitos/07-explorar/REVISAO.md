# Revisão — Explorar e encontrar

Status: implementada e revisada em 19/09/2026.

Referência principal: `pranchas/009-explorar-mapa-lista.png`.
Branch da revisão: `codex/reformulacao-entrada-comunidade`.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Busca e contexto territorial | Implementado | `src/app/pages/BuscaPage.tsx`, `TerritoryTopbar` | Manter query, território, busca global e fallback de cidade como autoridades reais | Rota `q=eletricista` conferida no navegador interno |
| Categorias e filtros | Implementado | `FILTERS`, `PRIMARY_FILTER_IDS`, `isLaunchSurfaceEnabled` | Exibir Todos, Negócios, Serviços, Classificados e Educação conforme flags; filtros adicionais continuam no menu | Serviços ativo, chip, limpar, ordenação e menu mobile conferidos |
| Lista de resultados | Implementado com mock DEV controlado | `src/app/mocks/buscaConceptMock.ts`, `ResultsView` | Usar resultados de demonstração somente quando `concept-mock=1`; produção continua consumindo `useGlobalSearch` | Três resultados, estados ativos, cards e links profissionais conferidos |
| Mapa | Implementado | `TerritoryMapPreview`, `BUSCA_CONCEPT_MAP_VIEWPORT`, `BUSCA_CONCEPT_MAP_POLYGONS` | Preservar o componente de mapa real e os dados do mock isolado; não desenhar um mapa falso na tela | Mapa carregou no desktop amplo com marcadores e card destacado |
| Navegação mobile do concept | Ajustado apenas no preview DEV | `TerritoryAdaptiveNavigation.tsx` | Reproduzir `Início`, `Comunidade`, `Publicar`, `Conversas`, `Conta`; publicação aponta para o fluxo comunitário real com `action=publicar` | Cinco itens e `Explorar` fora da barra foram conferidos |
| Rail desktop do concept | Ajustado apenas no preview DEV | `TerritoryAdaptiveNavigation.tsx` | Reproduzir Início, Comunidade, Explorar, Negócios, Serviços, Mobilidade, Classificados e Educação | Oito módulos, `Explorar` ativo e `Trocar território` conferidos |
| Vazio, erro e permissão | Mantidos | `BuscaPage.tsx`, `TerritoryState`, `TerritorySurface` | Não mascarar indisponibilidade; produção mantém carregamento, erro, vazio e regras de autenticação existentes | Caminhos permanecem preservados fora do mock |

## Decisões de implementação

- A diferença de navegação da prancha é específica da superfície visual aprovada. O rail e a barra móvel foram condicionados ao `concept-mock=1` em ambiente DEV para não alterar a navegação global de produção.
- A ação `Publicar` do preview não grava nem concede participação: ela navega para a comunidade com `action=publicar`, onde o gate de acesso continua sendo aplicado.
- Os três profissionais e as coordenadas do mapa continuam isolados no mock DEV já existente. Sem `concept-mock=1`, a tela usa busca, resultados, resolução territorial e mapa reais.

## Validação

- Navegador interno: conferidos filtro Serviços, chip e limpar, ordenação, alternância Lista/Mapa, cards, CTA `Ver no mapa`, barra mobile e rail desktop.
- Viewports: mobile equivalente `389 × 867` CSS px; desktop amplo `1440 × 867` CSS px.
- `npm run typecheck:app`.
- ESLint no componente de navegação alterado.
- `git diff --check`.

Limitação mantida: o conteúdo de três resultados e o polígono visual são dados demonstrativos exclusivamente do preview DEV; não são apresentados como inventário persistido em produção.
