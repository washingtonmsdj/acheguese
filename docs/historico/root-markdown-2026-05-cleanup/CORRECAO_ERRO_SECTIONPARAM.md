# Correção - Erro de Declaração Duplicada

**Data**: 2026-04-18  
**Status**: ✅ Corrigido  
**Erro**: `SyntaxError: Identifier 'sectionParam' has already been declared`

---

## Problema

Erro de sintaxe JavaScript causado por declaração duplicada da variável `sectionParam` no arquivo `PerfilHubPage.tsx`.

### Erro Original

```
Uncaught SyntaxError: Identifier 'sectionParam' has already been declared 
(at PerfilHubPage.tsx:84:11)
```

### Código com Erro

```typescript
const sectionParam = searchParams.get("sec");
const sectionParam = searchParams.get("sec"); // ❌ Duplicado!
const activeSection: ProfileSectionId = isProfileSectionId(sectionParam)
  ? sectionParam
  : "resumo";
```

---

## Causa

Durante a refatoração para usar o SSOT de seções, a linha de declaração de `sectionParam` foi duplicada acidentalmente ao fazer o `strReplace`.

---

## Solução

Removida a declaração duplicada, mantendo apenas uma:

```typescript
const sectionParam = searchParams.get("sec");
const activeSection: ProfileSectionId = isProfileSectionId(sectionParam)
  ? sectionParam
  : "resumo";
```

---

## Arquivo Corrigido

✅ `src/modules/profile/pages/PerfilHubPage.tsx`
- Linha 174: Declaração única de `sectionParam`
- Linha 175: Removida duplicação

---

## Verificação

- [x] Erro de sintaxe corrigido
- [x] Variável declarada uma única vez
- [x] Código compila sem erros
- [x] Aplicação carrega normalmente

---

## Lição Aprendida

Ao fazer substituições com `strReplace`, sempre verificar se não há duplicações acidentais, especialmente em declarações de variáveis.

---

**Status Final**: ✅ Corrigido e funcionando
