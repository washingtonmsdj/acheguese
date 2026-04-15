# Fase 1 - Integração Business: Diagnóstico

**Data**: 2026-03-29  
**Status**: 🔍 DIAGNÓSTICO COMPLETO

---

## 1. DIAGNÓSTICO DOS PONTOS DE INTEGRAÇÃO

### 1.1 Análise do Estado Atual

**BusinessService** (`src/core/business/services/BusinessService.ts`):
- ✅ Já usa `generateUniqueSlug()` via `BusinessUrlService`
- ❌ Não valida formato de slug antes de gerar
- ❌ Não verifica reserved names
- ❌ Não usa cooldown para mudança de slug
- ❌ Não registra histórico de mudança (trigger do banco faz isso)
- ❌ Não valida disponibilidade antes de criar/atualizar

**BusinessUrlService** (`src/core/business/services/BusinessUrlService.ts`):
- ✅ Já tem `generateSlug()` (normalização)
- ✅ Já tem `generateUniqueSlug()` (checagem de colisão)
- ✅ Já tem `isValidSlug()` (validação de formato)
- ❌ Não usa `PublicIdentityService` para validação
- ❌ Não verifica reserved names via core
- ❌ Não usa `BusinessIdentityAdapter`
- ❌ Lógica duplicada com `BusinessIdentityPolicy`

### 1.2 Pontos de Integração Identificados

#### A. BusinessUrlService → PublicIdentityService

**Migrar**:
1. `generateSlug()` → `PublicIdentityService.normalize()`
2. `isValidSlug()` → `PublicIdentityService.validateFormat()`
3. `generateUniqueSlug()` → `PublicIdentityService.checkAvailability()` + sugestão
4. Adicionar checagem de reserved names

**Preservar**:
- Toda lógica de URL pública (canônica, premium, legacy)
- Resolução por território
- Histórico de URL (já usa `business_slug_history`)

#### B. BusinessService → PublicIdentityService

**Adicionar**:
1. Validação de slug antes de criar empresa
2. Validação de slug antes de atualizar empresa
3. Checagem de cooldown antes de permitir mudança
4. Validação de disponibilidade com sugestão

**Preservar**:
- Toda lógica de negócio de empresa
- Mappers
- Sanitização
- Integração com ProfileService

### 1.3 Arquitetura de Integração

```
BusinessService
    ↓ (validação de slug)
PublicIdentityService
    ↓ (orquestração)
BusinessIdentityAdapter
    ↓ (persistência)
business_data (slug)
business_slug_history (histórico)
```

**Fluxo de Criação**:
1. BusinessService recebe input com nome
2. Gera slug via `PublicIdentityService.normalize()`
3. Valida formato via `PublicIdentityService.validateFormat()`
4. Verifica disponibilidade via `PublicIdentityService.checkAvailability()`
5. Se indisponível, usa sugestão
6. Cria empresa com slug validado

**Fluxo de Atualização**:
1. BusinessService recebe input com novo nome (opcional)
2. Se nome mudou, gera novo slug
3. Verifica cooldown via `PublicIdentityService.canChangeIdentifier()`
4. Se em cooldown, rejeita mudança
5. Valida disponibilidade do novo slug
6. Atualiza empresa (trigger registra histórico)

---

## 2. MAPEAMENTO DE FUNÇÕES

### 2.1 BusinessUrlService

| Função Atual | Ação | Nova Implementação |
|--------------|------|-------------------|
| `generateSlug()` | MIGRAR | `PublicIdentityService.normalize(name, 'business')` |
| `isValidSlug()` | MIGRAR | `PublicIdentityService.validateFormat(slug, 'business')` |
| `generateUniqueSlug()` | REFATORAR | Usar `checkAvailability()` + sugestão |
| `isReservedSlug()` | REMOVER | `PublicIdentityService.isReserved(slug, 'business')` |
| `buildUrls()` | PRESERVAR | Lógica de URL pública permanece |
| `resolveBySlug()` | PRESERVAR | Resolução de URL permanece |
| `resolveByTerritoryAndSlug()` | PRESERVAR | Resolução territorial permanece |
| `resolveBySlugHistory()` | PRESERVAR | Histórico de URL permanece |

### 2.2 BusinessService

| Função Atual | Ação | Integração |
|--------------|------|-----------|
| `createBusiness()` | ADICIONAR VALIDAÇÃO | Validar slug antes de criar |
| `updateBusiness()` | ADICIONAR VALIDAÇÃO | Validar slug + cooldown antes de atualizar |
| `generateUniqueSlug()` | REFATORAR | Delegar para `BusinessUrlService` refatorado |

---

## 3. REGRAS DE NEGÓCIO PRESERVADAS

### 3.1 URL Pública (BusinessUrlService)

✅ **PRESERVAR INTEGRALMENTE**:
- Canônica: `/empresas/:uf/:cidade/:slug`
- Premium: `/p/:slug` (redirect 308 para canônica)
- Legacy: `/business/:slug` (redirect para canônica)
- Interna: `/dashboard/business/:id`
- Resolução por território
- Resolução por histórico (redirect 308)

### 3.2 Slug (BusinessIdentityPolicy)

✅ **REGRAS JÁ IMPLEMENTADAS NO CORE**:
- Formato: kebab-case
- Tamanho: 2-100 caracteres
- Regex: `^[a-z0-9][a-z0-9-]*[a-z0-9]$`
- Normalização: remove acentos, converte espaços para hífen
- Reserved names: `empresas`, `business`, `admin`, etc.
- Cooldown: 30 dias entre mudanças

### 3.3 Histórico (business_slug_history)

✅ **PRESERVAR**:
- Trigger automático registra mudanças
- Histórico público com redirect 308
- Resolução de URL antiga para atual
- Campos: `old_slug`, `old_canonical_url`, `change_reason`

---

## 4. PONTOS DE ATENÇÃO

### 4.1 Não Criar Username Paralelo

❌ **PROIBIDO**:
- Empresa NÃO tem username
- Empresa usa apenas slug
- Não adicionar campo username em business_data
- Não criar rota `/u/:username` para empresa

✅ **CORRETO**:
- Empresa usa slug como identificador público
- Rota canônica: `/empresas/:uf/:cidade/:slug`
- Rota premium: `/p/:slug`

### 4.2 Cooldown de Mudança

⚠️ **IMPORTANTE**:
- Cooldown de 30 dias entre mudanças de slug
- Histórico em `business_slug_history` é SSOT
- Campos denormalizados (`last_slug_change_at`) são cache
- Validar cooldown antes de permitir update

### 4.3 Reserved Names

⚠️ **IMPORTANTE**:
- Reserved names específicos de business
- Não usar reserved names de profile
- Validar antes de criar/atualizar
- Sugerir alternativa se reservado

### 4.4 Sugestão de Slug

✅ **COMPORTAMENTO**:
- Se slug reservado: adicionar sufixo `-empresa`
- Se slug ocupado: adicionar contador `-1`, `-2`, etc.
- Usar `PublicIdentityService` para sugestão consistente

---

## 5. CHECKLIST DE INTEGRAÇÃO

### 5.1 Preparação

- [x] Core public-identity implementado
- [x] Testes do core aprovados (76 testes, 100%)
- [x] BusinessIdentityAdapter implementado
- [x] BusinessIdentityPolicy implementado
- [ ] Registrar BusinessIdentityAdapter no service

### 5.2 BusinessUrlService

- [ ] Migrar `generateSlug()` para `PublicIdentityService.normalize()`
- [ ] Migrar `isValidSlug()` para `PublicIdentityService.validateFormat()`
- [ ] Refatorar `generateUniqueSlug()` para usar `checkAvailability()`
- [ ] Adicionar checagem de reserved names
- [ ] Remover lógica duplicada de normalização
- [ ] Preservar toda lógica de URL pública
- [ ] Atualizar testes

### 5.3 BusinessService

- [ ] Adicionar validação de slug em `createBusiness()`
- [ ] Adicionar validação de slug + cooldown em `updateBusiness()`
- [ ] Refatorar `generateUniqueSlug()` privado
- [ ] Adicionar tratamento de erro para cooldown
- [ ] Adicionar tratamento de erro para reserved names
- [ ] Atualizar testes

### 5.4 Testes

- [ ] Testes de integração BusinessUrlService + PublicIdentityService
- [ ] Testes de integração BusinessService + PublicIdentityService
- [ ] Testes de cooldown
- [ ] Testes de reserved names
- [ ] Testes de sugestão de slug
- [ ] Testes de validação de formato

### 5.5 Documentação

- [ ] Atualizar README do módulo business
- [ ] Documentar integração com public-identity
- [ ] Documentar fluxo de validação de slug
- [ ] Documentar cooldown e histórico

---

## 6. ESTIMATIVA DE IMPACTO

### 6.1 Arquivos a Alterar

**Core**:
- `src/core/public-identity/services/PublicIdentityService.ts` (registrar adapter)

**Business**:
- `src/core/business/services/BusinessUrlService.ts` (refatorar)
- `src/core/business/services/BusinessService.ts` (adicionar validações)
- `src/core/business/services/__tests__/BusinessUrlService.test.ts` (atualizar)
- `src/core/business/services/__tests__/BusinessService.test.ts` (adicionar)

### 6.2 Arquivos a Preservar

**Sem alteração**:
- `src/core/business/types/*` (tipos permanecem)
- `src/core/business/components/*` (UI não muda nesta fase)
- `src/core/business/hooks/*` (hooks não mudam nesta fase)
- `src/core/routing/*` (rotas não mudam nesta fase)

### 6.3 Compatibilidade

✅ **Retrocompatível**:
- Slugs existentes continuam funcionando
- URLs existentes continuam funcionando
- Histórico existente continua funcionando
- Nenhuma migração de dados necessária

⚠️ **Mudança de comportamento**:
- Validação mais rigorosa de slug
- Cooldown aplicado em updates
- Reserved names bloqueados
- Sugestão automática de slug alternativo

---

## 7. PRÓXIMOS PASSOS

1. ✅ Diagnóstico completo
2. ⏳ Registrar BusinessIdentityAdapter
3. ⏳ Refatorar BusinessUrlService
4. ⏳ Adicionar validações em BusinessService
5. ⏳ Criar/atualizar testes
6. ⏳ Validar integração
7. ⏳ Documentar mudanças

---

**Conclusão**: Integração business é direta e retrocompatível. A maior parte da lógica já existe, apenas precisa ser conectada ao core public-identity para validação consistente.
