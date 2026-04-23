# POLÍTICA OFICIAL DE ORGANIZAÇÃO DA RAIZ

**Versão:** 1.0  
**Data:** 2026-04-22  
**Status:** OFICIAL E OBRIGATÓRIA

---

## 🎯 OBJETIVO

Manter a raiz do projeto limpa, previsível e governada, seguindo os princípios SSOT (Single Source of Truth) operacional.

---

## 📋 REGRAS OBRIGATÓRIAS

### 1. Scripts na Raiz: PROIBIDO

**Regra:** Scripts soltos na raiz são **PROIBIDOS**.

**Destinos oficiais:**
```
scripts/
├── migrations/     # Scripts de aplicação de migrations
├── fixes/          # Scripts de correção pontual
├── devops/         # Scripts de deploy e CI/CD
├── validation/     # Scripts de validação
├── security/       # Scripts de segurança
├── test/           # Scripts de teste
└── backups/        # Backups de configurações
```

**Exemplos:**
```bash
# ❌ ERRADO:
./apply-migration.mjs
./fix-bug.py
./deploy.sh

# ✅ CORRETO:
scripts/migrations/apply-migration.mjs
scripts/fixes/fix-bug.py
scripts/devops/deploy.sh
```

---

### 2. Outputs Temporários: PROIBIDO

**Regra:** Outputs temporários na raiz são **PROIBIDOS**.

**Tratamento:**
- Artefatos gerados: `coverage/`, `dist/`, `playwright-report/`, `test-results/`
- Ação: Devem estar no `.gitignore`
- Destino: Apenas em diretórios específicos

**Exemplos:**
```bash
# ❌ ERRADO:
./lint-output.txt
./test-results.json
./coverage-report.html

# ✅ CORRETO:
coverage/
test-results/
playwright-report/
```

---

### 3. Arquivos .env: APENAS TEMPLATES

**Regra:** Apenas templates podem ser versionados.

**Versionados (permitidos):**
```
.env                        # Template público com placeholders
.env.example                # Template completo
.env.local.example          # Template local
.env.remote.example         # Template remote
.env.e2e.network.example    # Template E2E
```

**Proibidos (não versionar):**
```
.env.local                  # Secrets locais
.env.production             # Secrets produção (se tiver valores reais)
.env.remote                 # Secrets remote (se tiver valores reais)
.env.test                   # Secrets teste (se tiver valores reais)
.env.e2e.*                  # Secrets E2E (exceto .example)
```

**Regra de Ouro:**
> Se o arquivo contém uma chave/senha/token real, **NÃO DEVE** ser commitado.

---

### 4. Package Manager: APENAS UM

**Regra:** Apenas um package manager oficial.

**Oficial:** npm  
**Lock file:** `package-lock.json`

**Proibidos:**
```
bun.lock
yarn.lock
pnpm-lock.yaml
```

**Ação:** Se encontrar um lock file não oficial, remova:
```bash
rm bun.lock yarn.lock pnpm-lock.yaml
```

---

### 5. Configs ESLint: CENTRALIZAÇÃO

**Regra:** Apenas configs principais na raiz.

**Raiz (permitidos):**
```
eslint.config.js            # Config principal
eslint.config.security.mjs  # Config segurança
```

**Demais (mover para):**
```
eslint-rules/
├── configs/                # Configs específicas (.eslintrc-*.json)
└── plugins/                # Plugins customizados (eslint-plugin-*.cjs)
```

---

### 6. Documentação: APENAS README E SECURITY

**Regra:** Apenas `README.md` e `SECURITY.md` na raiz.

**Raiz (permitidos):**
```
README.md                   # Documentação principal
SECURITY.md                 # Política de segurança
```

**Demais (mover para):**
```
docs/                       # Toda documentação adicional
```

**Exceções temporárias:**
- Documentos de auditoria (AUDITORIA_*, PLANO_*, etc.)
- Podem ficar na raiz temporariamente
- Devem ser movidos para `docs/audits/` após revisão

---

## 🔍 VALIDAÇÃO E ENFORCEMENT

### Pre-commit Hook (futuro)
```bash
# Será implementado para validar:
- Nenhum script solto na raiz
- Nenhum output temporário na raiz
- Nenhum .env com secrets na raiz
- Apenas um lock file de package manager
```

### Validação Manual
```bash
# Verificar scripts na raiz
ls *.sh *.py *.mjs *.ps1 2>/dev/null

# Verificar outputs na raiz
ls *.txt *.log *.json 2>/dev/null | grep -v package

# Verificar .env na raiz
ls .env* | grep -v example
```

### CI/CD Validation (futuro)
```yaml
# Será adicionado ao workflow:
- name: Validate Root Structure
  run: npm run validate:root-structure
```

---

## 📊 ESTRUTURA OFICIAL DA RAIZ

### Diretórios Permitidos
```
.archive/           # Histórico (mantido)
.git/               # Git
.github/            # CI/CD
.husky/             # Git hooks
.kiro/              # Config Kiro
.lovable/           # Config Lovable
.tools/             # Ferramentas
.vercel/            # Deploy Vercel
.vscode/            # Config VS Code
api/                # Edge functions
coverage/           # Artefato (ignorado)
dist/               # Artefato (ignorado)
docs/               # Documentação
e2e/                # Testes E2E
eslint-rules/       # Regras ESLint
node_modules/       # Dependências (ignorado)
playwright-report/  # Artefato (ignorado)
public/             # Assets
scripts/            # Scripts operacionais
src/                # Código-fonte
supabase/           # Migrations Supabase
templates/          # Templates
test-results/       # Artefato (ignorado)
tests/              # Testes unitários
testsprite_tests/   # Testes TestSprite
```

### Arquivos Permitidos
```
# Configs principais
.gitignore
.gitleaks.toml
.vercelignore
components.json
eslint.config.js
eslint.config.security.mjs
index.html
package.json
package-lock.json
playwright.config.ts
playwright.mapa.config.ts
postcss.config.cjs
tailwind.config.ts
tsconfig.*.json
vercel.json
vite.config.ts
vitest.config.ts

# Documentação
README.md
SECURITY.md

# Templates .env
.env
.env.example
.env.local.example
.env.remote.example
.env.e2e.network.example
```

---

## 🚨 VIOLAÇÕES E CORREÇÕES

### Violação: Script na Raiz
```bash
# Problema:
./meu-script.sh

# Correção:
git mv meu-script.sh scripts/[categoria]/
# Onde [categoria] = migrations, fixes, devops, etc.
```

### Violação: Output na Raiz
```bash
# Problema:
./lint-output.txt

# Correção:
rm lint-output.txt
# Adicionar ao .gitignore se necessário
```

### Violação: .env com Secrets
```bash
# Problema:
.env.local commitado

# Correção:
git rm --cached .env.local
# Adicionar ao .gitignore
# Rotacionar secrets se já foi commitado
```

### Violação: Lock File Duplicado
```bash
# Problema:
bun.lock e package-lock.json

# Correção:
rm bun.lock
git add bun.lock
git commit -m "remove: bun.lock (npm é o package manager oficial)"
```

---

## 📚 REFERÊNCIAS

### Documentação Relacionada
- [AUDITORIA_RAIZ_AAA.md](./AUDITORIA_RAIZ_AAA.md) - Diagnóstico completo
- [REORGANIZACAO_CONCLUIDA.md](./REORGANIZACAO_CONCLUIDA.md) - Histórico da reorganização
- [RELATORIO_CONFORMIDADE_FINAL.md](./RELATORIO_CONFORMIDADE_FINAL.md) - Conformidade
- [GUIA_RAPIDO_NOVA_ESTRUTURA.md](./GUIA_RAPIDO_NOVA_ESTRUTURA.md) - Guia para equipe

### Princípios SSOT
- Single Source of Truth operacional
- Estrutura previsível e governada
- Sem gambiarra ou paliativo
- Manutenibilidade em primeiro lugar

---

## 🔄 PROCESSO DE REVISÃO

### Frequência
- **Mensal:** Revisão da estrutura da raiz
- **Trimestral:** Revisão da política

### Responsáveis
- **DevOps:** Enforcement e validação
- **Tech Lead:** Aprovação de exceções
- **Equipe:** Conformidade no dia a dia

### Exceções
- Devem ser documentadas
- Devem ter justificativa clara
- Devem ter prazo de validade
- Devem ser aprovadas pelo Tech Lead

---

## ✅ CHECKLIST DE CONFORMIDADE

Antes de fazer commit, verifique:

- [ ] Nenhum script solto na raiz
- [ ] Nenhum output temporário na raiz
- [ ] Nenhum .env com secrets
- [ ] Apenas um lock file (package-lock.json)
- [ ] Configs ESLint organizadas
- [ ] Documentação em `docs/` (exceto README e SECURITY)

---

## 📞 CONTATO

**Dúvidas sobre a política:**
- Consulte a documentação acima
- Fale com o Tech Lead
- Abra uma issue no GitHub

**Sugestões de melhoria:**
- Abra um PR com a proposta
- Documente a justificativa
- Aguarde aprovação do Tech Lead

---

**Esta política é oficial e obrigatória para todos os contribuidores.**

**Versão:** 1.0  
**Última atualização:** 2026-04-22  
**Próxima revisão:** 2026-05-22
