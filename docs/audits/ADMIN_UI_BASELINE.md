# Baseline Visual do Admin

Data-base: 2026-04-09

## SSOT visual atual
A base canonica do admin agora e composta por:
- `AdminPageHeader`: shell de titulo, descricao, icone e acoes.
- `AdminStatsGrid` + `AdminStatsCard`: leitura resumida no topo de cada surface.
- `AdminSectionCard`: bloco padrao de secao administrativa.
- `AdminFiltersBar`: contrato unico de busca e filtros.
- `AdminDataState`: estado de loading e vazio para superfices administrativas.
- `AdminErrorState`: estado canonico de falha para superfices administrativas.
- `AdminTable`: wrapper unico de tabela administrativa com responsividade e footer padrao.
- `AdminPagination`: navegacao padrao de listagens.

## Superficies prioritarias ja migradas
- `/admin/notifications`
- `/admin/identidade`
- `/admin/mapa`
- `/admin/operacoes`

## Regras de uso
1. Toda page administrativa nova deve abrir com `AdminPageHeader`.
2. Toda leitura resumida deve usar `AdminStatsGrid` e `AdminStatsCard` antes de criar card local.
3. Toda secao principal deve usar `AdminSectionCard`.
4. Listagens e filas operacionais devem usar `AdminFiltersBar`, `AdminDataState` e `AdminPagination`.
5. Toda falha de carregamento administrativa deve usar `AdminErrorState` antes de cair em mensagens inline.
6. Toda tabela administrativa nova deve usar `AdminTable` antes de criar wrapper local.
7. `Dialog`, `Drawer` e `Sheet` ainda nao possuem matriz final de uso; enquanto isso, detalhes de leitura usam `Dialog` e formularios complexos continuam fora deste baseline.
8. Nenhuma page administrativa deve renderizar loading, empty ou erro inline quando ja existir cobertura por `AdminDataState` e `AdminErrorState`.

## O que ja ficou convergente
- shell de page
- bloco de estatisticas
- filtros de leitura
- estados de loading, vazio e erro
- tabela administrativa prioritaria
- card de secao administrativa
- paginacao de filas principais

## O que ainda falta
- matriz formal de uso entre `Dialog`, `Drawer` e `Sheet`
- bulk actions, sorting e presets de coluna para tabelas administrativas mais densas
- refinamento mobile das tabelas e filtros em `admin`, `map` publico e `profile`
- expansao do baseline para o restante das pages admin ainda heterogeneas

## Arquivos canonicos
- `src/modules/admin/components/AdminPageHeader.tsx`
- `src/modules/admin/components/AdminStatsGrid.tsx`
- `src/modules/admin/components/AdminStatsCard.tsx`
- `src/modules/admin/components/AdminSectionCard.tsx`
- `src/modules/admin/components/AdminFiltersBar.tsx`
- `src/modules/admin/components/AdminDataState.tsx`
- `src/modules/admin/components/AdminErrorState.tsx`
- `src/modules/admin/components/AdminTable.tsx`
- `src/modules/admin/components/AdminPagination.tsx`
