# Profile SSOT — Fase 1 Concluída ✅

> **Data**: 2026-04-19  
> **Status**: ✅ FASE 1 CONCLUÍDA  
> **Próximo**: Iniciar Fase 2 (Migração Gradual)

---

## 📋 Resumo da Fase 1

A **Fase 1** da auditoria do domínio Profile foi concluída com sucesso. Criamos toda a arquitetura canônica sem introduzir breaking changes.

### Objetivos Alcançados

✅ Estrutura de pastas SSOT criada  
✅ Entidades canônicas de domínio definidas  
✅ Mappers entre camadas implementados  
✅ Read models consolidados  
✅ Inputs de operação tipados  
✅ Camada de compatibilidade legada criada  
✅ Tipos antigos marcados como `@deprecated`  
✅ Barrel export atualizado  

---

## 📁 Arquivos Criados

### Domain (Entidades Canônicas)

```
src/core/profiles/domain/
├── Profile.ts                  ✅ Entidade canônica (camelCase)
├── ProfileType.ts              ✅ Enum de tipos de perfil
├── ProfileStatus.ts            ✅ Value object de status
├── ProfilePermissions.ts       ✅ Value object de permissões
└── ProfileExtensions.ts        ✅ BusinessData, ProfessionalData, DriverData
```

**Características**:
- Entidade `Profile` com 25+ campos bem documentados
- Separação clara entre identidade, status, localização, contato, verificação, gamificação
- Funções auxiliares: `createDefaultProfile()`, `isProfile()`
- Baseado na migration `20260418010000_update_profiles_system.sql`

### Persistence (Row Types e Mappers)

```
src/core/profiles/persistence/
├── ProfileRow.ts               ✅ Re-export de types.generated (snake_case)
└── ProfileRowMapper.ts         ✅ Mapper row ↔ domain
```

**Características**:
- `ProfileRow` é re-export direto do banco (nunca modificar manualmente)
- `ProfileRowMapper` converte entre snake_case (banco) e camelCase (domínio)
- Mappers bidirecionais: `toDomain()` e `toRow()`

### Views (Read Models)

```
src/core/profiles/views/
├── ProfileSummary.ts           ✅ Read model para listas
├── Author.ts                   ✅ Read model para autoria
├── PublicProfile.ts            ✅ Read model público
└── ProfileContext.ts           ✅ Read model para sessão
```

**Características**:
- **ProfileSummary**: Mínimo para feeds/listas (id, displayName, avatarUrl, verified)
- **ProfileSummaryExtended**: Adiciona username, neighborhood, whatsapp
- **Author**: Para posts/comentários (id, name, avatarUrl, verified)
- **AuthorExtended**: Adiciona username, neighborhood, city
- **PublicProfile**: Para páginas públicas (sem PII)
- **PublicProfileExtended**: Adiciona localização resolvida
- **ProfileContext**: Para sessão (status, permissions, plan, reputation)

### Operations (Inputs/Outputs)

```
src/core/profiles/operations/
├── CreateProfileInput.ts       ✅ Input de criação
├── UpdateProfileInput.ts       ✅ Input de atualização
└── ProfileFilters.ts           ✅ Filtros de query
```

**Características**:
- **CreateProfileInput**: Campos obrigatórios (profile_type, display_name)
- **CreateProfileWithExtensionInput**: Adiciona extension_data para business/professional/driver
- **UpdateProfileInput**: Todos os campos opcionais (partial update)
- **UpdateProfileAdminInput**: Campos admin (reputation, suspended, verified)
- **ProfileFilters**: Filtros básicos (profile_type, verified, is_active, location_id)
- **AdminProfileFilters**: Filtros admin (min_reputation, created_after, order_by)
- **ProfileSearchFilters**: Filtros de busca (query, profile_type, verified)

### Legacy (Compatibilidade Temporária)

```
src/core/profiles/legacy/
├── LegacyProfile.ts            ✅ Tipos legados com @deprecated
└── LegacyMapper.ts             ✅ Mappers legacy ↔ domain
```

**Características**:
- `LegacyProfile`: Interface com todos os campos legados (pontos, telefone, badges, etc.)
- `LegacyProfileType`: Enum legado (personal, company, service)
- `LegacyCreateProfileData`: Input legado de criação
- `LegacyUpdateProfileData`: Input legado de atualização
- Mappers: `toLegacyProfile()`, `fromLegacyProfile()`, `fromLegacyUpdateData()`
- **Todos marcados com `@deprecated`**

---

## 🔄 Arquivos Modificados

### services/types.ts

Adicionado `@deprecated` em:
- `ProfileType` → Use `src/core/profiles/domain/ProfileType.ts`
- `LegacyProfileType` → Não use em código novo
- `ProfileStatus` → Use `src/core/profiles/views/ProfileContext.ts`
- `ProfilePermissions` → Use `src/core/profiles/views/ProfileContext.ts`
- `ProfilePlan` → Use `src/core/profiles/views/ProfileContext.ts`
- `ProfileReputation` → Use `src/core/profiles/views/ProfileContext.ts`
- `ProfileContext` → Use `src/core/profiles/views/ProfileContext.ts`
- `Profile` → Use `src/core/profiles/domain/Profile.ts` (anti-pattern: service redefine entidade)
- `CreateProfileData` → Use `src/core/profiles/operations/CreateProfileInput.ts`
- `UpdateProfileData` → Use `src/core/profiles/operations/UpdateProfileInput.ts`
- `ProfileSummary` → Use `src/core/profiles/views/ProfileSummary.ts`
- `ProfileSummaryExtended` → Use `src/core/profiles/views/ProfileSummary.ts`

### index.ts (Barrel Export)

Atualizado para exportar:
- **Domain**: Profile, ProfileType, ProfileStatus, ProfilePermissions, ProfileExtensions
- **Persistence**: ProfileRow, ProfileInsert, ProfileUpdate, ProfileRowMapper
- **Views**: ProfileSummary, Author, PublicProfile, ProfileContext
- **Operations**: CreateProfileInput, UpdateProfileInput, ProfileFilters
- **Legacy**: LegacyProfile, LegacyMapper (com @deprecated)
- **Services**: ProfileService e ProfileMobilityAdapter. O workflow de
  verificacao foi removido de Profile e pertence a `core/verification`; Profile
  mantem apenas a projecao publica `verified`.

---

## 📊 Estatísticas

### Arquivos Criados

- **Domain**: 5 arquivos
- **Persistence**: 2 arquivos
- **Views**: 4 arquivos
- **Operations**: 3 arquivos
- **Legacy**: 2 arquivos
- **Total**: **16 arquivos novos**

### Linhas de Código

- **Domain**: ~400 linhas
- **Persistence**: ~150 linhas
- **Views**: ~350 linhas
- **Operations**: ~200 linhas
- **Legacy**: ~250 linhas
- **Total**: **~1.350 linhas**

### Tipos Criados

- **Interfaces**: 25+
- **Enums**: 3
- **Type Aliases**: 5+
- **Funções auxiliares**: 10+

---

## 🎯 Próximos Passos (Fase 2)

### Fase 2: Migração Gradual

1. **Atualizar ProfileService**
   - Importar de `domain/` e `operations/`
   - Usar `ProfileRowMapper` para conversões
   - Remover redefinições de Profile

2. **Atualizar hooks**
   - `useProfile`: Importar de `domain/`
   - `usePrivateProfileWorkspace`: Importar de `views/`
   - `useProfileEditor`: Importar de `operations/`

3. **Atualizar componentes (lote por lote)**
   - Componentes de feed: Usar `ProfileSummary`
   - Componentes de autoria: Usar `Author`
   - Componentes de perfil público: Usar `PublicProfile`
   - Componentes de sessão: Usar `ProfileContext`

4. **Atualizar pages (lote por lote)**
   - Páginas de perfil: Usar `PublicProfile`
   - Páginas de admin: Usar `AdminProfileFilters`
   - Páginas de edição: Usar `UpdateProfileInput`

5. **Validação incremental**
   - Rodar `npx tsc --noEmit` após cada lote
   - Rodar `npx eslint src/core/profiles` após cada lote
   - Testar funcionalidades afetadas

---

## ⚠️ Riscos Mitigados

### Fase 1 (Concluída)

✅ **Sem breaking changes**: Tipos antigos ainda funcionam  
✅ **Compatibilidade legada**: Camada `legacy/` permite convivência  
✅ **Deprecation warnings**: Desenvolvedores são alertados  
✅ **Documentação clara**: Cada tipo tem comentário indicando o caminho correto  

### Fase 2 (Próxima)

⚠️ **Quebra de imports**: ~100 arquivos importam de `services/types.ts`  
⚠️ **Conflito de nomes**: `ProfileType` definido em 3 lugares  
⚠️ **Campos legados**: Código pode depender de `pontos`, `badges`, etc.  

**Mitigação**:
- Migrar em lotes pequenos (5-10 arquivos por vez)
- Validar com TypeScript após cada lote
- Manter camada legacy até Fase 3
- Usar mappers para conversão automática

---

## 🔍 Validação da Fase 1

### Checklist de Conformidade

- [x] Apenas 1 definição canônica de `Profile` existe em `domain/`
- [x] `Profile` está em `domain/`, não em `services/`
- [x] Mappers explícitos entre camadas existem
- [x] Views públicas não expõem PII
- [x] Inputs são tipados e validáveis
- [x] Campos legados estão em `legacy/` com `@deprecated`
- [x] Tipos antigos marcados com `@deprecated`
- [x] Barrel export atualizado

### Testes de Validação

```bash
# TypeCheck (deve passar sem erros)
npx tsc --noEmit

# Lint (deve passar sem erros)
npx eslint src/core/profiles --ext .ts,.tsx

# Buscar redefinições de Profile (deve encontrar apenas domain/ e legacy/)
grep -r "interface Profile" src/core/profiles --exclude-dir=node_modules

# Buscar @deprecated (deve encontrar em services/types.ts e legacy/)
grep -r "@deprecated" src/core/profiles
```

---

## 📚 Documentação Atualizada

- ✅ `docs/architecture/PROFILE_SSOT_AUDIT.md` — Auditoria completa
- ✅ `docs/architecture/PROFILE_SSOT_PHASE1_COMPLETE.md` — Este documento
- ⏳ `src/core/profiles/README.md` — Atualizar após Fase 2
- ⏳ `docs/architecture/SSOT_REGISTRY.md` — Atualizar após Fase 2

---

## 🏁 Conclusão da Fase 1

A **Fase 1** estabeleceu a fundação arquitetural sólida para o domínio Profile:

1. **Separação clara de responsabilidades**: domain, persistence, views, operations, legacy
2. **SSOT canônico**: Profile em `domain/Profile.ts`
3. **Compatibilidade preservada**: Camada legacy permite migração gradual
4. **Deprecation explícita**: Tipos antigos marcados para remoção futura
5. **Documentação completa**: Cada tipo tem comentários e exemplos

**Próximo passo**: Iniciar **Fase 2** (Migração Gradual) atualizando ProfileService e hooks.

---

**Status**: ✅ FASE 1 CONCLUÍDA  
**Data**: 2026-04-19  
**Próximo**: Fase 2 — Migração Gradual
