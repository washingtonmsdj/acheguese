# AUDITORIA ESTRUTURAL AAA - RAIZ DO PROJETO

**Data:** 2026-04-22  
**Projeto:** achegue-se  
**Package Manager Oficial:** npm (package-lock.json presente)  
**Objetivo:** Reorganização em nível AAA sem gambiarra

---

## 1. DIAGNÓSTICO COMPLETO DA RAIZ ATUAL

### 1.1 Inventário Total (94 itens na raiz)

#### DIRETÓRIOS (25)
```
.archive/          - 141 arquivos (md + tsx antigos)
.git/              - controle de versão
.github/           - workflows CI/CD
.husky/            - git hooks
.kiro/             - configuração IDE Kiro
.lovable/          - configuração Lovable
.tools/            - binário rg.exe
.vercel/           - configuração deploy Vercel
.vscode/           - configuração VS Code
api/               - edge functions
coverage/          - ARTEFATO GERADO (testes)
dist/              - ARTEFATO GERADO (build)
docs/              - documentação oficial
e2e/               - testes e2e
eslint-rules/      - regras ESLint customizadas
node_modules/      - dependências
playwright-report/ - ARTEFATO GERADO (relatório testes)
public/            - assets estáticos
scripts/           - scripts operacionais (já estruturado)
src/               - código-fonte principal
supabase/          - migrations e config Supabase
templates/         - templates do projeto
test-results/      - ARTEFATO GERADO (resultados testes)
tests/             - testes unitários
testsprite_tests/  - testes TestSprite
```

#### ARQUIVOS DE CONFIGURAÇÃO OFICIAL (23)
```
.gitignore                          ✓ OFICIAL
.gitleaks.toml                      ✓ OFICIAL (segurança)
.vercelignore                       ✓ OFICIAL
components.json                     ✓ OFICIAL (shadcn)
eslint.config.js                    ✓ OFICIAL
eslint.config.security.mjs          ✓ OFICIAL
index.html                          ✓ OFICIAL (entrypoint)
package.json                        ✓ OFICIAL
package-lock.json                   ✓ OFICIAL
playwright.config.ts                ✓ OFICIAL
playwright.mapa.config.ts           ✓ OFICIAL
postcss.config.cjs                  ✓ OFICIAL
README.md                           ✓ OFICIAL
SECURITY.md                         ✓ OFICIAL
tailwind.config.ts                  ✓ OFICIAL
tsconfig.app.json                   ✓ OFICIAL
tsconfig.json                       ✓ OFICIAL
tsconfig.node.json                  ✓ OFICIAL
tsconfig.test.json                  ✓ OFICIAL
vercel.json                         ✓ OFICIAL
vite.config.ts                      ✓ OFICIAL
vitest.config.ts                    ✓ OFICIAL
package.json.security-deps          ⚠️ REVISAR
```

#### ARQUIVOS .ENV (10) - RISCO DE SEGURANÇA
```
.env                    ⚠️ TEMPLATE PÚBLICO (deve ser commitado)
.env.e2e.network        ⚠️ REVISAR CONTEÚDO
.env.example            ✓ TEMPLATE
.env.local              ⚠️ NÃO DEVE ESTAR VERSIONADO
.env.local.example      ✓ TEMPLATE
.env.production         ⚠️ REVISAR (pode conter secrets)
.env.remote             ⚠️ REVISAR (pode conter secrets)
.env.remote.example     ✓ TEMPLATE
.env.test               ⚠️ REVISAR
```

#### ESLINT RULES SOLTAS (4) - DEVEM ESTAR EM eslint-rules/
```
.eslintrc-billing-rules.json    → mover para eslint-rules/
.eslintrc-maps-rules.json       → mover para eslint-rules/
.eslintrc-profile-rules.json    → mover para eslint-rules/
.eslintrc-security.json         → mover para eslint-rules/
```

#### PLUGINS ESLINT SOLTOS (4) - DEVEM ESTAR EM eslint-rules/
```
eslint-plugin-maps.cjs              → mover para eslint-rules/
eslint-plugin-session-context.cjs   → mover para eslint-rules/
eslint-plugin-ssot-hardcodes.cjs    → mover para eslint-rules/
eslint-plugin-ssot.cjs              → mover para eslint-rules/
```

#### SCRIPTS SOLTOS NA RAIZ (19) - POLUIÇÃO CRÍTICA
```
apply-dispatch-migration-simple.ps1     → scripts/migrations/
apply-dispatch-migration.mjs            → scripts/migrations/
apply-dispatch-migration.ps1            → scripts/migrations/
apply-dispatch-migration.sh             → scripts/migrations/
apply-driver-capabilities-fix.mjs       → scripts/fixes/
apply-final.mjs                         → scripts/migrations/
apply-gastronomy-migrations-only.mjs    → scripts/migrations/
apply-gastronomy-migrations.sh          → scripts/migrations/
apply-migration-simple.mjs              → scripts/migrations/
apply-migration.ps1                     → scripts/migrations/
apply-migrations-api.mjs                → scripts/migrations/
apply-migrations-cli.mjs                → scripts/migrations/
apply-migrations-direct.mjs             → scripts/migrations/
apply-migrations-final.mjs              → scripts/migrations/
apply-migrations-force.py               → scripts/migrations/
apply-migrations-pg.mjs                 → scripts/migrations/
apply-migrations.mjs                    → scripts/migrations/
apply-ride-offers-migration.mjs         → scripts/migrations/
apply-vaga-status-migration.ps1         → scripts/migrations/
```

#### SCRIPTS PYTHON SOLTOS (6) - DEVEM ESTAR EM scripts/fixes/
```
clean-migrations.py                 → scripts/fixes/
fix-all-profile-links.py            → scripts/fixes/
fix-duplicate-do-blocks.py          → scripts/fixes/
fix-enums.py                        → scripts/fixes/
fix-menu-references.py              → scripts/fixes/
fix-owner-id-references.py          → scripts/fixes/
fix-profile-links-references.py     → scripts/fixes/
make-migrations-idempotent.py       → scripts/fixes/
```

#### ARQUIVOS SQL SOLTOS (1)
```
query.sql                           → scripts/sql/ ou REMOVER
```

#### OUTPUTS E ARTEFATOS TEMPORÁRIOS (4) - LIXO
```
.codex-validate-deps.txt            → REMOVER (output temporário)
GIT_COMMIT_MESSAGE.txt              → REMOVER (temporário)
lint-final2.txt                     → REMOVER (output lint)
lint-output-final.txt               → REMOVER (output lint)
lint-output.txt                     → REMOVER (output lint)
```

#### SCRIPT POWERSHELL SOLTO (1)
```
push-to-github.ps1                  → scripts/devops/ ou REMOVER
```

#### DUALIDADE PACKAGE MANAGER (1) - INCONSISTÊNCIA
```
bun.lock                            ⚠️ CONFLITO com package-lock.json
```

---

## 2. MATRIZ DE CLASSIFICAÇÃO E DESTINO

| Item | Tipo | Classificação | Destino | Ação |
|------|------|---------------|---------|------|
| `.archive/` | Dir | Legado | `.archive/` | MANTER (histórico) |
| `.git/` | Dir | Estrutural | `.git/` | MANTER |
| `.github/` | Dir | Estrutural | `.github/` | MANTER |
| `.husky/` | Dir | Estrutural | `.husky/` | MANTER |
| `.kiro/` | Dir | Config IDE | `.kiro/` | MANTER |
| `.lovable/` | Dir | Config IDE | `.lovable/` | MANTER |
| `.tools/` | Dir | Ferramentas | `.tools/` | MANTER |
| `.vercel/` | Dir | Deploy | `.vercel/` | MANTER |
| `.vscode/` | Dir | Config IDE | `.vscode/` | MANTER |
| `api/` | Dir | Estrutural | `api/` | MANTER |
| `coverage/` | Dir | Artefato | `.gitignore` | IGNORAR (já está) |
| `dist/` | Dir | Artefato | `.gitignore` | IGNORAR (já está) |
| `docs/` | Dir | Estrutural | `docs/` | MANTER |
| `e2e/` | Dir | Estrutural | `e2e/` | MANTER |
| `eslint-rules/` | Dir | Estrutural | `eslint-rules/` | MANTER |
| `node_modules/` | Dir | Artefato | `.gitignore` | IGNORAR (já está) |
| `playwright-report/` | Dir | Artefato | `.gitignore` | IGNORAR (já está) |
| `public/` | Dir | Estrutural | `public/` | MANTER |
| `scripts/` | Dir | Estrutural | `scripts/` | MANTER |
| `src/` | Dir | Estrutural | `src/` | MANTER |
| `supabase/` | Dir | Estrutural | `supabase/` | MANTER |
| `templates/` | Dir | Estrutural | `templates/` | MANTER |
| `test-results/` | Dir | Artefato | `.gitignore` | IGNORAR (já está) |
| `tests/` | Dir | Estrutural | `tests/` | MANTER |
| `testsprite_tests/` | Dir | Estrutural | `testsprite_tests/` | MANTER |
| `.gitignore` | Config | Oficial | `.gitignore` | MANTER |
| `.gitleaks.toml` | Config | Oficial | `.gitleaks.toml` | MANTER |
| `.vercelignore` | Config | Oficial | `.vercelignore` | MANTER |
| `components.json` | Config | Oficial | `components.json` | MANTER |
| `eslint.config.js` | Config | Oficial | `eslint.config.js` | MANTER |
| `eslint.config.security.mjs` | Config | Oficial | `eslint.config.security.mjs` | MANTER |
| `index.html` | Entrypoint | Oficial | `index.html` | MANTER |
| `package.json` | Config | Oficial | `package.json` | MANTER |
| `package-lock.json` | Config | Oficial | `package-lock.json` | MANTER |
| `bun.lock` | Config | Conflito | REMOVER | REMOVER (npm é oficial) |
| `package.json.security-deps` | Config | Backup | `scripts/backups/` | MOVER |
| `playwright.config.ts` | Config | Oficial | `playwright.config.ts` | MANTER |
| `playwright.mapa.config.ts` | Config | Oficial | `playwright.mapa.config.ts` | MANTER |
| `postcss.config.cjs` | Config | Oficial | `postcss.config.cjs` | MANTER |
| `README.md` | Doc | Oficial | `README.md` | MANTER |
| `SECURITY.md` | Doc | Oficial | `SECURITY.md` | MANTER |
| `tailwind.config.ts` | Config | Oficial | `tailwind.config.ts` | MANTER |
| `tsconfig.*.json` | Config | Oficial | raiz | MANTER (4 arquivos) |
| `vercel.json` | Config | Oficial | `vercel.json` | MANTER |
| `vite.config.ts` | Config | Oficial | `vite.config.ts` | MANTER |
| `vitest.config.ts` | Config | Oficial | `vitest.config.ts` | MANTER |
| `.env` | Env | Template | `.env` | REVISAR CONTEÚDO |
| `.env.e2e.network` | Env | Test | `.env.e2e.network` | REVISAR |
| `.env.example` | Env | Template | `.env.example` | MANTER |
| `.env.local` | Env | Secret | REMOVER | REMOVER (não versionar) |
| `.env.local.example` | Env | Template | `.env.local.example` | MANTER |
| `.env.production` | Env | Secret | REVISAR | REVISAR SECRETS |
| `.env.remote` | Env | Secret | REVISAR | REVISAR SECRETS |
| `.env.remote.example` | Env | Template | `.env.remote.example` | MANTER |
| `.env.test` | Env | Test | `.env.test` | REVISAR |
| `.eslintrc-billing-rules.json` | Config | ESLint | `eslint-rules/` | MOVER |
| `.eslintrc-maps-rules.json` | Config | ESLint | `eslint-rules/` | MOVER |
| `.eslintrc-profile-rules.json` | Config | ESLint | `eslint-rules/` | MOVER |
| `.eslintrc-security.json` | Config | ESLint | `eslint-rules/` | MOVER |
| `eslint-plugin-*.cjs` | Plugin | ESLint | `eslint-rules/` | MOVER (4 arquivos) |
| `apply-*.ps1` | Script | Migration | `scripts/migrations/` | MOVER (3 arquivos) |
| `apply-*.mjs` | Script | Migration | `scripts/migrations/` | MOVER (13 arquivos) |
| `apply-*.sh` | Script | Migration | `scripts/migrations/` | MOVER (2 arquivos) |
| `apply-*.py` | Script | Migration | `scripts/migrations/` | MOVER (1 arquivo) |
| `clean-migrations.py` | Script | Fix | `scripts/fixes/` | MOVER |
| `fix-*.py` | Script | Fix | `scripts/fixes/` | MOVER (6 arquivos) |
| `make-migrations-idempotent.py` | Script | Fix | `scripts/fixes/` | MOVER |
| `query.sql` | SQL | Temp | REMOVER | REMOVER |
| `push-to-github.ps1` | Script | DevOps | `scripts/devops/` | MOVER |
| `.codex-validate-deps.txt` | Output | Temp | REMOVER | REMOVER |
| `GIT_COMMIT_MESSAGE.txt` | Output | Temp | REMOVER | REMOVER |
| `lint-*.txt` | Output | Temp | REMOVER | REMOVER (3 arquivos) |

---

## 3. PROBLEMAS CRÍTICOS IDENTIFICADOS

### 3.1 Segurança
- ⚠️ `.env.local` presente (pode conter secrets)
- ⚠️ `.env.production` presente (pode conter secrets)
- ⚠️ `.env.remote` presente (pode conter secrets)
- ⚠️ Necessário audit de conteúdo antes de qualquer ação

### 3.2 Poluição
- 19 scripts de migration soltos na raiz
- 8 scripts Python de fix soltos na raiz
- 4 outputs de lint temporários
- 4 configs ESLint fora do diretório oficial
- 4 plugins ESLint fora do diretório oficial

### 3.3 Inconsistência
- Dualidade `package-lock.json` + `bun.lock`
- Package manager oficial: npm (conforme package.json)
- `bun.lock` deve ser removido

### 3.4 Legado
- `.archive/` com 141 arquivos (mantido como histórico)
- Múltiplos scripts de migration duplicados/obsoletos

---

## 4. PLANO DE REORGANIZAÇÃO

### 4.1 Criar Estrutura de Destino
```bash
scripts/
  migrations/       # scripts de migration da raiz
  fixes/            # scripts Python de fix
  devops/           # scripts de deploy/CI
  sql/              # queries SQL avulsas (se necessário)
  backups/          # backups de configs

eslint-rules/
  configs/          # arquivos .eslintrc-*.json
  plugins/          # arquivos eslint-plugin-*.cjs
```

### 4.2 Movimentações
1. Mover 19 scripts de migration para `scripts/migrations/`
2. Mover 8 scripts Python para `scripts/fixes/`
3. Mover 4 configs ESLint para `eslint-rules/configs/`
4. Mover 4 plugins ESLint para `eslint-rules/plugins/`
5. Mover `push-to-github.ps1` para `scripts/devops/`
6. Mover `package.json.security-deps` para `scripts/backups/`

### 4.3 Remoções
1. Remover `bun.lock`
2. Remover `query.sql`
3. Remover `.codex-validate-deps.txt`
4. Remover `GIT_COMMIT_MESSAGE.txt`
5. Remover `lint-*.txt` (3 arquivos)

### 4.4 Revisões de Segurança
1. Auditar `.env.local`
2. Auditar `.env.production`
3. Auditar `.env.remote`
4. Auditar `.env.test`
5. Auditar `.env.e2e.network`

---

## 5. ÁRVORE FINAL OFICIAL DA RAIZ

```
achegue-se/
├── .archive/                       # Histórico (mantido)
├── .git/                           # Git
├── .github/                        # CI/CD
├── .husky/                         # Git hooks
├── .kiro/                          # Config Kiro
├── .lovable/                       # Config Lovable
├── .tools/                         # Ferramentas
├── .vercel/                        # Deploy Vercel
├── .vscode/                        # Config VS Code
├── api/                            # Edge functions
├── docs/                           # Documentação
├── e2e/                            # Testes E2E
├── eslint-rules/                   # Regras ESLint
│   ├── configs/                    # ← NOVO: configs movidas
│   └── plugins/                    # ← NOVO: plugins movidos
├── public/                         # Assets
├── scripts/                        # Scripts operacionais
│   ├── migrations/                 # ← CONSOLIDADO: migrations da raiz
│   ├── fixes/                      # ← CONSOLIDADO: fixes Python
│   ├── devops/                     # ← NOVO: scripts deploy
│   ├── backups/                    # ← NOVO: backups configs
│   ├── security/                   # Já existe
│   ├── test/                       # Já existe
│   └── ...                         # Demais subpastas
├── src/                            # Código-fonte
├── supabase/                       # Migrations Supabase
├── templates/                      # Templates
├── tests/                          # Testes unitários
├── testsprite_tests/               # Testes TestSprite
├── .env.example                    # Template público
├── .env.local.example              # Template local
├── .env.remote.example             # Template remote
├── .gitignore                      # Git ignore
├── .gitleaks.toml                  # Segurança
├── .vercelignore                   # Vercel ignore
├── components.json                 # Shadcn
├── eslint.config.js                # ESLint principal
├── eslint.config.security.mjs      # ESLint segurança
├── index.html                      # Entrypoint
├── package.json                    # NPM config
├── package-lock.json               # NPM lock
├── playwright.config.ts            # Playwright
├── playwright.mapa.config.ts       # Playwright maps
├── postcss.config.cjs              # PostCSS
├── README.md                       # Documentação raiz
├── SECURITY.md                     # Política segurança
├── tailwind.config.ts              # Tailwind
├── tsconfig.*.json                 # TypeScript (4 arquivos)
├── vercel.json                     # Vercel config
├── vite.config.ts                  # Vite
└── vitest.config.ts                # Vitest

REMOVIDOS DA RAIZ:
- bun.lock
- query.sql
- .codex-validate-deps.txt
- GIT_COMMIT_MESSAGE.txt
- lint-*.txt (3 arquivos)
- 19 scripts de migration
- 8 scripts Python
- 4 configs ESLint
- 4 plugins ESLint
- 1 script PowerShell devops
```

---

## 6. POLÍTICA OFICIAL

### 6.1 Scripts
- **Raiz:** PROIBIDO scripts soltos
- **Destino:** `scripts/` com subgrupos claros
- **Subgrupos oficiais:**
  - `migrations/` - aplicação de migrations
  - `fixes/` - correções pontuais
  - `validation/` - validações (já existe)
  - `devops/` - deploy e CI/CD
  - `security/` - segurança (já existe)
  - `test/` - testes (já existe)
  - `sql/` - queries SQL (se necessário)
  - `backups/` - backups de configs

### 6.2 Artefatos
- **Gerados:** `coverage/`, `dist/`, `playwright-report/`, `test-results/`
- **Tratamento:** `.gitignore` (já configurado)
- **Raiz:** PROIBIDO outputs temporários

### 6.3 Arquivos de Ambiente
- **Versionados:** apenas `.example` e templates públicos
- **Proibidos:** `.env.local`, `.env.production` com secrets reais
- **Política:**
  - `.env` = template público com placeholders
  - `.env.example` = template completo
  - `.env.local.example` = template local
  - `.env.remote.example` = template remote
  - `.env.local` = NÃO VERSIONAR (secrets locais)
  - `.env.production` = NÃO VERSIONAR (secrets produção)

### 6.4 Package Manager
- **Oficial:** npm
- **Lock file:** `package-lock.json`
- **Proibido:** `bun.lock`, `yarn.lock`, `pnpm-lock.yaml`

### 6.5 Configs ESLint
- **Raiz:** apenas `eslint.config.js` e `eslint.config.security.mjs`
- **Demais:** `eslint-rules/configs/` e `eslint-rules/plugins/`

---

## 7. VALIDAÇÃO FINAL

### 7.1 Checklist Pré-Execução
- [ ] Backup completo do projeto
- [ ] Audit de secrets em `.env.*`
- [ ] Verificar dependências de scripts movidos
- [ ] Revisar imports/paths em configs

### 7.2 Checklist Pós-Execução
- [ ] `npm run build` - sucesso
- [ ] `npm run lint` - sucesso
- [ ] `npm run typecheck` - sucesso
- [ ] `npm run test` - sucesso
- [ ] `npm run validate:ssot` - sucesso
- [ ] CI/CD workflows - funcionando
- [ ] Husky hooks - funcionando
- [ ] Scripts movidos - paths atualizados

### 7.3 Validação Operacional
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

## 8. RESUMO EXECUTIVO

### Situação Atual
- **Raiz poluída:** 94 itens (25 diretórios + 69 arquivos)
- **Scripts soltos:** 28 arquivos
- **Outputs temporários:** 5 arquivos
- **Conflitos:** 1 (bun.lock vs package-lock.json)
- **Riscos de segurança:** 5 arquivos .env a auditar

### Situação Final
- **Raiz limpa:** 47 itens (25 diretórios + 22 arquivos oficiais)
- **Scripts organizados:** 0 na raiz, todos em `scripts/`
- **Outputs removidos:** 5 arquivos
- **Conflitos resolvidos:** 0
- **Segurança:** política clara de .env

### Impacto
- **Redução:** 47% menos arquivos na raiz
- **Organização:** 100% scripts em subgrupos
- **Segurança:** política de .env documentada
- **Manutenibilidade:** estrutura previsível e governada

---

**Status:** DIAGNÓSTICO COMPLETO - AGUARDANDO APROVAÇÃO PARA EXECUÇÃO
