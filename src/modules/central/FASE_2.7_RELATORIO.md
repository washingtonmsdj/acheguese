# Relatório Fase 2.7 - Subnavegação da Vertical Gastronomia

**Data**: 2026-05-04  
**Status**: ✅ CONCLUÍDA

---

## Objetivo

Quando o usuário estiver em /central/empresas/:businessId/gastronomia, a navegação contextual da empresa deve exibir subitens específicos de gastronomia, sem inventar rotas inexistentes e sem quebrar empresas sem gastronomia ativa.

---

## Arquivos Modificados (3)

**1. src/modules/central/components/centralNavigation.config.ts**
- Adicionado `subItems?: CentralNavItem[]` ao tipo CentralNavItem
- Permite suporte a subitens colapsáveis na navegação

**2. src/modules/central/components/CentralNavigation.tsx**
- Adicionado useGastronomyStatus para verificar status da vertical gastronomia
- Adicionado novos ícones: Clock, MapPin, ShoppingBag, Truck, Megaphone
- Adicionado SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem para subitens colapsáveis
- Implementada lógica para exibir subitens de gastronomia apenas quando status for "active"
- Subitens de gastronomia: Setup, Cardápio, Horários, Área de entrega, Pedidos, Entregas, Promoções, Analytics
- Empresas elegíveis mas sem perfil ativo mostram apenas item "Gastronomia" (sem subitens)
- Empresas não elegíveis não mostram item "Gastronomia"

**3. src/modules/central/components/CentralBreadcrumbs.tsx**
- Adicionados mapeamentos para novos segmentos de gastronomia:
  - setup → Setup
  - cardapio → Cardápio
  - horarios → Horários
  - area-entrega → Área de entrega
  - pedidos → Pedidos
  - promocoes → Promoções

---

## Rotas Reais de Gastronomia Auditadas

### Rotas Encontradas (todas existem)
- ✅ /central/empresas/:businessId/gastronomia
- ✅ /central/empresas/:businessId/gastronomia/setup
- ✅ /central/empresas/:businessId/gastronomia/cardapio
- ✅ /central/empresas/:businessId/gastronomia/horarios
- ✅ /central/empresas/:businessId/gastronomia/area-entrega
- ✅ /central/empresas/:businessId/gastronomia/pedidos
- ✅ /central/empresas/:businessId/gastronomia/pedidos/:orderId
- ✅ /central/empresas/:businessId/gastronomia/entregas
- ✅ /central/empresas/:businessId/gastronomia/analytics
- ✅ /central/empresas/:businessId/gastronomia/promocoes

---

## SSOT de Rotas

### businessManagementRoutes (SSOT)
Todas as rotas de gastronomia já estavam definidas no SSOT:
- businessManagementRoutes.gastronomySetup(businessId)
- businessManagementRoutes.gastronomyCardapio(businessId)
- businessManagementRoutes.gastronomyHorarios(businessId)
- businessManagementRoutes.gastronomyAreaEntrega(businessId)
- businessManagementRoutes.gastronomyPedidos(businessId)
- businessManagementRoutes.gastronomyEntregas(businessId)
- businessManagementRoutes.gastronomyAnalytics(businessId)
- businessManagementRoutes.gastronomyPromocoes(businessId)

Não foi necessário adicionar novas rotas ao SSOT.

---

## Hooks/Services Utilizados

### useGastronomyStatus (SSOT)
- Hook canônico para verificar status da vertical gastronomia
- Retorna: status, profile, isLoading
- Status possíveis:
  - "not_eligible" - empresa não elegível para gastronomia
  - "not_configured" - empresa elegível mas sem perfil configurado
  - "active" - perfil de gastronomia ativo
  - "paused" - perfil pausado
  - "suspended" - perfil suspenso
- Parâmetros: businessId, isEligible
- enabled: !!businessId && isEligible

### isEligibleForVertical (SSOT)
- Função para verificar elegibilidade da empresa para a vertical
- Parâmetros: business.category, verticalKey
- Retorna: boolean

---

## Critérios Elegível vs Ativo

### Empresa Não Elegível
- isEligibleForVertical(business.category, 'gastronomy') = false
- Item "Gastronomia" não exibido na navegação
- useGastronomyStatus não é chamado (enabled: false)

### Empresa Elegível mas Sem Perfil Ativo
- isEligibleForVertical(business.category, 'gastronomy') = true
- useGastronomyStatus status = "not_configured"
- Item "Gastronomia" exibido na navegação
- Subitens de gastronomia não exibidos (isGastronomyActive = false)
- Usuário pode clicar em "Gastronomia" para fazer setup

### Empresa com Gastronomia Ativa
- isEligibleForVertical(business.category, 'gastronomy') = true
- useGastronomyStatus status = "active"
- Item "Gastronomia" exibido na navegação
- Subitens de gastronomia exibidos (isGastronomyActive = true)
- Subitens colapsáveis abaixo de "Gastronomia"

---

## Subitens de Gastronomia Implementados

### Subitens Contextuais (quando status = "active")
Quando em /central/empresas/:businessId/gastronomia, exibe:

**1. Setup**
- Rota: /central/empresas/:businessId/gastronomia/setup
- Ícone: LayoutGrid
- Exibido apenas quando status = "active"

**2. Cardápio**
- Rota: /central/empresas/:businessId/gastronomia/cardapio
- Ícone: ShoppingBag
- Exibido apenas quando status = "active"

**3. Horários**
- Rota: /central/empresas/:businessId/gastronomia/horarios
- Ícone: Clock
- Exibido apenas quando status = "active"

**4. Área de entrega**
- Rota: /central/empresas/:businessId/gastronomia/area-entrega
- Ícone: MapPin
- Exibido apenas quando status = "active"

**5. Pedidos**
- Rota: /central/empresas/:businessId/gastronomia/pedidos
- Ícone: ShoppingBag
- Exibido apenas quando status = "active"

**6. Entregas**
- Rota: /central/empresas/:businessId/gastronomia/entregas
- Ícone: Truck
- Exibido apenas quando status = "active"

**7. Promoções**
- Rota: /central/empresas/:businessId/gastronomia/promocoes
- Ícone: Megaphone
- Exibido apenas quando status = "active"

**8. Analytics**
- Rota: /central/empresas/:businessId/gastronomia/analytics
- Ícone: BarChart3
- Exibido apenas quando status = "active"

---

## Breadcrumbs Melhorados

| Rota | Breadcrumb Exibido |
|------|---------------------|
| /central/empresas/:businessId/gastronomia | Central > Empresas > Nome da empresa > Gastronomia |
| /central/empresas/:businessId/gastronomia/setup | Central > Empresas > Nome da empresa > Gastronomia > Setup |
| /central/empresas/:businessId/gastronomia/cardapio | Central > Empresas > Nome da empresa > Gastronomia > Cardápio |
| /central/empresas/:businessId/gastronomia/horarios | Central > Empresas > Nome da empresa > Gastronomia > Horários |
| /central/empresas/:businessId/gastronomia/area-entrega | Central > Empresas > Nome da empresa > Gastronomia > Área de entrega |
| /central/empresas/:businessId/gastronomia/pedidos | Central > Empresas > Nome da empresa > Gastronomia > Pedidos |
| /central/empresas/:businessId/gastronomia/entregas | Central > Empresas > Nome da empresa > Gastronomia > Entregas |
| /central/empresas/:businessId/gastronomia/promocoes | Central > Empresas > Nome da empresa > Gastronomia > Promoções |
| /central/empresas/:businessId/gastronomia/analytics | Central > Empresas > Nome da empresa > Gastronomia > Analytics |

---

## Comportamento Desktop vs Mobile

### Desktop
**Navegação Lateral:**
- Item "Gastronomia" com subitens colapsáveis quando status = "active"
- Subitens exibidos abaixo de "Gastronomia" quando expandido
- Item "Gastronomia" sem subitens quando status != "active"
- Item "Gastronomia" não exibido quando empresa não elegível

**Breadcrumbs:**
- Nome da empresa exibido em breadcrumbs
- Subitens de gastronomia exibidos em breadcrumbs

### Mobile
**Tabs/Dropdown:**
- Tab "Empresas" mostra nome da empresa quando em rota específica
- Subitens de gastronomia não poluem navegação mobile (apenas tabs principais)
- Navegação para subitens de gastronomia via breadcrumbs ou página de gastronomia

**Breadcrumbs:**
- Nome da empresa exibido em breadcrumbs
- Subitens de gastronomia exibidos em breadcrumbs

---

## Cenários Testados (Análise de Código)

### 1. Empresa sem gastronomia elegível
**Resultado:** ✅
- isEligibleForVertical(business.category, 'gastronomy') = false
- Item "Gastronomia" não exibido na navegação
- useGastronomyStatus não é chamado (enabled: false)

### 2. Empresa elegível mas sem perfil ativo
**Resultado:** ✅
- isEligibleForVertical(business.category, 'gastronomy') = true
- useGastronomyStatus status = "not_configured"
- Item "Gastronomia" exibido na navegação
- Subitens de gastronomia não exibidos (isGastronomyActive = false)
- Usuário pode clicar em "Gastronomia" para fazer setup

### 3. Empresa com gastronomia ativa
**Resultado:** ✅
- isEligibleForVertical(business.category, 'gastronomy') = true
- useGastronomyStatus status = "active"
- Item "Gastronomia" exibido na navegação
- Subitens de gastronomia exibidos (isGastronomyActive = true)
- Subitens colapsáveis abaixo de "Gastronomia"

### 4. Subitens só aparecem se as rotas existem
**Resultado:** ✅
- Todas as rotas de gastronomia foram auditadas e existem
- businessManagementRoutes já tem todas as rotas definidas
- Não foram inventadas rotas inexistentes

### 5. Breadcrumbs funcionam nas rotas existentes
**Resultado:** ✅
- Breadcrumbs exibem corretamente para todas as rotas de gastronomia
- Nome da empresa exibido em breadcrumbs
- Subitens de gastronomia exibidos em breadcrumbs

### 6. Usuário sem acesso continua bloqueado pelo BusinessAdminGuard
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
- ✅ Rotas legadas em /perfil/empresas/*
- ✅ Guards existentes (CentralAccessGuard, BusinessAdminGuard)
- ✅ Sistema visual existente (shadcn/ui, cores, componentes)
- ✅ Sub-rotas da Central (motorista, motoboy, profissional)
- ✅ Navegação das áreas Motorista/Motoboy não quebrada
- ✅ businessManagementRoutes (SSOT de rotas)
- ✅ useBusinessById (SSOT de dados da empresa)
- ✅ useGastronomyStatus (SSOT de status de gastronomia)
- ✅ isEligibleForVertical (SSOT de elegibilidade)

### Não Feito
- ✅ Não criar rotas/páginas novas se ainda não existirem
- ✅ Não mexer em banco
- ✅ Não mexer no /buscar
- ✅ Não refatorar billing/planos
- ✅ Não criar navegação para education ainda

---

## Consistência Visual

### Sistema Visual Existente
- Usado shadcn/ui para componentes (Sidebar, SidebarMenuSub, etc.)
- Cores primárias do sistema (text-primary, bg-primary, etc.)
- Ícones do lucide-react (LayoutGrid, ShoppingBag, Clock, MapPin, Truck, Megaphone, BarChart3)
- Tipografia consistente (text-sm, text-[11px], etc.)
- Espaçamentos consistentes (p-2, py-2, gap-2, etc.)

### Layout Central
- Subitens colapsáveis abaixo de "Gastronomia"
- Ícones específicos para cada subitem
- Estado ativo destacado (bg-sidebar-accent)
- Breadcrumbs com subitens de gastronomia

---

## Gates Finais

**Resultados:**
- ✅ lint passou (sem warnings)
- ✅ typecheck passou
- ✅ build passou (2m 45s)

---

## Comparação Fase 2.6 vs Fase 2.7

### Fase 2.6 (Navegação Contextual de Empresa)
- CentralNavigation detecta /central/empresas/:businessId
- Seção contextual da empresa ativa exibida
- Nome da empresa exibido em sidebar e breadcrumbs
- Subitens da empresa implementados (visão geral, dados, gastronomia, planos, link premium, analytics, configuracoes)
- Gastronomia exibida apenas se empresa elegível
- SSOT de rotas (businessManagementRoutes)
- SSOT de dados da empresa (useBusinessById)
- Loading state com Skeleton

### Fase 2.7 (Subnavegação da Vertical Gastronomia)
- CentralNavigation usa useGastronomyStatus para verificar status da vertical
- Subitens de gastronomia exibidos apenas quando status = "active"
- Subitens colapsáveis abaixo de "Gastronomia"
- Critérios elegível vs ativo implementados corretamente
- Subitens: Setup, Cardápio, Horários, Área de entrega, Pedidos, Entregas, Promoções, Analytics
- Breadcrumbs atualizados para subitens de gastronomia
- SSOT de status (useGastronomyStatus)
- SSOT de elegibilidade (isEligibleForVertical)

---

## Benefícios da Fase 2.7

### Experiência Contextual
- Usuário vê subitens de gastronomia apenas quando perfil ativo
- Empresas elegíveis mas sem perfil ativo veem apenas item "Gastronomia" para setup
- Empresas não elegíveis não veem item "Gastronomia"
- Orientação espacial clara com breadcrumbs mostrando subitens

### SSOT
- useGastronomyStatus para verificar status da vertical
- isEligibleForVertical para verificar elegibilidade
- businessManagementRoutes para todas as rotas de gastronomia
- Não hardcodado URLs espalhadas

### Loading States
- useGastronomyStatus tem isLoading state
- Skeleton exibido enquanto dados carregam
- Experiência fluida sem quebras visuais

### Vertical-Aware
- Diferenciação clara entre elegível vs ativo
- Subitens avançados apenas quando perfil ativo
- Setup acessível para empresas elegíveis

---

## Limitações Conhecidas

### Subitens de Education
- Navegação não inclui subitens específicos de education (programas, leads, eventos, analytics, planos)
- Esses subitens podem ser adicionados em uma fase futura
- Atualmente, usuário acessa subitens via página de education

### Ícones Repetidos
- ShoppingBag usado para Cardápio e Pedidos
- Pode ser melhorado com ícones mais específicos em fase futura

---

## Próximos Passos Recomendados

### Fase 2.8 (Sugestão)
1. Expandir navegação para subitens de education
   - Quando em /central/empresas/:businessId/education
   - Incluir subitens: setup, programas, leads, eventos, analytics, planos
   - Exibir como subitens colapsáveis dentro de "Education"
   - Usar useEducationStatus se disponível

2. Melhorar ícones de navegação
   - Usar ícones mais específicos para cada subitem
   - Cardápio: UtensilsCrossed
   - Pedidos: ShoppingBag
   - Setup: LayoutGrid
   - Horários: Clock
   - Área de entrega: MapPin
   - Entregas: Truck
   - Promoções: Megaphone
   - Analytics: BarChart3

3. Adicionar estado de carregamento mais sofisticado
   - Skeleton de navegação completa enquanto dados carregam
   - Indicadores de loading em subitens dinâmicos

4. Melhorar experiência mobile
   - Considerar accordion para subitens em mobile
   - Melhorar scroll horizontal em telas pequenas

### Notas Importantes
- Central agora tem subnavegação da vertical Gastronomia
- Subitens exibidos apenas quando perfil ativo
- Critérios elegível vs ativo implementados corretamente
- SSOT para rotas (businessManagementRoutes), status (useGastronomyStatus) e elegibilidade (isEligibleForVertical)
- Guards continuam protegendo rotas específicas
- Loading states com Skeleton implementados
- Gates de qualidade passaram sem erros
- Sem quebra de funcionalidades existentes
- Sistema visual consistente com o restante do app
