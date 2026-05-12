# 📊 Análise ClassificadosPage.tsx - Preparação para Refatoração

**Data**: 2026-04-18  
**Arquivo**: `src/modules/classifieds/pages/ClassificadosPage.tsx`  
**Tamanho**: 1129 linhas  
**Complexidade**: Muito Alta

---

## 📈 MÉTRICAS DO ARQUIVO

| Métrica | Valor |
|---------|-------|
| **Total de linhas** | 1129 |
| **Componentes inline** | 6 (HorizontalSection, SearchBar, AdsGrid, SellersGrid, ItemCard, getRelativeTime) |
| **Sections identificadas** | 8 (Hero, Categorias, Em Alta, Mais Procurados, Destaques, Patrocinados, Grid Principal, CTA Final) |
| **Constantes** | 3 (SORT_OPTIONS, CONDITION_OPTIONS, HIGHLIGHT_CATEGORIES) |
| **Complexidade** | Muito Alta |

---

## 🔍 ANÁLISE ESTRUTURAL

### **Componente Principal: ClassificadosPage**
- **Linhas**: ~1129
- **Responsabilidades**: 
  - Gerenciamento de estado (viewMode, filters)
  - Lógica de dados (classificados, vendedores, trending, featured)
  - Renderização de 8+ sections
  - Handlers de navegação e filtros
  - Lógica de paginação infinita

### **Componentes Inline Identificados**

1. **HorizontalSection** (~100 linhas)
   - Seções horizontais scrolláveis (Em Alta, Mais Procurados, Destaques)
   - Pode ser extraído para `components/sections/`

2. **SearchBar** (~150 linhas)
   - Barra de busca com filtros avançados
   - Sheet lateral com múltiplos filtros
   - Pode ser extraído para `components/filters/`

3. **AdsGrid** (~100 linhas)
   - Grid principal de anúncios
   - Infinite scroll
   - Loading states
   - Pode ser extraído para `components/grids/`

4. **SellersGrid** (~80 linhas)
   - Grid de vendedores
   - Loading states
   - Pode ser extraído para `components/grids/`

5. **ItemCard** (~200 linhas)
   - Card individual de anúncio
   - Muito complexo (badges, status, imagens, seller info)
   - Pode ser extraído para `components/cards/`

6. **getRelativeTime** (~15 linhas)
   - Função utilitária
   - Pode ser extraída para `utils/`

---

## 🎯 SECTIONS IDENTIFICADAS

### **1. Categorias de Destaque (Topo)**
- **Linhas**: ~50
- **Responsabilidade**: Grid de 6 categorias principais
- **Componentes**: Botões de categoria com ícones
- **Extrair para**: `ClassifiedsCategoriesSection.tsx`

### **2. Hero Compacto**
- **Linhas**: ~80
- **Responsabilidade**: Hero com imagem, título, CTA
- **Componentes**: Background, badge de território, título, CTA
- **Extrair para**: `ClassifiedsHeroSection.tsx`

### **3. Search Bar + Filtros**
- **Linhas**: ~150
- **Responsabilidade**: Busca e filtros avançados
- **Componentes**: Input de busca, Sheet de filtros
- **Extrair para**: `ClassifiedsFiltrosSection.tsx`

### **4. Quick Category Chips**
- **Linhas**: ~30
- **Responsabilidade**: Chips de categorias scrolláveis
- **Componentes**: Botões de categoria
- **Extrair para**: Integrar em `ClassifiedsFiltrosSection.tsx`

### **5. Em Alta (Trending)**
- **Linhas**: ~100
- **Responsabilidade**: Seção horizontal de anúncios recentes
- **Componentes**: HorizontalSection
- **Extrair para**: `ClassifiedsTrendingSection.tsx`

### **6. Mais Procurados**
- **Linhas**: ~100
- **Responsabilidade**: Seção horizontal de anúncios populares
- **Componentes**: HorizontalSection
- **Extrair para**: `ClassifiedsPopularSection.tsx`

### **7. Destaques Premium**
- **Linhas**: ~100
- **Responsabilidade**: Seção horizontal de anúncios premium
- **Componentes**: HorizontalSection
- **Extrair para**: `ClassifiedsFeaturedSection.tsx`

### **8. Mini Banner Patrocínio**
- **Linhas**: ~20
- **Responsabilidade**: Banner de anúncio
- **Componentes**: Card clicável
- **Extrair para**: Integrar em `ClassifiedsFooterSection.tsx`

### **9. Patrocinados Grid**
- **Linhas**: ~60
- **Responsabilidade**: Grid de anúncios patrocinados
- **Componentes**: Grid 4 colunas
- **Extrair para**: `ClassifiedsSponsoredSection.tsx`

### **10. View Toggle**
- **Linhas**: ~10
- **Responsabilidade**: Toggle entre Anúncios/Vendedores
- **Componentes**: ClassifiedsViewToggle (já existe)
- **Extrair para**: Integrar em `ClassifiedsListagemSection.tsx`

### **11. Main Content (Grid Principal)**
- **Linhas**: ~200
- **Responsabilidade**: Grid principal com infinite scroll
- **Componentes**: AdsGrid ou SellersGrid
- **Extrair para**: `ClassifiedsListagemSection.tsx`

### **12. CTA Banner Final**
- **Linhas**: ~30
- **Responsabilidade**: CTA para criar anúncio
- **Componentes**: Card com botão
- **Extrair para**: `ClassifiedsFooterSection.tsx`

---

## 📦 ESTRUTURA PROPOSTA

### **Arquivos a Criar**

```
src/modules/classifieds/
├── pages/
│   ├── ClassificadosPage.tsx         (150 linhas) ← REFATORADO
│   └── ClassificadosLayout.tsx       (40 linhas) ← NOVO
│
├── sections/
│   ├── types.ts                      (250 linhas) ← NOVO (SSOT)
│   ├── ClassifiedsHeroSection.tsx    (100 linhas) ← NOVO
│   ├── ClassifiedsCategoriesSection.tsx (80 linhas) ← NOVO
│   ├── ClassifiedsFiltrosSection.tsx (180 linhas) ← NOVO
│   ├── ClassifiedsTrendingSection.tsx (120 linhas) ← NOVO
│   ├── ClassifiedsPopularSection.tsx (120 linhas) ← NOVO
│   ├── ClassifiedsFeaturedSection.tsx (120 linhas) ← NOVO
│   ├── ClassifiedsSponsoredSection.tsx (80 linhas) ← NOVO
│   ├── ClassifiedsListagemSection.tsx (250 linhas) ← NOVO
│   ├── ClassifiedsFooterSection.tsx  (80 linhas) ← NOVO
│   └── index.ts                      (50 linhas) ← NOVO
│
├── components/
│   ├── filters/
│   │   ├── SearchBar.tsx             (180 linhas) ← NOVO
│   │   ├── FilterSheet.tsx           (150 linhas) ← NOVO
│   │   ├── CategoryChips.tsx         (50 linhas) ← NOVO
│   │   └── index.ts                  (20 linhas) ← NOVO
│   │
│   ├── cards/
│   │   ├── ClassifiedCard.tsx        (220 linhas) ← NOVO
│   │   ├── ClassifiedCardSkeleton.tsx (40 linhas) ← NOVO
│   │   ├── SponsoredCard.tsx         (80 linhas) ← NOVO
│   │   └── index.ts                  (20 linhas) ← NOVO
│   │
│   ├── grids/
│   │   ├── AdsGrid.tsx               (120 linhas) ← NOVO
│   │   ├── SellersGrid.tsx           (100 linhas) ← NOVO
│   │   └── index.ts                  (15 linhas) ← NOVO
│   │
│   └── sections/
│       ├── HorizontalSection.tsx     (120 linhas) ← NOVO
│       └── index.ts                  (10 linhas) ← NOVO
│
└── utils/
    ├── timeUtils.ts                  (30 linhas) ← NOVO
    └── index.ts                      (10 linhas) ← NOVO

Total estimado: ~2.600 linhas bem distribuídas em 30 arquivos
```

---

## 🎨 PADRÃO A SEGUIR

### **Baseado em PerfilHub e VagasPublicPage**

1. **Types centralizados (SSOT)** em `sections/types.ts`
2. **Sections modulares** com responsabilidades claras
3. **Componentes reutilizáveis** extraídos
4. **Layout separado** da lógica
5. **Página orquestradora** limpa e enxuta
6. **Props tipadas e readonly**
7. **Barrel exports** em todos os diretórios

---

## 🔄 COMPARAÇÃO COM REFATORAÇÕES ANTERIORES

| Aspecto | PerfilHub | VagasPublic | Classificados |
|---------|-----------|-------------|---------------|
| **Linhas originais** | 1579 | 621 | 1129 |
| **Complexidade** | Muito Alta | Alta | Muito Alta |
| **Sections** | 9 | 4 | 10 |
| **Componentes inline** | ~15 | ~5 | ~6 |
| **Arquivos criados** | 21 | 11 | ~30 (estimado) |
| **Linhas finais** | ~2.520 | ~1.110 | ~2.600 (estimado) |

---

## ⚠️ DESAFIOS ESPECÍFICOS

### **1. Complexidade Alta**
- Mais sections que VagasPublicPage
- Múltiplos modos de visualização (Anúncios/Vendedores)
- Lógica de trending/popular/featured

### **2. Componentes Complexos**
- ItemCard muito detalhado (~200 linhas)
- SearchBar com Sheet lateral (~150 linhas)
- HorizontalSection reutilizável

### **3. Estado Compartilhado**
- viewMode usado em múltiplas sections
- filters compartilhados entre sections
- Dados derivados (trending, popular, featured)

### **4. Infinite Scroll**
- Lógica de paginação no AdsGrid
- Intersection Observer
- Loading states

---

## ✅ BENEFÍCIOS ESPERADOS

### **1. Organização**
- 1129 linhas → ~30 arquivos modulares
- Cada section em seu próprio arquivo
- Componentes reutilizáveis isolados
- Utils separados

### **2. Manutenibilidade**
- Fácil encontrar e modificar código
- Menos merge conflicts
- Mudanças isoladas
- Onboarding simplificado

### **3. Testabilidade**
- Sections testáveis isoladamente
- Componentes testáveis unitariamente
- Utils testáveis separadamente
- Props tipadas facilitam mocks

### **4. Reutilização**
- HorizontalSection pode ser usado em outras páginas
- ClassifiedCard pode ser usado em outras listagens
- SearchBar pode ser adaptado para outros módulos
- FilterSheet pode ser reutilizado

### **5. Performance**
- Code splitting por section
- Lazy loading possível
- Bundle otimizável
- Infinite scroll otimizado

---

## 📋 PLANO DE REFATORAÇÃO

### **Etapa 1: Análise e Preparação** ✅
- [x] Ler arquivo completo
- [x] Identificar sections
- [x] Mapear componentes inline
- [x] Identificar constantes e utils
- [x] Criar documento de análise

### **Etapa 2: Types (SSOT)**
- [ ] Criar `src/modules/classifieds/sections/types.ts`
- [ ] Definir interfaces para cada section
- [ ] Definir types compartilhados (Classificado, Vendedor, Filters, etc)
- [ ] Exportar todos os types

### **Etapa 3: Utils**
- [ ] Criar `src/modules/classifieds/utils/timeUtils.ts`
- [ ] Extrair `getRelativeTime`
- [ ] Criar barrel export

### **Etapa 4: Componentes Base**
- [ ] Extrair `ClassifiedCard` para `components/cards/`
- [ ] Extrair `SponsoredCard` para `components/cards/`
- [ ] Criar `ClassifiedCardSkeleton`
- [ ] Criar barrel exports

### **Etapa 5: Componentes de Filtros**
- [ ] Extrair `SearchBar` para `components/filters/`
- [ ] Extrair `FilterSheet` para `components/filters/`
- [ ] Extrair `CategoryChips` para `components/filters/`
- [ ] Criar barrel exports

### **Etapa 6: Componentes de Grids**
- [ ] Extrair `AdsGrid` para `components/grids/`
- [ ] Extrair `SellersGrid` para `components/grids/`
- [ ] Criar barrel exports

### **Etapa 7: Componentes de Sections**
- [ ] Extrair `HorizontalSection` para `components/sections/`
- [ ] Criar barrel export

### **Etapa 8: Sections Principais**
- [ ] Criar `ClassifiedsHeroSection.tsx`
- [ ] Criar `ClassifiedsCategoriesSection.tsx`
- [ ] Criar `ClassifiedsFiltrosSection.tsx`
- [ ] Criar `ClassifiedsTrendingSection.tsx`
- [ ] Criar `ClassifiedsPopularSection.tsx`
- [ ] Criar `ClassifiedsFeaturedSection.tsx`
- [ ] Criar `ClassifiedsSponsoredSection.tsx`
- [ ] Criar `ClassifiedsListagemSection.tsx`
- [ ] Criar `ClassifiedsFooterSection.tsx`
- [ ] Criar barrel export

### **Etapa 9: Layout e Página**
- [ ] Criar `ClassificadosLayout.tsx`
- [ ] Refatorar `ClassificadosPage.tsx`
- [ ] Validar TypeScript (0 erros)

### **Etapa 10: Documentação**
- [ ] Criar `REFATORACAO_CLASSIFICADOS_PROGRESSO.md`
- [ ] Criar `REFATORACAO_CLASSIFICADOS_FINAL.md`
- [ ] Atualizar `CANDIDATOS_REFATORACAO.md`

### **Etapa 11: Aplicação**
- [ ] Substituir arquivo original
- [ ] Remover arquivo `.refactored.tsx`
- [ ] Validar TypeScript final
- [ ] Criar `REFATORACAO_CLASSIFICADOS_APLICADA.md`

---

## 🎯 ESTIMATIVA

| Etapa | Tempo Estimado | Complexidade |
|-------|----------------|--------------|
| Types (SSOT) | 30min | Média |
| Utils | 10min | Baixa |
| Componentes Base | 1h | Alta |
| Componentes Filtros | 45min | Média |
| Componentes Grids | 30min | Média |
| Componentes Sections | 20min | Baixa |
| Sections Principais | 2h | Alta |
| Layout e Página | 30min | Média |
| Documentação | 30min | Baixa |
| Aplicação | 15min | Baixa |
| **TOTAL** | **~6h** | **Muito Alta** |

---

## 💡 OBSERVAÇÕES

### **Diferenças vs VagasPublicPage**
- **Mais complexo**: 1129 linhas vs 621 linhas
- **Mais sections**: 10 vs 4
- **Mais componentes**: ~30 arquivos vs 11 arquivos
- **Mais features**: Trending, Popular, Featured, Sponsored, View Toggle

### **Similaridades com VagasPublicPage**
- Hero compacto
- Filtros avançados
- Grid principal com infinite scroll
- CTA final
- Padrão SSOT

### **Oportunidades de Reutilização**
- HorizontalSection pode ser usado em Vagas, Serviços, etc
- SearchBar pattern pode ser adaptado
- ClassifiedCard pattern pode inspirar outros cards
- FilterSheet pode ser reutilizado

---

## 🚀 PRÓXIMOS PASSOS

1. **Confirmar refatoração** - Usuário aprovar
2. **Começar por Types** - Criar SSOT
3. **Extrair componentes** - Base, Filtros, Grids
4. **Criar sections** - 10 sections modulares
5. **Refatorar página** - Orquestração limpa
6. **Validar** - 0 erros TypeScript
7. **Documentar** - Documentação completa
8. **Aplicar** - Substituir arquivo original

---

**Análise completa! Pronto para iniciar refatoração seguindo padrão SSOT estabelecido.** 🎯✨

