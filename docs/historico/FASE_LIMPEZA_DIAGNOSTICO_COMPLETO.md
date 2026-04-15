# FASE 3 — LIMPEZA ESTRUTURAL: DIAGNÓSTICO COMPLETO

**Data**: 2026-03-29  
**Objetivo**: Identificar todos os resíduos e legados para remoção

---

## 1. ROTAS LEGADAS IDENTIFICADAS

### 1.1 Rotas no Router (App.tsx)

**Rotas a remover**:
- ❌ `/business/:slug` → Substituída por `/empresas/:uf/:cidade/:slug`
- ❌ `/businesss/:slug` → Typo histórico, redireciona para canônica
- ⚠️ `/businesss/:id/catalogo` → Usado em e2e tests, avaliar

**Componentes de redirect**:
- `LegacyBusinessRedirect.tsx` → Remove após validar que não há tráfego
- `BusinessLegacyRoute.tsx` → Já integrado, avaliar necessidade
- `BusinessPremiumRoute.tsx` → Já integrado, avaliar necessidade

### 1.2 Referências em Código

**Hardcoded `/business/` encontrado em**:
- `src/shared/utils/urlUtils.ts` → Funções deprecated
- `src/modules/dashboard/pages/DashboardEmpresaPageV2.tsx` → Linha 64
- `src/modules/business/components/legacy/AppointmentIndicator.tsx`
- `src/modules/business/components/legacy/AppointmentToast.tsx`
- `src/core/routing/components/LegacyRedirect.tsx`
- `src/modules/admin/pages/AdminReivindicacoes.tsx`

**Hardcoded `/businesss/` encontrado em**:
- `src/App.tsx` → Rotas legadas
- `src/modules/dashboard/pages/DashboardEmpresaPageV2.tsx`
- `src/modules/business/components/legacy/AppointmentIndicator.tsx`
- `src/modules/business/components/legacy/AppointmentToast.tsx`
- `e2e/business.spec.ts` → Testes e2e

---

## 2. COMPONENTES E ARQUIVOS MORTOS

### 2.1 Services Duplicados

**ProfileIdentityService** → ❌ REMOVIDO (já feito na Fase Profile)
- Referências remanescentes em:
  - `src/modules/mobility/hooks/useDriverCreateMultiProfile.ts` (comentário)
  - `src/modules/mobility/components/driver/*` (6 arquivos)
  - `src/modules/admin/hooks/useReputationStats.ts`
  - `src/core/community/utils/communityBusinessLogic.ts`
  - `src/core/profiles/services/ProfileMobilityAdapter.ts` (comentário)
  - `src/core/business/services/__tests__/BusinessService.write.test.ts` (mock)

**Ação**: Atualizar imports para usar `profileService` ou `publicIdentityService`

### 2.2 Componentes Legacy

**Pasta `src/modules/business/components/legacy/`**:
- `AppointmentIndicator.tsx` → Usa URLs legadas
- `AppointmentToast.tsx` → Usa URLs legadas

**Ação**: Atualizar para usar `BusinessUrlService.getCanonicalUrl()`

### 2.3 Redirects Legados

**Componentes de redirect**:
- `src/shared/components/routing/LegacyBusinessRedirect.tsx`
- `src/core/routing/components/LegacyRedirect.tsx`

**Ação**: Manter temporariamente com TTL documentado, ou remover se sem tráfego

---

## 3. UTILITÁRIOS DEPRECATED

### 3.1 urlUtils.ts

**Funções deprecated identificadas**:

```typescript
// ❌ DEPRECATED
export function gerarUrlEmpresa(business) → Retorna /business/:slug
export function gerarUrlCanonica(business) → Retorna /business/:slug
export function gerarUrlsAlternativas(business) → Retorna [/business/:slug]
export function gerarUrlAbsoluta(business) → Retorna baseUrl/business/:slug
export function parseUrlEmpresa(pathname) → Parse /business/:slug
export function isUrlLegacy(pathname) → Check /business/
```

**Usadas em**:
- `src/shared/components/seo/BusinessSEOEnhanced.tsx`
- `src/modules/business/components/legacy/AppointmentIndicator.tsx`
- `src/modules/business/components/legacy/AppointmentToast.tsx`
- `src/core/routing/components/LegacyRedirect.tsx`
- `src/modules/admin/pages/AdminReivindicacoes.tsx`

**Ação**: 
1. Substituir por `BusinessUrlService.getCanonicalUrl()`
2. Marcar como deprecated com data de remoção
3. Remover após migração completa

### 3.2 Outras Funções Deprecated

**Em urlUtils.ts**:
- `obterNicho()` → Usado em AdminReivindicacoes
- Funções de parse de URL legadas

---

## 4. IMPORTS, EXPORTS E BARRELS

### 4.1 Re-exports Desnecessários

**src/modules/business/types/index.ts**:
- Re-exporta tudo de `@/core/business/types`
- Mantém tipos deprecated com warnings
- **Ação**: Limpar re-exports, manter apenas compatibilidade documentada

**src/modules/business/services/BusinessService.ts**:
- Re-exporta `@/core/business/services/BusinessService`
- **Ação**: Deprecar e documentar caminho direto

**src/shared/types/core.ts**:
- Comentários indicando uso de `@/core/business/types`
- **Ação**: Remover comentários obsoletos

### 4.2 Imports Indiretos

**Padrão encontrado**:
```typescript
// ❌ Import indireto via módulo
import { BusinessService } from "@/modules/business/services/BusinessService";

// ✅ Import direto do core
import { BusinessService } from "@/core/business/services/BusinessService";
```

**Arquivos afetados**: 15+ arquivos

---

## 5. ESTRUTURA DE MÓDULOS

### 5.1 core/business

**Estrutura atual**:
```
src/core/business/
├── components/          → Componentes de domínio
├── hooks/              → Hooks de domínio
├── services/           → Services (SSOT)
├── types/              → Types (SSOT)
└── __tests__/          → Testes
```

**Avaliação**: ✅ Estrutura adequada para core transversal

**Ação**: Nenhuma mudança estrutural necessária

### 5.2 modules/business

**Estrutura atual**:
```
src/modules/business/
├── components/         → Componentes de UI
│   └── legacy/        → ⚠️ Componentes legados
├── hooks/             → Hooks de UI
├── pages/             → Páginas
├── services/          → ⚠️ Re-export do core
├── stores/            → Zustand stores
└── types/             → ⚠️ Re-export do core
```

**Ação**:
1. Atualizar componentes em `legacy/`
2. Deprecar re-exports em `services/` e `types/`
3. Manter estrutura de módulo para UI

### 5.3 core/profiles

**Estrutura atual**:
```
src/core/profiles/
├── services/
│   ├── ProfileService.ts           → ✅ SSOT
│   ├── ProfileMobilityAdapter.ts   → ⚠️ Temporário
│   └── index.ts
├── types/
└── __tests__/
```

**Avaliação**: ✅ ProfileService é SSOT, ProfileMobilityAdapter documentado como temporário

**Ação**: Nenhuma mudança necessária (já documentado)

---

## 6. NÚCLEO core/public-identity

### 6.1 Estrutura Atual

```
src/core/public-identity/
├── adapters/
│   ├── BusinessIdentityAdapter.ts
│   └── ProfileIdentityAdapter.ts
├── policies/
│   ├── BusinessIdentityPolicy.ts
│   └── ProfileIdentityPolicy.ts
├── services/
│   └── PublicIdentityService.ts
├── domain/
├── utils/
├── init.ts
├── index.ts
└── README.md
```

**Avaliação**: ✅ Estrutura limpa e coerente

**Ação**: Validar que não há imports indevidos

### 6.2 Exports

**index.ts atual**:
- ✅ Exporta tipos, interfaces, policies, adapters, services
- ✅ Exporta singleton `publicIdentityService`
- ✅ Exporta utils de reserved names

**Ação**: Nenhuma mudança necessária

---

## 7. BUSCA GLOBAL POR RESÍDUOS

### 7.1 Padrões a Buscar

**Rotas legadas**:
- [x] `/business/` → 20+ ocorrências
- [x] `/businesss/` → 8 ocorrências
- [ ] `ProfileIdentityService` → 12 ocorrências

**Funções deprecated**:
- [x] `gerarUrlEmpresa` → 6 ocorrências
- [x] `gerarUrlCanonica` → 2 ocorrências
- [ ] `gerarUrlsAlternativas` → ?
- [ ] `parseUrlEmpresa` → ?
- [ ] `isUrlLegacy` → ?

**Validações antigas**:
- [ ] Validação de slug fora do núcleo
- [ ] Validação de username fora do núcleo
- [ ] Availability duplicada
- [ ] Reserved names fora do núcleo

### 7.2 Próximas Buscas Necessárias

1. `gerarUrlsAlternativas`
2. `parseUrlEmpresa`
3. `isUrlLegacy`
4. `obterNicho`
5. Validações de slug/username fora do SSOT
6. Availability checks duplicados
7. Reserved names fora de `core/public-identity/utils/reserved-names.ts`

---

## 8. TESTES AFETADOS

### 8.1 Testes de Rotas Legadas

**e2e/business.spec.ts**:
- Usa `/businesss/:id/catalogo`
- **Ação**: Atualizar para rota canônica ou remover

### 8.2 Testes de Services

**src/core/business/services/__tests__/BusinessService.write.test.ts**:
- Mock de `ProfileIdentityService`
- **Ação**: Atualizar para usar `profileService` ou `publicIdentityService`

---

## 9. DOCUMENTAÇÃO OBSOLETA

### 9.1 Comentários Deprecated

**Encontrados em**:
- `src/shared/utils/urlUtils.ts` → Múltiplos @deprecated
- `src/modules/business/types/index.ts` → @deprecated warnings
- `src/modules/business/services/BusinessService.ts` → @deprecated

**Ação**: Manter @deprecated com data de remoção, ou remover se já migrado

### 9.2 READMEs

**A revisar**:
- `src/core/public-identity/README.md` → ✅ Atualizado
- `src/core/business/README.md` → ? (verificar se existe)
- `src/core/profiles/README.md` → ? (verificar se existe)

---

## RESUMO DO DIAGNÓSTICO

### Categorias de Resíduos

1. **Rotas Legadas**: 2 rotas principais + redirects
2. **Componentes Mortos**: 2 componentes legacy + redirects
3. **Utilitários Deprecated**: 6+ funções em urlUtils.ts
4. **Imports Indiretos**: 15+ arquivos
5. **Re-exports Desnecessários**: 3 arquivos
6. **Referências a ProfileIdentityService**: 12 ocorrências
7. **Testes Desatualizados**: 2 arquivos

### Prioridades

**Alta** (Quebra funcionalidade):
- Atualizar referências a `ProfileIdentityService`
- Atualizar componentes legacy que usam URLs antigas

**Média** (Dívida técnica):
- Remover rotas legadas após validar tráfego
- Deprecar funções em urlUtils.ts
- Limpar re-exports

**Baixa** (Limpeza):
- Remover comentários obsoletos
- Atualizar imports indiretos
- Limpar testes desatualizados

---

## PRÓXIMOS PASSOS

1. Completar busca global por resíduos restantes
2. Criar plano de remoção por prioridade
3. Executar remoções com testes
4. Validar que nada quebrou
5. Documentar o que foi removido

**Status**: Diagnóstico 70% completo
**Próxima ação**: Continuar busca global e criar plano de execução
