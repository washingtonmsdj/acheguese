# Rotas da Central que Ainda Redirecionam para /perfil

## Documento de Rastreio - Fase 1.1

Este documento documenta quais rotas da Central ainda redirecionam para `/perfil` e o motivo.

---

## Rotas com Redirecionamento Ativo

### 1. `/central/empresas` → `/perfil/empresas`

**Arquivo:** `src/modules/central/pages/CentralEmpresasPage.tsx`

**Motivo:** 
- A página de lista de empresas não foi migrada para a Central nesta fase
- Reutilização da página legada existente em `/perfil/empresas`
- Evita duplicação de código

**Redirecionamento:**
```typescript
useEffect(() => {
  navigate("/perfil/empresas", { replace: true });
}, [navigate]);
```

**Rota Final Futura:**
- Criar `CentralEmpresasListPage` com lista de empresas
- Integrar com `useBusinessModules` para obter empresas do usuário
- Adicionar CTAs para criar nova empresa

**Prioridade de Migração:** Média

---

### 2. `/central/motorista` → rota canônica da Central

**Arquivo:** `src/modules/central/pages/CentralMotoristaPage.tsx`

**Motivo:**
- Fluxo migrado para páginas canônicas da Central com guard dedicado.
- Não depende mais de wrapper redirecionando para `/perfil/mobilidade/*`.

**Status Atual:**
- Usa layout/páginas de motorista em `/central/motorista/*`.
- Onboarding canônico em `/central/motorista/cadastro`.

**Rota Final Futura:**
- Migrar `PerfilMobilidadeMotoristaHomePage` e sub-rotas para a Central
- Criar layout próprio para mobilidade na Central
- Integrar com `DriverGuard` já implementado

**Prioridade de Migração:** Média

---

### 3. `/central/motoboy` → rota canônica da Central

**Arquivo:** `src/modules/central/pages/CentralMotoboyPage.tsx`

**Motivo:**
- Fluxo migrado para páginas canônicas da Central com guard dedicado.
- Não depende mais de wrapper redirecionando para `/perfil/mobilidade/*`.

**Status Atual:**
- Usa layout/páginas de motoboy em `/central/motoboy/*`.
- Onboarding canônico em `/central/motoboy/cadastro`.

**Rota Final Futura:**
- Migrar `PerfilMobilidadeMotoboyHomePage` e sub-rotas para a Central
- Criar layout próprio para mobilidade na Central
- Integrar com `DriverGuard` já implementado

**Prioridade de Migração:** Média

---

## Rotas com Guards (Sem Redirecionamento)

### 1. `/central/empresas/:businessId/*`

**Guard:** `BusinessAdminGuard`

**Comportamento:**
- Valida acesso usando `useDashboardAccess`
- Se usuário não tiver acesso, redireciona para `/central/empresas` com toast de erro
- Se empresa não existir, redireciona para `/central/empresas` com toast de erro
- Reutiliza `BusinessDashboardShellPage` e sub-rotas (sem redirecionamento para `/perfil`)

**Status:** ✅ Protegido, sem dependência de redirecionamento

---

### 2. `/central/profissional`

**Guard:** `ProfessionalGuard`

**Comportamento:**
- Valida se usuário tem `professional` profile
- Se não tiver, mostra empty state com CTA para `/services/cadastrar`
- Reutiliza `CentralProfissionalPage` (placeholder funcional)

**Status:** ✅ Protegido, sem dependência de redirecionamento

---

### 3. `/central/motorista`

**Guard:** `DriverGuard` (service: "motorista")

**Comportamento:**
- Valida se usuário tem `driver_data`
- Se não tiver, mostra empty state com CTA para `/central/motorista/cadastro`
- Permanece no fluxo da Central (sem wrapper de perfil)

**Status:** ✅ Protegido e canônico na Central

---

### 4. `/central/motoboy`

**Guard:** `DriverGuard` (service: "motoboy")

**Comportamento:**
- Valida se usuário tem `driver_data`
- Se não tiver, mostra empty state com CTA para `/central/motoboy/cadastro`
- Permanece no fluxo da Central (sem wrapper de perfil)

**Status:** ✅ Protegido e canônico na Central

---

## Resumo

**Rotas com Redirecionamento Ativo:**
- `/central/empresas` → `/perfil/empresas`

**Rotas Protegidas (Sem Redirecionamento):**
- `/central/empresas/:businessId/*` - BusinessAdminGuard
- `/central/profissional` - ProfessionalGuard
- `/central/motorista` - DriverGuard + rotas canônicas `/central/motorista/*`
- `/central/motoboy` - DriverGuard + rotas canônicas `/central/motoboy/*`

**Rota Hub:**
- `/central` - CentralAccessGuard (autenticação apenas)

---

## Notas Importantes

1. **Guards Antecedem Redirecionamentos:**
   - `CentralAccessGuard` atua antes de qualquer rota `/central/*`
   - `BusinessAdminGuard`, `ProfessionalGuard`, `DriverGuard` atam antes dos wrappers
   - Isso garante que a validação de acesso aconteça antes de redirecionar para `/perfil`

2. **Redirecionamentos São Temporários:**
   - Os redirecionamentos atuais são wrappers para reutilização
   - A validação de acesso já está implementada via guards
- Mobilidade já foi migrada; pendência principal restante é `/central/empresas` legado.

3. **Sem Regressão em Rotas Legadas:**
   - Rotas `/perfil/empresas/*` e `/perfil/mobilidade/*` continuam funcionando
   - Links internos podem continuar apontando para rotas legadas
   - Migração gradual não interrompe funcionalidades existentes

---

## Próximos Passos (Fase 2)

1. **Migrar `/central/empresas`**
   - Criar `CentralEmpresasListPage`
   - Integrar com `useBusinessModules`
   - Eliminar redirecionamento para `/perfil/empresas`

2. **Migrar Links Internos**
   - Atualizar serviços para usar rotas da Central
   - Preservar compatibilidade com rotas legadas
