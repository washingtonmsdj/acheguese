# ARQUITETURA COMMUNITY - VERSÃO OFICIAL CONGELADA

> **Data de Congelamento:** 24/03/2026  
> **Status:** ✅ OFICIAL E DEFINITIVA  
> **Versão:** 1.0.0

---

## 🎯 LINHA DEFINITIVA

Esta é a ÚNICA versão válida da arquitetura Community. Qualquer documento anterior que contradiga esta linha deve ser desconsiderado.

### Decisões Arquiteturais Congeladas

1. **`/comunidade` = Feed Social Puro**
   - Contém APENAS posts sociais
   - Tipos: discussao, recomendacao, enquete, evento
   - Fonte única: PostService

2. **Alertas e Problemas = Blocos Contextuais**
   - Aparecem APENAS em blocos separados
   - AlertFeedSection (quando implementado)
   - IssueFeedSection (implementado)
   - NÃO aparecem inline entre posts

3. **AlertCard e IssueCard = Nunca Inline**
   - Renderizados apenas em seus blocos contextuais
   - Nunca misturados com PostCard no feed principal

4. **PostType = Apenas Tipos Sociais**
   ```typescript
   export type PostType = 
     | "discussao" 
     | "recomendacao" 
     | "enquete" 
     | "evento";
   ```
   - NÃO inclui "alerta"
   - NÃO inclui "zeladoria"
   - NÃO inclui "problema"

5. **PostService = Sem Conhecimento de Alertas/Zeladoria**
   - Conhece apenas posts sociais
   - Não conhece alertas
   - Não conhece problemas urbanos

6. **community-issues = Módulo Separado**
   - Workflow próprio
   - Service próprio (CommunityIssueService)
   - RPC própria (create_community_issue)
   - Não se mistura com posts

7. **Evento = Permanece em PostType**
   - Por enquanto, evento é um tipo de post social
   - Decisão de separar em módulo próprio fica para o futuro

8. **community-events = NÃO Criar Agora**
   - Não criar módulo separado de eventos
   - Eventos continuam como posts sociais
   - Reavaliar no futuro se necessário

---

## 📐 ESTRUTURA DA ARQUITETURA

### Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  /comunidade (ComunidadePage)                               │
│  ├── CommunityFeed (posts sociais)                          │
│  ├── AlertFeedSection (bloco contextual)                    │
│  └── IssueFeedSection (bloco contextual)                    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                       │
│  UnifiedComposer                                            │
│  ├── Post Social → CreatePostModal                          │
│  ├── Alerta → CreateAlertModal                             │
│  └── Problema → CreateIssueModal                           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  ├── PostService (posts sociais)                           │
│  ├── CommunityAlertService (alertas)                       │
│  └── CommunityIssueService (problemas)                     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                         │
│  ├── posts (tabela)                                         │
│  ├── community_alerts (tabela)                             │
│  └── community_issues (tabela)                             │
└─────────────────────────────────────────────────────────────┘
```

### Módulos

```
src/
├── core/
│   └── posts/
│       ├── services/
│       │   └── PostService.ts          # SSOT de posts sociais
│       ├── types/
│       │   └── Post.ts                 # PostType enxuto
│       └── adapters/
│           └── PostAdapter.ts          # Adaptador único
│
├── modules/
│   ├── community/
│   │   ├── pages/
│   │   │   └── ComunidadePage.tsx      # Página principal
│   │   ├── components/
│   │   │   ├── feed/
│   │   │   │   └── CommunityFeed.tsx   # Feed social puro
│   │   │   ├── composer/
│   │   │   │   └── UnifiedComposer.tsx # Orquestrador
│   │   │   └── cards/
│   │   │       └── UnifiedPostCard.tsx # Card de post
│   │   └── hooks/
│   │       └── feed/
│   │           └── useCommunityFeed.ts # Hook de feed
│   │
│   ├── community-alerts/
│   │   ├── services/
│   │   │   └── CommunityAlertService.ts # SSOT de alertas
│   │   ├── components/
│   │   │   ├── AlertFeedSection.tsx     # Bloco contextual
│   │   │   ├── AlertCard.tsx            # Card de alerta
│   │   │   └── CreateAlertModal.tsx     # Modal de criação
│   │   └── hooks/
│   │       └── useAlerts.ts             # Hook de alertas
│   │
│   └── community-issues/
│       ├── services/
│       │   └── CommunityIssueService.ts # SSOT de problemas
│       ├── components/
│       │   ├── IssueFeedSection.tsx     # Bloco contextual
│       │   ├── IssueCard.tsx            # Card de problema
│       │   └── CreateIssueModal.tsx     # Modal de criação
│       └── hooks/
│           └── useIssues.ts             # Hook de problemas
```

---

## 🔒 CONTRATOS DE FRONTEIRA

### core/posts

**CONHECE:**
- Posts sociais (discussao, recomendacao, enquete, evento)
- CRUD de posts
- Feed de posts
- Validações de posts

**NÃO CONHECE:**
- ❌ Alertas
- ❌ Problemas urbanos
- ❌ Lógica de moderação de alertas
- ❌ Lógica de apoio a problemas

**API PÚBLICA:**
```typescript
class PostService {
  createPost(profileId: string, data: CreatePostData): Promise<Post>
  getPostById(postId: string): Promise<Post | null>
  updatePost(postId: string, data: UpdatePostData): Promise<Post>
  deletePost(postId: string): Promise<void>
  getFeed(params: FeedParams): Promise<FeedResult>
  getPostsByProfile(profileId: string, params: PaginationParams): Promise<Post[]>
}
```

### modules/community

**CONHECE:**
- Composição de feed social
- Orquestração de criação (UnifiedComposer)
- UI de posts sociais
- Filtros de localização

**NÃO CONHECE:**
- ❌ Lógica interna de alertas
- ❌ Lógica interna de problemas
- ❌ Validações de alertas/issues
- ❌ RPC de alertas/issues

**IMPORTA:**
```typescript
// ✅ PERMITIDO
import { postService } from "@/core/posts/services";
import { AlertFeedSection, CreateAlertModal } from "@/modules/community-alerts";
import { IssueFeedSection, CreateIssueModal } from "@/modules/community-issues";

// ❌ PROIBIDO
import { communityAlertService } from "@/modules/community-alerts/services/CommunityAlertService";
import { communityIssueService } from "@/modules/community-issues/services/CommunityIssueService";
```

### modules/community-alerts

**CONHECE:**
- CRUD de alertas
- Validação de alertas (RPC)
- Moderação de alertas
- UI de alertas

**NÃO CONHECE:**
- ❌ Posts sociais (exceto via API pública)
- ❌ Problemas urbanos

**API PÚBLICA:**
```typescript
// Componentes
export { AlertFeedSection } from "./components/AlertFeedSection";
export { AlertCard } from "./components/AlertCard";
export { CreateAlertModal } from "./components/CreateAlertModal";

// Hooks
export { useAlerts } from "./hooks/useAlerts";
export { useCreateAlert } from "./hooks/useCreateAlert";

// Services (para uso externo se necessário)
export { communityAlertService } from "./services/CommunityAlertService";
```

### modules/community-issues

**CONHECE:**
- CRUD de problemas urbanos
- Validação de problemas (RPC)
- Sistema de apoio (upvotes)
- UI de problemas

**NÃO CONHECE:**
- ❌ Posts sociais (exceto via API pública)
- ❌ Alertas

**API PÚBLICA:**
```typescript
// Componentes
export { IssueFeedSection } from "./components/IssueFeedSection";
export { IssueCard } from "./components/IssueCard";
export { CreateIssueModal } from "./components/CreateIssueModal";

// Hooks
export { useIssues } from "./hooks/useIssues";
export { useCreateIssue } from "./hooks/useCreateIssue";
export { useIssueSupport } from "./hooks/useIssueSupport";

// Services (para uso externo se necessário)
export { communityIssueService } from "./services/CommunityIssueService";
```

---

## 🚫 ANTI-REGRESSÕES

### 1. PostType NUNCA Volta a Ter Alerta/Zeladoria

```typescript
// ✅ CORRETO - Versão oficial
export type PostType = 
  | "discussao" 
  | "recomendacao" 
  | "enquete" 
  | "evento";

// ❌ PROIBIDO - Regressão
export type PostType = 
  | "discussao" 
  | "recomendacao" 
  | "enquete" 
  | "evento"
  | "alerta"      // ❌ NUNCA
  | "zeladoria";  // ❌ NUNCA
```

**REGRA:** Qualquer PR que adicione "alerta" ou "zeladoria" a PostType deve ser REJEITADO.

### 2. Alertas/Issues NUNCA Inline no Feed

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

**REGRA:** AlertCard e IssueCard só podem aparecer em seus blocos contextuais.

### 3. Community NUNCA Acessa Banco Diretamente

```typescript
// ✅ CORRETO - Via service
const posts = await postService.getFeed({ city, limit: 20 });

// ❌ PROIBIDO - Acesso direto
const { data } = await supabase.from("posts").select("*"); // ❌
```

**REGRA:** Todo acesso a dados deve passar por um service (SSOT).

### 4. Community NUNCA Importa Services Internos

```typescript
// ✅ CORRETO - Componentes públicos
import { AlertFeedSection } from "@/modules/community-alerts";

// ❌ PROIBIDO - Services internos
import { communityAlertService } from "@/modules/community-alerts/services/CommunityAlertService"; // ❌
```

**REGRA:** Community só pode importar API pública de outros módulos.

### 5. Cada Módulo Mantém Suas Próprias Validações

```typescript
// ✅ CORRETO - Validação no service
// Em CommunityAlertService
async createAlert(payload) {
  // Validação de termos proibidos
  // Rate limiting
  // Deduplicação
  return rpc("create_community_alert", { payload });
}

// ❌ PROIBIDO - Duplicação de validações
// Em modules/community
async createAlert(data) {
  // Validação de termos proibidos // ❌ Duplicado
  return communityAlertService.createAlert(data);
}
```

**REGRA:** Validações de negócio ficam no service, não nos componentes.

---

## 📋 CHECKLIST DE CONFORMIDADE

Use este checklist para validar se um PR está conforme a arquitetura oficial:

### Tipos e Contratos
- [ ] PostType contém apenas tipos sociais
- [ ] Nenhum tipo "alerta" ou "zeladoria" em PostType
- [ ] Nenhum import de services internos em community
- [ ] Nenhum acesso direto ao supabase em community

### Renderização
- [ ] AlertCard aparece apenas em AlertFeedSection
- [ ] IssueCard aparece apenas em IssueFeedSection
- [ ] Nenhuma renderização condicional de alertas/issues no feed
- [ ] Feed principal contém apenas posts sociais

### Services
- [ ] PostService não conhece alertas nem problemas
- [ ] CommunityAlertService é SSOT de alertas
- [ ] CommunityIssueService é SSOT de problemas
- [ ] Cada service mantém suas próprias validações

### Composição
- [ ] UnifiedComposer orquestra criação
- [ ] Cada modal mantém sua lógica interna
- [ ] Community não duplica validações
- [ ] Blocos contextuais são independentes

---

## 🎯 PRÓXIMOS PASSOS

### Imediato
1. ✅ Arquitetura congelada
2. ✅ Documentação oficial criada
3. ⏳ Remover documentos contraditórios
4. ⏳ Atualizar README principal

### Curto Prazo
1. Implementar AlertFeedSection completo
2. Adicionar testes automatizados
3. Executar Lighthouse audit
4. Deploy para staging

### Médio Prazo
1. Monitorar conformidade em PRs
2. Adicionar lint rules customizadas
3. Criar ADRs (Architecture Decision Records)
4. Treinar equipe na arquitetura

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- `CONSOLIDACAO_COMMUNITY_COMPLETA.md` - Histórico da consolidação
- `VALIDACAO_BLINDAGEM_COMMUNITY.md` - Guia de validação
- `RELATORIO_VALIDACAO_COMMUNITY.md` - Relatório de validação
- `RESUMO_VALIDACAO_COMMUNITY.md` - Resumo executivo

---

## ✍️ ASSINATURAS

**Arquitetura Definida Por:** Kiro AI Assistant  
**Data de Congelamento:** 24/03/2026  
**Versão:** 1.0.0  
**Status:** ✅ OFICIAL E DEFINITIVA

---

**ESTA É A ÚNICA VERSÃO VÁLIDA DA ARQUITETURA COMMUNITY.**

Qualquer documento, código ou discussão que contradiga esta linha deve ser desconsiderado e corrigido para estar em conformidade com esta arquitetura oficial.
