# Requirements Document

## Introduction

Este documento especifica os requisitos para um sistema centralizado de contexto de sessão, substituindo o acesso direto e espalhado a user/profile pelo sistema atual. O objetivo é criar uma única fonte de verdade para:

- Dados de sessão (usuário autenticado)
- Profile ativo (profile selecionado pelo usuário)
- Lista de profiles disponíveis

A fonte de verdade é APENAS sessão e profile ativo. Permissões e autorização são responsabilidade do Authorization_Engine, um sistema completamente separado que consome dados de sessão mas não faz parte da fonte de verdade.

## Glossary

- **Session_Context_System**: Sistema centralizado que gerencia APENAS contexto de sessão, identidade e profile ativo (SEM permissões)
- **Authorization_Engine**: Sistema SEPARADO responsável por verificar permissões baseadas em profile, contexto e ownership/target entity
- **Active_Profile**: Profile atualmente selecionado pelo usuário para interações sociais e de domínio
- **Profile_Context**: Conjunto completo de dados de um profile (identidade, status, tipo)
- **Cache_Manager**: Sistema de cache com estratégias de invalidação para dados de sessão e profile
- **Session_Provider**: Provider React que fornece APENAS contexto de sessão (sem permissões acopladas)
- **Service_Gateway**: Porta única para acesso a dados de sessão em serviços fora do React
- **Canonical_Boundary**: Fronteira que define user_id para auth/global/técnico e profile_id para ações sociais/domínio
- **Target_Entity**: Entidade alvo de uma ação (post, comment, business) usada para verificação de ownership
- **Ownership_Context**: Contexto de propriedade que determina se um profile possui/controla uma entidade específica

## Requirements

### Requirement 1: Fonte Única para Dados de Sessão (SEM Permissões)

**User Story:** Como desenvolvedor, eu quero uma única fonte oficial para obter dados de sessão (user, activeProfile, profiles disponíveis) SEM permissões acopladas, para que não haja inconsistências e duplicação de lógica no sistema.

#### Acceptance Criteria

1. THE Session_Context_System SHALL provide a single source of truth for authenticated user data
2. THE Session_Context_System SHALL provide a single source of truth for active profile data
3. THE Session_Context_System SHALL provide a single source of truth for available profiles list
4. THE Session_Context_System SHALL provide a single source of truth for profile switching operations
5. THE Session_Context_System SHALL NOT include permission checking logic (separate concern)
6. WHEN multiple components request the same session data, THE Session_Context_System SHALL return consistent results
7. THE Session_Context_System SHALL prevent direct access to supabase.auth.getUser() outside the defined layer

### Requirement 2: React Integration Layer (Apenas Sessão)

**User Story:** Como desenvolvedor de componentes React, eu quero acessar dados de sessão através de useSessionContext() SEM permissões acopladas, para que haja separação clara de responsabilidades.

#### Acceptance Criteria

1. THE Session_Provider SHALL provide session context to all React components
2. THE useSessionContext hook SHALL be the only way for React components to access session data
3. THE useSessionContext hook SHALL provide ONLY: user, activeProfile, profiles list, loading states
4. THE useSessionContext hook SHALL NOT provide permission checking methods (separate concern)
5. THE useSessionContext hook SHALL handle loading states and error conditions
6. THE Session_Provider SHALL automatically update all consuming components when session changes
7. IF a component tries to access session data directly, THE system SHALL prevent this through linting rules

#### Contrato Mínimo do useSessionContext:
```typescript
interface SessionContext {
  user: User | null;
  activeProfile: Profile | null;
  profiles: Profile[];
  isLoading: boolean;
  error: Error | null;
  switchProfile: (profileId: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### Requirement 3: Service Layer Integration (Apenas Sessão)

**User Story:** Como desenvolvedor de serviços, eu quero uma porta única equivalente para acessar dados de sessão fora do React SEM permissões acopladas, para que não haja espalhamento de supabase.auth.getUser() pelo código.

#### Acceptance Criteria

1. THE Service_Gateway SHALL provide session access for non-React services
2. THE Service_Gateway SHALL prevent direct supabase.auth.getUser() calls in services
3. THE Service_Gateway SHALL provide ONLY session data (user, activeProfile, profiles)
4. THE Service_Gateway SHALL NOT provide permission checking methods (separate concern)
5. THE Service_Gateway SHALL maintain the same data consistency as the React layer
6. THE Service_Gateway SHALL handle authentication errors gracefully

#### Contrato Mínimo do Service_Gateway:
```typescript
interface ServiceGateway {
  // Leitura de contexto (read-only)
  getCurrentUser(): Promise<User | null>;
  getActiveProfile(): Promise<Profile | null>;
  getUserProfiles(): Promise<Profile[]>;
  isAuthenticated(): boolean;
}
```

**Justificativa para exclusão de switchActiveProfile():**
- switchActiveProfile() é uma operação de mutação de estado global
- Service_Gateway deve ser read-only para manter separação clara de responsabilidades
- Operações de mutação (switch, refresh) devem ficar APENAS no Session_Provider (React layer)
- Serviços não devem ter capacidade de alterar o contexto de sessão global
- Isso previne side effects inesperados e facilita debugging

### Requirement 4: Authorization Engine Separado com Ownership

**User Story:** Como desenvolvedor, eu quero um sistema de autorização SEPARADO baseado em profile + context + ownership/target entity, para que as permissões sejam mais granulares e contextuais.

#### Acceptance Criteria

1. THE Authorization_Engine SHALL be completely separate from Session_Context_System
2. THE Authorization_Engine SHALL implement canProfilePerformAction(profileId, action, context, targetEntity?) method
3. THE Authorization_Engine SHALL base all authorization decisions on profile data, not user_id
4. THE Authorization_Engine SHALL consider ownership/target entity in permission decisions
5. WHEN checking permissions, THE Authorization_Engine SHALL consider profile status, type, context, and ownership
6. THE Authorization_Engine SHALL support actions: post, comment, message, createBusiness, moderate, review, vote, upload, report, verify, ban, suspend
7. THE Authorization_Engine SHALL prevent semantic use of user_id in social/domain flows
8. IF a profile is suspended or blocked, THE Authorization_Engine SHALL deny all restricted actions
9. WHEN checking ownership, THE Authorization_Engine SHALL verify if profile owns/controls the target entity

#### Contrato Mínimo do Authorization_Engine:
```typescript
interface AuthorizationEngine {
  // Decisão de autorização contextual (SEMPRE usar para decisões reais)
  canProfilePerformAction(
    profileId: string, 
    action: Action, 
    context: ActionContext,
    targetEntity?: TargetEntity
  ): Promise<boolean>;
  
  // Verificação de ownership
  checkOwnership(
    profileId: string, 
    targetEntity: TargetEntity
  ): Promise<boolean>;
  
  // Lista de permissões (APENAS para UI/display, NÃO para decisões)
  // ⚠️ NUNCA usar getProfilePermissions() para autorizar ações
  // ⚠️ SEMPRE usar canProfilePerformAction() para decisões reais
  getProfilePermissions(
    profileId: string, 
    context: ActionContext
  ): Promise<Permission[]>;
}
```

**IMPORTANTE - Uso Correto do Authorization_Engine:**

❌ **ERRADO** - Usar getProfilePermissions() para decisões:
```typescript
const permissions = await authEngine.getProfilePermissions(profileId, context);
if (permissions.includes('post')) {
  // NÃO FAZER ISSO - ignora ownership e contexto específico
}
```

✅ **CORRETO** - Usar canProfilePerformAction() para decisões:
```typescript
const canPost = await authEngine.canProfilePerformAction(
  profileId, 
  'post', 
  context,
  targetEntity  // Inclui ownership check
);
if (canPost) {
  // Decisão correta considerando ownership e contexto
}
```

**Quando usar cada método:**
- `canProfilePerformAction()`: Para TODAS as decisões de autorização (criar, editar, deletar, etc)
- `checkOwnership()`: Quando precisa verificar ownership isoladamente
- `getProfilePermissions()`: APENAS para exibir lista de permissões na UI (não para decisões)

### Requirement 5: Fronteira Canônica de Identificadores

**User Story:** Como arquiteto de sistema, eu quero uma fronteira clara entre user_id (auth/global/técnico) e profile_id (ações sociais/domínio), para que não haja ambiguidade de identificadores no sistema.

#### Acceptance Criteria

1. THE Canonical_Boundary SHALL restrict user_id usage to authentication, global operations, and technical contexts only
2. THE Canonical_Boundary SHALL require profile_id for all social and domain actions
3. THE Canonical_Boundary SHALL prohibit ambiguous identifier usage in business logic
4. THE Canonical_Boundary SHALL enforce profile_id for: posts, comments, messages, business creation, social interactions
5. THE Canonical_Boundary SHALL enforce user_id for: authentication, global settings, technical operations, audit logs
6. THE system SHALL implement linting rules to detect canonical boundary violations
7. WHEN an identifier is used incorrectly, THE system SHALL provide clear guidance on correct usage

#### Fronteira de Identificadores:
```
user_id APENAS para:
- Autenticação (login/logout/session)
- Configurações globais do usuário
- Operações técnicas (logs, audit, billing)
- Relacionamentos entre usuário e profiles

profile_id SEMPRE para:
- Posts, comentários, mensagens
- Criação de businesses
- Interações sociais
- Ações de domínio específico
- Moderação contextual
```

### Requirement 6: Cache and Invalidation Strategy

**User Story:** Como usuário do sistema, eu quero que mudanças de sessão e profile sejam refletidas imediatamente em toda a aplicação, para que não haja inconsistências temporárias.

#### Acceptance Criteria

1. THE Cache_Manager SHALL cache session data (user, activeProfile, profiles list) in memory
2. WHEN session changes occur, THE Cache_Manager SHALL invalidate ALL session-related cached data
3. WHEN active profile is switched, THE Cache_Manager SHALL invalidate profile-specific cached data
4. WHEN active profile is switched, THE Cache_Manager SHALL propagate the change to Authorization_Engine layer
5. WHEN profile data is updated, THE Cache_Manager SHALL invalidate cached profile data
6. THE Cache_Manager SHALL ensure no stale data is served after invalidation events
7. THE system SHALL ensure authorization decisions reflect current session and profile state

#### Eventos que invalidam cache:
```
- Login/Logout: limpa TUDO (sessão + propaga para autorização)
- Profile switch: limpa profile cache + propaga mudança para Authorization_Engine
- Profile update: limpa profile cache + propaga mudança para Authorization_Engine

Note: Detalhes de TTLs, timeouts e estratégias específicas de cache serão definidos na fase de design
```

### Requirement 7: Separation of Session Context and Authorization

**User Story:** Como desenvolvedor, eu quero que fique explícito que Session_Context_System NÃO é fonte de autorização e que componentes NÃO devem inferir permissões do activeProfile, para que sempre usem Authorization_Engine para decisões de permissão.

#### Acceptance Criteria

1. THE Session_Context_System SHALL provide ONLY identity and context data (user, activeProfile, profiles)
2. THE Session_Context_System SHALL NOT provide any permission checking capabilities
3. THE Session_Context_System SHALL NOT provide any authorization decision methods
4. THE system SHALL detect common patterns of direct permission inference from activeProfile data where technically feasible
5. THE system SHALL require ALL permission decisions to go through Authorization_Engine
6. THE system architecture, documentation, and code review process SHALL enforce separation between session context and authorization
7. WHEN a component needs to check permissions, THE component SHALL use Authorization_Engine.canProfilePerformAction()
8. THE system SHALL provide clear documentation that activeProfile.type or activeProfile.status MUST NOT be used for authorization decisions

#### Separação Clara de Responsabilidades:

```
✅ Session_Context_System (APENAS contexto):
- Quem está logado? (user)
- Qual profile está ativo? (activeProfile)
- Quais profiles disponíveis? (profiles)
- Trocar profile ativo (switchProfile)

❌ Session_Context_System (NÃO faz):
- Verificar permissões
- Decidir se pode fazer ação
- Checar ownership
- Validar autorização

✅ Authorization_Engine (APENAS autorização):
- Pode fazer ação? (canProfilePerformAction)
- É dono da entidade? (checkOwnership)
- Quais permissões tem? (getProfilePermissions - apenas display)

❌ Authorization_Engine (NÃO faz):
- Gerenciar sessão
- Trocar profile ativo
- Carregar dados de sessão
```

#### Padrões Proibidos:

```typescript
// ❌ ERRADO - Inferir permissão do activeProfile
const { activeProfile } = useSessionContext();
if (activeProfile?.type === 'business') {
  // NÃO FAZER - ignora status, contexto, ownership
  showCreateBusinessButton();
}

// ❌ ERRADO - Usar status do profile para autorização
if (activeProfile?.status === 'active') {
  // NÃO FAZER - lógica de autorização espalhada
  allowPosting();
}

// ✅ CORRETO - Sempre usar Authorization_Engine
const { activeProfile } = useSessionContext();
const canCreateBusiness = await authEngine.canProfilePerformAction(
  activeProfile.id,
  'createBusiness',
  context
);
if (canCreateBusiness) {
  showCreateBusinessButton();
}
```

#### Enforcement através de Arquitetura, Automação e Code Review:

```
Detecção Automática (onde tecnicamente possível):
- ESLint rules para padrões comuns detectáveis de inferência direta
- Exemplos: activeProfile.type/status em condicionais simples de autorização
- Limitação: Padrões complexos ou indiretos podem não ser detectados automaticamente

Enforcement Manual (code review - essencial):
- Revisar lógica de autorização em PRs
- Verificar uso correto do Authorization_Engine
- Garantir que decisões de permissão não estão espalhadas
- Validar que activeProfile não é usado para autorização
- Identificar padrões que automação não detecta

Arquitetura (prevenção por design):
- Session_Context_System não expõe métodos de autorização
- Authorization_Engine é a única porta para decisões de permissão
- Documentação clara sobre separação de responsabilidades
- Treinamento de equipe sobre padrões corretos
```

### Requirement 8: Performance and Reliability

**User Story:** Como usuário final, eu quero que o sistema de sessão seja performático e confiável, para que não haja impacto na experiência de uso.

#### Acceptance Criteria

1. THE Session_Context_System SHALL respond to session queries efficiently for cached data
2. THE Authorization_Engine SHALL respond to permission checks efficiently for cached decisions
3. THE Session_Context_System SHALL handle network failures gracefully with appropriate fallbacks
4. THE Session_Context_System SHALL implement retry logic for transient failures
5. THE Session_Context_System SHALL maintain session state during temporary network interruptions
6. THE system SHALL log performance metrics for monitoring
7. THE system SHALL support concurrent access without data corruption
8. THE system SHALL not introduce blocking operations that degrade user experience

#### Performance Goals (Qualitative):
```
Session queries (cached): Should be fast and non-blocking for user experience
Permission checks (cached): Should be fast and non-blocking for user experience
Network failures: Graceful degradation without blocking UI
Concurrent access: No data corruption or race conditions
Cache strategy: Balance between freshness and performance

Note: Specific performance targets (response times, TTLs, timeouts, cache strategies) 
will be defined in design phase based on actual usage patterns and technical constraints
```

### Requirement 9: Access Control and Migration Rules

**User Story:** Como arquiteto de sistema, eu quero regras técnicas que impeçam regressão para padrões antigos de acesso direto, para que a arquitetura centralizada seja mantida.

#### Acceptance Criteria

1. THE system SHALL prohibit new direct access to supabase.auth.getUser() outside the defined layer
2. THE system SHALL prohibit use of user.id in social/domain flows
3. THE system SHALL prohibit manual active profile loading in components
4. THE system SHALL prohibit coupling of permissions in useSessionContext()
5. THE system SHALL implement ESLint rules to detect and prevent prohibited patterns
6. THE system SHALL fail builds when prohibited access patterns are detected
7. WHEN legacy code is found, THE system SHALL provide clear migration guidance

### Requirement 10: Migration and Compatibility (Temporária com Critérios de Saída)

**User Story:** Como desenvolvedor, eu quero um plano de migração claro com inventário completo, priorização e critérios de saída definidos, para que a transição seja controlada e o código legado seja completamente removido ao final.

#### Acceptance Criteria

1. THE migration plan SHALL provide a complete inventory of all files using legacy patterns (direct supabase.auth.getUser(), user.id in social flows, manual profile loading)
2. THE migration plan SHALL categorize files by priority: P0 (critical/high-traffic), P1 (important), P2 (low-priority)
3. THE migration plan SHALL define clear exit criteria for each priority level
4. THE migration plan SHALL provide step-by-step migration instructions for each file type
5. THE migration plan SHALL include rollback procedures in case of issues
6. THE migration plan SHALL maintain backward compatibility ONLY during transition period with explicit deprecation warnings
7. THE system SHALL explicitly PROHIBIT new uses of legacy patterns during migration
8. WHEN all P0 and P1 files are migrated, THE system SHALL remove compatibility layer for those patterns
9. WHEN all files are migrated (P0, P1, P2), THE system SHALL remove ALL legacy access patterns and compatibility layers
10. THE system SHALL fail builds for any legacy pattern usage after migration completion

#### Inventário e Priorização:
```
P0 - Crítico (migrar primeiro):
- Arquivos de autenticação core
- Componentes de alta frequência (feed, dashboard)
- Serviços de criação de conteúdo

P1 - Importante (migrar em seguida):
- Páginas de perfil e configurações
- Módulos de negócios e serviços
- Componentes de moderação

P2 - Baixa prioridade (migrar por último):
- Páginas administrativas de baixo uso
- Componentes de features experimentais
- Utilitários raramente usados
```

#### Critérios de Saída por Fase:
```
Fase 1 - P0 Completo:
- ✅ 100% dos arquivos P0 migrados
- ✅ Testes passando para arquivos P0
- ✅ Zero warnings de deprecation em P0
- → Remover compatibility layer para P0

Fase 2 - P1 Completo:
- ✅ 100% dos arquivos P0 + P1 migrados
- ✅ Testes passando para P0 + P1
- ✅ Zero warnings de deprecation em P0 + P1
- → Remover compatibility layer para P1

Fase 3 - Migração Completa:
- ✅ 100% dos arquivos migrados (P0 + P1 + P2)
- ✅ Todos os testes passando
- ✅ Zero warnings de deprecation
- ✅ ESLint rules ativadas para fail build
- → Remover TODA compatibility layer
- → Remover código legado completamente
```

#### Compatibilidade Legado (TEMPORÁRIA com prazo):
```
PERMITIDO durante migração (com warnings):
- Existing direct supabase.auth.getUser() calls
- Existing user.id usage em social flows
- Existing manual profile loading

PROIBIDO durante migração (fail build):
- NEW direct supabase.auth.getUser() calls
- NEW user.id usage em social flows  
- NEW manual profile loading
- NEW coupling of permissions in session context

Após cada fase:
- Fase 1: Remove compatibility para P0
- Fase 2: Remove compatibility para P1
- Fase 3: Remove TODA compatibility e código legado
```

### Requirement 11: Prohibition of Ambiguous Identifiers

**User Story:** Como desenvolvedor, eu quero que o sistema proíba identificadores ambíguos como author_id, owner_id, creator_id, para que sempre fique explícito se estamos referenciando user_id ou profile_id, prevenindo ambiguidade futura mesmo quando o contexto parecer óbvio.

#### Acceptance Criteria

1. THE system SHALL prohibit ambiguous identifier names in database schema: author_id, owner_id, creator_id, driver_id, sender_id, recipient_id
2. THE system SHALL require qualified identifier names in database schema: author_profile_id, owner_profile_id, creator_profile_id, driver_profile_id, sender_profile_id, recipient_profile_id
3. THE system SHALL prohibit ambiguous identifier names in TypeScript code: authorId, ownerId, creatorId, driverId, senderId, recipientId
4. THE system SHALL require qualified identifier names in TypeScript code: authorProfileId, ownerProfileId, creatorProfileId, driverProfileId, senderProfileId, recipientProfileId
5. THE system SHALL implement ESLint rules to detect ambiguous identifier usage
6. THE system SHALL implement database migration linting to detect ambiguous column names
7. WHEN an ambiguous identifier is detected, THE system SHALL fail the build with clear guidance
8. THE system SHALL provide automated refactoring suggestions for ambiguous identifiers
9. THE system SHALL require semantic qualification EVEN when context seems obvious to prevent future ambiguity

#### Justificativa para Qualificação Semântica Obrigatória:

Identificadores de relacionamento/ownership devem ser SEMPRE semanticamente qualificados, MESMO quando o contexto parecer óbvio. Esta regra previne ambiguidade futura e facilita manutenção:

```
❌ ERRADO - Parece óbvio mas é ambíguo:
posts.author_id  // Parece óbvio que é profile, mas não é explícito
messages.sender_id  // Contexto sugere profile, mas não garante
businesses.owner_id  // Ownership parece claro, mas ambíguo

✅ CORRETO - Explícito e à prova de futuro:
posts.author_profile_id  // Explicitamente um profile
messages.sender_profile_id  // Sem ambiguidade
businesses.owner_profile_id  // Claro que é profile ownership

Razões para qualificação SEMPRE obrigatória:
1. Previne ambiguidade quando código é lido fora de contexto
2. Facilita refatoração e manutenção futura
3. Torna queries e joins mais legíveis
4. Evita bugs quando sistema evolui
5. Documentação auto-explicativa no schema
6. Elimina necessidade de "adivinhar" o tipo correto
7. Reduz carga cognitiva em code review
8. Previne regressão para padrões ambíguos
```

#### Identificadores Proibidos vs Requeridos:

```
❌ PROIBIDO (ambíguo):
- author_id / authorId
- owner_id / ownerId
- creator_id / creatorId
- driver_id / driverId
- sender_id / senderId
- recipient_id / recipientId
- moderator_id / moderatorId
- reviewer_id / reviewerId

✅ REQUERIDO (explícito):
- author_profile_id / authorProfileId
- owner_profile_id / ownerProfileId
- creator_profile_id / creatorProfileId
- driver_profile_id / driverProfileId
- sender_profile_id / senderProfileId
- recipient_profile_id / recipientProfileId
- moderator_profile_id / moderatorProfileId
- reviewer_profile_id / reviewerProfileId

✅ EXCEÇÕES (contexto técnico/global):
- user_id / userId (apenas para auth e operações globais)
- created_by_user_id (audit logs técnicos)
- updated_by_user_id (audit logs técnicos)
```

#### Validação Automática:
```typescript
// ESLint rule para detectar identificadores ambíguos
{
  'no-ambiguous-identifiers': ['error', {
    prohibited: [
      'author_id', 'authorId',
      'owner_id', 'ownerId',
      'creator_id', 'creatorId',
      // ... outros
    ],
    message: 'Use qualified identifiers: author_profile_id, owner_profile_id, etc.'
  }]
}
```
