# VALIDAÇÃO E BLINDAGEM - Arquitetura Community

## Objetivo
Provar que a arquitetura consolidada funciona corretamente em produto real, sem regressão e sem reabrir acoplamentos indevidos.

## FRENTE 1: CHECKLIST FUNCIONAL E2E

### 1.1 POST SOCIAL - Fluxo Completo

#### Criação
- [ ] Abrir UnifiedComposer
- [ ] Selecionar "Post Social"
- [ ] Preencher conteúdo
- [ ] Selecionar tipo (discussao, recomendacao, enquete)
- [ ] Adicionar imagens (máx 3)
- [ ] Adicionar tags
- [ ] Submeter via PostService.createPost()
- [ ] Verificar validação de dados
- [ ] Verificar rate limiting
- [ ] Verificar ownership do profile

#### Renderização
- [ ] Post aparece no feed principal (CommunityFeed)
- [ ] UnifiedPostCard renderiza corretamente
- [ ] Avatar e nome do autor corretos
- [ ] Conteúdo formatado
- [ ] Imagens carregam
- [ ] Tags exibidas
- [ ] Contadores (likes, comments) corretos
- [ ] Timestamp relativo

#### Interações
- [ ] Like/Unlike via SocialInteractionsService
- [ ] Comentar via CommentsModal
- [ ] Salvar/Unsave
- [ ] Compartilhar
- [ ] Reportar abuso
- [ ] Editar (apenas autor)
- [ ] Deletar (apenas autor)

#### Estados
- [ ] Loading skeleton durante fetch
- [ ] Empty state quando sem posts
- [ ] Error state em caso de falha
- [ ] Infinite scroll funciona
- [ ] Refetch após criar post

### 1.2 ALERTA - Fluxo Completo

#### Criação
- [ ] Abrir UnifiedComposer
- [ ] Selecionar "Alerta Urgente"
- [ ] Modal CreateAlertModal abre
- [ ] Preencher categoria (seguranca, transito, etc)
- [ ] Preencher descrição
- [ ] Selecionar localização
- [ ] Submeter via communityAlertService.createAlert()
- [ ] Verificar RPC create_community_alert
- [ ] Verificar validação de termos proibidos
- [ ] Verificar rate limiting
- [ ] Verificar deduplicação


#### Renderização
- [ ] Alerta NÃO aparece inline no feed principal
- [ ] Alerta aparece em AlertFeedSection (bloco contextual separado)
- [ ] AlertCard renderiza com borda vermelha
- [ ] Badge de categoria exibido
- [ ] Countdown de expiração funciona
- [ ] Botão "Ver Orientações" funciona
- [ ] Contador de visualizações

#### Interações
- [ ] Marcar como visto
- [ ] Reportar alerta falso
- [ ] Compartilhar alerta
- [ ] Encerrar alerta (apenas autor)

#### Estados
- [ ] Loading skeleton em AlertFeedSection
- [ ] Empty state quando sem alertas
- [ ] Error state isolado (não quebra feed principal)
- [ ] Alertas expirados não aparecem
- [ ] Alertas removidos não aparecem

### 1.3 PROBLEMA URBANO - Fluxo Completo

#### Criação
- [ ] Abrir UnifiedComposer
- [ ] Selecionar "Problema Urbano"
- [ ] Modal CreateIssueModal abre
- [ ] Preencher categoria (iluminacao, limpeza, etc)
- [ ] Preencher descrição
- [ ] Adicionar fotos
- [ ] Selecionar localização
- [ ] Submeter via communityIssueService.createIssue()
- [ ] Verificar RPC create_community_issue
- [ ] Verificar rate limiting
- [ ] Verificar deduplicação

#### Renderização
- [ ] Problema NÃO aparece inline no feed principal
- [ ] Problema aparece em IssueFeedSection (bloco contextual separado)
- [ ] IssueCard renderiza com borda laranja
- [ ] Badge de categoria exibido
- [ ] Status exibido (aberto, em_analise, resolvido)
- [ ] Contador de apoios
- [ ] Prioridade visual

#### Interações
- [ ] Apoiar problema (upvote)
- [ ] Remover apoio
- [ ] Reportar abuso
- [ ] Compartilhar
- [ ] Atualizar status (apenas autor)

#### Estados
- [ ] Loading skeleton em IssueFeedSection
- [ ] Empty state quando sem problemas
- [ ] Error state isolado (não quebra feed principal)
- [ ] Problemas resolvidos marcados visualmente
- [ ] Problemas removidos não aparecem


## FRENTE 2: CONTRATOS DE FRONTEIRA

### 2.1 Responsabilidades de core/posts

**O QUE CORE/POSTS CONHECE:**
- Posts sociais (discussao, recomendacao, enquete, evento)
- CRUD de posts
- Feed de posts
- Métricas de posts (likes, comments, shares)
- Polls vinculadas a posts
- Validações de posts
- Permissões de posts

**O QUE CORE/POSTS NÃO CONHECE:**
- ❌ Alertas (community-alerts)
- ❌ Problemas urbanos (community-issues)
- ❌ Lógica de moderação de alertas
- ❌ Lógica de apoio a problemas
- ❌ RPC específicas de alertas/issues

**API PÚBLICA:**
```typescript
// PostService
- createPost(profileId, data): Post
- getPostById(postId): Post | null
- updatePost(postId, data): Post
- deletePost(postId): void
- getFeed(params): FeedResult
- getPostsByProfile(profileId, params): Post[]
- getPostsByLocation(location, params): Post[]
- getSavedPosts(userId, params): Post[]
- getPostStats(postId): PostStats
- validatePostOwnership(postId, userId): boolean
- canUserCreatePost(userId): boolean
```

**TIPOS EXPORTADOS:**
```typescript
export type PostType = 
  | "discussao" 
  | "recomendacao" 
  | "enquete" 
  | "evento";

export type Post = {
  id: string;
  type: PostType;
  content: string;
  author_profile_id: string;
  // ... outros campos
};
```

### 2.2 Responsabilidades de modules/community

**O QUE COMMUNITY CONHECE:**
- Composição de feed social
- Orquestração de criação (UnifiedComposer)
- UI de posts sociais
- Filtros de localização
- Modais de posts
- Widgets de comunidade

**O QUE COMMUNITY NÃO CONHECE:**
- ❌ Lógica interna de alertas
- ❌ Lógica interna de problemas
- ❌ Validações de alertas/issues
- ❌ RPC de alertas/issues

**REGRA DE COMPOSIÇÃO:**
- Community importa APENAS componentes públicos de community-alerts e community-issues
- Community NÃO importa services ou hooks internos desses módulos
- Community orquestra via props e callbacks


### 2.3 API Pública de community-alerts

**COMPONENTES EXPORTADOS:**
```typescript
export { AlertFeedSection } from "./components/AlertFeedSection";
export { AlertCard } from "./components/AlertCard";
export { CreateAlertModal } from "./components/CreateAlertModal";
```

**HOOKS EXPORTADOS:**
```typescript
export { useAlerts } from "./hooks/useAlerts";
export { useCreateAlert } from "./hooks/useCreateAlert";
export { useAlertReport } from "./hooks/useAlertReport";
```

**SERVICES EXPORTADOS:**
```typescript
export { communityAlertService } from "./services/CommunityAlertService";
export { alertModerationService } from "./services/AlertModerationService";
```

**TIPOS EXPORTADOS:**
```typescript
export type AlertCategory = 
  | "seguranca" 
  | "transito" 
  | "clima" 
  | "servicos" 
  | "outro";

export type CommunityAlertPublic = {
  id: string;
  category: AlertCategory;
  description: string;
  city: string;
  // ... campos públicos
};
```

**REGRA DE USO:**
- Community pode importar componentes para composição
- Community pode importar hooks para lógica de UI
- Community NÃO deve acessar tabelas de alertas diretamente
- Community NÃO deve duplicar lógica de validação de alertas

### 2.4 API Pública de community-issues

**COMPONENTES EXPORTADOS:**
```typescript
export { IssueFeedSection } from "./components/IssueFeedSection";
export { IssueCard } from "./components/IssueCard";
export { CreateIssueModal } from "./components/CreateIssueModal";
```

**HOOKS EXPORTADOS:**
```typescript
export { useIssues } from "./hooks/useIssues";
export { useCreateIssue } from "./hooks/useCreateIssue";
export { useIssueSupport } from "./hooks/useIssueSupport";
```

**TIPOS EXPORTADOS:**
```typescript
export type IssueCategory = 
  | "iluminacao" 
  | "limpeza" 
  | "calcada" 
  | "seguranca" 
  | "outro";

export type CommunityIssuePublic = {
  id: string;
  category: IssueCategory;
  description: string;
  status: IssueStatus;
  // ... campos públicos
};
```

**REGRA DE USO:**
- Community pode importar componentes para composição
- Community pode importar hooks para lógica de UI
- Community NÃO deve acessar tabelas de issues diretamente
- Community NÃO deve duplicar lógica de validação de issues


### 2.5 Imports Permitidos e Proibidos

#### ✅ PERMITIDO

**Community pode importar de:**
```typescript
// Core
import { postService } from "@/core/posts/services";
import { Post, PostType } from "@/core/posts/types";
import { useSessionContext } from "@/core/session";
import { profileService } from "@/core/profiles";

// Módulos irmãos (apenas API pública)
import { AlertFeedSection, CreateAlertModal } from "@/modules/community-alerts";
import { IssueFeedSection, CreateIssueModal } from "@/modules/community-issues";

// Shared
import { Button } from "@/shared/components/ui/button";
import { logger } from "@/shared/utils/logger";
```

#### ❌ PROIBIDO

**Community NÃO pode importar:**
```typescript
// ❌ Services internos de outros módulos
import { communityAlertService } from "@/modules/community-alerts/services/CommunityAlertService";
import { communityIssueService } from "@/modules/community-issues/services/CommunityIssueService";

// ❌ Hooks internos de outros módulos
import { useAlertValidation } from "@/modules/community-alerts/hooks/useAlertValidation";
import { useIssueValidation } from "@/modules/community-issues/hooks/useIssueValidation";

// ❌ Tipos internos de outros módulos
import { AlertInternal } from "@/modules/community-alerts/domain/internal";
import { IssueInternal } from "@/modules/community-issues/domain/internal";

// ❌ Acesso direto ao banco
import { supabase } from "@/integrations/supabase";
const { data } = await supabase.from("community_alerts").select("*"); // ❌
```

### 2.6 Regra Explícita: PostType NÃO Volta a Receber Alerta nem Zeladoria

**DECISÃO ARQUITETURAL DEFINITIVA:**

```typescript
// ✅ CORRETO - PostType enxuto e social
export type PostType = 
  | "discussao" 
  | "recomendacao" 
  | "enquete" 
  | "evento";

// ❌ PROIBIDO - NÃO reabrir PostType
export type PostType = 
  | "discussao" 
  | "recomendacao" 
  | "enquete" 
  | "evento"
  | "alerta"      // ❌ NUNCA
  | "zeladoria";  // ❌ NUNCA
```

**JUSTIFICATIVA:**
1. Alertas têm domínio próprio (community-alerts)
2. Problemas urbanos têm domínio próprio (community-issues)
3. Cada domínio tem suas próprias regras de negócio
4. Misturar tipos quebra SSOT e cria acoplamento
5. Composição via blocos contextuais é a solução correta

**ANTI-REGRESSÃO:**
- Qualquer PR que adicione "alerta" ou "zeladoria" a PostType deve ser REJEITADO
- Qualquer código que trate alertas/issues como posts deve ser REFATORADO
- Qualquer mistura inline no feed deve ser REMOVIDA


## FRENTE 3: VALIDAÇÃO DA PÁGINA /COMUNIDADE

### 3.1 Cenário: Sem Alertas

**Setup:**
- Usuário com profile ativo
- City e neighborhood definidos
- Nenhum alerta ativo na região

**Validações:**
- [ ] Feed principal carrega posts sociais normalmente
- [ ] AlertFeedSection NÃO aparece (ou mostra empty state)
- [ ] IssueFeedSection aparece normalmente
- [ ] UnifiedComposer funciona
- [ ] Nenhum erro no console
- [ ] Performance não afetada

### 3.2 Cenário: Sem Problemas

**Setup:**
- Usuário com profile ativo
- City e neighborhood definidos
- Nenhum problema urbano ativo na região

**Validações:**
- [ ] Feed principal carrega posts sociais normalmente
- [ ] AlertFeedSection aparece normalmente
- [ ] IssueFeedSection NÃO aparece (ou mostra empty state)
- [ ] UnifiedComposer funciona
- [ ] Nenhum erro no console
- [ ] Performance não afetada

### 3.3 Cenário: Com Alertas

**Setup:**
- Usuário com profile ativo
- 3 alertas ativos na região

**Validações:**
- [ ] Feed principal carrega posts sociais
- [ ] AlertFeedSection aparece APÓS o feed principal
- [ ] 3 AlertCards renderizados corretamente
- [ ] Alertas NÃO aparecem inline entre posts
- [ ] Cada alerta tem borda vermelha
- [ ] Botão "Ver Mais" funciona se houver mais alertas
- [ ] Nenhum erro no console

### 3.4 Cenário: Com Problemas

**Setup:**
- Usuário com profile ativo
- 5 problemas urbanos ativos na região

**Validações:**
- [ ] Feed principal carrega posts sociais
- [ ] IssueFeedSection aparece APÓS o feed principal
- [ ] 5 IssueCards renderizados corretamente
- [ ] Problemas NÃO aparecem inline entre posts
- [ ] Cada problema tem borda laranja
- [ ] Botão "Ver Mais" funciona se houver mais problemas
- [ ] Nenhum erro no console

### 3.5 Cenário: Com Ambos

**Setup:**
- Usuário com profile ativo
- 2 alertas ativos
- 3 problemas urbanos ativos

**Validações:**
- [ ] Feed principal carrega posts sociais
- [ ] AlertFeedSection aparece (se implementado)
- [ ] IssueFeedSection aparece
- [ ] Blocos são independentes
- [ ] Ordem: Feed → Alertas → Problemas
- [ ] Nenhuma mistura inline
- [ ] Nenhum erro no console


### 3.6 Cenário: Erro em Um Bloco, Sucesso nos Outros

**Setup:**
- Feed principal: sucesso (10 posts)
- AlertFeedSection: erro de rede
- IssueFeedSection: sucesso (5 problemas)

**Validações:**
- [ ] Feed principal renderiza normalmente
- [ ] AlertFeedSection mostra error state isolado
- [ ] IssueFeedSection renderiza normalmente
- [ ] Erro em alertas NÃO quebra página inteira
- [ ] Erro em alertas NÃO quebra feed principal
- [ ] Erro em alertas NÃO quebra problemas
- [ ] Botão "Tentar Novamente" em AlertFeedSection
- [ ] Console mostra erro apenas de alertas

**Setup 2:**
- Feed principal: erro de rede
- AlertFeedSection: sucesso
- IssueFeedSection: sucesso

**Validações:**
- [ ] Feed principal mostra error state
- [ ] AlertFeedSection renderiza normalmente
- [ ] IssueFeedSection renderiza normalmente
- [ ] Erro no feed NÃO quebra blocos contextuais
- [ ] Botão "Tentar Novamente" no feed

### 3.7 Cenário: Loading States

**Setup:**
- Primeira carga da página
- Todos os requests lentos (simular throttling)

**Validações:**
- [ ] Feed principal mostra 3 PostCardSkeleton
- [ ] AlertFeedSection mostra 2 AlertCardSkeleton
- [ ] IssueFeedSection mostra 2 IssueCardSkeleton
- [ ] Skeletons têm animação de pulse
- [ ] Skeletons respeitam layout dos cards reais
- [ ] Transição suave de skeleton → conteúdo
- [ ] Nenhum flash de conteúdo

### 3.8 Cenário: Empty States

**Setup:**
- Usuário novo em região sem atividade
- Nenhum post, alerta ou problema

**Validações:**
- [ ] Feed principal mostra empty state
- [ ] Mensagem: "Seja o primeiro a postar na sua região"
- [ ] Botão "Criar Post" visível
- [ ] AlertFeedSection não aparece ou mostra empty state
- [ ] IssueFeedSection não aparece ou mostra empty state
- [ ] UnifiedComposer funciona normalmente
- [ ] Criar primeiro post atualiza feed

### 3.9 Cenário: Composer Abrindo Fluxo Certo

**Setup:**
- Usuário clica em UnifiedComposer

**Validações:**
- [ ] Dropdown abre com 3 opções
- [ ] Opção 1: "Post Social" com ícone MessageCircle
- [ ] Opção 2: "Alerta Urgente" com ícone AlertTriangle
- [ ] Opção 3: "Problema Urbano" com ícone Construction
- [ ] Clicar "Post Social" → CreatePostModal abre
- [ ] Clicar "Alerta Urgente" → CreateAlertModal abre
- [ ] Clicar "Problema Urbano" → CreateIssueModal abre
- [ ] Cada modal é independente
- [ ] Fechar modal volta ao estado inicial
- [ ] Criar conteúdo fecha modal e atualiza feed correspondente


## FRENTE 4: PERFORMANCE

### 4.1 Auditoria de Requests

**Objetivo:** Verificar quantos requests /comunidade dispara na carga inicial

**Método:**
1. Abrir DevTools → Network
2. Limpar histórico
3. Navegar para /comunidade
4. Contar requests

**Requests Esperados:**
```
1. GET /auth/user (sessão)
2. GET /profiles?user_id=... (profile ativo)
3. GET /posts?city=...&limit=20 (feed principal)
4. GET /community_alerts_public?city=... (alertas)
5. GET /community_issues_public?city=... (problemas)
```

**Validações:**
- [ ] Total de requests ≤ 5 na carga inicial
- [ ] Nenhum request duplicado
- [ ] Nenhum request desnecessário
- [ ] Requests em paralelo (não sequenciais)
- [ ] Cache headers corretos

### 4.2 Fetch Duplicado

**Cenários a Verificar:**

**Cenário 1: Mesmo endpoint chamado 2x**
- [ ] Verificar se getFeed() é chamado múltiplas vezes
- [ ] Verificar se getAlerts() é chamado múltiplas vezes
- [ ] Verificar se getIssues() é chamado múltiplas vezes

**Cenário 2: Dados já em cache sendo refetchados**
- [ ] Verificar staleTime dos queries
- [ ] Verificar gcTime dos queries
- [ ] Verificar se refetch manual está correto

**Cenário 3: Componente renderiza 2x causando fetch duplo**
- [ ] Verificar React.StrictMode (esperado em dev)
- [ ] Verificar se hooks estão memoizados
- [ ] Verificar se useEffect tem deps corretas

**Correções Necessárias:**
```typescript
// ✅ CORRETO - staleTime e gcTime definidos
const query = useInfiniteQuery({
  queryKey: ["community-feed", locationScope, city],
  queryFn: fetchFeed,
  staleTime: 2 * 60 * 1000, // 2 minutos
  gcTime: 5 * 60 * 1000,    // 5 minutos
});

// ❌ ERRADO - sem staleTime
const query = useInfiniteQuery({
  queryKey: ["community-feed"],
  queryFn: fetchFeed,
  // refetch a cada render!
});
```

### 4.3 Render Duplicado

**Método:**
1. Adicionar console.log em componentes principais
2. Navegar para /comunidade
3. Contar quantas vezes cada componente renderiza

**Componentes a Monitorar:**
- ComunidadePage
- CommunityFeed
- UnifiedPostCard (cada instância)
- AlertFeedSection
- IssueFeedSection

**Validações:**
- [ ] ComunidadePage renderiza 1x (ou 2x em StrictMode)
- [ ] CommunityFeed renderiza 1x após dados carregarem
- [ ] UnifiedPostCard renderiza 1x por post
- [ ] AlertFeedSection renderiza 1x
- [ ] IssueFeedSection renderiza 1x
- [ ] Nenhum loop infinito de renders
- [ ] Nenhum render causado por prop instável

**Correções Necessárias:**
```typescript
// ✅ CORRETO - callbacks memoizados
const handlePostClick = useCallback((postId: string) => {
  // ...
}, []);

// ❌ ERRADO - callback recriado a cada render
const handlePostClick = (postId: string) => {
  // ...
};
```


### 4.4 Blocos Carregam em Paralelo

**Objetivo:** Verificar se feed, alertas e problemas carregam simultaneamente

**Método:**
1. Abrir DevTools → Network
2. Ativar "Preserve log"
3. Navegar para /comunidade
4. Verificar timeline dos requests

**Validações:**
- [ ] Request de posts inicia imediatamente
- [ ] Request de alertas inicia imediatamente
- [ ] Request de problemas inicia imediatamente
- [ ] Requests NÃO são sequenciais (um após o outro)
- [ ] Requests são paralelos (overlapping no timeline)
- [ ] Tempo total ≈ tempo do request mais lento (não soma de todos)

**Exemplo de Timeline Correto:**
```
0ms    ─────────────────────────────────────────────────────────────
       │ GET /posts (200ms)
       │ GET /community_alerts_public (150ms)
       │ GET /community_issues_public (180ms)
200ms  ─────────────────────────────────────────────────────────────
       Todos completaram em ~200ms (não 530ms)
```

**Exemplo de Timeline Errado:**
```
0ms    ─────────────────────────────────────────────────────────────
       │ GET /posts (200ms)
200ms  │ GET /community_alerts_public (150ms)
350ms  │ GET /community_issues_public (180ms)
530ms  ─────────────────────────────────────────────────────────────
       Total: 530ms (sequencial - RUIM)
```

### 4.5 Refetch Desnecessário

**Cenários a Verificar:**

**Cenário 1: Navegar para /comunidade → sair → voltar**
- [ ] Dados em cache são reutilizados
- [ ] Nenhum refetch se dentro de staleTime
- [ ] Refetch em background se fora de staleTime

**Cenário 2: Criar post → feed atualiza**
- [ ] Apenas feed de posts refetch
- [ ] Alertas NÃO refetch
- [ ] Problemas NÃO refetch

**Cenário 3: Criar alerta → alertas atualizam**
- [ ] Apenas alertas refetch
- [ ] Feed de posts NÃO refetch
- [ ] Problemas NÃO refetch

**Cenário 4: Mudar filtro de localização**
- [ ] Todos os blocos refetch (esperado)
- [ ] Queries antigas são canceladas
- [ ] Nenhum race condition

**Correções Necessárias:**
```typescript
// ✅ CORRETO - invalidação específica
await queryClient.invalidateQueries({ 
  queryKey: ["community-feed"] 
});

// ❌ ERRADO - invalidação global
await queryClient.invalidateQueries();
```

### 4.6 Oportunidades de Cache e Skeleton Optimization

**Cache:**
- [ ] staleTime configurado em todos os queries
- [ ] gcTime configurado em todos os queries
- [ ] Prefetch de próxima página no infinite scroll
- [ ] Cache de imagens via browser
- [ ] Cache de avatares via CDN

**Skeleton:**
- [ ] Skeleton aparece instantaneamente (não após delay)
- [ ] Skeleton tem mesma altura do conteúdo real
- [ ] Skeleton tem animação suave
- [ ] Transição skeleton → conteúdo sem layout shift
- [ ] Skeleton é acessível (aria-busy, aria-label)

**Otimizações Sugeridas:**
```typescript
// Prefetch próxima página
useEffect(() => {
  if (hasNextPage && !isFetchingNextPage) {
    queryClient.prefetchInfiniteQuery({
      queryKey: ["community-feed", locationScope],
      queryFn: fetchFeed,
    });
  }
}, [hasNextPage, isFetchingNextPage]);

// Skeleton com altura fixa
<div className="h-[200px] animate-pulse bg-gray-200 rounded-lg" />
```


## FRENTE 5: DOCUMENTAÇÃO FINAL CURTA

### 5.1 Fontes de Verdade (SSOT)

| Domínio | SSOT | Localização |
|---------|------|-------------|
| Posts Sociais | PostService | `core/posts/services/PostService.ts` |
| Alertas | CommunityAlertService | `modules/community-alerts/services/CommunityAlertService.ts` |
| Problemas Urbanos | CommunityIssueService | `modules/community-issues/services/CommunityIssueService.ts` |
| Profiles | ProfileService | `core/profiles/services/ProfileService.ts` |
| Interações Sociais | SocialInteractionsService | `core/social/services/SocialInteractionsService.ts` |

### 5.2 Rotas

| Rota | Componente | Responsabilidade |
|------|-----------|------------------|
| `/comunidade` | ComunidadePage | Feed social + blocos contextuais |
| `/comunidade/post/:id` | PostDetailModal | Detalhes de post social |
| `/comunidade/alertas` | (futuro) | Página dedicada de alertas |
| `/comunidade/problemas` | ProblemasPage | Página dedicada de problemas |

### 5.3 Responsabilidades por Domínio

#### core/posts
- CRUD de posts sociais
- Feed de posts
- Validações de posts
- Permissões de posts
- Polls vinculadas a posts

#### modules/community
- Composição de feed social
- Orquestração de criação (UnifiedComposer)
- UI de posts sociais
- Filtros de localização
- Widgets de comunidade

#### modules/community-alerts
- CRUD de alertas
- Validação de alertas (RPC)
- Moderação de alertas
- UI de alertas (AlertCard, AlertFeedSection)

#### modules/community-issues
- CRUD de problemas urbanos
- Validação de problemas (RPC)
- Sistema de apoio (upvotes)
- UI de problemas (IssueCard, IssueFeedSection)

### 5.4 Regra do Feed

**FEED PRINCIPAL (/comunidade):**
- Contém APENAS posts sociais
- Tipos: discussao, recomendacao, enquete, evento
- Fonte: PostService.getFeed()
- Renderizado por: CommunityFeed + UnifiedPostCard

**BLOCOS CONTEXTUAIS:**
- Alertas: AlertFeedSection (separado, após feed)
- Problemas: IssueFeedSection (separado, após feed)
- NÃO aparecem inline entre posts
- Cada bloco é independente
- Erro em um bloco NÃO quebra os outros

### 5.5 Regra do Composer

**UnifiedComposer:**
- Orquestra criação de 3 tipos de conteúdo
- Post Social → CreatePostModal → PostService
- Alerta Urgente → CreateAlertModal → CommunityAlertService
- Problema Urbano → CreateIssueModal → CommunityIssueService

**REGRA:**
- Community apenas orquestra
- Community NÃO absorve lógica interna
- Cada modal mantém sua própria lógica
- Cada service mantém suas próprias validações


### 5.6 Imports Permitidos

```typescript
// ✅ Community pode importar:

// Core
import { postService } from "@/core/posts/services";
import { Post, PostType } from "@/core/posts/types";
import { useSessionContext } from "@/core/session";
import { profileService } from "@/core/profiles";

// Módulos irmãos (apenas API pública)
import { 
  AlertFeedSection, 
  CreateAlertModal,
  useAlerts 
} from "@/modules/community-alerts";

import { 
  IssueFeedSection, 
  CreateIssueModal,
  useIssues 
} from "@/modules/community-issues";

// Shared
import { Button } from "@/shared/components/ui/button";
import { logger } from "@/shared/utils/logger";
```

### 5.7 Anti-Regressões Arquiteturais

#### 1. PostType NUNCA Volta a Ter Alerta/Zeladoria
```typescript
// ✅ CORRETO
export type PostType = 
  | "discussao" 
  | "recomendacao" 
  | "enquete" 
  | "evento";

// ❌ PROIBIDO
export type PostType = 
  | "discussao" 
  | "recomendacao" 
  | "enquete" 
  | "evento"
  | "alerta"      // ❌ NUNCA
  | "zeladoria";  // ❌ NUNCA
```

#### 2. Alertas/Issues NUNCA Inline no Feed
```typescript
// ✅ CORRETO - Blocos separados
<CommunityFeed />
<AlertFeedSection />
<IssueFeedSection />

// ❌ PROIBIDO - Mistura inline
<CommunityFeed>
  {items.map(item => {
    if (item.type === 'post') return <PostCard />
    if (item.type === 'alert') return <AlertCard /> // ❌
    if (item.type === 'issue') return <IssueCard /> // ❌
  })}
</CommunityFeed>
```

#### 3. Community NUNCA Acessa Banco Diretamente
```typescript
// ✅ CORRETO - Via service
const posts = await postService.getFeed({ city, limit: 20 });

// ❌ PROIBIDO - Acesso direto
const { data } = await supabase
  .from("posts")
  .select("*"); // ❌
```

#### 4. Community NUNCA Importa Services Internos de Outros Módulos
```typescript
// ✅ CORRETO - Componentes públicos
import { AlertFeedSection } from "@/modules/community-alerts";

// ❌ PROIBIDO - Services internos
import { communityAlertService } from "@/modules/community-alerts/services/CommunityAlertService"; // ❌
```

#### 5. Cada Módulo Mantém Suas Próprias Validações
```typescript
// ✅ CORRETO - Cada módulo valida seus dados
// Em community-alerts/services/CommunityAlertService.ts
async createAlert(payload) {
  // Validação de termos proibidos
  // Rate limiting
  // Deduplicação
  return rpc("create_community_alert", { payload });
}

// ❌ PROIBIDO - Community duplicando validações
// Em modules/community/hooks/useCreateAlert.ts
async createAlert(data) {
  // Validação de termos proibidos // ❌ Duplicado
  // Rate limiting // ❌ Duplicado
  return communityAlertService.createAlert(data);
}
```


## EXECUÇÃO DA VALIDAÇÃO

### Passo 1: Checklist Funcional E2E

Execute manualmente cada item do checklist:
- Abra o navegador em modo incógnito
- Faça login com usuário de teste
- Execute cada fluxo documentado
- Marque ✅ ou ❌ em cada item
- Documente problemas encontrados

### Passo 2: Contratos de Fronteira

Valide imports e exports:
```bash
# Buscar imports proibidos
grep -r "from.*community-alerts/services" src/modules/community/
grep -r "from.*community-issues/services" src/modules/community/
grep -r "supabase.from" src/modules/community/

# Buscar tipos proibidos em PostType
grep -r '"alerta"' src/core/posts/types/
grep -r '"zeladoria"' src/core/posts/types/
```

### Passo 3: Validação da Página

Execute cada cenário documentado:
- Use React DevTools para monitorar renders
- Use Network tab para monitorar requests
- Use Console para verificar erros
- Documente comportamento observado

### Passo 4: Performance

Execute auditoria de performance:
```bash
# Lighthouse
npm run build
npm run preview
# Abrir Lighthouse no Chrome DevTools
# Executar audit em /comunidade

# React DevTools Profiler
# Gravar profile durante navegação
# Analisar flame graph
# Identificar componentes lentos
```

### Passo 5: Documentação

Revise documentação gerada:
- Verifique se SSOT está correto
- Verifique se rotas estão corretas
- Verifique se responsabilidades estão claras
- Verifique se anti-regressões estão documentadas

## TEMPLATE DE RELATÓRIO

```markdown
# Relatório de Validação - Community

## Data: [DATA]
## Executor: [NOME]

### 1. Checklist Funcional E2E

#### Post Social
- [x] Criação: OK
- [x] Renderização: OK
- [ ] Interações: FALHA - Like não funciona
- [x] Estados: OK

#### Alerta
- [x] Criação: OK
- [x] Renderização: OK
- [x] Interações: OK
- [x] Estados: OK

#### Problema Urbano
- [x] Criação: OK
- [x] Renderização: OK
- [x] Interações: OK
- [x] Estados: OK

### 2. Contratos de Fronteira

- [x] Nenhum import proibido encontrado
- [x] PostType não contém alerta/zeladoria
- [x] Community não acessa banco diretamente

### 3. Validação da Página

- [x] Sem alertas: OK
- [x] Sem problemas: OK
- [x] Com alertas: OK
- [x] Com problemas: OK
- [x] Com ambos: OK
- [ ] Erro em um bloco: FALHA - Erro quebra página inteira
- [x] Loading states: OK
- [x] Empty states: OK
- [x] Composer: OK

### 4. Performance

- Requests na carga inicial: 5
- Fetch duplicado: Não
- Render duplicado: Não
- Blocos em paralelo: Sim
- Refetch desnecessário: Não
- Cache configurado: Sim

### 5. Problemas Encontrados

1. Like não funciona em posts
   - Erro: "Cannot read property 'id' of undefined"
   - Localização: usePostInteractions.ts:45
   - Prioridade: Alta

2. Erro em AlertFeedSection quebra página
   - Erro: Uncaught TypeError
   - Localização: AlertFeedSection.tsx:78
   - Prioridade: Alta

### 6. Correções Aplicadas

1. Like corrigido
   - Commit: abc123
   - PR: #456

2. Error boundary adicionado
   - Commit: def456
   - PR: #457

### 7. Resultado Final

- TypeCheck: ✅ PASSOU
- Lint: ⚠️ 3 warnings (não relacionados)
- Build: ✅ PASSOU
- Performance: ✅ Lighthouse 95/100

### 8. Pendências

1. Implementar AlertFeedSection completo
2. Adicionar testes E2E
3. Otimizar imagens
```

## CRITÉRIOS DE APROVAÇÃO

A arquitetura está BLINDADA se:

1. ✅ Todos os fluxos E2E funcionam
2. ✅ Nenhum import proibido encontrado
3. ✅ Nenhuma mistura inline no feed
4. ✅ Erro em um bloco não quebra os outros
5. ✅ Requests ≤ 5 na carga inicial
6. ✅ Nenhum fetch duplicado
7. ✅ Blocos carregam em paralelo
8. ✅ TypeCheck passa
9. ✅ Build passa
10. ✅ Lighthouse ≥ 90

Se QUALQUER critério falhar, a arquitetura NÃO está blindada.
