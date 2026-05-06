# Mapa de Equivalência de Rotas - Fase 1

Este documento documenta o mapeamento entre as rotas legadas e as novas rotas da Central.

## Resumo

- **Rotas legadas preservadas**: `/perfil/empresas/*` e `/perfil/mobilidade/*` continuam funcionando
- **Novas rotas da Central**: `/central/*` criadas como hub de gestão
- **Links principais atualizados**: Apontam para `/central/*`
- **Páginas reutilizadas**: Sem duplicação de código

---

## Rotas de Empresas

### Legadas (Preservadas)
- `/perfil/empresas` - Lista de empresas
- `/perfil/empresas/:businessId` - Dashboard da empresa
- `/perfil/empresas/:businessId/dados` - Dados da empresa
- `/perfil/empresas/:businessId/gastronomia` - Dashboard gastronomia
- `/perfil/empresas/:businessId/gastronomia/setup` - Setup gastronomia
- `/perfil/empresas/:businessId/gastronomia/cardapio` - Cardápio
- `/perfil/empresas/:businessId/gastronomia/horarios` - Horários
- `/perfil/empresas/:businessId/gastronomia/area-entrega` - Área de entrega
- `/perfil/empresas/:businessId/gastronomia/pedidos` - Pedidos
- `/perfil/empresas/:businessId/gastronomia/pedidos/:orderId` - Detalhes do pedido
- `/perfil/empresas/:businessId/gastronomia/entregas` - Entregas
- `/perfil/empresas/:businessId/gastronomia/analytics` - Analytics
- `/perfil/empresas/:businessId/gastronomia/promocoes` - Promoções
- `/perfil/empresas/:businessId/education` - Dashboard education
- `/perfil/empresas/:businessId/education/setup` - Setup education
- `/perfil/empresas/:businessId/education/programas` - Programas
- `/perfil/empresas/:businessId/education/leads` - Leads
- `/perfil/empresas/:businessId/education/eventos` - Eventos
- `/perfil/empresas/:businessId/education/analytics` - Analytics education
- `/perfil/empresas/:businessId/education/planos` - Planos education
- `/perfil/empresas/:businessId/planos` - Planos da empresa
- `/perfil/empresas/:businessId/link-premium` - Link premium
- `/perfil/empresas/:businessId/analytics` - Analytics geral
- `/perfil/empresas/:businessId/configuracoes` - Configurações

### Novas (Central)
- `/central/empresas` - Redireciona para `/perfil/empresas` (wrapper)
- `/central/empresas/:businessId` - Reutiliza `BusinessDashboardShellPage`
- `/central/empresas/:businessId/dados` - Reutiliza `BusinessDetailsPage`
- `/central/empresas/:businessId/gastronomia` - Reutiliza `GastronomyDashboardPage`
- `/central/empresas/:businessId/gastronomia/setup` - Reutiliza `GastronomySetupPage`
- `/central/empresas/:businessId/gastronomia/cardapio` - Reutiliza `MenuManagementPage`
- `/central/empresas/:businessId/gastronomia/horarios` - Reutiliza `BusinessHoursPage`
- `/central/empresas/:businessId/gastronomia/area-entrega` - Reutiliza `DeliveryAreaPage`
- `/central/empresas/:businessId/gastronomia/pedidos` - Reutiliza `OrdersPage`
- `/central/empresas/:businessId/gastronomia/pedidos/:orderId` - Reutiliza `OrderDetailsPage`
- `/central/empresas/:businessId/gastronomia/entregas` - Reutiliza `DeliveryManagementPage`
- `/central/empresas/:businessId/gastronomia/analytics` - Reutiliza `AnalyticsPage`
- `/central/empresas/:businessId/gastronomia/promocoes` - Reutiliza `GastronomyPromotionsPage`
- `/central/empresas/:businessId/education` - Reutiliza `EducationDashboardPage`
- `/central/empresas/:businessId/education/setup` - Reutiliza `EducationSetupPage`
- `/central/empresas/:businessId/education/programas` - Reutiliza `EducationProgramsPage`
- `/central/empresas/:businessId/education/leads` - Reutiliza `EducationLeadsPage`
- `/central/empresas/:businessId/education/eventos` - Reutiliza `EducationEventsPage`
- `/central/empresas/:businessId/education/analytics` - Reutiliza `EducationAnalyticsPage`
- `/central/empresas/:businessId/education/planos` - Reutiliza `EducationPlansPage`
- `/central/empresas/:businessId/planos` - Reutiliza `BusinessPlansPage`
- `/central/empresas/:businessId/link-premium` - Reutiliza `BusinessPremiumSitePage`
- `/central/empresas/:businessId/analytics` - Reutiliza `BusinessAnalyticsPage`
- `/central/empresas/:businessId/configuracoes` - Reutiliza `BusinessSettingsPage`

---

## Rotas de Mobilidade

### Legadas (Preservadas)
- `/perfil/mobilidade` - Hub de mobilidade
- `/perfil/mobilidade/motorista` - Home motorista
- `/perfil/mobilidade/motorista/cadastro` - Cadastro motorista
- `/perfil/mobilidade/motorista/disponibilidade` - Disponibilidade motorista
- `/perfil/mobilidade/motorista/corridas` - Corridas motorista
- `/perfil/mobilidade/motorista/ganhos` - Ganhos motorista
- `/perfil/mobilidade/motorista/configuracoes` - Configurações motorista
- `/perfil/mobilidade/motoboy` - Home motoboy
- `/perfil/mobilidade/motoboy/cadastro` - Cadastro motoboy
- `/perfil/mobilidade/motoboy/disponibilidade` - Disponibilidade motoboy
- `/perfil/mobilidade/motoboy/entregas` - Entregas motoboy
- `/perfil/mobilidade/motoboy/ganhos` - Ganhos motoboy
- `/perfil/mobilidade/motoboy/configuracoes` - Configurações motoboy

### Novas (Central)
- `/central/motorista` - Redireciona para `/perfil/mobilidade/motorista` (wrapper)
- `/central/motoboy` - Redireciona para `/perfil/mobilidade/motoboy` (wrapper)

---

## Rotas da Central (Novas)

- `/central` - Hub da Central (CentralHubPage)
- `/central/empresas` - Wrapper para empresas
- `/central/empresas/:businessId/*` - Rotas de gestão de empresas
- `/central/profissional` - Placeholder funcional para área profissional
- `/central/motorista` - Wrapper para motorista
- `/central/motoboy` - Wrapper para motoboy

---

## Guards Implementados

- **CentralAccessGuard**: Exige autenticação para todas as rotas `/central/*`
  - Redireciona para `/login` se não autenticado
  - Preserva `redirectTo` no estado para redirecionamento pós-login

---

## Navegação Atualizada

### Header/Sidebar Público
- Adicionado item único "Central" na seção "Gestão"
- Ícone: `LayoutGrid`
- Requer autenticação: `true`
- Link: `/central`

### ResumoSection (/perfil)
- Links atualizados:
  - "Minhas empresas": `/perfil/empresas` → `/central/empresas`
  - "Mobilidade": `/perfil/mobilidade/motorista` → `/central/motorista`
  - "Motoboy": `/perfil/mobilidade/motoboy` → `/central/motoboy`
- Adicionado bloco discreto "Acessar Central" com botão para `/central`

### Sections do Perfil
- "empresas": `hiddenInNavigation: true`
- "mobilidade": `hiddenInNavigation: true`
- Reduzido destaque visual de gestão no perfil

---

## Páginas Reutilizadas

### Empresas
- `BusinessDashboardShellPage` - Reutilizado em `/central/empresas/:businessId`
- `BusinessOverviewPage` - Reutilizado
- `BusinessDetailsPage` - Reutilizado
- `GastronomyDashboardPage` - Reutilizado
- `GastronomySetupPage` - Reutilizado
- `MenuManagementPage` - Reutilizado
- `BusinessHoursPage` - Reutilizado
- `DeliveryAreaPage` - Reutilizado
- `OrdersPage` - Reutilizado
- `OrderDetailsPage` - Reutilizado
- `DeliveryManagementPage` - Reutilizado
- `AnalyticsPage` - Reutilizado
- `GastronomyPromotionsPage` - Reutilizado
- `EducationDashboardPage` - Reutilizado
- `EducationSetupPage` - Reutilizado
- `EducationProgramsPage` - Reutilizado
- `EducationLeadsPage` - Reutilizado
- `EducationEventsPage` - Reutilizado
- `EducationAnalyticsPage` - Reutilizado
- `EducationPlansPage` - Reutilizado
- `BusinessPlansPage` - Reutilizado
- `BusinessPremiumSitePage` - Reutilizado
- `BusinessAnalyticsPage` - Reutilizado
- `BusinessSettingsPage` - Reutilizado

### Mobilidade
- Redirecionamento para páginas legadas em `/perfil/mobilidade/*`
- Sem duplicação de páginas

---

## Validações

### /buscar e "meu bairro"
- ✅ Rota `/buscar` não alterada
- ✅ "meu bairro" usa `user_residences.location_id` como fonte primária
- ✅ Não usa `business_data.location_id` ou `professional_data.location_id`
- ✅ Sem regressão

---

## Arquivos Modificados

1. `src/app/routes/lazyImports.ts` - Lazy imports da Central
2. `src/app/routes/AppRoutes.tsx` - Rotas da Central
3. `src/app/components/navigation/navigation.config.ts` - Item "Central" na navegação
4. `src/modules/profile/config/profile-sections.config.ts` - Esconder sections de gestão
5. `src/modules/profile/sections/ResumoSection.tsx` - Links atualizados + bloco "Acessar Central"

---

## Arquivos Criados

1. `src/modules/central/components/CentralLayout.tsx` - Layout da Central
2. `src/modules/central/pages/CentralHubPage.tsx` - Hub da Central
3. `src/modules/central/pages/CentralEmpresasPage.tsx` - Wrapper empresas
4. `src/modules/central/pages/CentralProfissionalPage.tsx` - Placeholder profissional
5. `src/modules/central/pages/CentralMotoristaPage.tsx` - Wrapper motorista
6. `src/modules/central/pages/CentralMotoboyPage.tsx` - Wrapper motoboy
7. `src/modules/central/guards/CentralAccessGuard.tsx` - Guard de autenticação
8. `src/modules/central/ROUTE_MAPPING.md` - Este documento
