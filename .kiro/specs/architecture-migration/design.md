# Documento de Design: Migração de Arquitetura Feature-First

## Visão Geral

Este documento descreve o design técnico para migrar a base de código de uma arquitetura baseada em camadas (layer-based) para uma arquitetura feature-first organizada por domínio.

### Objetivos

1. **Migrar o projeto real** - Foco em executar a migração concreta, não em construir framework de migração
2. **Definir núcleo canônico primeiro** - Consolidar modelagem central de user/profile/author antes de mover código
3. **Criar espinha dorsal nova** - Estabelecer estrutura base com regras de dependência corretas
4. **Migrar núcleo fundacional primeiro** - auth → users → profiles → permissions → resto
5. **Compatibility layer curta** - Temporária e rastreável, removida assim que possível
6. **Preservar padrões SSOT** - Manter integridade dos dados durante migração

### Contexto

A arquitetura atual organiza código por tipo técnico (components/, services/, hooks/, pages/), dificultando:
- Localizar código relacionado a uma feature
- Entender dependências entre domínios
- Escalar o time
- Realizar code splitting eficiente

A nova arquitetura organiza por domínio/funcionalidade, melhorando coesão e reduzindo acoplamento.


## Arquitetura

### Estrutura Atual (Layer-Based)

```
src/
├── components/        # 30+ domínios misturados
├── services/          # 20+ serviços por domínio
├── hooks/             # 50+ hooks organizados por domínio
├── pages/             # 40+ páginas
├── types/             # Types centralizados
├── contexts/          # Auth, Location, Profile
├── lib/               # Utilities, validation
├── validation/        # Schemas Zod por domínio
└── stores/            # Zustand stores
```

### Estrutura Alvo (Feature-First)

```
src/
├── app/                    # Router, layouts, providers, config
│   ├── router/
│   ├── layouts/
│   ├── providers/
│   └── config/
├── shared/                 # UI genérica, hooks, utils, constants (SEM dependências)
│   ├── components/ui/
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   └── types/
├── core/                   # Sistemas transversais centrais
│   ├── auth/
│   ├── users/
│   ├── profiles/
│   ├── permissions/
│   ├── notifications/
│   ├── messaging/
│   ├── moderation/
│   ├── media/
│   ├── reputation/
│   ├── audit/
│   ├── search/
│   └── location/
├── integrations/           # Camada de infraestrutura (SEM dependências superiores)
│   ├── supabase/
│   ├── realtime/
│   ├── maps/
│   └── external-notifications/
└── modules/                # Domínios do produto
    ├── dashboard/
    ├── profile/
    ├── community/
    ├── business/
    ├── services/
    ├── classifieds/
    ├── mobility/
    └── admin/
```

### Estrutura Interna de Módulo

```
modules/community/
├── components/           # Componentes específicos do domínio
│   ├── feed/
│   ├── posts/
│   ├── comments/
│   └── groups/
├── hooks/               # Hooks específicos do domínio
├── services/            # Lógica de negócio
├── types/               # Types específicos
├── pages/               # Páginas do domínio
├── schemas/             # Validação Zod
├── stores/              # Estado local (se necessário)
└── index.ts             # Exports públicos (APENAS API pública)
```

### Regras de Dependência (CORRETAS)

```
app/* → modules/*         ✅ Permitido
app/* → core/*            ✅ Permitido
app/* → shared/*          ✅ Permitido

modules/* → core/*        ✅ Permitido
modules/* → shared/*      ✅ Permitido
modules/* → integrations/* ❌ PROIBIDO (usar core como intermediário)
modules/A → modules/B     ❌ PROIBIDO (cross-module import)

core/* → integrations/*   ✅ Permitido
core/* → shared/*         ✅ Permitido
core/* → modules/*        ❌ PROIBIDO

shared/* → *              ❌ PROIBIDO (camada sem dependências)

integrations/* → *        ❌ PROIBIDO (camada de infraestrutura)
```

**Justificativa das regras**:
- **shared** não pode depender de nada (componentes UI puros, utils genéricos)
- **integrations** é camada de infraestrutura (não depende de lógica de negócio)
- **core** pode usar integrations e shared (sistemas transversais)
- **modules** NÃO pode acessar integrations diretamente (usar core como intermediário)
- **modules** NÃO pode importar outros modules (isolamento de domínio)


## Componentes e Interfaces

### Núcleo Canônico (DEFINIR ANTES DE MOVER CÓDIGO)

Antes de migrar blocos grandes, consolidar modelagem central:

#### Entidades Principais

```typescript
// core/users/types/User.ts - Entidade principal do sistema
interface User {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

// core/profiles/types/Profile.ts - Perfil do usuário
interface Profile {
  id: string;
  user_id: string;  // FK para User
  display_name: string;
  avatar_url?: string;
  bio?: string;
}

// core/profiles/types/PublicProfile.ts - Identidade pública
interface PublicProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  reputation_score: number;
  // NÃO expõe dados sensíveis
}

// core/profiles/types/Author.ts - Quem assina conteúdo
interface Author {
  profile_id: string;
  display_name: string;
  avatar_url?: string;
  // Usado em posts, comments, reviews
}

// modules/mobility/types/DriverProfile.ts - Perfil específico de módulo
interface DriverProfile {
  profile_id: string;  // FK para Profile
  license_number: string;
  vehicle_info: VehicleInfo;
  rating: number;
}

// modules/business/types/BusinessOwnerProfile.ts - Perfil específico de módulo
interface BusinessOwnerProfile {
  profile_id: string;  // FK para Profile
  business_id: string;
  role: 'owner' | 'manager';
}
```

#### Conexões Entre Entidades

```
User (core/users)
  ↓ 1:1
Profile (core/profiles)
  ↓ 1:1
PublicProfile (core/profiles) ← usado para exibição pública
  ↓
Author (core/profiles) ← usado para assinar conteúdo
  ↓ 1:N
DriverProfile (modules/mobility) ← perfil específico de domínio
BusinessOwnerProfile (modules/business) ← perfil específico de domínio
```

#### Perguntas Respondidas

1. **Qual é a entidade principal do sistema?**
   - `User` em `core/users` - representa conta/autenticação

2. **O que é identidade pública?**
   - `PublicProfile` em `core/profiles` - dados seguros para exibição pública

3. **O que assina conteúdo?**
   - `Author` em `core/profiles` - referência para quem criou posts/comments/reviews

4. **Como business/services/mobility se conectam ao usuário central?**
   - Via `profile_id` - cada módulo tem seu próprio perfil específico (DriverProfile, BusinessOwnerProfile)
   - Todos referenciam `Profile` central em `core/profiles`

### Sistema de Permissões

```typescript
// core/permissions/types/Permission.ts
interface Permission {
  id: string;
  resource: string;  // 'post', 'business', 'ride'
  action: string;    // 'create', 'read', 'update', 'delete'
  scope: 'own' | 'any';
}

// core/permissions/types/Role.ts
interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

// core/permissions/services/PermissionService.ts
class PermissionService {
  canUserPerformAction(
    userId: string,
    resource: string,
    action: string,
    resourceOwnerId?: string
  ): Promise<boolean>;
}
```

### Ferramentas Simples de Migração

**NÃO criar framework complexo**. Usar ferramentas simples e manuais:

#### Script de Movimentação de Arquivo

```typescript
// scripts/move-file.ts
async function moveFile(source: string, destination: string) {
  // 1. Copiar arquivo
  await fs.copyFile(source, destination);
  
  // 2. Atualizar imports (manual ou semi-automático)
  console.log(`Moved: ${source} → ${destination}`);
  console.log('TODO: Update imports in other files');
  
  // 3. Validar compilação
  const result = await exec('tsc --noEmit');
  if (result.exitCode !== 0) {
    console.error('Compilation failed! Revert changes.');
  }
}
```

#### Validação Simples

```typescript
// scripts/validate.ts
async function validate() {
  // 1. Compilação TypeScript
  console.log('Checking TypeScript...');
  await exec('tsc --noEmit');
  
  // 2. Testes
  console.log('Running tests...');
  await exec('npm test');
  
  // 3. ESLint
  console.log('Running ESLint...');
  await exec('npm run lint');
  
  console.log('✅ Validation passed');
}
```

#### Compatibility Layer Simples

```typescript
// src/components/community/PostCard.tsx (re-export temporário)
export { PostCard } from '@/modules/community/components/PostCard';

// Permite imports antigos continuarem funcionando:
// import { PostCard } from '@/components/community/PostCard'; ✅
```

### Configuração de Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/app/*": ["./src/app/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/core/*": ["./src/core/*"],
      "@/integrations/*": ["./src/integrations/*"],
      "@/modules/*": ["./src/modules/*"]
    }
  }
}
```

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      "@/app": path.resolve(__dirname, "./src/app"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
      "@/core": path.resolve(__dirname, "./src/core"),
      "@/integrations": path.resolve(__dirname, "./src/integrations"),
      "@/modules": path.resolve(__dirname, "./src/modules")
    }
  }
});
```

### Regras ESLint de Dependência

```javascript
// eslint.config.js
export default [
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/modules/*/'],
            message: 'Cross-module imports are not allowed'
          },
          {
            group: ['@/core/*'],
            importNames: ['*'],
            message: 'Core cannot depend on modules'
          },
          {
            group: ['@/shared/*'],
            importNames: ['*'],
            message: 'Shared cannot have dependencies'
          },
          {
            group: ['@/integrations/*'],
            importNames: ['*'],
            message: 'Integrations is infrastructure layer'
          }
        ]
      }]
    }
  }
];
```

### Regra Proibindo Acesso Direto ao Supabase

```javascript
// eslint.config.js (adicionar)
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@supabase/supabase-js'],
          message: 'Direct Supabase access not allowed. Use @/integrations/supabase or @/core/* services'
        }
      ]
    }]
  }
}
```


## Modelos de Dados

### Configuração de Migração

```typescript
// .kiro/migration-config.json
interface MigrationConfig {
  version: string;
  phases: Phase[];
}

interface Phase {
  name: string;
  order: number;
  directories: string[];
}

// Exemplo
{
  "version": "1.0.0",
  "phases": [
    { "name": "app", "order": 1, "directories": ["src/app"] },
    { "name": "shared", "order": 2, "directories": ["src/shared"] },
    { "name": "core", "order": 3, "directories": ["src/core"] },
    { "name": "integrations", "order": 4, "directories": ["src/integrations"] },
    { "name": "modules", "order": 5, "directories": ["src/modules"] }
  ]
}
```

### Estado de Migração

```typescript
// .kiro/migration-status.json
interface MigrationStatus {
  currentPhase: string | null;
  completedPhases: CompletedPhase[];
  startedAt: string;
}

interface CompletedPhase {
  name: string;
  completedAt: string;
  commitHash: string;
}
```


## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema - essencialmente, uma declaração formal sobre o que o sistema deve fazer.*

### Property 1: Ordem de Migração

*Para qualquer* sequência de fases executadas, as fases devem seguir a ordem: criar espinha dorsal → auth → users → profiles → permissions → sistemas transversais → módulos de domínio.

**Valida: Requisitos 1.1, 1.2**

### Property 2: Compilação Após Cada Etapa

*Para qualquer* arquivo movido, após a movimentação e atualização de imports, o código TypeScript deve compilar sem erros.

**Valida: Requisitos 2.6, 5.1**

### Property 3: Invariante SSOT

*Para qualquer* entidade SSOT, deve existir exatamente uma definição autoritativa antes e depois de qualquer operação de migração.

**Valida: Requisitos 3.1, 3.5**

### Property 4: Regras de Dependência

*Para qualquer* import no código, a direção deve seguir as regras: app → modules/core/shared, modules → core/shared, core → integrations/shared, shared → nada, integrations → nada.

**Valida: Requisitos 7.6, 10.4**

### Property 5: Isolamento de Módulos

*Para qualquer* par de módulos (A, B) onde A ≠ B, imports de modules/A para modules/B devem ser proibidos e detectados pelo ESLint.

**Valida: Requisitos 7.7, 17**

### Property 6: Barrel Exports Apenas para API Pública

*Para qualquer* módulo, o arquivo index.ts deve exportar apenas componentes, serviços, hooks e types públicos, não internals.

**Valida: Requisitos 8.1, 8.3**

### Property 7: Testes Continuam Passando

*Para qualquer* teste que passava antes da migração, esse teste deve continuar passando após a migração.

**Valida: Requisitos 12.6, 28**

### Property 8: Núcleo Canônico Definido

*Para qualquer* entidade central (User, Profile, Author), deve existir uma definição canônica em core/* antes de qualquer módulo referenciar essa entidade.

**Valida: Requisito implícito de consolidação do núcleo**


## Tratamento de Erros

### Estratégia Geral

Abordagem fail-fast simples:

1. **Validar antes de executar** - Verificar pré-condições
2. **Detectar imediatamente** - Parar ao primeiro erro
3. **Reportar claramente** - Mostrar o que deu errado e onde
4. **Reverter manualmente** - Usar git reset se necessário

### Categorias de Erros

#### Erros de Compilação

**Quando**: Após mover arquivos ou atualizar imports

**Tratamento**:
```bash
# Executar compilação
tsc --noEmit

# Se falhar, reverter
git reset --hard HEAD
```

**Exemplo de reporte**:
```
❌ Compilation Error
File: src/components/LoginForm.tsx:15:23
Error: Cannot find module '@/services/auth/AuthService'
Action: Revert changes with: git reset --hard HEAD
```

#### Erros de Teste

**Quando**: Após completar uma etapa

**Tratamento**:
```bash
# Executar testes
npm test

# Se falhar, reverter
git reset --hard HEAD
```

**Exemplo de reporte**:
```
❌ Test Failures
Failed: src/core/auth/__tests__/AuthService.test.ts
  ✗ should authenticate user with valid credentials
Action: Fix test or revert with: git reset --hard HEAD
```

#### Violações SSOT

**Quando**: Após mover arquivos SSOT

**Tratamento**:
```bash
# Executar ESLint
npm run lint

# Se violação, corrigir manualmente
```

**Exemplo de reporte**:
```
❌ SSOT Violation
Entity: User
Definitions:
  1. src/core/users/types/User.ts (NEW)
  2. src/types/User.ts (OLD - remove this)
Action: Remove old definition manually
```

#### Violações de Regras de Import

**Quando**: Após mover arquivos

**Tratamento**:
```bash
# ESLint detecta automaticamente
npm run lint
```

**Exemplo de reporte**:
```
❌ Import Rule Violation
File: src/modules/community/services/PostService.ts:5
Import: import { BusinessService } from '@/modules/business'
Rule: Cross-module imports not allowed
Action: Move shared logic to core or use events
```


## Estratégia de Testes

### Abordagem Dual

- **Testes Unitários**: Exemplos específicos, casos extremos, condições de erro
- **Testes de Propriedades**: Propriedades universais através de múltiplas entradas

Ambos são complementares e necessários.

### Biblioteca de Property-Based Testing

**Biblioteca**: `fast-check` (TypeScript/JavaScript)

**Instalação**:
```bash
npm install --save-dev fast-check
```

**Configuração**: Mínimo 100 iterações por teste

### Exemplos de Testes

#### Teste Unitário: Validação de Compilação

```typescript
import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Migration Validation', () => {
  it('should compile without errors after moving file', async () => {
    // Move file
    await moveFile('src/services/auth/AuthService.ts', 'src/core/auth/services/AuthService.ts');
    
    // Validate compilation
    const result = await execAsync('tsc --noEmit');
    expect(result.stderr).toBe('');
  });
});
```

#### Teste de Propriedade: Invariante SSOT

```typescript
import { describe, it } from 'vitest';
import fc from 'fast-check';
import { SSOTValidator } from './SSOTValidator';

describe('SSOTValidator', () => {
  // Feature: architecture-migration, Property 3: Invariante SSOT
  it('should maintain exactly one definition for each SSOT entity', () => {
    const validator = new SSOTValidator();
    
    fc.assert(
      fc.property(
        fc.constantFrom('User', 'Post', 'Comment', 'Business'),
        async (entity) => {
          const count = await validator.countDefinitions(entity);
          expect(count).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Teste de Propriedade: Regras de Dependência

```typescript
import { describe, it } from 'vitest';
import fc from 'fast-check';
import { DependencyValidator } from './DependencyValidator';

describe('DependencyValidator', () => {
  // Feature: architecture-migration, Property 4: Regras de Dependência
  it('should enforce dependency rules', () => {
    const validator = new DependencyValidator();
    
    fc.assert(
      fc.property(
        fc.record({
          from: fc.constantFrom('app', 'modules', 'core', 'shared', 'integrations'),
          to: fc.constantFrom('app', 'modules', 'core', 'shared', 'integrations')
        }),
        (dep) => {
          const allowed = validator.isAllowed(dep.from, dep.to);
          
          // Verificar regras
          if (dep.from === 'shared' || dep.from === 'integrations') {
            expect(allowed).toBe(false);
          }
          if (dep.from === 'core' && dep.to === 'modules') {
            expect(allowed).toBe(false);
          }
          if (dep.from === 'modules' && dep.to === 'integrations') {
            expect(allowed).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Cobertura de Testes

**Meta**:
- Cobertura de linha: mínimo 80%
- Cobertura de propriedades: 100% (todas as 8 propriedades principais)

**Ferramentas**:
- Vitest para execução
- fast-check para property-based testing
- c8 para cobertura


## Plano de Execução Concreto

### Fase 1: Criar Espinha Dorsal (1-2 dias)

#### 1.1 Criar Estrutura de Diretórios

```bash
# Criar diretórios base
mkdir -p src/app/{router,layouts,providers,config}
mkdir -p src/shared/{components/ui,hooks,utils,constants,types}
mkdir -p src/core/{auth,users,profiles,permissions}
mkdir -p src/integrations/{supabase,realtime,maps,external-notifications}
mkdir -p src/modules
```

#### 1.2 Configurar Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/app/*": ["./src/app/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/core/*": ["./src/core/*"],
      "@/integrations/*": ["./src/integrations/*"],
      "@/modules/*": ["./src/modules/*"]
    }
  }
}
```

```typescript
// vite.config.ts
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      "@/app": path.resolve(__dirname, "./src/app"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
      "@/core": path.resolve(__dirname, "./src/core"),
      "@/integrations": path.resolve(__dirname, "./src/integrations"),
      "@/modules": path.resolve(__dirname, "./src/modules")
    }
  }
});
```

#### 1.3 Configurar Regras ESLint

```javascript
// eslint.config.js
export default [
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/modules/*/'],
            message: 'Cross-module imports not allowed'
          },
          {
            group: ['@supabase/supabase-js'],
            message: 'Direct Supabase access not allowed. Use @/integrations/supabase'
          }
        ]
      }]
    }
  }
];
```

#### 1.4 Validar Estrutura

```bash
# Verificar que tudo compila
npm run build

# Executar testes
npm test

# Commit
git add .
git commit -m "chore: create feature-first directory structure"
```

### Fase 2: Definir Núcleo Canônico (2-3 dias)

#### 2.1 Criar Entidades Principais

```typescript
// src/core/users/types/User.ts
export interface User {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

// src/core/users/index.ts
export * from './types/User';
```

```typescript
// src/core/profiles/types/Profile.ts
export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
}

// src/core/profiles/types/PublicProfile.ts
export interface PublicProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  reputation_score: number;
}

// src/core/profiles/types/Author.ts
export interface Author {
  profile_id: string;
  display_name: string;
  avatar_url?: string;
}

// src/core/profiles/index.ts
export * from './types/Profile';
export * from './types/PublicProfile';
export * from './types/Author';
```

#### 2.2 Criar Sistema de Permissões

```typescript
// src/core/permissions/types/Permission.ts
export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: 'own' | 'any';
}

// src/core/permissions/types/Role.ts
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

// src/core/permissions/index.ts
export * from './types/Permission';
export * from './types/Role';
```

#### 2.3 Validar Núcleo

```bash
# Compilar
tsc --noEmit

# Commit
git add .
git commit -m "feat: define canonical core entities (User, Profile, Author, Permissions)"
```

### Fase 3: Migrar Núcleo Fundacional (1 semana)

#### 3.1 Migrar Auth (Dia 1)

```bash
# Mover arquivos
mv src/services/auth/* src/core/auth/services/
mv src/contexts/AuthContext.tsx src/core/auth/contexts/
mv src/hooks/useAuth.ts src/core/auth/hooks/

# Criar barrel export
cat > src/core/auth/index.ts << 'EOF'
export * from './services/AuthService';
export * from './contexts/AuthContext';
export * from './hooks/useAuth';
EOF

# Atualizar imports (buscar e substituir)
# @/services/auth → @/core/auth
# @/contexts/AuthContext → @/core/auth

# Validar
tsc --noEmit
npm test

# Commit
git add .
git commit -m "refactor: migrate auth to core"
```

#### 3.2 Migrar Users (Dia 2)

```bash
# Mover arquivos
mv src/services/users/* src/core/users/services/
mv src/hooks/useUser.ts src/core/users/hooks/

# Criar barrel export
cat > src/core/users/index.ts << 'EOF'
export * from './types/User';
export * from './services/UserService';
export * from './hooks/useUser';
EOF

# Atualizar imports
# @/services/users → @/core/users

# Validar
tsc --noEmit
npm test

# Commit
git add .
git commit -m "refactor: migrate users to core"
```

#### 3.3 Migrar Profiles (Dia 3)

```bash
# Mover arquivos
mv src/services/profiles/* src/core/profiles/services/
mv src/hooks/useProfile.ts src/core/profiles/hooks/

# Atualizar barrel export
cat >> src/core/profiles/index.ts << 'EOF'
export * from './services/ProfileService';
export * from './hooks/useProfile';
EOF

# Atualizar imports
# @/services/profiles → @/core/profiles

# Validar
tsc --noEmit
npm test

# Commit
git add .
git commit -m "refactor: migrate profiles to core"
```

#### 3.4 Migrar Permissions (Dia 4)

```bash
# Mover arquivos
mv src/services/permissions/* src/core/permissions/services/
mv src/hooks/usePermissions.ts src/core/permissions/hooks/

# Atualizar barrel export
cat >> src/core/permissions/index.ts << 'EOF'
export * from './services/PermissionService';
export * from './hooks/usePermissions';
EOF

# Atualizar imports
# @/services/permissions → @/core/permissions

# Validar
tsc --noEmit
npm test

# Commit
git add .
git commit -m "refactor: migrate permissions to core"
```

#### 3.5 Migrar Sistemas Transversais Restantes (Dia 5)

```bash
# Notifications
mv src/services/notifications/* src/core/notifications/

# Messaging
mv src/services/messaging/* src/core/messaging/

# Moderation
mv src/services/moderation/* src/core/moderation/

# Media
mv src/services/media/* src/core/media/

# Reputation
mv src/services/reputation/* src/core/reputation/

# Audit
mv src/services/audit/* src/core/audit/

# Search
mv src/services/search/* src/core/search/

# Location
mv src/services/location/* src/core/location/

# Criar barrel exports para cada um
# Atualizar imports
# Validar e commit
```

### Fase 4: Migrar Integrations (1 dia)

```bash
# Mover Supabase
mv src/lib/supabase/* src/integrations/supabase/

# Mover Realtime
mv src/lib/realtime/* src/integrations/realtime/

# Mover Maps
mv src/lib/maps/* src/integrations/maps/

# Criar barrel exports
# Atualizar imports
# Validar e commit
```

### Fase 5: Migrar Shared (1 dia)

```bash
# Mover UI components
mv src/components/ui/* src/shared/components/ui/

# Mover hooks genéricos
mv src/hooks/common/* src/shared/hooks/

# Mover utils
mv src/lib/utils/* src/shared/utils/

# Mover constants
mv src/constants/* src/shared/constants/

# Criar barrel exports
# Atualizar imports
# Validar e commit
```

### Fase 6: Migrar Módulos de Domínio (2-3 semanas)

#### Ordem de Migração:
1. **dashboard** (mais simples)
2. **profile** (depende de core)
3. **business** (base para outros)
4. **services** (depende de business)
5. **classifieds** (independente)
6. **mobility** (mais complexo)
7. **admin** (depende de todos)

#### Template de Migração por Módulo:

```bash
# Exemplo: modules/community
mkdir -p src/modules/community/{components,hooks,services,types,pages,schemas}

# Mover componentes
mv src/components/community/* src/modules/community/components/

# Mover services
mv src/services/community/* src/modules/community/services/

# Mover hooks
mv src/hooks/community/* src/modules/community/hooks/

# Mover types
mv src/types/community/* src/modules/community/types/

# Mover pages
mv src/pages/community/* src/modules/community/pages/

# Mover schemas
mv src/validation/community/* src/modules/community/schemas/

# Criar barrel export (APENAS API PÚBLICA)
cat > src/modules/community/index.ts << 'EOF'
// Components
export { CommunityFeed } from './components/CommunityFeed';
export { PostCard } from './components/PostCard';

// Services
export { CommunityService } from './services/CommunityService';

// Hooks
export { useCommunity } from './hooks/useCommunity';

// Types
export * from './types';
EOF

# Atualizar imports
# @/components/community → @/modules/community
# @/services/community → @/modules/community

# Validar
tsc --noEmit
npm test
npm run lint

# Commit
git add .
git commit -m "refactor: migrate community module"
```

### Fase 7: Limpeza e Consolidação (1 semana)

#### 7.1 Remover Compatibility Layer

```bash
# Remover re-exports antigos
rm -rf src/components/
rm -rf src/services/
rm -rf src/hooks/

# Atualizar todos os imports para usar novos caminhos
# Buscar e substituir em todo o projeto
```

#### 7.2 Validação Final

```bash
# Compilação
tsc --noEmit

# Testes
npm test

# Lint
npm run lint

# Build
npm run build

# Verificar bundle size
ls -lh dist/
```

#### 7.3 Documentação

```bash
# Atualizar README.md
# Criar ARCHITECTURE.md
# Documentar regras de import
# Criar guia de migração para novos devs
```

### Checklist da Fase 1 (Espinha Dorsal)

- [ ] Criar diretórios: app/, shared/, core/, integrations/, modules/
- [ ] Configurar path aliases em tsconfig.json
- [ ] Configurar aliases em vite.config.ts
- [ ] Adicionar regras ESLint de dependência
- [ ] Adicionar regra proibindo acesso direto ao Supabase
- [ ] Validar que projeto compila
- [ ] Validar que testes passam
- [ ] Commit: "chore: create feature-first directory structure"

### Riscos e Pontos de Bloqueio

#### Riscos Identificados

1. **Dependências circulares entre core systems**
   - Mitigação: Migrar na ordem correta (auth → users → profiles → permissions)
   - Usar interfaces para quebrar ciclos se necessário

2. **Imports quebrados após movimentação**
   - Mitigação: Usar buscar e substituir cuidadosamente
   - Validar compilação após cada movimentação
   - Manter compatibility layer temporária se necessário

3. **Testes falhando após migração**
   - Mitigação: Executar testes após cada etapa
   - Atualizar imports em arquivos de teste
   - Reverter se testes falharem

4. **Módulos acessando integrations diretamente**
   - Mitigação: ESLint detecta e bloqueia
   - Refatorar para usar core como intermediário

5. **Cross-module imports**
   - Mitigação: ESLint detecta e bloqueia
   - Mover lógica compartilhada para core

6. **Bundle size aumentando**
   - Mitigação: Usar barrel exports apenas para API pública
   - Configurar tree-shaking corretamente
   - Monitorar bundle size após cada fase

#### Pontos de Bloqueio

1. **Definição do núcleo canônico incompleta**
   - Bloqueio: Não pode migrar módulos sem definir User/Profile/Author
   - Solução: Completar Fase 2 antes de Fase 3

2. **Regras de dependência não configuradas**
   - Bloqueio: Código pode violar arquitetura sem detecção
   - Solução: Configurar ESLint na Fase 1

3. **Testes não passando**
   - Bloqueio: Não pode prosseguir se testes falharem
   - Solução: Corrigir testes ou reverter mudanças

4. **Compilação falhando**
   - Bloqueio: Não pode prosseguir se código não compila
   - Solução: Corrigir imports ou reverter mudanças


## Considerações Finais

### Estratégia de Migração

**Foco**: Migrar o projeto real, não construir framework de migração.

**Abordagem**:
- Ferramentas simples e manuais
- Validação após cada etapa
- Commits atômicos
- Rollback manual via git se necessário

### Compatibility Layer

**Propósito**: Manter código antigo funcionando durante migração

**Implementação**:
```typescript
// src/components/community/PostCard.tsx (re-export temporário)
export { PostCard } from '@/modules/community/components/PostCard';
```

**Remoção**: Após todos os imports serem atualizados para novos caminhos

### Performance

**Code Splitting**:
```typescript
// app/router/routes.tsx
const CommunityModule = lazy(() => import('@/modules/community'));
```

**Tree Shaking**: Barrel exports devem exportar apenas API pública

**Bundle Analysis**: Monitorar após cada fase
```bash
npm run build -- --analyze
```

### Documentação Gerada

Ao final da migração:
1. **ARCHITECTURE.md** - Explicação da nova estrutura
2. **MIGRATION_GUIDE.md** - Como adicionar novas features
3. **IMPORT_RULES.md** - Regras de import permitidas/proibidas
4. **CHANGELOG.md** - Lista de mudanças realizadas

### Próximos Passos

1. **Aprovação do plano** - Review e aprovação
2. **Fase 1: Espinha dorsal** - Criar estrutura base (1-2 dias)
3. **Fase 2: Núcleo canônico** - Definir entidades centrais (2-3 dias)
4. **Fase 3: Núcleo fundacional** - Migrar auth/users/profiles/permissions (1 semana)
5. **Fase 4-7: Resto da migração** - Integrations, shared, modules, limpeza (3-4 semanas)

**Total estimado**: 5-6 semanas

