# 🚀 Quick Reference - Arquitetura Community

> **Versão:** 1.0.0 | **Status:** ✅ OFICIAL

---

## 📐 REGRA DE OURO

```
/comunidade = FEED SOCIAL
Alertas e Problemas = BLOCOS SEPARADOS
PostType = APENAS SOCIAL
```

---

## ✅ PERMITIDO

```typescript
// PostType
export type PostType = "discussao" | "recomendacao" | "enquete" | "evento";

// Estrutura
<CommunityFeed />           // Posts sociais
<AlertFeedSection />        // Bloco separado
<IssueFeedSection />        // Bloco separado

// Imports
import { postService } from "@/core/posts/services";
import { AlertFeedSection } from "@/modules/community-alerts";
import { IssueFeedSection } from "@/modules/community-issues";

// Services
const posts = await postService.getFeed({ city });
const alerts = await communityAlertService.getAlerts({ city });
const issues = await communityIssueService.getIssues({ city });
```

---

## ❌ PROIBIDO

```typescript
// PostType
export type PostType = ... | "alerta" | "zeladoria"; // ❌ NUNCA

// Mistura inline
<CommunityFeed>
  {items.map(item => 
    item.type === 'alert' ? <AlertCard /> : ... // ❌ NUNCA
  )}
</CommunityFeed>

// Imports proibidos
import { communityAlertService } from "@/modules/community-alerts/services/..."; // ❌

// Acesso direto
const { data } = await supabase.from("posts").select("*"); // ❌
```

---

## 🏗️ ESTRUTURA

```
src/
├── core/posts/              # SSOT de posts sociais
│   ├── services/PostService.ts
│   └── types/Post.ts
│
├── modules/
│   ├── community/           # Orquestração
│   │   ├── pages/ComunidadePage.tsx
│   │   ├── components/
│   │   │   ├── feed/CommunityFeed.tsx
│   │   │   └── composer/UnifiedComposer.tsx
│   │   └── hooks/feed/useCommunityFeed.ts
│   │
│   ├── community-alerts/    # SSOT de alertas
│   │   ├── services/CommunityAlertService.ts
│   │   └── components/AlertFeedSection.tsx
│   │
│   └── community-issues/    # SSOT de problemas
│       ├── services/CommunityIssueService.ts
│       └── components/IssueFeedSection.tsx
```

---

## 🔍 VALIDAÇÃO RÁPIDA

```bash
# Tudo de uma vez
npm run typecheck && npm run lint && npm run build

# Buscar violações
grep -r "alerta|zeladoria" src/core/posts/types/
grep -r "from.*community-alerts/services" src/modules/community/
grep -r "supabase\.from" src/modules/community/
grep -r "AlertCard|IssueCard" src/modules/community/components/feed/
```

---

## 📋 CHECKLIST PR

- [ ] PostType sem alerta/zeladoria
- [ ] Nenhum import proibido
- [ ] Nenhuma mistura inline
- [ ] Nenhum acesso direto ao banco
- [ ] TypeCheck passa
- [ ] Build passa

---

## 📚 DOCUMENTAÇÃO

| Documento | Quando Usar |
|-----------|-------------|
| ARQUITETURA_COMMUNITY_OFICIAL.md | Entender arquitetura completa |
| VALIDACAO_BLINDAGEM_COMMUNITY.md | Validar conformidade |
| PLANO_EXECUCAO_ARQUITETURA_OFICIAL.md | Executar refatoração |
| ARQUITETURA_CONGELADA_RESUMO.md | Visão geral rápida |
| Este arquivo | Referência rápida |

---

## 🎯 SSOT (Single Source of Truth)

| Domínio | SSOT | Localização |
|---------|------|-------------|
| Posts Sociais | PostService | core/posts/services/PostService.ts |
| Alertas | CommunityAlertService | modules/community-alerts/services/CommunityAlertService.ts |
| Problemas | CommunityIssueService | modules/community-issues/services/CommunityIssueService.ts |

---

## 🚫 ANTI-PADRÕES COMUNS

### ❌ Misturar tipos no feed
```typescript
// ERRADO
const items = [...posts, ...alerts, ...issues];
items.map(item => renderByType(item));

// CERTO
<CommunityFeed posts={posts} />
<AlertFeedSection alerts={alerts} />
<IssueFeedSection issues={issues} />
```

### ❌ Duplicar validações
```typescript
// ERRADO - Validação no componente
const handleCreate = async (data) => {
  if (!data.content) return; // ❌ Duplicado
  await service.create(data);
};

// CERTO - Validação no service
const handleCreate = async (data) => {
  await service.create(data); // Service valida
};
```

### ❌ Importar services internos
```typescript
// ERRADO
import { communityAlertService } from "@/modules/community-alerts/services/...";

// CERTO
import { AlertFeedSection } from "@/modules/community-alerts";
```

---

## 💡 DICAS

1. **Sempre use services** - Nunca acesse banco diretamente
2. **Blocos separados** - Nunca misture inline
3. **PostType enxuto** - Apenas tipos sociais
4. **Imports públicos** - Apenas API pública de módulos
5. **Validações no service** - Não duplique no componente

---

## 📞 AJUDA

**Dúvida sobre arquitetura?**
→ Leia ARQUITETURA_COMMUNITY_OFICIAL.md

**Precisa validar código?**
→ Use VALIDACAO_BLINDAGEM_COMMUNITY.md

**Vai refatorar?**
→ Siga PLANO_EXECUCAO_ARQUITETURA_OFICIAL.md

**Problema de conformidade?**
→ Abra issue com label "conformity"

---

**Versão:** 1.0.0  
**Última Atualização:** 24/03/2026  
**Status:** ✅ OFICIAL
