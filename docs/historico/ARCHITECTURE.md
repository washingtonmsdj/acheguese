# Arquitetura do Sistema

## 📋 Visão Geral

Plataforma de comunidade local construída com arquitetura moderna, focada em performance, segurança e escalabilidade.

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - UI library com Concurrent Features
- **TypeScript 5** - Type safety e developer experience
- **Vite** - Build tool e dev server
- **TanStack Query v5** - Data fetching e cache
- **Radix UI** - Componentes acessíveis
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Ícones

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Storage
  - Edge Functions

### Ferramentas
- **ESLint** - Linting com regras customizadas SSOT
- **TypeScript** - Type checking
- **Husky** - Git hooks
- **dotenv** - Environment variables

## 📁 Estrutura de Pastas

```
projeto/
├── src/
│   ├── components/          # Componentes React
│   │   ├── accessibility/   # Acessibilidade
│   │   ├── admin/          # Painel administrativo
│   │   ├── business/       # Empresas e negócios
│   │   ├── civic/          # Alertas cívicos
│   │   ├── community/      # Feed e posts
│   │   ├── mobility/       # Mobilidade urbana
│   │   └── ui/            # Componentes base
│   ├── services/           # Lógica de negócio
│   │   ├── posts/         # Gerenciamento de posts
│   │   ├── profile/       # Gerenciamento de perfis
│   │   ├── social/        # Interações sociais
│   │   └── feed/          # Feed e timeline
│   ├── types/             # TypeScript types
│   ├── lib/               # Configurações e utils
│   ├── hooks/             # React hooks customizados
│   └── pages/             # Páginas da aplicação
├── docs/                  # Documentação
├── scripts/               # Scripts de automação
├── supabase/             # Migrations e schemas
│   └── migrations/       # SQL migrations
└── public/               # Assets estáticos
```

## 🎯 Princípios Arquiteturais

### 1. SSOT (Single Source of Truth)

Padrão fundamental que garante consistência em todo o sistema:

- **Nomenclatura padronizada** de colunas e relacionamentos
- **Validação automática** via ESLint customizado
- **Documentação como código** - regras explícitas

Ver: [DATA_MODELING.md](./DATA_MODELING.md)

### 2. Separation of Concerns

- **Services** contêm lógica de negócio
- **Components** são apresentacionais
- **Hooks** encapsulam lógica reutilizável
- **Types** definem contratos

### 3. Type Safety

- TypeScript em modo strict
- Interfaces explícitas para todas as entidades
- Validação em tempo de compilação

### 4. Performance First

- Code splitting automático (Vite)
- Lazy loading de componentes
- Cache inteligente (TanStack Query)
- Otimização de imagens

### 5. Security by Default

- Credenciais apenas em variáveis de ambiente
- Validação automática de segurança
- RLS (Row Level Security) no Supabase
- Sanitização de inputs

## 🔄 Fluxo de Dados

### Autenticação

```
User → Supabase Auth → Session → Profile Context → UI
```

### Posts e Feed

```
User Action → Service Layer → Supabase → TanStack Query → Cache → UI
                    ↓
              Validação SSOT
```

### Real-time

```
Database Change → Supabase Realtime → Subscription → UI Update
```

## 🏗️ Camadas da Aplicação

### 1. Presentation Layer (Components)

Componentes React responsáveis pela UI:

```typescript
// Exemplo: Componente apresentacional
export function PostCard({ post }: { post: Post }) {
  return (
    <Card>
      <PostHeader author={post.author_profile} />
      <PostContent content={post.content} />
      <PostActions postId={post.id} />
    </Card>
  );
}
```

### 2. Business Logic Layer (Services)

Serviços que encapsulam regras de negócio:

```typescript
// Exemplo: Service com lógica de negócio
export class PostService {
  async createPost(profileId: string, data: CreatePostData): Promise<Post> {
    // Validações
    // Transformações
    // Persistência
    // Retorno
  }
}
```

### 3. Data Access Layer (Supabase Client)

Cliente configurado para acesso ao banco:

```typescript
// Configuração centralizada
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

### 4. State Management (TanStack Query)

Cache e sincronização de estado:

```typescript
// Exemplo: Query com cache
const { data: posts } = useQuery({
  queryKey: ['posts', filters],
  queryFn: () => postService.getFeed(filters),
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

## 🔐 Segurança

### Gestão de Credenciais

- ✅ Todas as credenciais em `.env.local`
- ✅ Validação automática via script
- ✅ Pre-commit hooks para prevenir commits
- ✅ CI/CD com verificação de segurança

Ver: [SECURITY.md](./SECURITY.md)

### Row Level Security (RLS)

Políticas no Supabase garantem acesso seguro:

```sql
-- Exemplo: Usuário só vê seus próprios posts
CREATE POLICY "Users can view own posts"
ON posts FOR SELECT
USING (author_profile_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));
```

## 📊 Modelagem de Dados

### Conceitos Fundamentais

**User vs Profile vs Author**

- `user_id` - Identidade de autenticação (auth.users)
- `profile_id` - Identidade de atuação (múltiplos por user)
- `author_profile_id` - Papel contextual (sempre aponta para profile)

Ver: [DATA_MODELING.md](./DATA_MODELING.md)

### Relacionamentos

```
users (1) ──< (N) profiles
profiles (1) ──< (N) posts
posts (1) ──< (N) comments
profiles (N) ──< (N) profile_favorites
```

## 🚀 Performance

### Otimizações Implementadas

1. **Code Splitting**
   - Lazy loading de rotas
   - Dynamic imports para componentes pesados

2. **Caching**
   - TanStack Query com stale-time configurado
   - Cache de perfis e posts

3. **Database**
   - Índices em colunas frequentemente consultadas
   - Queries otimizadas com select específico

4. **Assets**
   - Imagens otimizadas
   - Lazy loading de imagens
   - CDN para assets estáticos

## 🧪 Testes

### Estratégia

- **Unit Tests** - Lógica de negócio (Services)
- **Integration Tests** - Fluxos completos
- **E2E Tests** - Cenários críticos de usuário

### Ferramentas

- Vitest para unit/integration
- Playwright para E2E (futuro)

## 📱 Responsividade

### Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Mobile First

Todos os componentes são desenvolvidos mobile-first, com progressive enhancement para telas maiores.

## ♿ Acessibilidade

### Padrões

- WCAG 2.1 Level AA como objetivo
- Componentes Radix UI (acessíveis por padrão)
- Testes com leitores de tela
- Navegação por teclado

### Recursos

- Skip to content
- ARIA labels
- Contraste adequado
- Foco visível

## 🔄 CI/CD

### GitHub Actions

```yaml
# Workflow de validação
- Lint (ESLint + SSOT rules)
- Type check (TypeScript)
- Security check (credenciais)
- Build test
```

## 📈 Monitoramento

### Métricas

- Performance (Web Vitals)
- Erros (Error tracking)
- Uso (Analytics)

### Logging

```typescript
// Sistema de logging estruturado
logger.info('Post created', { postId, userId });
logger.error('Failed to create post', { error, context });
```

## 🔮 Roadmap Técnico

### Curto Prazo
- [ ] Testes automatizados completos
- [ ] PWA com service worker
- [ ] Otimização de bundle size

### Médio Prazo
- [ ] Server-side rendering (SSR)
- [ ] Edge functions para lógica complexa
- [ ] GraphQL layer (opcional)

### Longo Prazo
- [ ] Microservices para módulos específicos
- [ ] Real-time collaboration features
- [ ] AI/ML para recomendações

## 🔐 Session Context System

### Visão Geral

O sistema de contexto de sessão (`src/core/session/`) é a **única fonte de verdade** para dados de sessão em runtime. Ele gerencia exclusivamente identidade e contexto — sem permissões acopladas.

```
src/core/session/
├── state/SessionState.ts         # SSOT compartilhado (React + non-React)
├── services/SessionService.ts    # Gerencia onAuthStateChange, atualiza SessionState
├── services/ServiceGateway.ts    # Acesso read-only para serviços não-React
├── providers/SessionProvider.tsx # React context provider (lê de SessionState)
├── hooks/useSessionContext.ts    # Hook para componentes React
└── cache/CacheManager.ts         # Otimização de performance (não é SSOT)
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
user_id    → autenticação, configurações globais, operações técnicas, audit logs
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

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Última atualização**: 2026-03-19  
**Versão**: 1.0.0  
**Mantido por**: Equipe de Desenvolvimento
