# TERRITORY-DOMAIN.md — Domínio oficial

**Territory** é o domínio principal da navegação a partir da Sprint DOMAIN.1. Cidade e Bairro **deixam de ser conceitos arquiteturais** e passam a ser apenas **tipos de Territory**.

---

## 1. Territory (entidade raiz)

`Territory` representa **qualquer recorte geográfico oficial** com identidade única, hierarquia e status. É a fundação sobre a qual todo o produto opera: navegação, feed, comunidade, buscas, comércio e comunicação são sempre resolvidos a partir de um Territory ativo.

**Propriedades canônicas:**

| Campo | Descrição |
|-------|-----------|
| `id` | Identificador único (UUID). |
| `type` | Valor de `TerritoryType`. |
| `parent_id` | Territory pai na hierarquia. |
| `slug` | Segmento estável de URL. |
| `geographic_path` | Caminho canônico: `/br/ba/salvador/pituba`. |
| `status` | `active` \| `inactive`. |
| `metadata` | Dados auxiliares (código IBGE, timezone, população). |

Implementação atual: `src/core/location/types/index.ts` → interface `Location` (**alias temporário**; o nome canônico é `Territory`).

---

## 2. TerritoryType (enum canônico)

`TerritoryType` enumera as **naturezas geográficas oficiais** que um Territory pode assumir. Toda navegação, filtro e agrupamento no produto se baseia neste enum — nunca em nomes de módulos.

| Valor | Papel no domínio |
|-------|------------------|
| `country` | Raiz territorial (ex.: Brasil). |
| `state` | Unidade federativa (ex.: Bahia). |
| `city` | Município (ex.: Salvador). |
| `district` | Divisão administrativa municipal (IBGE). Usada como *fallback* quando o município não possui base oficial de bairros. |
| `neighborhood` | Bairro oficial da cidade (fonte municipal validada). |

Implementação atual: `LocationType` em `src/core/location/types/index.ts` (**alias temporário** de `TerritoryType`).

---

## 3. Diferenças formais

### 3.1. Country, State, City, District, Neighborhood

São **valores de `TerritoryType`**, não domínios separados. Todos compartilham a mesma entidade `Territory` e a mesma hierarquia (`parent_id` / `geographic_path`). A diferença é apenas o nível na árvore:

```
Country (br)
 └─ State (ba)
     └─ City (salvador)
         ├─ District (subúrbio-ferroviário)     ← fallback IBGE
         └─ Neighborhood (pituba)               ← fonte municipal
```

Regras:

- **Country / State / City / District / Neighborhood não são módulos.** Se existir uma pasta com esse nome (ex.: `core/city`), ela é **legado** conforme `DOMAIN-MAPPING.md`.
- **City e Neighborhood** são os dois tipos mais expostos no produto: a UI usa "cidade" e "bairro" como *labels*, mas a estrutura é sempre `Territory`.
- **District** existe apenas como fallback quando a cidade não tem `Neighborhood` mapeado (ver `tools/seeds/municipal-neighborhood-sources.ts`).

### 3.2. Community

**Community é um subdomínio social sobre um Territory**, não um tipo de Territory.

| Aspecto | Territory | Community |
|---------|-----------|-----------|
| Natureza | Recorte geográfico oficial | Camada social/editorial que existe **em cima** de um Territory |
| Cardinalidade | 1 por recorte geográfico | 1 Community por Territory ativado (city ou neighborhood) |
| Fonte | IBGE + fontes municipais | Produto (rollout, moderação, engajamento) |
| Conteúdo | Metadados geográficos | Feed, posts, moderadores, eventos, alertas |
| Existe sem o outro? | Sim | Não — Community sempre referencia um Territory |

Regra: **toda Community tem exatamente um Territory**. O inverso não é verdadeiro — nem todo Territory tem Community ativa (ex.: `coming_soon`).

### 3.3. Group (TerritoryGroup)

**Group é um agrupamento operacional de Territories**, útil quando o produto precisa tratar múltiplos bairros como uma única unidade de filtro/feed sem alterar a hierarquia oficial.

| Aspecto | Territory | Group |
|---------|-----------|-------|
| Estrutura | Árvore rígida (`parent_id`) | Coleção flexível de `Territory` (`members`) |
| Hierarquia | Oficial | Não hierárquico |
| Origem | Dados geográficos | Curadoria do produto |
| Uso típico | Endereço, navegação, feed local | Campanhas, cobertura de serviço móvel, regiões operacionais |
| Âncora | — | `anchor_city_id` (facilitador, não hierarquia) |

Implementação atual: `TerritorialGroup` em `src/core/location/types/index.ts` (**alias temporário** de `TerritoryGroup`).

---

## 4. Resumo hierárquico

```
Territory (entidade raiz)
 ├── TerritoryType: country | state | city | district | neighborhood
 ├── TerritoryGroup: coleção não-hierárquica de Territories
 └── Community: camada social sobre um Territory (1:1 quando ativa)
```

- **Um Territory** pode ter **zero ou uma Community** ativa.
- **Um Territory** pode participar de **zero ou mais Groups**.
- **Uma Community** referencia **exatamente um Territory**.
- **Um Group** contém **um ou mais Territories** e opcionalmente uma `anchor_city`.

---

## 5. Regras invioláveis

1. **Nunca** tratar `City`, `Neighborhood`, `District` como domínios independentes. São apenas `TerritoryType`.
2. **Nunca** criar tipos, hooks ou serviços com prefixo `City*`, `Neighborhood*`, `Landing*`, `Launch*`, `Home*` (sem `Territory*`).
3. **Toda** navegação deve resolver primeiro um `Territory` (via `useActiveTerritory` / `useResolveTerritoryFromUrl`) antes de decidir UI.
4. **Toda** consulta filtrada por região deve usar `TerritoryFilter` (`scope: 'location' | 'group' | 'none'`).
5. **Community** só existe atrelada a um Territory ativo — não há Community "solta".
6. **Group** nunca aparece na URL pública primária; é filtro operacional.

---

## 6. Referências

- `src/core/location/types/index.ts` — implementação atual (alias de Territory).
- `src/core/location/docs/LOCATION_ARCHITECTURE.md` — regras de endereço e privacidade por tipo.
- `src/core/territorial/services/types.ts` — `TerritoryNode` (árvore administrativa).
- `docs/domain/DOMAIN-MAPPING.md` — mapeamento nome atual → canônico.
- `NAVIGATION-MAPPING.md` — mapeamento de páginas Territory.
