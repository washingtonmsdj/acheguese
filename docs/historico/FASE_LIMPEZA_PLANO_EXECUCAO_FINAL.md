# FASE 3 — LIMPEZA ESTRUTURAL: PLANO DE EXECUÇÃO FINAL

**Data**: 2026-03-29  
**Status**: Plano Fechado - Pronto para Execução

---

## BLOCO 1: RESÍDUOS CONFIRMADOS POR CATEGORIA

### Categoria A: Rotas Legadas

**A1. `/business/:slug`** (20+ ocorrências)
- **Decisão**: `remove_now`
- **Motivo**: Substituída por `/empresas/:uf/:cidade/:slug` (arquitetura canônica)
- **Substituído por**: `BusinessUrlService.getCanonicalUrl()`

**A2. `/businesss/:slug`** (8 ocorrências)
- **Decisão**: `remove_now`
- **Motivo**: Typo histórico, não faz parte da arquitetura final
- **Substituído por**: Rota canônica `/empresas/:uf/:cidade/:slug`

**A3. `/perfil/:userId`** (15+ ocorrências)
- **Decisão**: `keep_final`
- **Motivo**: Rota interna/compatibilidade legítima, parte da arquitetura final
- **Uso**: Acesso direto por ID (admin, links internos, compatibilidade)
- **Coexiste com**: `/u/:username` (rota pública principal)

**A4. `/p/:slug`** (BusinessPremiumRoute)
- **Decisão**: `keep_final`
- **Motivo**: Rota premium curta, parte da arquitetura final
- **Uso**: URLs curtas para businesses premium
- **Não é legado**: Mantém-se na arquitetura

### Categoria B: Componentes de Redirect

**B1. `LegacyBusinessRedirect.tsx`**
- **Decisão**: `remove_now`
- **Motivo**: Redireciona `/businesss/:slug` que será removido
- **Localização**: `src/shared/components/routing/LegacyBusinessRedirect.tsx`

**B2. `BusinessLegacyRoute.tsx`**
- **Decisão**: `remove_now`
- **Motivo**: Redireciona `/business/:slug` que será removido
- **Localização**: `src/core/routing/components/BusinessLegacyRoute.tsx`

**B3. `LegacyRedirect.tsx`**
- **Decisão**: `remove_now`
- **Motivo**: Usa `gerarUrlEmpresa()` deprecated, não faz parte da arquitetura final
- **Localização**: `src/core/routing/components/LegacyRedirect.tsx`

**B4. `BusinessPremiumRoute.tsx`**
- **Decisão**: `keep_final`
- **Motivo**: Parte da arquitetura final, rota premium `/p/:slug`
- **Não remover**: É funcionalidade ativa, não legado

### Categoria C: Funções Deprecated (urlUtils.ts)

**C1. `gerarUrlEmpresa()`** (6 usos)
- **Decisão**: `migrate_then_remove`
- **Motivo**: Retorna `/business/:slug` deprecated
- **Substituído por**: `BusinessUrlService.getCanonicalUrl()`
- **Usada em**:
  - `BusinessSEOEnhanced.tsx`
  - `AppointmentIndicator.tsx`
  - `AppointmentToast.tsx`
  - `LegacyRedirect.tsx`
  - `AdminReivindicacoes.tsx`

**C2. `gerarUrlCanonica()`** (2 usos)
- **Decisão**: `migrate_then_remove`
- **Motivo**: Retorna `/business/:slug` deprecated
- **Substituído por**: `BusinessUrlService.getCanonicalUrl()`

**C3. `gerarUrlsAlternativas()`**
- **Decisão**: `remove_now`
- **Motivo**: Retorna array com `/business/:slug`, não usado
- **Substituído por**: N/A (não necessário)

**C4. `gerarUrlAbsoluta()`**
- **Decisão**: `migrate_then_remove`
- **Motivo**: Usa `/business/:slug`
- **Substituído por**: `BusinessUrlService.getCanonicalUrl()` + `window.location.origin`

**C5. `parseUrlEmpresa()`**
- **Decisão**: `remove_now`
- **Motivo**: Parse de `/business/:slug`, não usado na arquitetura final

**C6. `isUrlLegacy()`**
- **Decisão**: `remove_now`
- **Motivo**: Check de `/business/`, não necessário após remoção

**C7. `obterNicho()`**
- **Decisão**: `keep_temporarily_with_reason`
- **Motivo**: Usado em AdminReivindicacoes, avaliar se ainda necessário
- **Razão**: Pode ser necessário para dados legados no admin

### Categoria D: Referências a ProfileIdentityService

**D1. Imports de `profileIdentityService`** (12 ocorrências)
- **Decisão**: `migrate_then_remove`
- **Motivo**: Service removido na Fase Profile
- **Substituído por**: `profileService` ou `publicIdentityService`
- **Arquivos afetados**:
  - `src/modules/mobility/components/driver/*` (6 arquivos)
  - `src/modules/admin/hooks/useReputationStats.ts`
  - `src/core/community/utils/communityBusinessLogic.ts`
  - `src/core/business/services/__tests__/BusinessService.write.test.ts`

**D2. Comentários mencionando ProfileIdentityService**
- **Decisão**: `remove_now`
- **Motivo**: Referências obsoletas em comentários

### Categoria E: Re-exports Desnecessários

**E1. `modules/business/services/BusinessService.ts`**
- **Decisão**: `remove_now`
- **Motivo**: Re-export de `@/core/business/services/BusinessService`
- **Substituído por**: Import direto do core
- **Ação**: Atualizar imports em 15+ arquivos

**E2. `modules/business/types/index.ts`**
- **Decisão**: `migrate_then_remove`
- **Motivo**: Re-exports de `@/core/business/types`
- **Substituído por**: Import direto do core
- **Manter temporariamente**: Muitos arquivos dependem, migrar gradualmente

**E3. `shared/types/core.ts` (comentários Business)**
- **Decisão**: `remove_now`
- **Motivo**: Comentários obsoletos indicando uso do core

### Categoria F: Componentes Legacy

**F1. `modules/business/components/legacy/AppointmentIndicator.tsx`**
- **Decisão**: `migrate_then_remove`
- **Motivo**: Usa `gerarUrlEmpresa()` deprecated
- **Ação**: Atualizar para `BusinessUrlService.getCanonicalUrl()`

**F2. `modules/business/components/legacy/AppointmentToast.tsx`**
- **Decisão**: `migrate_then_remove`
- **Motivo**: Usa `gerarUrlEmpresa()` deprecated
- **Ação**: Atualizar para `BusinessUrlService.getCanonicalUrl()`

### Categoria G: Testes Desatualizados

**G1. `e2e/business.spec.ts`**
- **Decisão**: `migrate_then_remove`
- **Motivo**: Usa `/businesss/:id/catalogo`
- **Ação**: Atualizar para rota canônica ou remover teste

**G2. `BusinessService.write.test.ts` (mock ProfileIdentityService)**
- **Decisão**: `migrate_then_remove`
- **Motivo**: Mock de service removido
- **Ação**: Atualizar para mock de `profileService`

---

## BLOCO 2: O QUE SERÁ REMOVIDO

### Remoção Imediata (remove_now)

1. **Rotas**:
   - `/business/:slug` no App.tsx
   - `/businesss/:slug` no App.tsx
   - `/businesss/:id/catalogo` no App.tsx (avaliar e2e)

2. **Componentes**:
   - `src/shared/components/routing/LegacyBusinessRedirect.tsx`
   - `src/core/routing/components/BusinessLegacyRoute.tsx`
   - `src/core/routing/components/LegacyRedirect.tsx`

3. **Funções (urlUtils.ts)**:
   - `gerarUrlsAlternativas()`
   - `parseUrlEmpresa()`
   - `isUrlLegacy()`

4. **Re-exports**:
   - `modules/business/services/BusinessService.ts` (arquivo inteiro)

5. **Comentários**:
   - Referências a ProfileIdentityService em comentários
   - Comentários obsoletos em `shared/types/core.ts`

### Total de Arquivos a Remover: 4 arquivos completos

---

## BLOCO 3: O QUE SERÁ MIGRADO

### Migração com Remoção Posterior (migrate_then_remove)

1. **Funções urlUtils.ts** → `BusinessUrlService.getCanonicalUrl()`:
   - `gerarUrlEmpresa()` (6 usos)
   - `gerarUrlCanonica()` (2 usos)
   - `gerarUrlAbsoluta()` (1 uso)

2. **Imports ProfileIdentityService** → `profileService` ou `publicIdentityService`:
   - 6 arquivos em `modules/mobility/components/driver/`
   - 1 arquivo em `modules/admin/hooks/`
   - 1 arquivo em `core/community/utils/`
   - 1 arquivo em testes

3. **Componentes Legacy**:
   - `AppointmentIndicator.tsx` → Atualizar URLs
   - `AppointmentToast.tsx` → Atualizar URLs

4. **Testes**:
   - `e2e/business.spec.ts` → Atualizar rotas
   - `BusinessService.write.test.ts` → Atualizar mocks

5. **Re-exports**:
   - `modules/business/types/index.ts` → Migrar imports gradualmente

### Total de Arquivos a Migrar: 15+ arquivos

---

## BLOCO 4: O QUE PERMANECERÁ LEGITIMAMENTE

### Arquitetura Final (keep_final)

1. **Rotas**:
   - ✅ `/u/:username` → Rota pública de profile (SEO-friendly)
   - ✅ `/perfil/:userId` → Rota interna/compatibilidade de profile
   - ✅ `/perfil/*` → Rotas de gerenciamento de perfil
   - ✅ `/p/:slug` → Rota premium curta de business
   - ✅ `/empresas/:uf/:cidade/:slug` → Rota canônica de business

2. **Componentes**:
   - ✅ `BusinessPremiumRoute.tsx` → Parte da arquitetura
   - ✅ `BusinessCanonicalRoute.tsx` → Rota canônica
   - ✅ `ProfilePublicRoute.tsx` → Rota pública de profile
   - ✅ `StandaloneRoute.tsx` → Catch-all para slugs

3. **Services**:
   - ✅ `BusinessUrlService` → SSOT de URLs de business
   - ✅ `ProfileService` → SSOT de profiles
   - ✅ `PublicIdentityService` → SSOT de identidade pública

4. **Estrutura**:
   - ✅ `core/business/` → Domínio transversal
   - ✅ `core/profiles/` → Domínio transversal
   - ✅ `core/public-identity/` → Núcleo transversal
   - ✅ `modules/business/` → UI e páginas
   - ✅ `modules/profile/` → UI e páginas

### Temporário com Razão (keep_temporarily_with_reason)

1. **`obterNicho()`**:
   - **Razão**: Usado em AdminReivindicacoes para dados legados
   - **Avaliar**: Se ainda necessário após migração de dados
   - **TTL**: Até migração completa de dados legados

2. **`ProfileMobilityAdapter.ts`**:
   - **Razão**: Campos de mobilidade não expostos por ProfileService
   - **Documentado**: Comentários explicam temporariedade
   - **TTL**: Até criação de MobilityService canônico

---

## BLOCO 5: ORDEM EXATA DE EXECUÇÃO

### Fase 1: Preparação (Sem Quebra)

**1.1. Migrar imports de ProfileIdentityService** (10 arquivos)
```
src/modules/mobility/components/driver/DriverStatsCard.tsx
src/modules/mobility/components/driver/DriverStatsCompact.tsx
src/modules/mobility/components/driver/DriverSuspensionAlert.tsx
src/modules/mobility/components/driver/DriverRidesList.tsx
src/modules/mobility/components/driver/WeeklyEarningsChart.tsx
src/modules/mobility/hooks/useDriverCreateMultiProfile.ts
src/modules/admin/hooks/useReputationStats.ts
src/core/community/utils/communityBusinessLogic.ts
src/core/business/services/__tests__/BusinessService.write.test.ts
```
- Substituir `profileIdentityService` por `profileService`
- Executar testes após cada arquivo

**1.2. Migrar funções deprecated de URL** (9 arquivos)
```
src/shared/components/seo/BusinessSEOEnhanced.tsx
src/modules/business/components/legacy/AppointmentIndicator.tsx
src/modules/business/components/legacy/AppointmentToast.tsx
src/core/routing/components/LegacyRedirect.tsx
src/modules/admin/pages/AdminReivindicacoes.tsx
```
- Substituir `gerarUrlEmpresa()` por `BusinessUrlService.getCanonicalUrl()`
- Substituir `gerarUrlCanonica()` por `BusinessUrlService.getCanonicalUrl()`
- Executar testes após cada arquivo

**1.3. Atualizar imports indiretos** (15+ arquivos)
```
Substituir:
  import { BusinessService } from "@/modules/business/services/BusinessService"
Por:
  import { BusinessService } from "@/core/business/services/BusinessService"
```
- Buscar e substituir em massa
- Executar testes

### Fase 2: Remoção de Rotas Legadas

**2.1. Remover rotas do App.tsx**
```typescript
// REMOVER:
<Route path="/business/:slug" element={<BusinessLegacyRoute />} />
<Route path="/businesss/:slug" element={<LegacyBusinessRedirect />} />
<Route path="/businesss/:id/catalogo" element={<EmpresaCatalogoPublicoPage />} />
```
- Executar testes de routing

**2.2. Remover componentes de redirect**
```
DELETE: src/shared/components/routing/LegacyBusinessRedirect.tsx
DELETE: src/core/routing/components/BusinessLegacyRoute.tsx
DELETE: src/core/routing/components/LegacyRedirect.tsx
```
- Executar testes

### Fase 3: Limpeza de Utilitários

**3.1. Remover funções deprecated de urlUtils.ts**
```typescript
// REMOVER:
- gerarUrlsAlternativas()
- parseUrlEmpresa()
- isUrlLegacy()
```
- Executar testes

**3.2. Marcar como deprecated (com data de remoção)**
```typescript
// MANTER COM @deprecated:
- gerarUrlEmpresa() → @deprecated 2026-04-30
- gerarUrlCanonica() → @deprecated 2026-04-30
- gerarUrlAbsoluta() → @deprecated 2026-04-30
```

### Fase 4: Limpeza de Re-exports

**4.1. Remover re-export de BusinessService**
```
DELETE: src/modules/business/services/BusinessService.ts
```
- Já migrado na Fase 1.3

**4.2. Limpar comentários obsoletos**
```
src/shared/types/core.ts → Remover comentários sobre Business
```

### Fase 5: Atualizar Testes

**5.1. Atualizar e2e tests**
```
e2e/business.spec.ts → Atualizar rotas ou remover testes de rotas legadas
```

**5.2. Atualizar unit tests**
```
src/core/business/services/__tests__/BusinessService.write.test.ts
→ Já migrado na Fase 1.1
```

### Fase 6: Validação Final

**6.1. Executar todos os testes**
```bash
npm test -- src/core/business
npm test -- src/core/profiles
npm test -- src/core/public-identity
npm test -- src/core/routing
```

**6.2. Executar e2e tests**
```bash
npm run test:e2e
```

**6.3. Verificar TypeScript**
```bash
npx tsc --noEmit
```

**6.4. Verificar build**
```bash
npm run build
```

---

## CHECKLIST DE EXECUÇÃO

### Preparação
- [ ] Commit atual antes de iniciar
- [ ] Branch de limpeza criada
- [ ] Testes baseline executados

### Fase 1: Preparação
- [ ] 1.1. Migrar imports ProfileIdentityService (10 arquivos)
- [ ] 1.2. Migrar funções deprecated URL (9 arquivos)
- [ ] 1.3. Atualizar imports indiretos (15+ arquivos)
- [ ] Testes executados e aprovados

### Fase 2: Remoção de Rotas
- [ ] 2.1. Remover rotas legadas do App.tsx
- [ ] 2.2. Remover componentes de redirect (3 arquivos)
- [ ] Testes de routing executados

### Fase 3: Limpeza de Utilitários
- [ ] 3.1. Remover funções deprecated (3 funções)
- [ ] 3.2. Marcar deprecated com TTL (3 funções)
- [ ] Testes executados

### Fase 4: Limpeza de Re-exports
- [ ] 4.1. Remover re-export BusinessService
- [ ] 4.2. Limpar comentários obsoletos
- [ ] Testes executados

### Fase 5: Atualizar Testes
- [ ] 5.1. Atualizar e2e tests
- [ ] 5.2. Validar unit tests
- [ ] Todos os testes aprovados

### Fase 6: Validação Final
- [ ] 6.1. Testes core/* aprovados
- [ ] 6.2. E2E tests aprovados
- [ ] 6.3. TypeScript sem erros
- [ ] 6.4. Build bem-sucedido

### Finalização
- [ ] Documento de limpeza criado
- [ ] Commit de limpeza estrutural
- [ ] PR criado e revisado

---

## MÉTRICAS ESPERADAS

**Arquivos Removidos**: 4 arquivos completos
**Arquivos Migrados**: 25+ arquivos
**Funções Removidas**: 6 funções
**Rotas Removidas**: 3 rotas legadas
**Imports Atualizados**: 30+ imports

**Redução de Código**: ~500-800 linhas
**Redução de Complexidade**: Eliminação de 2 caminhos de URL legados
**Melhoria de Manutenibilidade**: SSOT consolidado

---

## RISCOS E MITIGAÇÕES

**Risco 1**: Quebra de links externos
- **Mitigação**: Rotas legadas já redirecionam, remoção não afeta

**Risco 2**: Testes quebrados
- **Mitigação**: Execução incremental com validação por fase

**Risco 3**: Imports quebrados
- **Mitigação**: TypeScript detecta, correção antes de commit

**Risco 4**: Build quebrado
- **Mitigação**: Validação de build na Fase 6

---

## STATUS

**Plano**: ✅ FECHADO E PRONTO PARA EXECUÇÃO
**Próxima Ação**: Executar Fase 1.1 (Migrar imports ProfileIdentityService)
