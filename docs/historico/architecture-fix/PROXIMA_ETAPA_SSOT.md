# 🔄 PRÓXIMA ETAPA: CORREÇÃO DE VIOLAÇÕES SSOT

**Data**: 2026-03-23  
**Status**: ⏳ PENDENTE  
**Prioridade**: MÉDIA

---

## 📊 SITUAÇÃO ATUAL

### Arquitetura
✅ **CONCLUÍDO**: 232 violações de arquitetura corrigidas (100%)

### Regras SSOT (ESLint)
⚠️ **PENDENTE**: 15 erros de SSOT detectados

---

## 🎯 VIOLAÇÕES SSOT IDENTIFICADAS

### Resumo por Arquivo

| Arquivo | Erros | Tipo de Violação |
|---------|-------|------------------|
| `AdminDataService.ts` | 5 | profiles (3), user_roles (2) |
| `ChatService.ts` | 6 | conversations (6) |
| `MetricsService.ts` | 4 | profiles (2), posts (1), reviews (1) |
| **TOTAL** | **15** | |

---

## 📋 DETALHAMENTO DAS VIOLAÇÕES

### 1. AdminDataService.ts (5 erros)

**Localização**: `src/core/admin/services/AdminDataService.ts`

**Violações**:
```
Linha 20:37 - Acesso direto à tabela 'profiles' → Use ProfileService
Linha 43:37 - Acesso direto à tabela 'profiles' → Use ProfileService
Linha 63:37 - Acesso direto à tabela 'user_roles' → Use AdminService
Linha 81:31 - Acesso direto à tabela 'user_roles' → Use AdminService
Linha 97:44 - Acesso direto à tabela 'profiles' → Use ProfileService
```

**Problema**: AdminDataService está acessando diretamente tabelas que deveriam ser acessadas via outros services.

**Solução**:
- Criar `ProfileService` em `src/core/profiles/services/`
- Mover lógica de `user_roles` para dentro do próprio AdminDataService (é admin)
- Atualizar AdminDataService para usar ProfileService

---

### 2. ChatService.ts (6 erros)

**Localização**: `src/core/chat/services/ChatService.ts`

**Violações**:
```
Linha 41:37  - Acesso direto à tabela 'conversations' → Use MessagingService
Linha 108:13 - Acesso direto à tabela 'conversations' → Use MessagingService
Linha 150:40 - Acesso direto à tabela 'conversations' → Use MessagingService
Linha 160:37 - Acesso direto à tabela 'conversations' → Use MessagingService
Linha 187:37 - Acesso direto à tabela 'conversations' → Use MessagingService
Linha 265:11 - Acesso direto à tabela 'conversations' → Use MessagingService
```

**Problema**: ChatService está acessando 'conversations', mas o ESLint espera MessagingService.

**Solução**:
- **Opção A**: Renomear ChatService para MessagingService
- **Opção B**: Atualizar regra ESLint para aceitar ChatService
- **Recomendação**: Opção B (ChatService é mais descritivo)

---

### 3. MetricsService.ts (4 erros)

**Localização**: `src/core/metrics/services/MetricsService.ts`

**Violações**:
```
Linha 37:9   - Acesso direto à tabela 'profiles' → Use ProfileService
Linha 40:9   - Acesso direto à tabela 'posts' → Use PostService
Linha 100:46 - Acesso direto à tabela 'profiles' → Use ProfileService
Linha 109:39 - Acesso direto à tabela 'reviews' → Use ReviewsService
```

**Problema**: MetricsService está acessando múltiplas tabelas diretamente.

**Solução**:
- Criar `ProfileService` (se ainda não existir)
- Criar `PostService` em `src/core/community/services/`
- Criar `ReviewsService` em `src/core/business/services/`
- Atualizar MetricsService para usar esses services

---

## 🔧 PLANO DE CORREÇÃO

### Fase 1: Criar Services Faltantes (2h)

1. **ProfileService** (`src/core/profiles/services/ProfileService.ts`)
   - getById()
   - getByUserId()
   - update()
   - list()

2. **PostService** (`src/core/community/services/PostService.ts`)
   - getPosts()
   - getPostById()
   - createPost()
   - updatePost()
   - deletePost()

3. **ReviewsService** (`src/core/business/services/ReviewsService.ts`)
   - getReviews()
   - getReviewById()
   - createReview()
   - updateReview()
   - deleteReview()

### Fase 2: Refatorar Services Existentes (2h)

1. **AdminDataService**
   - Usar ProfileService para acesso a profiles
   - Manter user_roles interno (é responsabilidade de admin)

2. **MetricsService**
   - Usar ProfileService
   - Usar PostService
   - Usar ReviewsService

### Fase 3: Atualizar Regras ESLint (30min)

1. **Atualizar `eslint-plugin-ssot.cjs`**
   - Adicionar ChatService como service válido para 'conversations'
   - Ou renomear para MessagingService

### Fase 4: Validação (30min)

1. Executar `npm run lint`
2. Verificar 0 erros de SSOT
3. Executar `npm run validate:deps`
4. Documentar mudanças

---

## 📈 IMPACTO ESTIMADO

### Tempo Total
- Fase 1: 2h (criar services)
- Fase 2: 2h (refatorar)
- Fase 3: 30min (ESLint)
- Fase 4: 30min (validação)
- **Total**: ~5 horas

### Arquivos Afetados
- 3 services existentes (refatoração)
- 3 services novos (criação)
- 1 arquivo ESLint (atualização)
- Barrel exports (atualização)

### Benefícios
- ✅ 100% conformidade com regras SSOT
- ✅ Código mais modular e testável
- ✅ Separação clara de responsabilidades
- ✅ Facilita manutenção futura

---

## 🚦 PRIORIDADE

### Alta Prioridade
- ❌ Não bloqueia desenvolvimento
- ❌ Não causa bugs em produção
- ❌ Não afeta funcionalidades

### Média Prioridade
- ✅ Melhora qualidade do código
- ✅ Facilita manutenção
- ✅ Estabelece padrões consistentes

### Baixa Prioridade
- ❌ Não é urgente
- ❌ Pode ser feito incrementalmente

**Recomendação**: Executar em sprint dedicado a qualidade de código.

---

## 📚 REFERÊNCIAS

### Arquivos Relacionados
- `eslint-plugin-ssot.cjs` - Regras SSOT
- `src/core/admin/services/AdminDataService.ts`
- `src/core/chat/services/ChatService.ts`
- `src/core/metrics/services/MetricsService.ts`

### Documentação
- [CORRECAO_ARQUITETURA_COMPLETA.md](./CORRECAO_ARQUITETURA_COMPLETA.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## ✅ CRITÉRIOS DE SUCESSO

1. ✅ `npm run lint` sem erros de SSOT
2. ✅ `npm run validate:deps` com 0 violações
3. ✅ Todos os services criados e documentados
4. ✅ Testes passando (se existirem)
5. ✅ Documentação atualizada

---

## 🎯 PRÓXIMOS PASSOS

### Imediato (Opcional)
1. Revisar este documento
2. Aprovar plano de correção
3. Agendar sprint de qualidade

### Curto Prazo
1. Criar ProfileService
2. Criar PostService
3. Criar ReviewsService

### Médio Prazo
1. Refatorar services existentes
2. Atualizar regras ESLint
3. Validar e documentar

---

**Status**: ⏳ AGUARDANDO APROVAÇÃO  
**Estimativa**: 5 horas  
**Impacto**: Melhoria de qualidade (não urgente)
