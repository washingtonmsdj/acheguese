# ATUALIZAÇÕES NECESSÁRIAS PÓS-REORGANIZAÇÃO

**Data:** 2026-04-22  
**Objetivo:** Documentar todas as atualizações de paths necessárias após a reorganização

---

## 1. ARQUIVOS QUE PRECISAM SER ATUALIZADOS

### 1.1 eslint.config.js (CRÍTICO)
**Localização:** `./eslint.config.js`

**Mudanças necessárias:**
```javascript
// ANTES:
const ssot = require("./eslint-plugin-ssot.cjs");
const sessionContext = require("./eslint-plugin-session-context.cjs");
const maps = require("./eslint-plugin-maps.cjs");

// DEPOIS:
const ssot = require("./eslint-rules/plugins/eslint-plugin-ssot.cjs");
const sessionContext = require("./eslint-rules/plugins/eslint-plugin-session-context.cjs");
const maps = require("./eslint-rules/plugins/eslint-plugin-maps.cjs");
```

### 1.2 scripts/validate-security-fixes.ts
**Localização:** `./scripts/validate-security-fixes.ts`

**Mudanças necessárias:**
```typescript
// ANTES (linha 154):
const eslintPath = path.join(process.cwd(), '.eslintrc-security.json');

// DEPOIS:
const eslintPath = path.join(process.cwd(), 'eslint-rules/configs/.eslintrc-security.json');
```

### 1.3 .github/workflows/ssot-enforcement.yml
**Localização:** `./.github/workflows/ssot-enforcement.yml`

**Mudanças necessárias:**
```yaml
# ANTES (linha 38):
npx eslint --config .eslintrc-billing-rules.json 'src/**/*.{ts,tsx}'

# DEPOIS:
npx eslint --config eslint-rules/configs/.eslintrc-billing-rules.json 'src/**/*.{ts,tsx}'
```

### 1.4 package.json.security-deps (SERÁ MOVIDO)
**Localização:** `./package.json.security-deps` → `./scripts/backups/package.json.security-deps`

**Mudanças necessárias:**
```json
// ANTES:
"lint:security": "eslint . --config .eslintrc-security.json --ext .ts,.tsx",
"lint:security:fix": "eslint . --config .eslintrc-security.json --ext .ts,.tsx --fix"

// DEPOIS:
"lint:security": "eslint . --config eslint-rules/configs/.eslintrc-security.json --ext .ts,.tsx",
"lint:security:fix": "eslint . --config eslint-rules/configs/.eslintrc-security.json --ext .ts,.tsx --fix"
```

---

## 2. DOCUMENTAÇÃO QUE PRECISA SER ATUALIZADA

### 2.1 Documentos com Referências aos Arquivos Movidos

#### src/core/maps/BLINDAGEM_ARQUITETURAL.md
```markdown
// ANTES:
As regras estão definidas em `.eslintrc-maps-rules.json`.
import mapsRules from './.eslintrc-maps-rules.json';

// DEPOIS:
As regras estão definidas em `eslint-rules/configs/.eslintrc-maps-rules.json`.
import mapsRules from './eslint-rules/configs/.eslintrc-maps-rules.json';
```

#### src/core/profiles/services/types.ts (comentário)
```typescript
// ANTES:
// Bloqueados para código novo via .eslintrc-profile-rules.json

// DEPOIS:
// Bloqueados para código novo via eslint-rules/configs/.eslintrc-profile-rules.json
```

#### docs/STATUS.md
```markdown
// ANTES:
- `.eslintrc-billing-rules.json`

// DEPOIS:
- `eslint-rules/configs/.eslintrc-billing-rules.json`
```

#### docs/DATA_MODELING.md
```markdown
// ANTES:
- `eslint-plugin-ssot.cjs` - Regras de validação

// DEPOIS:
- `eslint-rules/plugins/eslint-plugin-ssot.cjs` - Regras de validação
```

#### docs/historico/ARCHITECTURE.md
```markdown
// ANTES:
As regras do plugin `eslint-plugin-session-context` estão ativas

// DEPOIS:
As regras do plugin `eslint-rules/plugins/eslint-plugin-session-context.cjs` estão ativas
```

---

## 3. SCRIPTS QUE PODEM REFERENCIAR ARQUIVOS MOVIDOS

### 3.1 Scripts de Migration (MOVIDOS)
Verificar se algum script referencia outros scripts da raiz:
- `apply-*.mjs`
- `apply-*.ps1`
- `apply-*.sh`
- `apply-*.py`

**Ação:** Buscar imports/requires relativos

### 3.2 Scripts de Fix (MOVIDOS)
Verificar se algum script Python referencia outros:
- `fix-*.py`
- `clean-migrations.py`
- `make-migrations-idempotent.py`

**Ação:** Buscar imports relativos

---

## 4. ORDEM DE EXECUÇÃO DAS ATUALIZAÇÕES

### Fase 1: Atualizar Referências ANTES de Mover
```bash
# 1. Atualizar eslint.config.js
# 2. Atualizar scripts/validate-security-fixes.ts
# 3. Atualizar .github/workflows/ssot-enforcement.yml
```

### Fase 2: Mover Arquivos
```bash
# Executar movimentações conforme PLANO_EXECUCAO_REORGANIZACAO.md
```

### Fase 3: Atualizar Documentação
```bash
# Atualizar todos os documentos listados na seção 2
```

### Fase 4: Validar
```bash
npm run lint
npm run build
npm run typecheck
```

---

## 5. SCRIPT DE ATUALIZAÇÃO AUTOMÁTICA

### 5.1 Atualizar Referências em Documentação
```bash
# Buscar e substituir em todos os arquivos .md
find docs -name "*.md" -type f -exec sed -i 's|\.eslintrc-billing-rules\.json|eslint-rules/configs/.eslintrc-billing-rules.json|g' {} +
find docs -name "*.md" -type f -exec sed -i 's|\.eslintrc-maps-rules\.json|eslint-rules/configs/.eslintrc-maps-rules.json|g' {} +
find docs -name "*.md" -type f -exec sed -i 's|\.eslintrc-profile-rules\.json|eslint-rules/configs/.eslintrc-profile-rules.json|g' {} +
find docs -name "*.md" -type f -exec sed -i 's|\.eslintrc-security\.json|eslint-rules/configs/.eslintrc-security.json|g' {} +
find docs -name "*.md" -type f -exec sed -i 's|eslint-plugin-maps\.cjs|eslint-rules/plugins/eslint-plugin-maps.cjs|g' {} +
find docs -name "*.md" -type f -exec sed -i 's|eslint-plugin-session-context\.cjs|eslint-rules/plugins/eslint-plugin-session-context.cjs|g' {} +
find docs -name "*.md" -type f -exec sed -i 's|eslint-plugin-ssot-hardcodes\.cjs|eslint-rules/plugins/eslint-plugin-ssot-hardcodes.cjs|g' {} +
find docs -name "*.md" -type f -exec sed -i 's|eslint-plugin-ssot\.cjs|eslint-rules/plugins/eslint-plugin-ssot.cjs|g' {} +
```

### 5.2 PowerShell (Windows)
```powershell
# Atualizar referências em documentação
Get-ChildItem -Path docs -Filter *.md -Recurse | ForEach-Object {
    (Get-Content $_.FullName) `
        -replace '\.eslintrc-billing-rules\.json', 'eslint-rules/configs/.eslintrc-billing-rules.json' `
        -replace '\.eslintrc-maps-rules\.json', 'eslint-rules/configs/.eslintrc-maps-rules.json' `
        -replace '\.eslintrc-profile-rules\.json', 'eslint-rules/configs/.eslintrc-profile-rules.json' `
        -replace '\.eslintrc-security\.json', 'eslint-rules/configs/.eslintrc-security.json' `
        -replace 'eslint-plugin-maps\.cjs', 'eslint-rules/plugins/eslint-plugin-maps.cjs' `
        -replace 'eslint-plugin-session-context\.cjs', 'eslint-rules/plugins/eslint-plugin-session-context.cjs' `
        -replace 'eslint-plugin-ssot-hardcodes\.cjs', 'eslint-rules/plugins/eslint-plugin-ssot-hardcodes.cjs' `
        -replace 'eslint-plugin-ssot\.cjs', 'eslint-rules/plugins/eslint-plugin-ssot.cjs' |
    Set-Content $_.FullName
}
```

---

## 6. CHECKLIST DE VALIDAÇÃO PÓS-ATUALIZAÇÃO

### 6.1 Arquivos Críticos
- [ ] `eslint.config.js` - imports corretos
- [ ] `scripts/validate-security-fixes.ts` - path correto
- [ ] `.github/workflows/ssot-enforcement.yml` - path correto
- [ ] `package.json` - scripts funcionando

### 6.2 Comandos de Validação
- [ ] `npm run lint` - passa sem erros
- [ ] `npm run lint:maps` - passa sem erros
- [ ] `npm run lint:security` - passa sem erros
- [ ] `npm run build` - sucesso
- [ ] `npm run typecheck` - sucesso

### 6.3 Documentação
- [ ] Todos os links para configs ESLint atualizados
- [ ] Todos os links para plugins ESLint atualizados
- [ ] README.md atualizado com nova estrutura

---

## 7. RISCOS E MITIGAÇÕES

### Risco 1: ESLint Não Carrega Plugins
**Sintoma:** Erro ao executar `npm run lint`  
**Causa:** Paths incorretos em `eslint.config.js`  
**Mitigação:** Atualizar paths ANTES de mover arquivos

### Risco 2: CI/CD Falha
**Sintoma:** Workflow `ssot-enforcement.yml` falha  
**Causa:** Path incorreto para `.eslintrc-billing-rules.json`  
**Mitigação:** Atualizar workflow ANTES de mover arquivos

### Risco 3: Scripts de Validação Quebram
**Sintoma:** `validate-security-fixes.ts` não encontra config  
**Causa:** Path hardcoded incorreto  
**Mitigação:** Atualizar script ANTES de mover arquivos

---

## 8. ORDEM RECOMENDADA DE EXECUÇÃO

1. ✅ Criar estrutura de diretórios
2. ✅ Atualizar `eslint.config.js`
3. ✅ Atualizar `scripts/validate-security-fixes.ts`
4. ✅ Atualizar `.github/workflows/ssot-enforcement.yml`
5. ✅ Mover arquivos ESLint configs
6. ✅ Mover arquivos ESLint plugins
7. ✅ Validar: `npm run lint`
8. ✅ Mover scripts de migration
9. ✅ Mover scripts de fix
10. ✅ Mover scripts devops
11. ✅ Remover arquivos temporários
12. ✅ Atualizar .gitignore
13. ✅ Atualizar documentação
14. ✅ Validar: `npm run build && npm run typecheck`
15. ✅ Commit

---

**Status:** DOCUMENTAÇÃO COMPLETA - PRONTO PARA EXECUÇÃO
