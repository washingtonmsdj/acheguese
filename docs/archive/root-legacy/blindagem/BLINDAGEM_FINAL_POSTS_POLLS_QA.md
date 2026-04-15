# Blindagem Final — Posts + Polls + Q&A

**Data:** 2026-04-06  
**Escopo:** Evidência ampla do eixo inteiro

---

## 1. Grep Real Amplo

### @ts-nocheck

**src/core/posts:** ✅ ZERO  
**src/core/comments:** ✅ ZERO  
**tests (eixo):** ✅ ZERO

**src/core/community:** ❌ 8 arquivos
- communityBusinessLogic.ts, types.ts, CommunityService.ts, CivicReportService.ts
- index.ts, useCommunityProfile.ts, useCommunityInteractions.ts, useCommunityImageUpload.ts

**src/modules/community:** ❌ 52 arquivos (páginas, hooks, services)

**src/shared/types:** ❌ 28 arquivos (tipos compartilhados globais)

**src/shared/validation:** ❌ 8 arquivos (schemas não auditados: user, review, profile, validators, messages, index, error-handler)

### @ts-ignore
✅ ZERO ocorrências no eixo

### @ts-expect-error
✅ ZERO ocorrências no eixo

### as any
- PostService: 47 ocorrências (queries Supabase - aceitável)
- CommentService: 13 ocorrências (queries Supabase - aceitável)

---

## 2. Diagnostics Reais Amplos

```bash
npx tsc --noEmit 2>&1 | Select-String -Pattern "src/(core|modules)/community" | Measure-Object
# Count: 0

getDiagnostics([
  "src/core/posts/services/PostService.ts",
  "src/core/comments/services/CommentService.ts",
  "src/shared/validation/schemas/post.schema.ts",
  "src/shared/validation/schemas/comment.schema.ts",
  "src/modules/community/schemas/postSchemas.ts"
])
# No diagnostics found (todos)
```

**Status:** Zero erros TypeScript nos arquivos auditados

---

## 3. Testes Reais Canônicos

```bash
npm test tests/cleanup-legacy-posts-regression.test.ts \
         tests/fase6-regressao-posts.test.ts \
         tests/sprint-qa-regression.test.ts \
         tests/qa-answers-regression.test.ts

# Output real:
Test Files  4 passed (4)
Tests  82 passed (82)
Duration  15.75s
```

**Suítes:**
1. cleanup-legacy-posts-regression (14 testes)
2. fase6-regressao-posts (12 testes)
3. sprint-qa-regression (29 testes)
4. qa-answers-regression (27 testes)

---

## 4. Conclusão Final Honesta

**Auditado (16 arquivos):**
- src/core/posts/** (3)
- src/core/comments/** (3)
- src/shared/validation/schemas/post.schema.ts
- src/shared/validation/schemas/comment.schema.ts
- src/modules/community/schemas/postSchemas.ts
- src/modules/community/schemas/comment.schema.ts
- tests (6)

**Status:** Zero @ts-nocheck, zero diagnostics, 82/82 testes passando

**Não auditado (96 arquivos):**
- src/core/community (8)
- src/modules/community (52)
- src/shared/types (28)
- src/shared/validation (8)

**Padrão técnico:** 60 `as any` em queries Supabase (aceitável)

16 arquivos centrais auditados ficaram sem @ts-nocheck, com zero diagnostics e 82/82 testes nas 4 suítes executadas.
