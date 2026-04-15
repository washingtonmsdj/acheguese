## Plano: Classificados Item-First

### Fase 1 — Hook & Tipos (fundação)
1. **Expandir `useClassificadosPage`** — Adicionar estado para:
   - `viewMode: 'anuncios' | 'vendedores'` (padrão: anúncios)
   - Novos filtros: `condition` (novo/usado/seminovo), `delivery` (entrega/retirada), `hasPhoto`, `sellerType` (profissional/particular)
   - Handler para trocar modo

2. **Criar `useVendedores` hook** — Query para listar vendedores com:
   - Nome, bairro, qtd de anúncios ativos, avaliação
   - Itens em destaque (top 3 do vendedor)

### Fase 2 — Componentes novos
3. **`ClassifiedsViewToggle`** — Toggle Anúncios / Vendedores (tabs pill)

4. **Redesign `AdCard` (item-first)** — Card com:
   - Foto forte, título, preço, bairro, condição, data
   - Vendedor (nome curto), selo profissional/particular
   - Botão "Ver anúncio"

5. **`VendedorCard`** — Card de vendedor:
   - Nome, bairro, qtd anúncios, avaliação
   - Preview de itens em destaque
   - Botão "Ver anúncios"

6. **Redesign `ClassificadoFilters`** — Adicionar:
   - Condição (novo/usado/seminovo)
   - Entrega/retirada
   - Com foto
   - Vendedor profissional/particular
   - Subcategoria

### Fase 3 — Página principal
7. **Reescrever `ClassificadosPage`** — Nova estrutura:
   - Header com contexto territorial
   - Busca principal expandida (item, categoria, marca, bairro, anunciante)
   - Filtros rápidos (chips)
   - Atalhos por categoria
   - Destaques
   - Toggle Anúncios / Vendedores
   - Grid principal (modo ativo)
   - Carregar mais

### Fase 4 — Página de detalhe
8. **Enriquecer `ClassificadoDetailPage`** — Adicionar:
   - Condição do item
   - Seção "Outros anúncios deste vendedor"
   - Melhorar layout de anúncios relacionados

### Fase 5 — Service layer
9. **Expandir `ClassifiedService`** — Novos métodos:
   - `getClassifiedsBySeller(sellerId)` — anúncios de um vendedor
   - `getSellersWithAds(filter)` — lista vendedores com contagem
   - Suporte a filtro por condição, hasPhoto, delivery na query principal

### Não será alterado
- Rotas públicas existentes
- Arquitetura modular SSOT
- Tipos base de `ClassifiedData`
- Services de URL, Report, Location, Rollout
