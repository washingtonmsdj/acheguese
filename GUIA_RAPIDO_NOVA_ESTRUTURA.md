# 🚀 GUIA RÁPIDO - NOVA ESTRUTURA DA RAIZ

**Data:** 2026-04-22  
**Para:** Equipe de Desenvolvimento  
**Assunto:** Reorganização AAA da raiz do projeto

---

## 📢 O QUE MUDOU?

A raiz do projeto foi reorganizada para ficar mais limpa e profissional. **Seus arquivos locais estão seguros**, mas alguns arquivos foram movidos para pastas organizadas.

---

## 🗂️ ONDE ESTÃO OS ARQUIVOS AGORA?

### Scripts de Migration
**ANTES:** Raiz do projeto  
**AGORA:** `scripts/migrations/`

```bash
# Exemplos:
apply-dispatch-migration.mjs       → scripts/migrations/
apply-migrations-final.mjs         → scripts/migrations/
apply-gastronomy-migrations.sh     → scripts/migrations/
```

### Scripts de Fix
**ANTES:** Raiz do projeto  
**AGORA:** `scripts/fixes/`

```bash
# Exemplos:
fix-all-profile-links.py           → scripts/fixes/
clean-migrations.py                → scripts/fixes/
make-migrations-idempotent.py      → scripts/fixes/
```

### Configs ESLint
**ANTES:** Raiz do projeto  
**AGORA:** `eslint-rules/configs/` e `eslint-rules/plugins/`

```bash
# Configs:
.eslintrc-billing-rules.json       → eslint-rules/configs/
.eslintrc-maps-rules.json          → eslint-rules/configs/
.eslintrc-security.json            → eslint-rules/configs/

# Plugins:
eslint-plugin-ssot.cjs             → eslint-rules/plugins/
eslint-plugin-maps.cjs             → eslint-rules/plugins/
```

### Scripts DevOps
**ANTES:** Raiz do projeto  
**AGORA:** `scripts/devops/`

```bash
push-to-github.ps1                 → scripts/devops/
```

---

## ✅ O QUE VOCÊ PRECISA FAZER?

### 1. Atualizar Repositório Local
```bash
git pull origin main
```

### 2. Verificar Seus Scripts
Se você tem scripts ou aliases que referenciam arquivos movidos, atualize os paths:

```bash
# ANTES:
./apply-migrations-final.mjs

# AGORA:
./scripts/migrations/apply-migrations-final.mjs
```

### 3. Seus Arquivos .env Estão Seguros
- ✅ `.env.local` - **MANTIDO** (seus secrets estão seguros)
- ✅ `.env.remote` - **MANTIDO** (se você tem)
- ✅ `.env.test` - **MANTIDO** (se você tem)

**Nenhuma ação necessária!**

---

## 🚫 O QUE FOI REMOVIDO?

### Arquivos Temporários
- `bun.lock` (npm é o package manager oficial)
- `query.sql` (temporário)
- `lint-*.txt` (outputs)
- `.codex-validate-deps.txt` (output)
- `GIT_COMMIT_MESSAGE.txt` (temporário)

### .env.e2e.network
- Removido do Git (agora é gerado automaticamente)
- Se você precisa, rode: `npm run seed:e2e:network`

---

## 📋 NOVA POLÍTICA DE SCRIPTS

### ❌ NÃO FAÇA:
```bash
# Criar scripts na raiz
./meu-script.sh
./fix-algo.py
```

### ✅ FAÇA:
```bash
# Criar scripts nas pastas apropriadas
scripts/migrations/meu-script.sh
scripts/fixes/fix-algo.py
scripts/devops/deploy.sh
```

### Pastas Disponíveis:
- `scripts/migrations/` - Scripts de migration
- `scripts/fixes/` - Scripts de correção
- `scripts/devops/` - Scripts de deploy/CI
- `scripts/validation/` - Scripts de validação
- `scripts/security/` - Scripts de segurança
- `scripts/test/` - Scripts de teste

---

## 🔍 COMO ENCONTRAR UM SCRIPT?

### Opção 1: Buscar por Nome
```bash
# PowerShell
Get-ChildItem -Path scripts -Recurse -Filter "*migration*"

# Bash
find scripts -name "*migration*"
```

### Opção 2: Buscar por Conteúdo
```bash
# PowerShell
Get-ChildItem -Path scripts -Recurse | Select-String "texto"

# Bash
grep -r "texto" scripts/
```

### Opção 3: Verificar README
```bash
cat scripts/README.md
```

---

## 🆘 PROBLEMAS COMUNS

### "Script não encontrado"
**Problema:** `./apply-migrations.mjs: not found`

**Solução:**
```bash
# Atualizar path
./scripts/migrations/apply-migrations.mjs
```

### "ESLint não funciona"
**Problema:** ESLint não carrega configs

**Solução:**
```bash
# Já foi corrigido automaticamente
# Se ainda tiver problema, rode:
npm run lint
```

### "Meu .env.local sumiu"
**Problema:** Não consigo encontrar meu .env.local

**Solução:**
```bash
# Seu .env.local está seguro na raiz!
ls -la .env.local

# Se não existe, você nunca teve um
# Crie a partir do template:
cp .env.local.example .env.local
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para mais detalhes, consulte:

1. **AUDITORIA_RAIZ_AAA.md** - Diagnóstico completo
2. **REORGANIZACAO_CONCLUIDA.md** - O que foi feito
3. **RELATORIO_CONFORMIDADE_FINAL.md** - Validações e conformidade

---

## 💬 DÚVIDAS?

### Onde reportar problemas?
- Abra uma issue no GitHub
- Fale com o time de DevOps
- Consulte a documentação acima

### Preciso atualizar algo no meu ambiente?
**Não!** Apenas rode `git pull` e continue trabalhando normalmente.

### Meus scripts vão quebrar?
**Não!** Se você usa scripts do repositório, os paths foram atualizados automaticamente. Se você tem scripts locais que referenciam arquivos movidos, atualize os paths.

---

## ✅ CHECKLIST RÁPIDO

- [ ] `git pull origin main` executado
- [ ] Scripts locais atualizados (se necessário)
- [ ] `.env.local` verificado (deve estar na raiz)
- [ ] `npm run build` funciona
- [ ] `npm run lint` funciona
- [ ] Tudo funcionando normalmente

---

## 🎉 BENEFÍCIOS PARA VOCÊ

- ✅ **Raiz mais limpa** - Fácil de navegar
- ✅ **Scripts organizados** - Fácil de encontrar
- ✅ **Onboarding mais rápido** - Novos devs agradecem
- ✅ **Menos confusão** - Estrutura previsível
- ✅ **Mais profissional** - Projeto AAA

---

**Bem-vindo à nova estrutura! 🚀**

Se tiver dúvidas, consulte a documentação ou fale com a equipe.
