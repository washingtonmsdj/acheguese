# 🛣️ ROTAS ADMIN - NOVAS PÁGINAS

## Rotas que precisam ser adicionadas ao sistema de roteamento

### Localização
As rotas devem ser adicionadas no arquivo de rotas do admin, provavelmente em:
- `src/app/routes.tsx` ou
- `src/app/router.tsx` ou
- `src/modules/admin/routes.tsx`

### Novas Rotas

```typescript
// Importar as novas páginas
import {
  AdminGastronomia,
  AdminVagas,
  AdminRoles,
} from "@/modules/admin";

// Adicionar as rotas dentro do layout de admin
{
  path: "/admin",
  element: <AdminLayout />,
  children: [
    // ... rotas existentes ...
    
    // NOVAS ROTAS
    {
      path: "gastronomia",
      element: <AdminGastronomia />,
    },
    {
      path: "vagas",
      element: <AdminVagas />,
    },
    {
      path: "roles",
      element: <AdminRoles />,
    },
  ],
}
```

### Estrutura Completa de Rotas Admin (Referência)

```typescript
{
  path: "/admin",
  element: <AdminLayout />,
  children: [
    // VISÃO GERAL
    { index: true, element: <AdminDashboard /> },
    
    // MOBILIDADE
    { path: "motoristas", element: <AdminMotoristas /> },
    { path: "reports-passageiros", element: <AdminReportsPassageiros /> },
    { path: "pontos-embarque", element: <AdminPontosEmbarque /> },
    { path: "analytics-mobilidade", element: <AdminAnalyticsMobilidade /> },
    { path: "realtime-dashboard", element: <AdminRealtimeDashboard /> },
    
    // CONTEÚDO & CADASTROS
    { path: "banners", element: <BannersPage /> },
    { path: "businesss", element: <AdminEmpresas /> },
    { path: "gastronomia", element: <AdminGastronomia /> }, // NOVA
    { path: "services", element: <AdminServicos /> },
    { path: "classificados", element: <AdminClassificados /> },
    { path: "classificados/denuncias", element: <AdminClassificadosDenuncias /> },
    { path: "vagas", element: <AdminVagas /> }, // NOVA
    { path: "eventos", element: <AdminEventos /> },
    { path: "cupons", element: <AdminCupons /> },
    { path: "pontos-turisticos", element: <AdminPontosTuristicos /> },
    
    // MODERAÇÃO & SEGURANÇA
    { path: "moderacao-completa", element: <AdminModeracaoCompleta /> },
    { path: "verificacoes", element: <AdminVerificacoes /> },
    { path: "reivindicacoes", element: <AdminReivindicacoes /> },
    { path: "alertas", element: <AdminAlertas /> },
    
    // COMUNIDADE
    { path: "users", element: <AdminUsuarios /> },
    { path: "zeladoria", element: <AdminZeladoria /> },
    { path: "mensagens", element: <AdminMensagens /> },
    { path: "gamificacao", element: <AdminGamificacao /> },
    
    // SISTEMA
    { path: "roles", element: <AdminRoles /> }, // NOVA
    { path: "configuracoes", element: <AdminConfiguracoes /> },
    { path: "analytics", element: <AdminAnalytics /> },
    { path: "ssot", element: <AdminSSOT /> },
    { path: "highlights", element: <AdminHighlights /> },
    { path: "territorial-groups", element: <AdminTerritorialGroups /> },
    { path: "territory-management", element: <AdminTerritoryManagement /> },
    { path: "city-metadata", element: <AdminCityMetadata /> },
    { path: "locations", element: <LocationsAdminPage /> },
  ],
}
```

## Verificação de Permissões

As novas rotas já estão protegidas pelo `AdminLayout`, que verifica se o usuário tem permissão de admin antes de renderizar qualquer página.

Não é necessário adicionar verificação adicional nas rotas individuais.

## Navegação

A navegação já foi atualizada no `AdminLayout.tsx` com os links para as novas páginas:
- `/admin/gastronomia` - Gestão de Gastronomia
- `/admin/vagas` - Gestão de Vagas
- `/admin/roles` - Roles & Permissões

## Testes

Para testar as novas rotas:

1. Faça login como admin
2. Acesse `/admin`
3. Clique nos novos itens do menu:
   - "Gastronomia" (em CONTEÚDO & CADASTROS)
   - "Vagas" (em CONTEÚDO & CADASTROS)
   - "Roles & Permissões" (em SISTEMA)

## Próximos Passos

Após adicionar as rotas, verifique:
- [ ] As páginas carregam corretamente
- [ ] Os dados são exibidos
- [ ] As ações (ativar/desativar, deletar, etc) funcionam
- [ ] A paginação funciona
- [ ] Os filtros funcionam
- [ ] Os toasts de feedback aparecem
- [ ] A navegação entre tabs funciona
