# Arquitetura Feature-First

> **Nota de status (2026-03-30)**: Este documento é a fonte oficial de arquitetura geral.
> Após o cleanup estrutural mínimo viável (Etapas A-R), os seguintes pontos foram normalizados:
> - `src/services/` removida — use `@/core/*` ou `@/modules/*`
> - `src/core/company/` removida — use `@/core/business`
> - `src/core/supabase/` removida — use `@/integrations/supabase`
> - `src/pages/` esvaziada — páginas de produto em `src/modules/*/pages/`
> - `MobilityAdminQueryService` adicionado em `src/core/mobility/services/`
> - Blindagem v3.0 ativa — detalhes em `VEREDITO_FINAL_COERENCIA_v3.md`

## 📋 Visão Geral

Este documento descreve a arquitetura feature-first do projeto, resultado da migração de uma arquitetura baseada em camadas (layer-based) para uma organização por domínio/funcionalidade. A nova estrutura melhora a coesão do código, reduz o acoplamento entre módulos e facilita a escalabilidade do time.

**Status da Migração**: ✅ Completa (Fase 6 - Todos os módulos migrados)

## 🎯 Objetivos da Arquitetura

1. **Coesão por Domínio** - Todo código relacionado a uma feature fica junto
2. **Isolamento de Módulos** - Módulos não dependem uns dos outros
3. **Escalabilidade** - Times podem trabalhar em módulos independentes
4. **Code Splitting Eficiente** - Melhor performance e bundle size
5. **Manutenibilidade** - Fácil localizar e modificar código

## 📁 Estrutura de Diretórios

### Visão Geral

```
src/
├── app/                    # Configuração da aplicação
│   ├── router/            # Rotas e navegação
│   ├── layouts/           # Layouts principais
│   ├── providers/         # Providers globais (Auth, Query, etc)
│   └── config/            # Configurações da aplicação
│
├── shared/                 # Código compartilhado SEM dependências
│   ├── components/ui/     # Componentes UI genéricos (Button, Card, etc)
│   ├── hooks/             # Hooks reutilizáveis genéricos
│   ├── utils/             # Utilitários puros
│   ├── constants/         # Constantes globais
│   └── types/             # Types compartilhados
│
├── core/                   # Sistemas transversais centrais
│   ├── auth/              # Autenticação e sessão
│   ├── users/             # Gerenciamento de usuários
│   ├── profiles/          # Perfis de usuário
│   ├── permissions/       # Sistema de permissões
│   ├── notifications/     # Notificações
│   ├── messaging/         # Sistema de mensagens
│   ├── moderation/        # Moderação de conteúdo
│   ├── media/             # Upload e gerenciamento de mídia
│   ├── gamification/      # Sistema de gamificação
│   ├── location/          # Serviços de localização
│   ├── realtime/          # Subscriptions em tempo real
│   └── ...                # Outros sistemas transversais
│
├── integrations/           # Camada de infraestrutura
│   ├── supabase/          # Cliente Supabase
│   ├── realtime/          # Configuração realtime
│   ├── maps/              # Integração com mapas
│   └── external-notifications/  # Notificações externas
│
└── modules/                # Módulos de domínio do produto
    ├── dashboard/         # Dashboard principal
    ├── profile/           # Perfil de usuário
    ├── community/         # Feed e comunidade
    ├── business/          # Empresas e negócios
    ├── services/          # Serviços profissionais
    ├── classifieds/       # Classificados
    ├── mobility/          # Mobilidade urbana
    └── admin/             # Painel administrativo
```

### Estrutura Interna de um Módulo

Cada módulo segue uma estrutura consistente:

```
modules/community/
├── components/           # Componentes específicos do domínio
│   ├── feed/            # Subgrupo: componentes do feed
│   ├── posts/           # Subgrupo: componentes de posts
│   ├── comments/        # Subgrupo: componentes de comentários
│   └── groups/          # Subgrupo: componentes de grupos
├── hooks/               # Hooks específicos do domínio
├── services/            # Lógica de negócio do domínio
├── types/               # Types específicos do domínio
├── pages/               # Páginas do domínio
├── schemas/             # Validação Zod do domínio
├── stores/              # Estado local (se necessário)
└── index.ts             # Barrel export - APENAS API pública
```

## 🔄 Regras de Dependência

### Hierarquia de Camadas

```
┌─────────────────────────────────────────┐
│              app/*                      │  ← Orquestra tudo
│  (router, layouts, providers, config)  │
└─────────────────────────────────────────┘
              ↓ pode importar
┌─────────────────────────────────────────┐
│           modules/*                     │  ← Domínios do produto
│  (dashboard, profile, community, etc)  │
└─────────────────────────────────────────┘
              ↓ pode importar
┌─────────────────────────────────────────┐ac
│             core/*                      │  ← Sistemas transversais
│  (auth, users, profiles, permissions)  │
└─────────────────────────────────────────┘
              ↓ pode importar
┌──────────────────┬──────────────────────┐
│   shared/*       │   integrations/*     │  ← Fundação
│  (UI, utils)     │  (Supabase, APIs)    │
└──────────────────┴──────────────────────┘
```

### Regras Permitidas ✅

| De → Para | app | modules | core | shared | integrations |
|-----------|-----|---------|------|--------|--------------|
| **app** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **modules** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **core** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **shared** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **integrations** | ❌ | ❌ | ❌ | ❌ | ✅ |

### Regras Detalhadas

#### ✅ Permitido

```typescript
// app pode importar de modules, core e shared
import { CommunityFeed } from '@/modules/community';
import { useAuth } from '@/core/auth';
import { Button } from '@/shared/components/ui';

// modules podem importar de core e shared
import { ProfileService } from '@/core/profiles';
import { formatDate } from '@/shared/utils';

// core pode importar de integrations e shared
import { supabase } from '@/integrations/supabase';
import { cn } from '@/shared/utils';
```

#### ❌ Proibido

```typescript
// ❌ Cross-module imports (módulos não podem importar outros módulos)
import { BusinessCard } from '@/modules/business';  // Em modules/community

// ❌ Core não pode importar de modules
import { CommunityService } from '@/modules/community';  // Em core/notifications

// ❌ Modules não podem acessar integrations diretamente
import { supabase } from '@/integrations/supabase';  // Em modules/community
// Use core como intermediário

// ❌ Shared não pode ter dependências
import { useAuth } from '@/core/auth';  // Em shared/hooks
```

### Justificativa das Regras

1. **shared não depende de nada** - Componentes UI puros, utils genéricos
2. **integrations é camada de infraestrutura** - Não depende de lógica de negócio
3. **core pode usar integrations e shared** - Sistemas transversais precisam de infraestrutura
4. **modules NÃO pode acessar integrations** - Usar core como intermediário
5. **modules NÃO pode importar outros modules** - Isolamento de domínio

## 🏗️ Camadas da Aplicação

### 1. App Layer (`app/`)

**Propósito**: Configuração e orquestração da aplicação

**Responsabilidades**:
- Configuração de rotas
- Layouts principais (AppLayout, AuthLayout)
- Providers globais (QueryClientProvider, AuthProvider)
- Configurações da aplicação

**Exemplo**:
```typescript
// app/router/routes.tsx
import { CommunityPage } from '@/modules/community';
import { DashboardPage } from '@/modules/dashboard';

export const routes = [
  { path: '/community', element: <CommunityPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
];
```

### 2. Shared Layer (`shared/`)

**Propósito**: Código compartilhado sem dependências

**Responsabilidades**:
- Componentes UI genéricos (Button, Card, Dialog)
- Hooks reutilizáveis genéricos (useDebounce, useLocalStorage)
- Utilitários puros (formatDate, cn, slugify)
- Constantes globais
- Types compartilhados

**Características**:
- ⚠️ **NUNCA** importa de outras camadas
- Código 100% reutilizável
- Sem lógica de negócio

**Exemplo**:
```typescript
// shared/components/ui/Button.tsx
export function Button({ children, ...props }: ButtonProps) {
  return <button className={cn("btn", props.className)} {...props}>{children}</button>;
}

// shared/utils/format.ts
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}
```

### 3. Core Layer (`core/`)

**Propósito**: Sistemas transversais usados por múltiplos módulos

**Responsabilidades**:
- Autenticação e autorização
- Gerenciamento de usuários e perfis
- Sistema de permissões
- Notificações
- Mensagens
- Moderação
- Upload de mídia
- Gamificação
- Localização
- Realtime subscriptions

**Características**:
- Pode usar `integrations` e `shared`
- **NUNCA** importa de `modules`
- Fornece APIs para módulos consumirem

**Exemplo**:
```typescript
// core/auth/services/AuthService.ts
import { supabase } from '@/integrations/supabase';

export class AuthService {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }
}

// core/auth/index.ts (barrel export)
export { AuthService } from './services/AuthService';
export { useAuth } from './hooks/useAuth';
export type { User, Session } from './types';
```

### 4. Integrations Layer (`integrations/`)

**Propósito**: Camada de infraestrutura e integrações externas

**Responsabilidades**:
- Cliente Supabase configurado
- Configuração de realtime
- Integração com APIs de mapas
- Notificações push externas

**Características**:
- ⚠️ **NUNCA** importa de outras camadas
- Apenas configuração e clientes
- Sem lógica de negócio

**Exemplo**:
```typescript
// integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// integrations/supabase/index.ts
export { supabase } from './client';
export type { Database } from './types';
```

### 5. Modules Layer (`modules/`)

**Propósito**: Domínios do produto (features)

**Responsabilidades**:
- Implementar features específicas
- Componentes de domínio
- Lógica de negócio de domínio
- Páginas do domínio

**Características**:
- Pode usar `core` e `shared`
- ⚠️ **NUNCA** importa outros `modules`
- ⚠️ **NUNCA** acessa `integrations` diretamente

**Módulos Disponíveis**:

#### `modules/dashboard/`
Dashboard principal com visão geral do usuário

#### `modules/profile/`
Gerenciamento de perfil do usuário

#### `modules/community/`
Feed social, posts, comentários, grupos

#### `modules/business/`
Empresas, catálogos, produtos

#### `modules/services/`
Serviços profissionais

#### `modules/classifieds/`
Classificados (compra/venda)

#### `modules/mobility/`
Mobilidade urbana, rotas, caronas

#### `modules/admin/`
Painel administrativo

**Exemplo**:
```typescript
// modules/community/services/PostService.ts
import { ProfileService } from '@/core/profiles';
import { MediaService } from '@/core/media';

export class PostService {
  async createPost(profileId: string, content: string, images?: File[]) {
    // Validar perfil
    const profile = await ProfileService.getProfile(profileId);
    
    // Upload de imagens (se houver)
    let imageUrls: string[] = [];
    if (images) {
      imageUrls = await MediaService.uploadImages(images);
    }
    
    // Criar post
    // ...
  }
}

// modules/community/index.ts (barrel export - APENAS API PÚBLICA)
export { CommunityFeed } from './components/CommunityFeed';
export { PostCard } from './components/PostCard';
export { PostService } from './services/PostService';
export { useCommunity } from './hooks/useCommunity';
export type { Post, Comment } from './types';

// ❌ NÃO exportar internals
// export { PostCardHeader } from './components/PostCard/Header';  // Internal
```

## 📦 Barrel Exports

### O que são Barrel Exports?

Arquivos `index.ts` que re-exportam APIs públicas de um módulo, criando um ponto de entrada limpo.

### Regras

1. **Apenas API Pública** - Não exportar componentes internos
2. **Organizado por Tipo** - Agrupar exports (components, services, hooks, types)
3. **Named Exports** - Preferir named exports sobre default exports
4. **Tree-Shakeable** - Garantir que exports não utilizados sejam removidos

### Exemplo Completo

```typescript
// modules/community/index.ts

// ============================================
// Components (API Pública)
// ============================================
export { CommunityFeed } from './components/CommunityFeed';
export { PostCard } from './components/PostCard';
export { CommentList } from './components/CommentList';
export { CreatePostModal } from './components/CreatePostModal';

// ============================================
// Services
// ============================================
export { PostService } from './services/PostService';
export { CommentService } from './services/CommentService';

// ============================================
// Hooks
// ============================================
export { useCommunity } from './hooks/useCommunity';
export { usePost } from './hooks/usePost';
export { useComments } from './hooks/useComments';

// ============================================
// Types
// ============================================
export type {
  Post,
  Comment,
  CreatePostData,
  UpdatePostData,
} from './types';

// ❌ NÃO EXPORTAR (internals)
// export { PostCardHeader } from './components/PostCard/Header';
// export { PostCardFooter } from './components/PostCard/Footer';
// export { formatPostDate } from './utils/format';
```

## 🔒 Imposição de Regras (ESLint)

### Configuração

As regras de dependência são impostas automaticamente via ESLint:

```javascript
// eslint.config.js
export default [
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/modules/*/*'],
            message: 'Cross-module imports are not allowed. Modules must be isolated.'
          },
          {
            group: ['@supabase/supabase-js'],
            message: 'Direct Supabase access not allowed. Use @/integrations/supabase or @/core/* services.'
          },
          {
            group: ['@/integrations/*'],
            message: 'Modules cannot access integrations directly. Use @/core/* as intermediary.'
          }
        ]
      }]
    }
  }
];
```

### Validação

```bash
# Executar validação de imports
npm run lint

# Exemplo de erro detectado:
# ❌ modules/community/services/PostService.ts:5
#    import { BusinessService } from '@/modules/business'
#    Error: Cross-module imports are not allowed. Modules must be isolated.
```

## 📊 Diagrama de Dependências

```
┌─────────────────────────────────────────────────────────────┐
│                         APP LAYER                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Router  │  │ Layouts  │  │Providers │  │  Config  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ imports
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      MODULES LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │ Profile  │  │Community │  │ Business │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Services │  │Classifieds│ │ Mobility │  │  Admin   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ imports (NO cross-module!)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                       CORE LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │  Users   │  │ Profiles │  │Permission│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Notify  │  │Messaging │  │Moderation│  │  Media   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │Gamificat.│  │ Location │  │ Realtime │  ...            │
│  └──────────┘  └──────────┘  └──────────┘                 │
└────────────────────────┬────────────────────────────────────┘
                         │ imports
                         ↓
┌──────────────────────────────┬──────────────────────────────┐
│       SHARED LAYER           │     INTEGRATIONS LAYER       │
│  ┌──────────┐  ┌──────────┐ │  ┌──────────┐  ┌──────────┐ │
│  │UI Comps. │  │  Hooks   │ │  │ Supabase │  │ Realtime │ │
│  └──────────┘  └──────────┘ │  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐ │  ┌──────────┐  ┌──────────┐ │
│  │  Utils   │  │Constants │ │  │   Maps   │  │Ext.Notif.│ │
│  └──────────┘  └──────────┘ │  └──────────┘  └──────────┘ │
│  (NO dependencies)           │  (NO dependencies)           │
└──────────────────────────────┴──────────────────────────────┘
```

## 🎯 Padrões de Implementação

### Como Adicionar uma Nova Feature

1. **Decidir a Camada**
   - É um domínio do produto? → `modules/`
   - É usado por múltiplos módulos? → `core/`
   - É UI genérico? → `shared/`

2. **Criar Estrutura**
```bash
# Exemplo: novo módulo de eventos
mkdir -p src/modules/events/{components,hooks,services,types,pages,schemas}
```

3. **Implementar Feature**
```typescript
// modules/events/services/EventService.ts
import { ProfileService } from '@/core/profiles';
import { LocationService } from '@/core/location';

export class EventService {
  async createEvent(profileId: string, data: CreateEventData) {
    // Implementação
  }
}
```

4. **Criar Barrel Export**
```typescript
// modules/events/index.ts
export { EventList } from './components/EventList';
export { EventService } from './services/EventService';
export { useEvents } from './hooks/useEvents';
export type { Event, CreateEventData } from './types';
```

5. **Usar no App**
```typescript
// app/router/routes.tsx
import { EventsPage } from '@/modules/events';

export const routes = [
  { path: '/events', element: <EventsPage /> },
];
```

### Quando Usar Core vs Modules

#### Use `core/` quando:
- ✅ Funcionalidade usada por **múltiplos módulos**
- ✅ Sistema transversal (auth, notifications, permissions)
- ✅ Precisa acessar `integrations` diretamente

#### Use `modules/` quando:
- ✅ Feature específica de um **domínio do produto**
- ✅ Componentes e lógica isolados
- ✅ Não precisa ser compartilhado com outros módulos

#### Exemplo:

```typescript
// ✅ CORRETO: NotificationService em core (usado por vários módulos)
// core/notifications/services/NotificationService.ts
export class NotificationService {
  async sendNotification(userId: string, message: string) {
    // Usado por community, business, mobility, etc
  }
}

// ✅ CORRETO: PostService em modules/community (específico do domínio)
// modules/community/services/PostService.ts
import { NotificationService } from '@/core/notifications';

export class PostService {
  async createPost(data: CreatePostData) {
    // Lógica específica de posts
    await NotificationService.sendNotification(/* ... */);
  }
}
```

## 🚀 Performance e Otimização

### Code Splitting

A arquitetura feature-first facilita code splitting automático:

```typescript
// app/router/routes.tsx
import { lazy } from 'react';

// Lazy loading de módulos
const CommunityPage = lazy(() => import('@/modules/community/pages/CommunityPage'));
const BusinessPage = lazy(() => import('@/modules/business/pages/BusinessPage'));

export const routes = [
  { path: '/community', element: <CommunityPage /> },
  { path: '/business', element: <BusinessPage /> },
];
```

### Tree Shaking

Barrel exports garantem que apenas código usado é incluído no bundle:

```typescript
// ✅ Apenas Button é incluído no bundle
import { Button } from '@/shared/components/ui';

// ❌ Evitar import de tudo
import * as UI from '@/shared/components/ui';  // Inclui tudo!
```

### Bundle Size

Monitorar tamanho do bundle após mudanças:

```bash
# Build com análise
npm run build -- --analyze

# Verificar que bundle não aumentou mais de 5%
```

## 🧪 Testes

### Estratégia de Testes por Camada

#### Shared
- **Unit tests** para utils e hooks
- **Component tests** para UI components
- Sem dependências externas

#### Core
- **Unit tests** para services
- **Integration tests** para fluxos completos
- Mockar `integrations`

#### Modules
- **Unit tests** para lógica de negócio
- **Integration tests** para fluxos de feature
- **E2E tests** para cenários críticos
- Mockar `core` services

### Exemplo

```typescript
// modules/community/services/__tests__/PostService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { PostService } from '../PostService';
import { ProfileService } from '@/core/profiles';

// Mock core service
vi.mock('@/core/profiles');

describe('PostService', () => {
  it('should create post with valid profile', async () => {
    // Arrange
    vi.mocked(ProfileService.getProfile).mockResolvedValue(mockProfile);
    
    // Act
    const post = await PostService.createPost(profileId, content);
    
    // Assert
    expect(post).toBeDefined();
    expect(post.author_profile_id).toBe(profileId);
  });
});
```

## 🔐 Session Context System

### Visão Geral

O sistema de contexto de sessão (`src/core/session/`) é a **única fonte de verdade** para dados de sessão em runtime. Ele gerencia exclusivamente identidade e contexto — sem permissões acopladas.

```
src/core/session/
├── state/SessionState.ts        # SSOT compartilhado (React + non-React)
├── services/SessionService.ts   # Gerencia onAuthStateChange, atualiza SessionState
├── services/ServiceGateway.ts   # Acesso read-only para serviços não-React
├── providers/SessionProvider.tsx # React context provider (lê de SessionState)
├── hooks/useSessionContext.ts   # Hook para componentes React
└── cache/CacheManager.ts        # Otimização de performance (não é SSOT)
```

### Responsabilidades

**Session Context System faz:**
- Quem está logado? (`user`)
- Qual profile está ativo? (`activeProfile`)
- Quais profiles disponíveis? (`profiles`)
- Trocar profile ativo (`switchProfile`)

**Session Context System NÃO faz:**
- Verificar permissões
- Decidir se pode fazer ação
- Checar ownership
- Validar autorização

### Authorization Engine (Sistema Separado)

O `AuthorizationEngine` (`src/core/authorization/`) é um sistema **completamente separado** responsável por todas as decisões de permissão. Ele consome dados de sessão mas não faz parte da fonte de verdade.

**Authorization Engine faz:**
- Pode fazer ação? (`canProfilePerformAction`)
- É dono da entidade? (`checkOwnership`)
- Quais permissões tem? (`getProfilePermissions` — apenas display)

### Fronteira Canônica de Identificadores

```
user_id  → autenticação, configurações globais, operações técnicas, audit logs
profile_id → posts, comentários, mensagens, criação de businesses, interações sociais
```

Identificadores ambíguos (`authorId`, `ownerId`, `creatorId`) são **proibidos**. Use sempre a forma qualificada: `authorProfileId`, `ownerProfileId`, `creatorProfileId`.

### Ownership de Inicialização

| Responsável | Inicializa |
|---|---|
| `main.tsx` | `AuthorizationEngine.initialize()` |
| `SessionProvider` | `SessionService.initialize()` e `SessionService.initializeSession()` |

`main.tsx` inicializa o `AuthorizationEngine` antes do render da árvore React. O `SessionProvider` inicializa o `SessionService` (registra `onAuthStateChange`) e carrega a sessão inicial no `useEffect` de montagem.

### ESLint Enforcement

As regras do plugin `eslint-plugin-session-context` estão ativas em nível `'error'`, causando falha de build para:

- Acesso direto a `supabase.auth.getUser()` fora de `SessionService`
- Uso de `user.id` em fluxos sociais/domínio
- Inferência de permissão via `activeProfile.type` ou `activeProfile.status`
- Identificadores ambíguos (`authorId`, `ownerId`, etc.)

## 📚 Referências

### Documentação Relacionada

- [DATA_MODELING.md](./docs/DATA_MODELING.md) - Padrão SSOT (User vs Profile vs Author)
- [OWNERSHIP_CONTEXT_PERMISSIONS.md](./docs/OWNERSHIP_CONTEXT_PERMISSIONS.md) - Ownership e Permissões
- [CURRENT_RULES.md](./docs/CURRENT_RULES.md) - Regras vigentes do projeto
- [SECURITY.md](./docs/SECURITY.md) - Políticas de segurança

### Arquivos de Configuração

- `tsconfig.json` - Path aliases
- `vite.config.ts` - Aliases de resolução
- `eslint.config.js` - Regras de import

## 🔄 Migração

### Status

✅ **Fase 1**: Espinha dorsal criada  
✅ **Fase 2**: Núcleo canônico definido  
✅ **Fase 3**: Núcleo fundacional migrado (auth, users, profiles, permissions, etc)  
✅ **Fase 4**: Integrations migrado  
✅ **Fase 5**: Shared migrado  
✅ **Fase 6**: Todos os módulos migrados (dashboard, profile, community, business, services, classifieds, mobility, admin)  
✅ **Fase 7**: Limpeza e consolidação completa

### Rollback Points

Tags de rollback disponíveis:
- `migration-phase-1` - Espinha dorsal
- `migration-phase-2` - Núcleo canônico
- `migration-phase-3-complete` - Núcleo fundacional
- `migration-phase-4` - Integrations
- `migration-phase-5` - Shared
- `migration-phase-6-complete` - Todos os módulos

## 🎓 Boas Práticas

### ✅ DO

- Manter módulos isolados e independentes
- Usar barrel exports para APIs públicas
- Colocar lógica compartilhada em `core`
- Usar `core` como intermediário para `integrations`
- Seguir a estrutura interna consistente de módulos
- Validar imports com ESLint

### ❌ DON'T

- Importar entre módulos (`modules/A` → `modules/B`)
- Acessar `integrations` diretamente de `modules`
- Exportar internals em barrel exports
- Adicionar dependências em `shared`
- Ignorar erros de ESLint de imports

## 📞 Suporte

Para dúvidas sobre a arquitetura:

1. Consulte este documento
2. Verifique [CURRENT_RULES.md](./docs/CURRENT_RULES.md)
3. Abra uma issue no GitHub
4. Pergunte no canal de desenvolvimento

---

**Versão**: 2.0.0  
**Última atualização**: 2024-01-XX  
**Status**: ✅ Arquitetura Feature-First Completa

Feito com ❤️ para melhorar a manutenibilidade e escalabilidade do projeto
