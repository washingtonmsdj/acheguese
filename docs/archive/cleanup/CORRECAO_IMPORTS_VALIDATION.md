# Correção de Imports - Pasta validation

## Problema
Após deletar a pasta duplicada `src/shared/utils/validation/`, alguns arquivos ainda importavam dela, causando erro:
```
Failed to resolve import "@/shared/utils/validation/schemas/comment.schema"
```

## Arquivos Corrigidos

### 1. CommentService.ts
- ❌ `@/shared/utils/validation/schemas/comment.schema` → ✅ `@/shared/validation/schemas/comment.schema`
- ❌ `@/shared/utils/validation` → ✅ `@/shared/validation`
- Removido import não utilizado: `profileService`

### 2. PostService.ts
- ❌ `@/shared/utils/validation/schemas/post.schema` → ✅ `@/shared/validation/schemas/post.schema`
- ❌ `@/shared/utils/validation` → ✅ `@/shared/validation`

## Resultado
✅ 0 erros TypeScript
✅ Todos os imports apontam para a pasta correta
✅ App carrega sem erros
