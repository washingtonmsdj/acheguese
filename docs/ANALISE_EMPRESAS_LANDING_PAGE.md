# 📋 Análise: EmpresasLandingPage.tsx

**Data**: 2026-04-18  
**Arquivo**: `src/app/pages/EmpresasLandingPage.tsx`  
**Tamanho**: 971 linhas  
**Complexidade**: Muito Alta

---

## 🎯 VISÃO GERAL

Página de listagem de empresas com estilo "Nextdoor" (comunidade local):
- Mapa interativo com empresas
- Filtros e busca
- Atividade dos vizinhos
- Recomendações da comunidade
- Integração com sistema territorial
- Geolocalização e distâncias

---

## 📊 ESTRUTURA ATUAL

### **Seções Identificadas** (8)

1. **Categorias no Topo** (linhas ~60-90)
   - Grid de 6 categorias
   - Navegação por categoria
   - Animações Framer Motion

2. **Hero com Carrossel** (linhas ~90-150)
   - CanonicalHero
   - Carrossel de 3 banners
   - Busca integrada
   - CTA "Cadastrar Empresa"

3. **Filtros Rápidos** (linhas ~150-180)
   - 5 filtros quick (Perto de mim, Abertos agora, etc)
   - Toggle de filtros ativos

4. **Stats** (linhas ~180-210)
   - 4 estatísticas (empresas, avaliação, clientes, recomendações)
   - Grid responsivo

5. **Atividade dos Vizinhos** (linhas ~210-240)
   - Feed horizontal de atividades
   - Scroll horizontal

6. **Mapa do Bairro** (linhas ~240-350)
   - MapLibreAdapter
   - Polígonos territoriais
   - Markers de empresas
   - Clustering
   - Controles de busca e localização

7. **Lista de Empresas** (linhas ~350-550)
   - Grid de cards de empresas
   - Distâncias e tempo de caminhada
   - Recomendações de vizinhos
   - Ações (salvar, compartilhar, ligar, rota)
   - Toggle "Perto de mim"

8. **Recomendações da Comunidade** (linhas ~550-600)
   - Top 3 empresas mais recomendadas
   - Ranking visual

9. **Por que Cadastrar** (linhas ~600-650)
   - 3 benefícios
   - Cards informativos

10. **CTA Footer** (linhas ~650-700)
    - Call-to-action final
    - Botão de cadastro

---

## 🧩 COMPONENTES INLINE

### **Cards**
1. **CategoryCard** - Card de categoria (inline no grid)
2. **BusinessCard** - Card de empresa (inline no grid)
3. **NeighborActivityCard** - Card de atividade (inline no feed)
4. **TopBusinessCard** - Card de empresa top (inline no ranking)
5. **BenefitCard** - Card de benefício (inline na seção)

### **Filtros**
1. **QuickFilterChip** - Chip de filtro rápido (inline)

### **Badges**
1. **DistanceBadge** - Badge de distância (já existe como componente)
2. **StatusBadge** - Badge de status (inline)
3. **PremiumBadge** - Badge premium (inline)

---

## 📦 DADOS MOCK

### **Constantes** (linhas ~50-250)
1. `CATEGORIES` - 6 categorias
2. `FEATURED_BUSINESSES` - 6 empresas mock
3. `NEIGHBOR_ACTIVITY` - 5 atividades
4. `STATS` - 4 estatísticas
5. `QUICK_FILTERS` - 5 filtros
6. `NAV_LINKS` - 5 links de navegação

---

## 🔧 LÓGICA COMPLEXA

### **State Management** (linhas ~300-330)
- `searchQuery` - Busca
- `activeFilters` - Filtros ativos
- `viewMode` - Modo de visualização (list/map)
- `selectedBusiness` - Empresa selecionada
- `savedBusinesses` - Empresas salvas
- `nearbyMode` - Modo "perto de mim"
- `currentBannerIndex` - Índice do banner atual

### **Hooks Customizados**
- `useAuth()` - Autenticação
- `useTerritorialContextOptional()` - Contexto territorial
- `useTerritoryLabels()` - Labels do território
- `useBusinessList()` - Lista de empresas
- `useBusinessUrls()` - URLs de empresas
- `useFriendlyModuleUrls()` - URLs de módulos
- `useTerritoryPolygon()` - Polígonos do território
- `useRobustGeolocation()` - Geolocalização
- `useNearbyEntities()` - Entidades próximas

### **Computed Values** (linhas ~330-400)
- `territoryName` - Nome do território
- `territoryNameShort` - Nome abreviado
- `territoryPreposition` - Preposição correta (de/do/da)
- `businessesToShow` - Empresas a exibir (real ou mock)
- `filteredBusinesses` - Empresas filtradas

### **Effects**
- Auto-rotate de banners (5s)
- Busca de empresas reais quando em contexto territorial

---

## 🎨 COMPONENTES EXTERNOS USADOS

1. `CanonicalHero` - Hero padronizado
2. `MapLibreAdapter` - Mapa interativo
3. `NearbyToggle` - Toggle "perto de mim"
4. `DistanceBadge` - Badge de distância
5. `Button` - Botão UI
6. `Input` - Input UI
7. `motion` (Framer Motion) - Animações

---

## 📈 COMPLEXIDADE

### **Muito Alta**
- 971 linhas em um arquivo
- 10 seções diferentes
- 8+ hooks customizados
- Integração com mapa
- Geolocalização
- Sistema territorial
- Filtros complexos
- Mock data extenso

---

## 🎯 OPORTUNIDADES DE REFATORAÇÃO

### **1. Types (SSOT)**
- Criar `sections/types.ts`
- Interfaces para Business, Category, Activity, Stat, Filter
- Props para todas as sections

### **2. Utils**
- Extrair `getBusinessUrl`
- Extrair lógica de preposição
- Extrair lógica de filtros
- Centralizar mock data

### **3. Componentes de Cards** (5)
- `CategoryCard.tsx`
- `BusinessCard.tsx`
- `NeighborActivityCard.tsx`
- `TopBusinessCard.tsx`
- `BenefitCard.tsx`

### **4. Componentes de Filtros** (1)
- `QuickFilterChip.tsx`

### **5. Sections** (10)
- `EmpresasCategoriasSection.tsx`
- `EmpresasHeroSection.tsx`
- `EmpresasFiltrosSection.tsx`
- `EmpresasStatsSection.tsx`
- `EmpresasAtividadeSection.tsx`
- `EmpresasMapaSection.tsx`
- `EmpresasListaSection.tsx`
- `EmpresasRecomendacoesSection.tsx`
- `EmpresasBeneficiosSection.tsx`
- `EmpresasCTASection.tsx`

### **6. Layout**
- `EmpresasLandingLayout.tsx`

### **7. Página Refatorada**
- `EmpresasLandingPage.tsx` (~200 linhas)

---

## 📊 ESTIMATIVA DE REFATORAÇÃO

### **Arquivos a Criar**
- **Types**: 1 arquivo (~250 linhas)
- **Utils**: 3 arquivos (~150 linhas)
- **Cards**: 5 componentes (~400 linhas)
- **Filtros**: 1 componente (~50 linhas)
- **Sections**: 10 sections (~1.500 linhas)
- **Layout**: 1 arquivo (~100 linhas)
- **Página**: 1 arquivo (~200 linhas)

**Total**: ~35 arquivos | ~2.650 linhas

### **Tempo Estimado**
- Análise: ✅ Completa
- Types: ~1 hora
- Utils: ~1 hora
- Cards: ~2 horas
- Filtros: ~30 min
- Sections: ~4 horas
- Layout: ~30 min
- Página: ~1 hora
- Documentação: ~1 hora

**Total**: ~11 horas

---

## 🎨 ESTRUTURA PROPOSTA

```
src/modules/empresas-landing/
├── sections/
│   ├── types.ts (250 linhas) ⭐ SSOT
│   ├── EmpresasCategoriasSection.tsx
│   ├── EmpresasHeroSection.tsx
│   ├── EmpresasFiltrosSection.tsx
│   ├── EmpresasStatsSection.tsx
│   ├── EmpresasAtividadeSection.tsx
│   ├── EmpresasMapaSection.tsx
│   ├── EmpresasListaSection.tsx
│   ├── EmpresasRecomendacoesSection.tsx
│   ├── EmpresasBeneficiosSection.tsx
│   ├── EmpresasCTASection.tsx
│   └── index.ts
├── components/
│   ├── cards/
│   │   ├── CategoryCard.tsx
│   │   ├── BusinessCard.tsx
│   │   ├── NeighborActivityCard.tsx
│   │   ├── TopBusinessCard.tsx
│   │   ├── BenefitCard.tsx
│   │   └── index.ts
│   └── filters/
│       ├── QuickFilterChip.tsx
│       └── index.ts
├── utils/
│   ├── businessHelpers.ts
│   ├── territoryHelpers.ts
│   ├── mockData.ts
│   └── index.ts
└── pages/
    ├── EmpresasLandingLayout.tsx
    └── (EmpresasLandingPage.tsx - refatorado)
```

---

## 🚀 BENEFÍCIOS ESPERADOS

### **Código**
- ✅ 971 linhas → ~35 arquivos (~75 linhas/arquivo)
- ✅ 6 componentes reutilizáveis
- ✅ 10 sections modulares
- ✅ SSOT aplicado

### **Manutenção**
- ✅ Fácil localizar código
- ✅ Mudanças isoladas
- ✅ Testabilidade aumentada

### **Performance**
- ✅ Code splitting natural
- ✅ Lazy loading possível

---

## 🎯 PRIORIDADE

**⭐⭐⭐⭐⭐ MUITO ALTA**

**Motivos**:
1. ✅ Página muito grande (971 linhas)
2. ✅ Complexidade muito alta (mapa + geolocalização + filtros)
3. ✅ Página pública de alta visibilidade
4. ✅ SEO crítico
5. ✅ Múltiplas integrações (territorial, mapa, geolocalização)

---

## 📝 NOTAS

### **Desafios**
1. Integração com MapLibreAdapter
2. Geolocalização e distâncias
3. Sistema territorial complexo
4. Múltiplos hooks customizados
5. Mock data extenso

### **Oportunidades**
1. Reutilizar componentes em outras páginas de listagem
2. Criar biblioteca de cards de empresas
3. Padronizar filtros de busca
4. Centralizar lógica de geolocalização

---

## ✅ PRÓXIMOS PASSOS

1. ✅ Análise completa - Concluída
2. ⏳ Criar types (SSOT)
3. ⏳ Extrair utils
4. ⏳ Criar componentes de cards
5. ⏳ Criar componentes de filtros
6. ⏳ Criar sections
7. ⏳ Criar layout
8. ⏳ Refatorar página
9. ⏳ Validar TypeScript
10. ⏳ Documentar

---

**Análise completa - Pronta para refatoração!** 🚀
