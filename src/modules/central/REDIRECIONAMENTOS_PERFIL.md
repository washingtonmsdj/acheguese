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

### 2. `/central/motorista` → `/perfil/mobilidade/motorista`

**Arquivo:** `src/modules/central/pages/CentralMotoristaPage.tsx`

**Motivo:**
- As páginas de mobilidade (motorista/motoboy) não foram migradas para a Central nesta fase
- Reutilização das páginas legadas existentes em `/perfil/mobilidade/*`
- Evita duplicação de código

**Redirecionamento:**
```typescript
useEffect(() => {
  navigate("/perfil/mobilidade/motorista", { replace: true });
}, [navigate]);
```

**Rota Final Futura:**
- Migrar `PerfilMobilidadeMotoristaHomePage` e sub-rotas para a Central
- Criar layout próprio para mobilidade na Central
- Integrar com `DriverGuard` já implementado

**Prioridade de Migração:** Média

---

### 3. `/central/motoboy` → `/perfil/mobilidade/motoboy`

**Arquivo:** `src/modules/central/pages/CentralMotoboyPage.tsx`

**Motivo:**
- Mesmo motivo que `/central/motorista`
- Reutilização das páginas legadas existentes em `/perfil/mobilidade/*`
- Evita duplicação de código

**Redirecionamento:**
```typescript
useEffect(() => {
  navigate("/perfil/mobilidade/motoboy", { replace: true });
}, [navigate]);
```

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
- Se não tiver, mostra empty state com CTA para `/create-driver`
- Redireciona para `/perfil/mobilidade/motorista` (wrapper)

**Status:** ⚠️ Protegido, mas ainda redireciona para `/perfil`

---

### 4. `/central/motoboy`

**Guard:** `DriverGuard` (service: "motoboy")

**Comportamento:**
- Valida se usuário tem `driver_data`
- Se não tiver, mostra empty state com CTA para `/create-driver`
- Redireciona para `/perfil/mobilidade/motoboy` (wrapper)

**Status:** ⚠️ Protegido, mas ainda redireciona para `/perfil`

---

## Resumo

**Rotas com Redirecionamento Ativo:**
- `/central/empresas` → `/perfil/empresas`
- `/central/motorista` → `/perfil/mobilidade/motorista`
- `/central/motoboy` → `/perfil/mobilidade/motoboy`

**Rotas Protegidas (Sem Redirecionamento):**
- `/central/empresas/:businessId/*` - BusinessAdminGuard
- `/central/profissional` - ProfessionalGuard
- `/central/motorista` - DriverGuard (mas wrapper redireciona)
- `/central/motoboy` - DriverGuard (mas wrapper redireciona)

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
   - Futuramente as páginas serão migradas para eliminar redirecionamentos

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

2. **Migrar `/central/motorista` e `/central/motoboy`**
   - Migrar páginas de mobilidade para a Central
   - Criar layout próprio para mobilidade
   - Eliminar redirecionamentos para `/perfil/mobilidade/*`

3. **Migrar Links Internos**
   - Atualizar serviços para usar rotas da Central
   - Preservar compatibilidade com rotas legadas
