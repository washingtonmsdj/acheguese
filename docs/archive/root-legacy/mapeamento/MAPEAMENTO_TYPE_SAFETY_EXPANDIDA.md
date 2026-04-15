# Mapeamento Type Safety Expandida

**Data:** 2026-04-06  
**Objetivo:** Prova do escopo real antes de correção

---

## 1. Grep Real

**Total real:** 238 arquivos com @ts-nocheck

**@ts-ignore:** 0 ocorrências  
**@ts-expect-error:** 0 ocorrências  
**as any:** Não mapeado (fora do escopo de mapeamento)

---

## 2. Contagem Real por Diretório

| Diretório | Arquivos com @ts-nocheck |
|-----------|--------------------------|
| src/core/community | 8 |
| src/modules/community | 195 |
| src/shared/types | 27 |
| src/shared/validation | 8 |
| **TOTAL** | **238** |

---

## 3. Diagnostics Reais (Amostra)

```typescript
getDiagnostics([
  "src/core/community/types.ts",
  "src/core/community/services/CommunityService.ts",
  "src/shared/types/community.ts",
  "src/shared/types/feed.ts",
  "src/shared/validation/schemas/user.schema.ts"
])

// Resultado: No diagnostics found (todos)
```

**Observação:** Arquivos com @ts-nocheck não apresentam erros de diagnóstico porque o TypeScript não os verifica.

---

## 4. Classificação (Amostra de 5 arquivos analisados)

### Simples (3 arquivos)
**Critério:** Re-exports, interfaces simples, sem lógica complexa

1. **src/core/community/types.ts**
   - Re-export de CommunityPost
   - Interface CommunityStats simples
   - Correção: remover @ts-nocheck, zero ajustes necessários

2. **src/shared/types/community.ts**
   - Interfaces simples (RankingUser, FavoriteGroup, TrendingTopic, SponsoredAd)
   - Sem dependências complexas
   - Correção: remover @ts-nocheck, zero ajustes necessários

3. **src/shared/types/feed.ts**
   - Type aliases e interfaces simples
   - Sem lógica, apenas definições
   - Correção: remover @ts-nocheck, zero ajustes necessários

### Médio (2 arquivos)
**Critério:** Schemas Zod, validadores, mensagens com funções

4. **src/shared/validation/schemas/user.schema.ts**
   - Schema Zod com validações
   - Importa validadores customizados
   - Correção: remover @ts-nocheck, verificar tipos de validadores importados

5. **src/shared/validation/messages/pt-BR.ts**
   - Objeto com funções que retornam strings
   - Parâmetros tipados (min: number, max: number)
   - Correção: remover @ts-nocheck, adicionar tipo explícito ao objeto

### Bloqueado (0 arquivos na amostra)
**Critério:** Não identificado na amostra analisada

---

## 5. Conclusão Objetiva

**Escopo real provado:** 238 arquivos com @ts-nocheck (não 96 como estimado)

**Distribuição:**
- src/modules/community: 195 arquivos (82% do total) — componentes React, hooks, páginas
- src/shared/types: 27 arquivos (11%) — tipos compartilhados
- src/core/community: 8 arquivos (3%) — services e hooks core
- src/shared/validation: 8 arquivos (3%) — schemas e validadores

**Diagnósticos:** Zero erros nos arquivos amostrados (TypeScript não verifica arquivos com @ts-nocheck)

**Classificação preliminar (amostra de 5):**
- Simples: 3 (60%) — tipos e interfaces puras
- Médio: 2 (40%) — schemas Zod e validadores
- Bloqueado: 0 (0%)

**Próximo lote recomendado:**
1. **Lote 1 (Tipos Simples):** src/shared/types/** (27 arquivos) — interfaces e type aliases sem lógica
2. **Lote 2 (Core Community):** src/core/community/** (8 arquivos) — services e hooks core
3. **Lote 3 (Validação):** src/shared/validation/** (8 arquivos) — schemas e validadores
4. **Lote 4 (Componentes):** src/modules/community/** (195 arquivos) — maior volume, deixar por último

**Estimativa:** Lotes 1-3 (43 arquivos) são viáveis sem refatoração estrutural. Lote 4 (195 arquivos) requer análise mais profunda.
