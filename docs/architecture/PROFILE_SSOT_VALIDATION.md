# Profile SSOT — Comandos de Validação

> **Data**: 2026-04-19  
> **Objetivo**: Comandos para validar conformidade SSOT

---

## 🔍 Validação da Fase 1

### TypeScript

```bash
# Validar tipos (deve passar sem erros)
npx tsc --noEmit

# Validar apenas módulo profiles
npx tsc --noEmit --project tsconfig.json --include "src/core/profiles/**/*"
```

### ESLint

```bash
# Validar lint (deve passar sem erros)
npx eslint src/core/profiles --ext .ts,.tsx

# Validar com fix automático
npx eslint src/core/profiles --ext .ts,.tsx --fix
```

### Buscar Redefinições de Profile

```bash
# Deve encontrar apenas domain/ e legacy/
grep -r "interface Profile" src/core/profiles --exclude-dir=node_modules

# Deve encontrar apenas domain/ e legacy/ (Windows PowerShell)
Select-String -Path "src/core/profiles/**/*.ts" -Pattern "interface Profile"
```

### Buscar @deprecated

```bash
# Deve encontrar em services/types.ts e legacy/
grep -r "@deprecated" src/core/profiles

# Windows PowerShell
Select-String -Path "src/core/profiles/**/*.ts" -Pattern "@deprecated"
```

### Buscar Aliases Duplicados

```bash
# Buscar is_verified vs verified
grep -r "is_verified\|verified" src/core/profiles/domain

# Buscar is_suspended vs suspended
grep -r "is_suspended\|suspended" src/core/profiles/domain

# Buscar telefone vs phone
grep -r "telefone\|phone" src/core/profiles/domain
```

### Buscar any Soltos

```bash
# Deve retornar vazio (nenhum any em domain/)
grep -r ": any" src/core/profiles/domain

# Windows PowerShell
Select-String -Path "src/core/profiles/domain/**/*.ts" -Pattern ": any"
```

---

## 🔍 Validação da Fase 2

### Buscar Imports de services/types.ts

```bash
# Deve diminuir a cada lote migrado
grep -r "from.*services/types" src/core/profiles --exclude-dir=node_modules

# Contar imports restantes
grep -r "from.*services/types" src/core/profiles --exclude-dir=node_modules | wc -l

# Windows PowerShell
(Select-String -Path "src/core/profiles/**/*.ts" -Pattern "from.*services/types").Count
```

### Buscar Imports Canônicos

```bash
# Deve aumentar a cada lote migrado
grep -r "from.*domain/Profile" src/core/profiles --exclude-dir=node_modules

# Contar imports canônicos
grep -r "from.*domain/Profile" src/core/profiles --exclude-dir=node_modules | wc -l

# Windows PowerShell
(Select-String -Path "src/core/profiles/**/*.ts" -Pattern "from.*domain/Profile").Count
```

### Validar Lote Específico

```bash
# Exemplo: Validar Lote 1 (Core Mappers e Hooks)
npx tsc --noEmit src/core/profiles/mappers/ProfileMapper.ts
npx tsc --noEmit src/core/profiles/hooks/useProfile.ts
npx tsc --noEmit src/core/auth/hooks/useProfileContextIntegration.ts

npx eslint src/core/profiles/mappers/ProfileMapper.ts
npx eslint src/core/profiles/hooks/useProfile.ts
npx eslint src/core/auth/hooks/useProfileContextIntegration.ts
```

---

## 🔍 Validação da Fase 3

### Buscar Tipos Legados Ainda em Uso

```bash
# Deve retornar vazio após Fase 3
grep -r "LegacyProfile" src/ --exclude-dir=node_modules --exclude-dir=legacy

# Buscar pontos (campo legado)
grep -r "pontos" src/core/profiles --exclude-dir=node_modules --exclude-dir=legacy

# Buscar badges (campo legado)
grep -r "badges" src/core/profiles --exclude-dir=node_modules --exclude-dir=legacy

# Buscar author_profile_id (campo legado)
grep -r "author_profile_id" src/core/profiles --exclude-dir=node_modules --exclude-dir=legacy
```

### Buscar Redefinições de ProfileType

```bash
# Deve encontrar apenas 1 (em domain/)
grep -r "type ProfileType" src/ --exclude-dir=node_modules

# Deve encontrar apenas 1 (em domain/)
grep -r "export type ProfileType" src/ --exclude-dir=node_modules
```

---

## 🔍 Validação da Fase 4

### Verificar Regras ESLint

```bash
# Verificar se regras foram adicionadas
cat .eslintrc.js | grep -A 10 "profile-ssot"

# Windows PowerShell
Select-String -Path ".eslintrc.js" -Pattern "profile-ssot" -Context 0,10
```

### Testar Regras ESLint

```bash
# Tentar criar Profile fora de domain/ (deve falhar)
echo "export interface Profile { id: string; }" > src/test-profile.ts
npx eslint src/test-profile.ts
rm src/test-profile.ts

# Tentar usar any em input (deve falhar)
echo "export interface TestInput { data: any; }" > src/core/profiles/operations/TestInput.ts
npx eslint src/core/profiles/operations/TestInput.ts
rm src/core/profiles/operations/TestInput.ts
```

---

## 📊 Métricas de Progresso

### Fase 1

```bash
# Contar arquivos criados
ls -1 src/core/profiles/domain | wc -l
ls -1 src/core/profiles/persistence | wc -l
ls -1 src/core/profiles/views | wc -l
ls -1 src/core/profiles/operations | wc -l
ls -1 src/core/profiles/legacy | wc -l

# Windows PowerShell
(Get-ChildItem "src/core/profiles/domain").Count
(Get-ChildItem "src/core/profiles/persistence").Count
(Get-ChildItem "src/core/profiles/views").Count
(Get-ChildItem "src/core/profiles/operations").Count
(Get-ChildItem "src/core/profiles/legacy").Count
```

### Fase 2

```bash
# Progresso de migração (%)
# Total de arquivos: 30
# Arquivos migrados: contar imports canônicos

# Contar arquivos com imports canônicos
grep -rl "from.*domain/Profile" src/ --exclude-dir=node_modules | wc -l

# Contar arquivos com imports legados
grep -rl "from.*services/types.*Profile" src/ --exclude-dir=node_modules | wc -l

# Windows PowerShell
(Select-String -Path "src/**/*.ts" -Pattern "from.*domain/Profile" -List).Count
(Select-String -Path "src/**/*.ts" -Pattern "from.*services/types.*Profile" -List).Count
```

### Fase 3

```bash
# Contar tipos legados removidos
# Antes: 7 definições de Profile
# Depois: 1 definição de Profile

grep -r "interface Profile" src/ --exclude-dir=node_modules | wc -l

# Windows PowerShell
(Select-String -Path "src/**/*.ts" -Pattern "interface Profile").Count
```

---

## 🧪 Testes Manuais

### Fase 1

1. **Importar Profile canônico**
   ```typescript
   import type { Profile } from '@/core/profiles/domain/Profile';
   
   const profile: Profile = {
     id: '123',
     userId: '456',
     profileType: 'personal',
     slug: 'john-doe',
     username: 'johndoe',
     displayName: 'John Doe',
     // ... outros campos
   };
   ```

2. **Usar ProfileRowMapper**
   ```typescript
   import { ProfileRowMapper } from '@/core/profiles/persistence/ProfileRowMapper';
   import type { ProfileRow } from '@/core/profiles/persistence/ProfileRow';
   
   const row: ProfileRow = { /* ... */ };
   const profile = ProfileRowMapper.toDomain(row);
   ```

3. **Usar ProfileSummary**
   ```typescript
   import type { ProfileSummary } from '@/core/profiles/views/ProfileSummary';
   import { createProfileSummary } from '@/core/profiles/views/ProfileSummary';
   
   const summary = createProfileSummary({
     id: '123',
     displayName: 'John Doe',
     avatarUrl: 'https://...',
     verified: true,
   });
   ```

### Fase 2

1. **Verificar imports atualizados**
   - Abrir arquivo migrado
   - Verificar que imports são de `domain/`, `views/`, `operations/`
   - Verificar que não há imports de `services/types.ts` (exceto agregados)

2. **Verificar TypeScript**
   - Rodar `npx tsc --noEmit`
   - Verificar que não há erros

3. **Verificar funcionalidade**
   - Testar funcionalidade afetada
   - Verificar que comportamento é o mesmo

### Fase 3

1. **Verificar remoção de tipos legados**
   - Buscar `LegacyProfile` (deve retornar vazio)
   - Buscar `pontos` (deve retornar vazio)
   - Buscar `badges` (deve retornar vazio)

2. **Verificar consolidação de ProfileType**
   - Buscar `type ProfileType` (deve encontrar apenas 1)
   - Verificar que está em `domain/ProfileType.ts`

### Fase 4

1. **Testar regras ESLint**
   - Tentar criar `Profile` fora de `domain/` (deve falhar)
   - Tentar usar `any` em input (deve falhar)
   - Tentar importar `Profile` de `services/types.ts` (deve falhar)

---

## 🎯 Checklist de Conformidade Final

### Fase 1 ✅

- [x] Apenas 1 definição canônica de `Profile` existe em `domain/`
- [x] `Profile` está em `domain/`, não em `services/`
- [x] Mappers explícitos entre camadas existem
- [x] Views públicas não expõem PII
- [x] Inputs são tipados e validáveis
- [x] Campos legados estão em `legacy/` com `@deprecated`
- [x] Tipos antigos marcados com `@deprecated`
- [x] Barrel export atualizado
- [x] TypeScript passa sem erros
- [x] ESLint passa sem erros

### Fase 2 ⏳

- [ ] Todos os 30 arquivos migrados
- [ ] Nenhum import de `Profile` de `services/types.ts` (exceto agregados)
- [ ] Imports canônicos de `domain/`, `views/`, `operations/`
- [ ] TypeScript passa sem erros
- [ ] ESLint passa sem erros
- [ ] Testes manuais passam

### Fase 3 ⏳

- [ ] `src/core/profiles/types/Profile.ts` removido
- [ ] `src/shared/types/core.generated.ts` Profile removido
- [ ] Redefinições locais removidas
- [ ] `ProfileType` consolidado em um único lugar
- [ ] Campos legados removidos (`pontos`, `badges`, `author_profile_id`)
- [ ] Camada `legacy/` removida
- [ ] TypeScript passa sem erros
- [ ] ESLint passa sem erros

### Fase 4 ⏳

- [ ] Regra ESLint: proibir redefinição de `Profile` fora de `domain/`
- [ ] Regra ESLint: proibir `any` em inputs de Profile
- [ ] Regra ESLint: proibir import de `services/types.ts` Profile
- [ ] Documentação atualizada (`README.md`, `SSOT_REGISTRY.md`)
- [ ] Testes de regras ESLint passam

---

**Status**: ✅ FASE 1 VALIDADA  
**Data**: 2026-04-19  
**Próximo**: Validação da Fase 2
