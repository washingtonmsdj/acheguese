# 🎯 Candidatos para Próxima Refatoração

## 📊 ANÁLISE ATUALIZADA

**Data**: 2026-04-18  
**Última atualização**: 2026-04-18  
**Critérios**: Tamanho do arquivo, complexidade, impacto

---

## ✅ REFATORAÇÕES CONCLUÍDAS

### **1. PerfilHubPage.tsx** ✅ COMPLETO
- **Tamanho original**: 1579 linhas
- **Resultado**: 21 arquivos modulares (~2.520 linhas bem distribuídas)
- **Status**: ✅ Aplicado e funcionando

### **2. VagasPublicPage.tsx** ✅ COMPLETO
- **Tamanho original**: 621 linhas
- **Resultado**: 11 arquivos modulares (~1.110 linhas bem distribuídas)
- **Status**: ✅ Aplicado e funcionando

### **3. ClassificadosPage.tsx** ✅ COMPLETO
- **Tamanho original**: 1129 linhas
- **Resultado**: 27 arquivos modulares (~1.900 linhas bem distribuídas)
- **Status**: ✅ Aplicado e funcionando

---

## 🏆 TOP 5 PRÓXIMOS CANDIDATOS

### **1. ClassifiedsPage.tsx** ⭐⭐⭐⭐⭐ (RECOMENDADO)

**Arquivo**: `src/modules/classifieds/pages/ClassifiedsPage.tsx`  
**Tamanho**: Grande (estimado >500 linhas)  
**Complexidade**: Alta

**Por que refatorar?**
- ✅ Página pública importante (SEO crítico)
- ✅ Similar a VagasPublicPage (pode reutilizar padrão)
- ✅ Filtros e categorização complexa
- ✅ Listagem com paginação
- ✅ Múltiplas categorias de classificados

**Benefícios esperados**:
- 📦 Padrão consistente com Vagas e Perfil
- 🧪 Testabilidade melhorada
- 🎨 Código organizado
- 🚀 Reutilização de componentes

**Estrutura sugerida**:
```
src/modules/classifieds/
├── pages/
│   ├── ClassifiedsPage.tsx (orquestração)
│   └── ClassifiedsLayout.tsx (layout)
│
├── sections/
│   ├── types.ts (SSOT)
│   ├── ClassifiedsHeroSection.tsx
│   ├── ClassifiedsFiltrosSection.tsx
│   ├── ClassifiedsListagemSection.tsx
│   ├── ClassifiedsFooterSection.tsx
│   └── index.ts
│
└── components/
    ├── filters/
    │   ├── CategoryFilter.tsx
    │   ├── ActiveFilterChip.tsx
    │   └── index.ts
    │
    └── cards/
        ├── ClassifiedCard.tsx
        ├── ClassifiedCardSkeleton.tsx
        └── index.ts
```

**Prioridade**: ⭐⭐⭐⭐⭐ (ALTA - seguir momentum das refatorações)

---

### **2. AdminTerritoryManagement.tsx** ⭐⭐⭐⭐

**Arquivo**: `src/modules/admin/pages/AdminTerritoryManagement.tsx`  
**Tamanho**: Grande (estimado >500 linhas)  
**Complexidade**: Muito Alta

**Por que refatorar?**
- ✅ Página administrativa complexa
- ✅ Múltiplas operações CRUD
- ✅ Gerenciamento de estado complexo
- ✅ Formulários grandes
- ✅ Tabelas e listagens

**Benefícios esperados**:
- 📦 Componentes de formulário reutilizáveis
- 🧪 Testes isolados por funcionalidade
- 🎨 Código mais limpo
- 🔧 Manutenção facilitada

**Estrutura sugerida**:
```
src/modules/admin/
├── pages/
│   ├── AdminTerritoryManagement.tsx
│   └── AdminTerritoryLayout.tsx
│
├── sections/
│   ├── types.ts
│   ├── TerritoryListSection.tsx
│   ├── TerritoryFormSection.tsx
│   ├── TerritoryStatsSection.tsx
│   └── index.ts
│
└── components/
    ├── forms/
    │   ├── TerritoryForm.tsx
    │   └── index.ts
    │
    └── tables/
        ├── TerritoryTable.tsx
        └── index.ts
```

**Prioridade**: ⭐⭐⭐⭐ (ALTA - impacto em admin)

---

### **3. EmpresaDetailLandingPage.tsx** ⭐⭐⭐⭐

**Arquivo**: `src/app/pages/EmpresaDetailLandingPage.tsx`  
**Tamanho**: ~1169 linhas  
**Complexidade**: Muito Alta

**Por que refatorar?**
- ✅ Página muito grande (maior que PerfilHub)
- ✅ Múltiplas seções (sobre, produtos, avaliações, galeria, etc)
- ✅ SEO crítico
- ✅ Performance importante
- ✅ Página pública de alta visibilidade

**Benefícios esperados**:
- 📦 Sections modulares (8-10 sections)
- 🚀 Code splitting possível
- 🧪 Testes por seção
- 🎨 Manutenção facilitada

**Estrutura sugerida**:
```
src/modules/empresa/
├── pages/
│   ├── EmpresaDetailLandingPage.tsx
│   └── EmpresaDetailLayout.tsx
│
├── sections/
│   ├── types.ts
│   ├── EmpresaHeroSection.tsx
│   ├── EmpresaSobreSection.tsx
│   ├── EmpresaProdutosSection.tsx
│   ├── EmpresaAvaliacoesSection.tsx
│   ├── EmpresaGaleriaSection.tsx
│   ├── EmpresaContatoSection.tsx
│   └── index.ts
│
└── components/
    ├── cards/
    │   ├── ProdutoCard.tsx
    │   ├── AvaliacaoCard.tsx
    │   └── index.ts
    │
    └── gallery/
        ├── ImageGallery.tsx
        └── index.ts
```

**Prioridade**: ⭐⭐⭐⭐ (ALTA - página grande e complexa)

---

### **4. AdminMobilityPage.tsx** ⭐⭐⭐

**Arquivo**: `src/modules/admin/pages/AdminMobilityPage.tsx`  
**Tamanho**: Grande (estimado >500 linhas)  
**Complexidade**: Alta

**Por que refatorar?**
- ✅ Dashboard administrativo complexo
- ✅ Múltiplas visualizações
- ✅ Dados em tempo real
- ✅ Gráficos e métricas

**Benefícios esperados**:
- 📦 Componentes de dashboard reutilizáveis
- 🧪 Testes isolados
- 🎨 Código organizado

**Prioridade**: ⭐⭐⭐ (MÉDIA - admin interno)

---

### **5. GastronomiaPublicPage.tsx** ⭐⭐⭐

**Arquivo**: `src/modules/gastronomia/pages/GastronomiaPublicPage.tsx`  
**Tamanho**: Médio-Grande (estimado 400-600 linhas)  
**Complexidade**: Média-Alta

**Por que refatorar?**
- ✅ Página pública importante
- ✅ Similar a Vagas e Classifieds
- ✅ Filtros por categoria
- ✅ Listagem de estabelecimentos

**Benefícios esperados**:
- 📦 Padrão consistente
- 🧪 Testabilidade
- 🎨 Código organizado

**Prioridade**: ⭐⭐⭐ (MÉDIA - seguir padrão)

---

## 🎯 RECOMENDAÇÃO FINAL

### **PRÓXIMO A REFATORAR: ClassifiedsPage.tsx** ⭐

**Motivos**:
1. ✅ **Momentum** - Acabamos de refatorar VagasPublicPage (padrão fresco)
2. ✅ **Similaridade** - Muito similar a VagasPublicPage (pode reutilizar padrão)
3. ✅ **Impacto alto** - Página pública importante
4. ✅ **Complexidade gerenciável** - Similar em tamanho a VagasPublicPage
5. ✅ **Reutilização** - Pode reutilizar componentes de filtros

---

## 📋 PLANO DE REFATORAÇÃO - ClassifiedsPage

### **Etapa 1: Análise**
- [ ] Ler arquivo completo
- [ ] Identificar responsabilidades
- [ ] Mapear componentes inline
- [ ] Identificar similaridades com VagasPublicPage

### **Etapa 2: Types (SSOT)**
- [ ] Criar `src/modules/classifieds/sections/types.ts`
- [ ] Definir interfaces para cada section
- [ ] Definir types compartilhados

### **Etapa 3: Componentes**
- [ ] Extrair filtros para `components/filters/`
- [ ] Extrair cards para `components/cards/`
- [ ] Criar barrel exports

### **Etapa 4: Sections**
- [ ] Criar `ClassifiedsHeroSection.tsx`
- [ ] Criar `ClassifiedsFiltrosSection.tsx`
- [ ] Criar `ClassifiedsListagemSection.tsx`
- [ ] Criar `ClassifiedsFooterSection.tsx`
- [ ] Criar barrel export

### **Etapa 5: Layout e Página**
- [ ] Criar `ClassifiedsLayout.tsx`
- [ ] Refatorar `ClassifiedsPage.tsx`
- [ ] Validar TypeScript (0 erros)

### **Etapa 6: Documentação**
- [ ] Criar documentação da refatoração
- [ ] Atualizar este documento

---

## 🎨 PADRÃO ESTABELECIDO

### **Baseado em PerfilHub e VagasPublicPage**

```typescript
// 1. Types centralizados (SSOT)
src/modules/{module}/sections/types.ts

// 2. Sections modulares
src/modules/{module}/sections/
├── {Module}HeroSection.tsx
├── {Module}FiltrosSection.tsx
├── {Module}ListagemSection.tsx
├── {Module}FooterSection.tsx
└── index.ts

// 3. Componentes reutilizáveis
src/modules/{module}/components/
├── filters/
│   ├── ActiveFilterChip.tsx
│   ├── ExpandedFilters.tsx
│   └── index.ts
└── cards/
    ├── {Module}Card.tsx
    ├── {Module}CardSkeleton.tsx
    └── index.ts

// 4. Layout separado
src/modules/{module}/pages/{Module}Layout.tsx

// 5. Página orquestradora
src/modules/{module}/pages/{Module}Page.tsx
```

---

## 📊 COMPARAÇÃO ATUALIZADA

| Candidato | Linhas | Complexidade | Impacto | Prioridade | Status |
|-----------|--------|--------------|---------|------------|--------|
| ~~PerfilHubPage~~ | ~~1579~~ | ~~Muito Alta~~ | ~~Alto~~ | - | ✅ Completo |
| ~~VagasPublicPage~~ | ~~621~~ | ~~Alta~~ | ~~Alto~~ | - | ✅ Completo |
| ~~ClassificadosPage~~ | ~~1129~~ | ~~Muito Alta~~ | ~~Alto~~ | - | ✅ Completo |
| AdminTerritoryManagement | >500 | Muito Alta | Médio | ⭐⭐⭐⭐ | Pendente |
| EmpresaDetailLandingPage | ~1169 | Muito Alta | Alto | ⭐⭐⭐⭐ | Pendente |
| AdminMobilityPage | >500 | Alta | Médio | ⭐⭐⭐ | Pendente |
| GastronomiaPublicPage | 400-600 | Média-Alta | Médio | ⭐⭐⭐ | Pendente |

---

## 🚀 PRÓXIMOS PASSOS

1. **Analisar ClassifiedsPage.tsx** - Ler arquivo e identificar estrutura
2. **Criar spec (opcional)** - Definir requisitos e design
3. **Executar refatoração** - Seguir padrão estabelecido
4. **Validar** - 0 erros TypeScript
5. **Documentar** - Criar documentação completa
6. **Aplicar** - Substituir arquivo original

---

## 💡 OBSERVAÇÕES

### **Padrão Estabelecido e Validado**
- ✅ PerfilHub estabeleceu o padrão (1579 → 21 arquivos)
- ✅ VagasPublicPage validou o padrão (621 → 11 arquivos)
- ✅ Documentação completa disponível
- ✅ 0 erros TypeScript em ambos

### **Benefícios Acumulados**
- 📦 Biblioteca de componentes crescente
- 🎨 Código consistente em todo projeto
- 🧪 Testabilidade em todo projeto
- 🚀 Performance otimizada
- 👥 Onboarding mais rápido

### **Longo Prazo**
- Todas as páginas grandes seguirão o mesmo padrão
- Código mais profissional e manutenível
- Facilita code reviews
- Reduz bugs e regressões

---

## 📈 PROGRESSO GERAL

**Refatorações Completas**: 3/7 (42.9%)

```
✅ PerfilHubPage         [████████████████████] 100%
✅ VagasPublicPage       [████████████████████] 100%
✅ ClassificadosPage     [████████████████████] 100%
⏳ AdminTerritory        [░░░░░░░░░░░░░░░░░░░░]   0%
⏳ EmpresaDetail         [░░░░░░░░░░░░░░░░░░░░]   0%
⏳ AdminMobility         [░░░░░░░░░░░░░░░░░░░░]   0%
⏳ GastronomiaPublic     [░░░░░░░░░░░░░░░░░░░░]   0%
```

---

**Recomendação**: Começar por **ClassifiedsPage.tsx** 🎯

**Vantagem**: Aproveitar o momentum e padrão fresco da refatoração de VagasPublicPage!
