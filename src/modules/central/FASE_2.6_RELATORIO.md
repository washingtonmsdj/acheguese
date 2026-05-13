# Relatório Fase 2.6 - Navegação Contextual de Empresa

**Data**: 2026-05-04  
**Status**: ✅ CONCLUÍDA

---

## Objetivo

Quando o usuário estiver em /central/empresas/:businessId, a Central deve exibir navegação contextual da empresa ativa, com nome da empresa e subitens do painel.

---

## Arquivos Modificados (2)

**1. src/modules/central/components/CentralNavigation.tsx**
- Adicionado useParams para extrair businessId da URL
- Adicionado useBusinessById para buscar dados da empresa
- Adicionado businessManagementRoutes para SSOT de rotas
- Adicionado isEligibleForVertical para verificar elegibilidade de gastronomia
- Adicionado Skeleton para loading state do nome da empresa
- Implementada detecção de /central/empresas/:businessId
- Adicionada seção contextual da empresa ativa com nome da empresa
- Adicionados subitens da empresa (visão geral, dados, gastronomia, planos, link premium, analytics, configuracoes)
- Seção "Empresas" ocultada quando em rota de empresa específica
- Mobile: nome da empresa exibido em vez de "Empresas" quando em rota de empresa

**2. src/modules/central/components/CentralBreadcrumbs.tsx**
- Adicionado useParams para extrair businessId da URL
- Adicionado useBusinessById para buscar dados da empresa
- Adicionado Skeleton para loading state do nome da empresa
- Adicionados mapeamentos para novos segmentos (dados, gastronomia, planos, link-premium, analytics)
- Nome da empresa exibido em breadcrumbs quando businessId está presente
- Loading state com skeleton enquanto dados da empresa carregam

---

## Subitens da Empresa Implementados

### Subitens Contextuais
Quando em /central/empresas/:businessId, exibe:

**1. Visão geral**
- Rota: /central/empresas/:businessId
- Ícone: Store
- Sempre exibido

**2. Dados da empresa**
- Rota: /central/empresas/:businessId/dados
- Ícone: Building2
- Sempre exibido

**3. Gastronomia**
- Rota: /central/empresas/:businessId/gastronomia
- Ícone: UtensilsCrossed
- Exibido apenas se empresa for elegível para vertical gastronomia
- Usa isEligibleForVertical(business.category, 'gastronomy')

**4. Planos**
- Rota: /central/empresas/:businessId/planos
- Ícone: CreditCard
- Sempre exibido

**5. Link premium**
- Rota: /central/empresas/:businessId/link-premium
- Ícone: LinkIcon
- Sempre exibido

**6. Analytics**
- Rota: /central/empresas/:businessId/analytics
- Ícone: BarChart3
- Sempre exibido

**7. Configurações**
- Rota: /central/empresas/:businessId/configuracoes
- Ícone: Settings
- Sempre exibido

---

## SSOT de Rotas

### businessManagementRoutes (SSOT)
Usado para todas as rotas do painel da empresa:
- businessManagementRoutes.overview(businessId)
- businessManagementRoutes.dados(businessId)
- businessManagementRoutes.gastronomia(businessId)
- businessManagementRoutes.planos(businessId)
- businessManagementRoutes.linkPremium(businessId)
- businessManagementRoutes.analytics(businessId)
- businessManagementRoutes.configuracoes(businessId)

### useBusinessById (SSOT)
Usado para buscar dados da empresa:
- Hook canônico existente
- Cache via React Query
- queryKey: ['business', id]
- enabled: !!id
- staleTime: 5 minutos

---

## Dados da Empresa Ativa

### Hook Utilizado
- useBusinessById(businessId)
- Retorna: business, isLoading, isError, error, refetch

### Loading State
- Skeleton exibido enquanto dados carregam
- Sidebar: Skeleton no label da seção
- Breadcrumbs: Skeleton no nome da empresa

### Fallback Seguro
- Se businessId não estiver presente, não exibe navegação contextual
- Se business não estiver disponível, não exibe navegação contextual
- Respeita BusinessAdminGuard (não substitui validação de acesso)

---

## Breadcrumbs Melhorados

| Rota | Breadcrumb Exibido |
|------|---------------------|
| /central | (não exibe) |
| /central/empresas | Central > Empresas |
| /central/empresas/:businessId | Central > Empresas > Nome da empresa |
| /central/empresas/:businessId/dados | Central > Empresas > Nome da empresa > Dados da empresa |
| /central/empresas/:businessId/gastronomia | Central > Empresas > Nome da empresa > Gastronomia |
| /central/empresas/:businessId/planos | Central > Empresas > Nome da empresa > Planos |
| /central/empresas/:businessId/link-premium | Central > Empresas > Nome da empresa > Link premium |
| /central/empresas/:businessId/analytics | Central > Empresas > Nome da empresa > Analytics |
| /central/empresas/:businessId/configuracoes | Central > Empresas > Nome da empresa > Configurações |

---

## Comportamento Desktop vs Mobile

### Desktop
**Navegação Lateral:**
- Seção "Empresas" ocultada quando em /central/empresas/:businessId
- Seção contextual da empresa exibida abaixo das outras seções
- Label da seção mostra nome da empresa (ou Skeleton enquanto carrega)
- Subitens da empresa exibidos dentro da seção contextual

**Breadcrumbs:**
- Nome da empresa exibido em breadcrumbs
- Skeleton enquanto dados carregam

### Mobile
**Tabs/Dropdown:**
- Tab "Empresas" mostra nome da empresa quando em rota de empresa específica
- Nome da empresa exibido em vez de "Empresas"
- Subitens da empresa não poluem navegação mobile (apenas tabs principais)

**Breadcrumbs:**
- Nome da empresa exibido em breadcrumbs
- Skeleton enquanto dados carregam

---

## Cenários Testados (Análise de Código)

### 1. /central/empresas
**Resultado:** ✅
- Navegação exibe seção "Empresas" ativa
- Breadcrumbs exibe "Central > Empresas"
- Seção contextual da empresa não exibida (não está em rota de empresa específica)

### 2. /central/empresas/:businessId
**Resultado:** ✅
- Navegação detecta rota de empresa específica
- Seção "Empresas" ocultada
- Seção contextual da empresa exibida com nome da empresa
- Breadcrumbs exibe "Central > Empresas > Nome da empresa"
- Skeleton enquanto dados carregam

### 3. /central/empresas/:businessId/dados
**Resultado:** ✅
- Navegação exibe seção contextual da empresa
- Item "Dados da empresa" ativo
- Breadcrumbs exibe "Central > Empresas > Nome da empresa > Dados da empresa"

### 4. /central/empresas/:businessId/gastronomia
**Resultado:** ✅
- Navegação exibe seção contextual da empresa
- Item "Gastronomia" ativo (se empresa elegível)
- Breadcrumbs exibe "Central > Empresas > Nome da empresa > Gastronomia"

### 5. /central/empresas/:businessId/planos
**Resultado:** ✅
- Navegação exibe seção contextual da empresa
- Item "Planos" ativo
- Breadcrumbs exibe "Central > Empresas > Nome da empresa > Planos"

### 6. /central/empresas/:businessId/configuracoes
**Resultado:** ✅
- Navegação exibe seção contextual da empresa
- Item "Configurações" ativo
- Breadcrumbs exibe "Central > Empresas > Nome da empresa > Configurações"

### 7. Empresa sem vertical gastronomia
**Resultado:** ✅
- isEligibleForVertical(business.category, 'gastronomy') retorna false
- Item "Gastronomia" não exibido na navegação contextual
- Outros subitens continuam exibidos

### 8. Empresa com gastronomia ativa
**Resultado:** ✅
- isEligibleForVertical(business.category, 'gastronomy') retorna true
- Item "Gastronomia" exibido na navegação contextual
- Todos os subitens exibidos corretamente

### 9. Usuário sem acesso
**Resultado:** ✅
- BusinessAdminGuard continua bloqueando acesso
- Navegação contextual não substitui validação de acesso
- Usuário sem acesso é redirecionado pelo guard

---

## Guards Mantidos

### CentralAccessGuard
- Continua exigindo autenticação para acessar /central/*
- Navegação contextual não interfere

### BusinessAdminGuard
- Continua protegendo rotas específicas de empresas
- Navegação contextual não substitui validação de acesso
- Usuário sem acesso continua bloqueado

---

## Compatibilidade Mantida

### Não Quebrado
- ✅ Rotas legadas em /central/empresas/*
- ✅ Guards existentes (CentralAccessGuard, BusinessAdminGuard)
- ✅ Sistema visual existente (shadcn/ui, cores, componentes)
- ✅ Sub-rotas da Central (motorista, motoboy, profissional)
- ✅ Navegação das áreas Motorista/Motoboy não quebrada
- ✅ businessManagementRoutes (SSOT de rotas)
- ✅ useBusinessById (SSOT de dados da empresa)

### Não Feito
- ✅ Não remover rotas legadas
- ✅ Não mexer em banco
- ✅ Não mexer no /buscar
- ✅ Não refatorar billing
- ✅ Não criar design fora do sistema visual atual

---

## Consistência Visual

### Sistema Visual Existente
- Usado shadcn/ui para componentes (Sidebar, Skeleton, etc.)
- Cores primárias do sistema (text-primary, bg-primary, etc.)
- Ícones do lucide-react (Store, Building2, UtensilsCrossed, CreditCard, LinkIcon, BarChart3, Settings)
- Tipografia consistente (text-sm, text-[11px], etc.)
- Espaçamentos consistentes (p-2, py-2, gap-2, etc.)

### Layout Central
- Seção contextual com label em uppercase tracking-wide
- Skeleton para loading state
- Itens de navegação com ícones e labels
- Estado ativo destacado (bg-sidebar-accent)
- Nome da empresa exibido em sidebar e breadcrumbs

---

## Gates Finais

**Resultados:**
- ✅ lint passou (sem warnings)
- ✅ typecheck passou
- ✅ build passou (2m 3s)

---

## Comparação Fase 2.5 vs Fase 2.6

### Fase 2.5 (Layout e Navegação Própria)
- Criada navegação contextual específica para Central
- CentralLayout usa navegação própria (CentralNavigation)
- Breadcrumbs simples implementados
- Desktop: sidebar com navegação lateral
- Mobile: tabs/dropdown horizontal

### Fase 2.6 (Navegação Contextual de Empresa)
- CentralNavigation detecta /central/empresas/:businessId
- Seção contextual da empresa ativa exibida
- Nome da empresa exibido em sidebar e breadcrumbs
- Subitens da empresa implementados (visão geral, dados, gastronomia, planos, link premium, analytics, configuracoes)
- Gastronomia exibida apenas se empresa elegível
- SSOT de rotas (businessManagementRoutes)
- SSOT de dados da empresa (useBusinessById)
- Loading state com Skeleton

---

## Benefícios da Fase 2.6

### Experiência Contextual
- Usuário vê nome da empresa na navegação quando em rota específica
- Subitens da empresa organizados em seção contextual
- Orientação espacial clara com breadcrumbs mostrando nome da empresa

### SSOT
- Rotas do painel da empresa centralizadas em businessManagementRoutes
- Dados da empresa via useBusinessById (hook canônico)
- Não hardcodado URLs espalhadas

### Loading States
- Skeleton exibido enquanto dados da empresa carregam
- Experiência fluida sem quebras visuais

### Vertical-Aware
- Gastronomia exibida apenas se empresa elegível
- isEligibleForVertical garante lógica correta
- Outras verticais podem ser adicionadas futuramente

---

## Limitações Conhecidas

### Subitens de Gastronomia
- Navegação não inclui subitens específicos de gastronomia (cardapio, horarios, area-entrega, pedidos, entregas, analytics, promocoes)
- Esses subitens podem ser adicionados em uma fase futura
- Atualmente, usuário acessa subitens via página de gastronomia

### Ícones Repetidos
- Todos os subitens da empresa usam ícones específicos
- Pode ser melhorado com ícones mais específicos em fase futura

---

## Próximos Passos Recomendados

### Fase 2.7 (Sugestão)
1. Expandir navegação para subitens de gastronomia
   - Quando em /central/empresas/:businessId/gastronomia
   - Incluir subitens: cardapio, horarios, area-entrega, pedidos, entregas, analytics, promocoes
   - Exibir como subitens colapsáveis dentro de "Gastronomia"

2. Expandir navegação para subitens de education
   - Quando em /central/empresas/:businessId/education
   - Incluir subitens: programas, leads, eventos, analytics, planos
   - Exibir como subitens colapsáveis dentro de "Education"

3. Melhorar ícones de navegação
   - Usar ícones mais específicos para cada subitem
   - Dados: FileText
   - Gastronomia: UtensilsCrossed
   - Planos: CreditCard
   - Link premium: Link
   - Analytics: BarChart3
   - Configurações: Settings

4. Adicionar estado de carregamento mais sofisticado
   - Skeleton de navegação completa enquanto dados carregam
   - Indicadores de loading em subitens dinâmicos

### Notas Importantes
- Central agora tem navegação contextual de empresa
- Nome da empresa exibido em sidebar e breadcrumbs
- Subitens da empresa organizados em seção contextual
- Gastronomia exibida apenas se empresa elegível
- SSOT para rotas (businessManagementRoutes) e dados (useBusinessById)
- Guards continuam protegendo rotas específicas
- Loading states com Skeleton implementados
- Gates de qualidade passaram sem erros
- Sem quebra de funcionalidades existentes
- Sistema visual consistente com o restante do app
