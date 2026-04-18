# 📊 Análise EmpresaDetailLandingPage.tsx - Preparação para Refatoração

**Data**: 2026-04-18  
**Arquivo**: `src/app/pages/EmpresaDetailLandingPage.tsx`  
**Tamanho**: 1108 linhas  
**Complexidade**: Muito Alta

---

## 📈 MÉTRICAS DO ARQUIVO

| Métrica | Valor |
|---------|-------|
| **Total de linhas** | 1108 |
| **Seções principais** | 7 (Hero, CTAs, Resumo, Info, Produtos, Avaliações, Fotos) |
| **Mock data** | 4 objetos grandes (MOCK_BUSINESSES, MOCK_PRODUCTS, MOCK_REVIEWS, NEARBY_BUSINESSES) |
| **Funções utilitárias** | 4 (formatDate, getInitials, getYearsActive, isCurrentlyOpen) |
| **Complexidade** | Muito Alta |

---

## 🔍 ANÁLISE ESTRUTURAL

### **Componente Principal: EmpresaDetailLandingPage**
- **Linhas**: ~1108
- **Responsabilidades**: 
  - Gerenciamento de estado (loading, favorites, products, hours)
  - Lógica de dados (business, products, reviews, nearby)
  - Renderização de 7 seções diferentes
  - Handlers de ações (share, copy, route, favorite)
  - SEO e meta tags

### **Seções Identificadas**

1. **Hero Section** (~150 linhas)
   - Banner com overlay
   - Logo e informações principais
   - Badges (Premium, Verificado, Aberto/Fechado)
   - Rating e reviews
   - Modos de atendimento

2. **CTAs Section** (~100 linhas)
   - Botões de ação (WhatsApp, Ligar, Rota, Salvar, Recomendar)
   - Opções de rota (a pé, carro, Google Maps)
   - CTA de delivery (se aplicável)
   - CTA de gastronomia (se aplicável)

3. **Resumo Section** (~80 linhas)
   - Descrição da empresa
   - Quick facts (anos ativo, avaliações, verificado)
   - Especialidades

4. **Informações Práticas Section** (~350 linhas)
   - Endereço + Mapa
   - Horário de funcionamento
   - Formas de atendimento
   - Áreas atendidas
   - Formas de pagamento
   - Contato e redes sociais
   - Facilidades
   - CTA de reivindicar empresa

5. **Produtos/Serviços Section** (~120 linhas)
   - Filtro por categoria
   - Grid de produtos
   - Preços e promoções
   - Botão "ver mais"

6. **Avaliações Section** (~150 linhas)
   - Resumo de rating
   - Distribuição de estrelas
   - Lista de avaliações
   - CTA para escrever avaliação

7. **Fotos Section** (~40 linhas)
   - Grid de fotos
   - Hover effects

8. **Empresas Próximas Section** (~80 linhas)
   - Cards de empresas próximas
   - Distância e rating

9. **Footer** (~40 linhas)
   - Links de navegação

---

## 📦 ESTRUTURA PROPOSTA

### **Arquivos a Criar**

```
src/modules/empresa/
├── pages/
│   ├── EmpresaDetailLandingPage.tsx  (250 linhas) ← REFATORADO
│   └── EmpresaDetailLayout.tsx       (30 linhas) ← NOVO
│
├── sections/
│   ├── types.ts                      (300 linhas) ← NOVO (SSOT)
│   ├── EmpresaHeroSection.tsx        (150 linhas) ← NOVO
│   ├── EmpresaCTAsSection.tsx        (120 linhas) ← NOVO
│   ├── EmpresaResumoSection.tsx      (100 linhas) ← NOVO
│   ├── EmpresaInfoSection.tsx        (200 linhas) ← NOVO
│   ├── EmpresaProdutosSection.tsx    (150 linhas) ← NOVO
│   ├── EmpresaAvaliacoesSection.tsx  (180 linhas) ← NOVO
│   ├── EmpresaFotosSection.tsx       (60 linhas) ← NOVO
│   ├── EmpresaProximasSection.tsx    (100 linhas) ← NOVO
│   └── index.ts                      (40 linhas) ← NOVO
│
├── components/
│   ├── cards/
│   │   ├── ProductCard.tsx           (80 linhas) ← NOVO
│   │   ├── ReviewCard.tsx            (70 linhas) ← NOVO
│   │   ├── NearbyBusinessCard.tsx    (60 linhas) ← NOVO
│   │   └── index.ts                  (15 linhas) ← NOVO
│   │
│   ├── info/
│   │   ├── AddressCard.tsx           (100 linhas) ← NOVO
│   │   ├── HoursCard.tsx             (120 linhas) ← NOVO
│   │   ├── ContactCard.tsx           (100 linhas) ← NOVO
│   │   ├── PaymentCard.tsx           (80 linhas) ← NOVO
│   │   ├── FacilitiesCard.tsx        (70 linhas) ← NOVO
│   │   └── index.ts                  (20 linhas) ← NOVO
│   │
│   ├── ctas/
│   │   ├── ActionButton.tsx          (50 linhas) ← NOVO
│   │   ├── RouteOptions.tsx          (80 linhas) ← NOVO
│   │   └── index.ts                  (10 linhas) ← NOVO
│   │
│   └── rating/
│       ├── RatingSummary.tsx         (80 linhas) ← NOVO
│       ├── RatingDistribution.tsx    (60 linhas) ← NOVO
│       └── index.ts                  (10 linhas) ← NOVO
│
└── utils/
    ├── formatters.ts                 (50 linhas) ← NOVO
    ├── businessHelpers.ts            (60 linhas) ← NOVO
    ├── mockData.ts                   (150 linhas) ← NOVO
    └── index.ts                      (15 linhas) ← NOVO

Total estimado: ~3.200 linhas bem distribuídas em 40 arquivos
```

---

## 🎯 BENEFÍCIOS ESPERADOS

### **1. Organização** ✅
- 1108 linhas → ~40 arquivos modulares
- Cada seção em seu próprio arquivo
- Componentes reutilizáveis
- Utils separados

### **2. Manutenibilidade** ✅
- Fácil encontrar e modificar código
- Menos merge conflicts
- Mudanças isoladas
- Onboarding simplificado

### **3. Testabilidade** ✅
- Seções testáveis isoladamente
- Componentes testáveis
- Utils testáveis separadamente
- Props tipadas facilitam mocks

### **4. Reutilização** ✅
- ProductCard reutilizável
- ReviewCard reutilizável
- ActionButton reutilizável
- Formatters reutilizáveis

### **5. Performance** ✅
- Code splitting por seção
- Lazy loading possível
- Bundle otimizável

---

## 📋 PLANO DE REFATORAÇÃO

### **Etapa 1: Análise e Preparação** ✅
- [x] Ler arquivo completo
- [x] Identificar seções
- [x] Mapear componentes inline
- [x] Identificar utils
- [x] Criar documento de análise

### **Etapa 2: Types (SSOT)**
- [ ] Criar `src/modules/empresa/sections/types.ts`
- [ ] Definir interfaces para cada section
- [ ] Definir types compartilhados (Business, Product, Review, etc)
- [ ] Exportar todos os types

### **Etapa 3: Utils**
- [ ] Criar `src/modules/empresa/utils/formatters.ts`
- [ ] Extrair formatDate, getInitials, getYearsActive
- [ ] Criar `src/modules/empresa/utils/businessHelpers.ts`
- [ ] Extrair isCurrentlyOpen
- [ ] Criar `src/modules/empresa/utils/mockData.ts`
- [ ] Mover MOCK_BUSINESSES, MOCK_PRODUCTS, etc
- [ ] Criar barrel exports

### **Etapa 4: Componentes de Cards**
- [ ] Criar `ProductCard.tsx`
- [ ] Criar `ReviewCard.tsx`
- [ ] Criar `NearbyBusinessCard.tsx`
- [ ] Criar barrel exports

### **Etapa 5: Componentes de Info**
- [ ] Criar `AddressCard.tsx`
- [ ] Criar `HoursCard.tsx`
- [ ] Criar `ContactCard.tsx`
- [ ] Criar `PaymentCard.tsx`
- [ ] Criar `FacilitiesCard.tsx`
- [ ] Criar barrel exports

### **Etapa 6: Componentes de CTAs**
- [ ] Criar `ActionButton.tsx`
- [ ] Criar `RouteOptions.tsx`
- [ ] Criar barrel exports

### **Etapa 7: Componentes de Rating**
- [ ] Criar `RatingSummary.tsx`
- [ ] Criar `RatingDistribution.tsx`
- [ ] Criar barrel exports

### **Etapa 8: Sections Principais**
- [ ] Criar `EmpresaHeroSection.tsx`
- [ ] Criar `EmpresaCTAsSection.tsx`
- [ ] Criar `EmpresaResumoSection.tsx`
- [ ] Criar `EmpresaInfoSection.tsx`
- [ ] Criar `EmpresaProdutosSection.tsx`
- [ ] Criar `EmpresaAvaliacoesSection.tsx`
- [ ] Criar `EmpresaFotosSection.tsx`
- [ ] Criar `EmpresaProximasSection.tsx`
- [ ] Criar barrel export

### **Etapa 9: Layout e Página**
- [ ] Criar `EmpresaDetailLayout.tsx`
- [ ] Refatorar `EmpresaDetailLandingPage.tsx`
- [ ] Validar TypeScript (0 erros)

### **Etapa 10: Documentação**
- [ ] Criar `REFATORACAO_EMPRESA_DETAIL_PROGRESSO.md`
- [ ] Criar `REFATORACAO_EMPRESA_DETAIL_FINAL.md`
- [ ] Atualizar `CANDIDATOS_REFATORACAO.md`

### **Etapa 11: Aplicação**
- [ ] Substituir arquivo original
- [ ] Remover arquivo `.refactored.tsx`
- [ ] Validar TypeScript final
- [ ] Criar `REFATORACAO_EMPRESA_DETAIL_APLICADA.md`

---

## 🎯 ESTIMATIVA

| Etapa | Tempo Estimado | Complexidade |
|-------|----------------|--------------|
| Types (SSOT) | 40min | Média |
| Utils | 30min | Baixa |
| Componentes Cards | 1h | Média |
| Componentes Info | 1h30min | Média-Alta |
| Componentes CTAs | 30min | Baixa |
| Componentes Rating | 30min | Baixa |
| Sections Principais | 2h30min | Alta |
| Layout e Página | 40min | Média |
| Documentação | 30min | Baixa |
| Aplicação | 15min | Baixa |
| **TOTAL** | **~9h** | **Muito Alta** |

---

## 💡 OBSERVAÇÕES

### **Diferenças vs Outras Refatorações**
- **Mais seções**: 7 seções principais vs 4-5 nas outras
- **Mais componentes**: ~40 arquivos vs 21-28
- **Mock data grande**: Precisa ser extraído
- **SEO complexo**: BusinessSEO com muitos parâmetros
- **Múltiplos CTAs**: WhatsApp, Phone, Route, Favorite, etc

### **Similaridades com Outras Refatorações**
- Padrão SSOT estabelecido
- Sections modulares
- Componentes reutilizáveis
- Layout separado
- Página orquestradora

### **Oportunidades de Reutilização**
- ProductCard pode ser usado em outras páginas
- ReviewCard pode ser usado em outras páginas
- ActionButton pode ser usado em outras páginas
- Formatters podem ser usados globalmente

---

## 🚀 PRÓXIMOS PASSOS

1. **Confirmar refatoração** - Usuário aprovar
2. **Começar por Types** - Criar SSOT
3. **Extrair utils** - formatters, helpers, mockData
4. **Extrair componentes** - Cards, Info, CTAs, Rating
5. **Criar sections** - 8 sections modulares
6. **Refatorar página** - Orquestração limpa
7. **Validar** - 0 erros TypeScript
8. **Documentar** - Documentação completa
9. **Aplicar** - Substituir arquivo original

---

**Análise completa! Pronto para iniciar refatoração seguindo padrão SSOT estabelecido.** 🎯✨

**NOTA**: Esta é a maior refatoração até agora (1108 linhas → ~40 arquivos). Requer atenção especial à organização e reutilização de componentes.

