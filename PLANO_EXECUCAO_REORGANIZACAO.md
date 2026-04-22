# PLANO DE EXECUÇÃO - REORGANIZAÇÃO AAA DA RAIZ

**Data:** 2026-04-22  
**Status:** PRONTO PARA EXECUÇÃO  
**Aprovação Necessária:** SIM

---

## RESUMO EXECUTIVO

### Situação de Segurança
✅ **BOM:** `.env.local` NÃO foi commitado (secrets seguros)  
⚠️ **ATENÇÃO:** `.env.e2e.network` commitado com credenciais de teste  
✅ **OK:** `.env.production` commitado apenas como template

### Ações Necessárias
- **Movimentações:** 36 arquivos
- **Remoções:** 6 arquivos
- **Criação de diretórios:** 4 novos
- **Atualizações:** .gitignore

---

## FASE 1: PREPARAÇÃO

### 1.1 Criar Estrutura de Destino
```bash
mkdir -p eslint-rules/configs
mkdir -p eslint-rules/plugins
mkdir -p scripts/backups
mkdir -p scripts/devops
```

### 1.2 Backup de Segurança
```bash
# Criar branch de backup
git checkout -b backup/pre-reorganizacao-raiz
git add -A
git commit -m "backup: snapshot antes da reorganização da raiz"
git checkout main
```

---

## FASE 2: MOVIMENTAÇÕES

### 2.1 ESLint Configs (4 arquivos)
```bash
git mv .eslintrc-billing-rules.json eslint-rules/configs/
git mv .eslintrc-maps-rules.json eslint-rules/configs/
git mv .eslintrc-profile-rules.json eslint-rules/configs/
git mv .eslintrc-security.json eslint-rules/configs/
```

### 2.2 ESLint Plugins (4 arquivos)
```bash
git mv eslint-plugin-maps.cjs eslint-rules/plugins/
git mv eslint-plugin-session-context.cjs eslint-rules/plugins/
git mv eslint-plugin-ssot-hardcodes.cjs eslint-rules/plugins/
git mv eslint-plugin-ssot.cjs eslint-rules/plugins/
```

### 2.3 Scripts de Migration - PowerShell (3 arquivos)
```bash
git mv apply-dispatch-migration-simple.ps1 scripts/migrations/
git mv apply-dispatch-migration.ps1 scripts/migrations/
git mv apply-vaga-status-migration.ps1 scripts/migrations/
```

### 2.4 Scripts de Migration - JavaScript/MJS (13 arquivos)
```bash
git mv apply-dispatch-migration.mjs scripts/migrations/
git mv apply-final.mjs scripts/migrations/
git mv apply-gastronomy-migrations-only.mjs scripts/migrations/
git mv apply-migration-simple.mjs scripts/migrations/
git mv apply-migrations-api.mjs scripts/migrations/
git mv apply-migrations-cli.mjs scripts/migrations/
git mv apply-migrations-direct.mjs scripts/migrations/
git mv apply-migrations-final.mjs scripts/migrations/
git mv apply-migrations-pg.mjs scripts/migrations/
git mv apply-migrations.mjs scripts/migrations/
git mv apply-ride-offers-migration.mjs scripts/migrations/
git mv apply-driver-capabilities-fix.mjs scripts/fixes/
git mv apply-migration.ps1 scripts/migrations/
```

### 2.5 Scripts de Migration - Shell (2 arquivos)
```bash
git mv apply-dispatch-migration.sh scripts/migrations/
git mv apply-gastronomy-migrations.sh scripts/migrations/
```

### 2.6 Scripts de Migration - Python (1 arquivo)
```bash
git mv apply-migrations-force.py scripts/migrations/
```

### 2.7 Scripts Python de Fix (7 arquivos)
```bash
git mv clean-migrations.py scripts/fixes/
git mv fix-all-profile-links.py scripts/fixes/
git mv fix-duplicate-do-blocks.py scripts/fixes/
git mv fix-enums.py scripts/fixes/
git mv fix-menu-references.py scripts/fixes/
git mv fix-owner-id-references.py scripts/fixes/
git mv fix-profile-links-references.py scripts/fixes/
git mv make-migrations-idempotent.py scripts/fixes/
```

### 2.8 Scripts DevOps (1 arquivo)
```bash
git mv push-to-github.ps1 scripts/devops/
```

### 2.9 Backup de Config (1 arquivo)
```bash
git mv package.json.security-deps scripts/backups/
```

---

## FASE 3: REMOÇÕES

### 3.1 Remover Dualidade de Package Manager
```bash
rm bun.lock
```

### 3.2 Remover Outputs Temporários (5 arquivos)
```bash
rm .codex-validate-deps.txt
rm GIT_COMMIT_MESSAGE.txt
rm lint-final2.txt
rm lint-output-final.txt
rm lint-output.txt
```

### 3.3 Remover SQL Temporário
```bash
rm query.sql
```

---

## FASE 4: ATUALIZAR .gitignore

### 4.1 Adicionar Regras para .env.e2e.*
```gitignore
# Environment
.env.local
.env.*.local
.env.staging
.env.test
.env.remote
.env.e2e.*              # ← ADICIONAR: ignora todos .env.e2e.*

# Exceto templates
!.env
!.env.example
!.env.local.example
!.env.remote.example
```

### 4.2 Adicionar Regras para Outputs
```gitignore
# Outputs temporários (já existe, mas garantir)
*.txt
!README*.txt
lint-*.txt
```

---

## FASE 5: REMOVER .env.e2e.network DO REPOSITÓRIO

### 5.1 Remover do Tracking
```bash
git rm --cached .env.e2e.network
```

### 5.2 Criar Template
```bash
# Criar .env.e2e.network.example
cat > .env.e2e.network.example << 'EOF'
# Auto-gerado por seed-e2e-network.ts — NÃO editar manualmente
# Este arquivo é gerado automaticamente ao executar: npm run seed:e2e:network
E2E_NETWORK_USER_EMAIL=e2e-network@test.local
E2E_NETWORK_USER_PASSWORD=your_test_password_here
E2E_NETWORK_STANDALONE_ID=your_uuid_here
E2E_NETWORK_STANDALONE_PROFILE_ID=your_uuid_here
E2E_NETWORK_STANDALONE_SLUG=e2e-standalone-test
E2E_NETWORK_LOC1_ID=your_uuid_here
E2E_NETWORK_LOC1_NAME=Pituba
E2E_NETWORK_LOC1_PATH=/br/ba/salvador/pituba
E2E_NETWORK_LOC2_ID=your_uuid_here
E2E_NETWORK_LOC2_NAME=Rio Vermelho
E2E_NETWORK_LOC2_PATH=/br/ba/salvador/rio-vermelho
E2E_NETWORK_HUB_SLUG=e2e-brand-hub-test
E2E_NETWORK_BRANCH_SLUG=e2e-branch-barra-test
EOF
```

---

## FASE 6: COMMIT E VALIDAÇÃO

### 6.1 Commit das Mudanças
```bash
git add -A
git commit -m "refactor: reorganização AAA da raiz do projeto

- Move 36 arquivos para estrutura organizada
- Remove 6 arquivos temporários/obsoletos
- Atualiza .gitignore para .env.e2e.*
- Remove .env.e2e.network do tracking (cria template)
- Remove bun.lock (npm é o package manager oficial)
- Organiza ESLint configs em eslint-rules/configs/
- Organiza ESLint plugins em eslint-rules/plugins/
- Consolida scripts de migration em scripts/migrations/
- Consolida scripts de fix em scripts/fixes/
- Move scripts DevOps para scripts/devops/

BREAKING CHANGE: Paths de scripts movidos
- Scripts de migration: raiz → scripts/migrations/
- Scripts de fix: raiz → scripts/fixes/
- ESLint configs: raiz → eslint-rules/configs/
- ESLint plugins: raiz → eslint-rules/plugins/

Refs: AUDITORIA_RAIZ_AAA.md"
```

### 6.2 Validação Operacional
```bash
# Build
npm run build

# Lint
npm run lint

# Type check
npm run typecheck

# Tests
npm run test

# SSOT
npm run validate:ssot

# Architecture
npm run validate:architecture:incremental
```

---

## FASE 7: DOCUMENTAÇÃO

### 7.1 Atualizar README.md
Adicionar seção sobre estrutura da raiz:

```markdown
## Estrutura da Raiz

A raiz do projeto segue uma política rigorosa de organização:

### Diretórios Oficiais
- `src/` - código-fonte
- `scripts/` - scripts operacionais (migrations, fixes, devops)
- `docs/` - documentação
- `supabase/` - migrations e config Supabase
- `tests/`, `e2e/`, `testsprite_tests/` - testes
- `public/` - assets estáticos
- `api/` - edge functions
- `eslint-rules/` - regras e plugins ESLint customizados

### Configs Oficiais
Apenas configs de ferramentas principais ficam na raiz:
- `package.json`, `tsconfig.json`, `vite.config.ts`, etc.

### Política de Scripts
Scripts soltos na raiz são PROIBIDOS. Use:
- `scripts/migrations/` - aplicação de migrations
- `scripts/fixes/` - correções pontuais
- `scripts/devops/` - deploy e CI/CD
- `scripts/validation/` - validações
- `scripts/security/` - segurança

### Política de .env
- Versionados: apenas `.example` e templates
- Proibidos: arquivos com secrets reais
- Ver: `.env.example` para referência
```

### 7.2 Criar Documentação de Scripts
```bash
# Atualizar scripts/README.md com nova estrutura
```

---

## FASE 8: VERIFICAÇÕES FINAIS

### 8.1 Checklist de Validação
- [ ] Build funciona: `npm run build`
- [ ] Lint passa: `npm run lint`
- [ ] Type check passa: `npm run typecheck`
- [ ] Testes passam: `npm run test`
- [ ] SSOT válido: `npm run validate:ssot`
- [ ] Architecture válida: `npm run validate:architecture:incremental`
- [ ] Husky hooks funcionam
- [ ] CI/CD workflows funcionam
- [ ] Scripts movidos têm paths corretos
- [ ] ESLint configs carregam corretamente
- [ ] .gitignore funciona corretamente

### 8.2 Verificar Referências
```bash
# Buscar referências aos arquivos movidos
git grep -n "eslintrc-billing-rules"
git grep -n "eslintrc-maps-rules"
git grep -n "eslintrc-profile-rules"
git grep -n "eslintrc-security"
git grep -n "eslint-plugin-maps"
git grep -n "eslint-plugin-session-context"
git grep -n "eslint-plugin-ssot"
```

---

## RISCOS E MITIGAÇÕES

### Risco 1: Scripts com Paths Hardcoded
**Mitigação:** Buscar e atualizar referências

### Risco 2: ESLint Configs Não Carregam
**Mitigação:** Atualizar `eslint.config.js` se necessário

### Risco 3: CI/CD Quebra
**Mitigação:** Verificar workflows em `.github/workflows/`

### Risco 4: Husky Hooks Quebram
**Mitigação:** Testar hooks após commit

---

## ROLLBACK

Se algo der errado:
```bash
# Voltar para branch de backup
git checkout backup/pre-reorganizacao-raiz

# Ou reverter commit
git revert HEAD

# Ou reset hard (CUIDADO!)
git reset --hard HEAD~1
```

---

## RESUMO DE MUDANÇAS

### Arquivos Movidos: 36
- ESLint configs: 4
- ESLint plugins: 4
- Scripts migration: 19
- Scripts fix: 8
- Scripts devops: 1

### Arquivos Removidos: 6
- bun.lock
- query.sql
- .codex-validate-deps.txt
- GIT_COMMIT_MESSAGE.txt
- lint-*.txt (3 arquivos)

### Arquivos Removidos do Tracking: 1
- .env.e2e.network (criado template)

### Diretórios Criados: 4
- eslint-rules/configs/
- eslint-rules/plugins/
- scripts/backups/
- scripts/devops/

### Arquivos Atualizados: 2
- .gitignore
- README.md (documentação)

---

## PRÓXIMOS PASSOS APÓS EXECUÇÃO

1. Monitorar CI/CD por 24h
2. Verificar se equipe consegue rodar scripts
3. Atualizar documentação de onboarding
4. Criar hook pre-commit para detectar scripts na raiz
5. Documentar política de organização no CONTRIBUTING.md

---

**Status:** AGUARDANDO APROVAÇÃO PARA EXECUÇÃO  
**Tempo Estimado:** 15-20 minutos  
**Reversível:** SIM (via git revert ou branch de backup)
