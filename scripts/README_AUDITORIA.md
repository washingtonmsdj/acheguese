# 🔧 Scripts de Auditoria e Correção

Esta pasta contém scripts automatizados para corrigir os problemas identificados na auditoria completa do projeto.

---

## 📁 ESTRUTURA

```
scripts/
├── README_AUDITORIA.md              ← Este arquivo
├── cleanup-project-root.ps1         ← Fase 1: Limpeza da raiz
├── remove-ts-nocheck.ps1            ← Fase 2: Remover gambiarras
├── fix-ssot-violations.md           ← Guia de correção SSOT
├── migrations/
│   └── sql/                         ← Arquivos SQL movidos
├── debug/                           ← Scripts de teste/debug movidos
├── powershell/                      ← Scripts PowerShell movidos
└── temp/                            ← Arquivos temporários
```

---

## 🚀 SCRIPTS DISPONÍVEIS

### 1. cleanup-project-root.ps1
**Fase**: 1 - Limpeza Imediata  
**Tempo**: 5-10 minutos  
**Objetivo**: Organizar estrutura de arquivos

#### O que faz:
- ✅ Cria estrutura de diretórios organizada
- ✅ Move 80+ arquivos SQL para `migrations/sql/`
- ✅ Move 50+ scripts de teste para `debug/`
- ✅ Move 10+ scripts PowerShell para `powershell/`
- ✅ Arquiva 20+ arquivos temporários em `.archive/`
- ✅ Remove binários (ngrok.exe)
- ✅ Atualiza .gitignore

#### Como executar:
```powershell
# Na raiz do projeto
.\scripts\cleanup-project-root.ps1
```

#### Resultado esperado:
```
🧹 Iniciando limpeza da raiz do projeto...

📁 Criando estrutura de diretórios...
  ✅ Criado: scripts/migrations/sql
  ✅ Criado: scripts/debug
  ✅ Criado: scripts/powershell
  ✅ Criado: .archive/sql
  ✅ Criado: .archive/images
  ✅ Criado: .archive/temp

📦 Movendo arquivos SQL...
  ✅ Movidos 82 arquivos SQL

🔧 Movendo scripts de debug...
  ✅ Movidos 53 scripts de debug

⚡ Movendo scripts PowerShell...
  ✅ Movidos 12 scripts PowerShell

📘 Movendo scripts TypeScript de teste...
  ✅ Movidos 8 scripts TypeScript de teste

📜 Movendo scripts JavaScript legados...
  ✅ Movidos 3 scripts JavaScript

🗄️  Arquivando temporários...
  ✅ Arquivados 18 arquivos temporários

🗑️  Removendo binários...
  ✅ Removido ngrok.exe

📝 Atualizando .gitignore...
  ✅ .gitignore atualizado

✨ Limpeza concluída!

📊 Resumo:
  • 82 arquivos SQL movidos para scripts/migrations/sql/
  • 53 scripts de debug movidos para scripts/debug/
  • 12 scripts PowerShell movidos para scripts/powershell/
  • 8 scripts TypeScript movidos para scripts/debug/
  • 3 scripts JavaScript movidos para scripts/debug/
  • 18 arquivos arquivados em .archive/
```

#### Validação:
```bash
# Verificar raiz limpa
ls -la

# Verificar estrutura criada
ls -la scripts/
ls -la .archive/

# Verificar git status
git status
```

---

### 2. remove-ts-nocheck.ps1
**Fase**: 2 - Remover Gambiarras  
**Tempo**: 10-15 minutos  
**Objetivo**: Remover @ts-nocheck e revelar erros TypeScript

#### O que faz:
- ✅ Remove @ts-nocheck de Core Admin Services (13 arquivos)
- ✅ Remove @ts-nocheck de Shared Types (10+ arquivos)
- ✅ Remove @ts-nocheck de Shared Utils (30+ arquivos)
- ✅ Remove @ts-nocheck de Validation Schemas (5+ arquivos)
- ✅ Executa TypeCheck para revelar erros
- ✅ Gera relatório de execução

#### Como executar:
```powershell
# Na raiz do projeto
.\scripts\remove-ts-nocheck.ps1
```

#### Resultado esperado:
```
🔧 Iniciando remoção de @ts-nocheck...

📦 Fase 1: Core Admin Services...
  ✅ Removido @ts-nocheck de: src/core/admin/index.ts
  ✅ Removido @ts-nocheck de: src/core/admin/services/AdminBusinessService.ts
  ... (11 arquivos similares)
  📊 Total: 13 arquivos processados

📦 Fase 2: Shared Types...
  ✅ Removido @ts-nocheck de: src/shared/types/database.types.ts
  ... (9 arquivos similares)
  📊 Total: 10 arquivos processados

📦 Fase 3: Shared Utils...
  ✅ Removido @ts-nocheck de: src/shared/utils/accessibility.ts
  ... (29 arquivos similares)
  📊 Total: 30 arquivos processados

📦 Fase 4: Validation Schemas...
  ✅ Removido @ts-nocheck de: src/shared/validation/schemas/user.schema.ts
  ... (4 arquivos similares)
  📊 Total: 5 arquivos processados

📦 Fase 5: Shared Stores e Services...
  ✅ Removido @ts-nocheck de: src/shared/stores/businessStore.ts
  ... (2 arquivos similares)
  📊 Total: 3 arquivos processados

🔍 Executando TypeCheck...
  ⚠️  Isso pode revelar erros que estavam escondidos
  [Erros TypeScript serão exibidos aqui]

✨ Remoção de @ts-nocheck concluída!

📊 Resumo:
  • Core Admin Services: 13 arquivos
  • Shared Types: 10 arquivos
  • Shared Utils: 30 arquivos
  • Validation Schemas: 5 arquivos
  • Outros: 3 arquivos
  • TOTAL: 61 arquivos processados
```

#### Validação:
```bash
# Verificar remoção
grep -r "@ts-nocheck" src/

# Executar TypeCheck
npm run typecheck

# Executar Lint
npm run lint
```

#### ⚠️ IMPORTANTE:
Após executar este script, você verá **muitos erros TypeScript** que estavam escondidos. Isso é **esperado e desejado**. Agora você precisa corrigir esses erros um por um.

---

### 3. fix-ssot-violations.md
**Fase**: 3 - Corrigir SSOT  
**Tempo**: Referência contínua  
**Objetivo**: Guia técnico para correção de violações SSOT

#### O que contém:
- ✅ Checklist de 29 violações SSOT
- ✅ Exemplos de código antes/depois
- ✅ Padrão de refatoração
- ✅ Mapeamento tabela → serviço canônico
- ✅ Template de commit
- ✅ Casos especiais
- ✅ Ordem de execução

#### Como usar:
```bash
# Ler o guia
cat scripts/fix-ssot-violations.md

# Ou abrir no editor
code scripts/fix-ssot-violations.md
```

#### Estrutura do guia:
1. **Checklist de Violações** - Lista completa de violações
2. **Exemplos por Arquivo** - Código antes/depois
3. **Padrão de Refatoração** - Como corrigir
4. **Mapeamento de Serviços** - Tabela → Serviço
5. **Template de Commit** - Como commitar
6. **Casos Especiais** - Edge Functions, Scripts, Testes
7. **Ordem de Execução** - Priorização
8. **Progresso** - Tracking de correções

---

## 📋 ORDEM DE EXECUÇÃO

### Passo 1: Preparação
```bash
# Criar branch
git checkout -b fix/cleanup-ssot-violations

# Fazer backup
git branch backup/before-cleanup
```

### Passo 2: Fase 1 - Limpeza
```powershell
# Executar script
.\scripts\cleanup-project-root.ps1

# Validar
git status
git diff

# Commitar
git add .
git commit -m "chore: organizar estrutura de arquivos (Fase 1)"
```

### Passo 3: Fase 2 - Remover @ts-nocheck
```powershell
# Executar script
.\scripts\remove-ts-nocheck.ps1

# Validar erros revelados
npm run typecheck

# Corrigir erros TypeScript
# (Este passo é manual e pode levar 3-5 dias)

# Commitar
git add .
git commit -m "fix: remover @ts-nocheck e corrigir erros TypeScript (Fase 2)"
```

### Passo 4: Fase 3 - Corrigir SSOT
```bash
# Consultar guia
cat scripts/fix-ssot-violations.md

# Corrigir violações uma por uma
# (Este passo é manual e pode levar 5-7 dias)

# Validar
npm run lint
npm run audit:ssot-violations

# Commitar incrementalmente
git add src/core/admin/services/AdminProfileGovernanceService.ts
git commit -m "fix(ssot): corrigir 9 violações SSOT em AdminProfileGovernanceService"
```

### Passo 5: Fases 4, 5, 6
Seguir PLANO_CORRECAO_EXECUTIVO.md

---

## 🎯 VALIDAÇÕES

### Após Fase 1
```bash
# Verificar estrutura
ls -la
ls -la scripts/
ls -la .archive/

# Verificar git
git status
git diff --stat
```

### Após Fase 2
```bash
# Verificar remoção de @ts-nocheck
grep -r "@ts-nocheck" src/ | wc -l
# Deve retornar 0 ou muito próximo

# Verificar TypeScript
npm run typecheck

# Verificar Lint
npm run lint
```

### Após Fase 3
```bash
# Verificar violações SSOT
npm run lint | grep "ssot/"
# Deve retornar 0 violações

# Verificar auditoria
npm run audit:ssot-violations
```

### Validação Final
```bash
# Tudo deve passar
npm run lint
npm run typecheck
npm run test
npm run audit:ssot-violations
npm run validate:architecture:governance
```

---

## 📊 MÉTRICAS DE PROGRESSO

### Fase 1: Limpeza
- [ ] Estrutura de diretórios criada
- [ ] Arquivos SQL movidos (82)
- [ ] Scripts de debug movidos (53)
- [ ] Scripts PowerShell movidos (12)
- [ ] Temporários arquivados (18)
- [ ] .gitignore atualizado
- [ ] Commit realizado

### Fase 2: @ts-nocheck
- [ ] Core Admin Services (13 arquivos)
- [ ] Shared Types (10 arquivos)
- [ ] Shared Utils (30 arquivos)
- [ ] Validation Schemas (5 arquivos)
- [ ] Outros (3 arquivos)
- [ ] Erros TypeScript corrigidos
- [ ] Commit realizado

### Fase 3: SSOT
- [ ] AdminProfileGovernanceService.ts (9 violações)
- [ ] AdminCommunityIssuesService.ts (8 violações)
- [ ] EDGE_FUNCTION_ATUALIZADA_MOTOBOY.ts (6 violações)
- [ ] AdminNotificationsService.ts (1 violação)
- [ ] Scripts na raiz (5 violações)
- [ ] Validação passou
- [ ] Commits realizados

---

## 🚨 TROUBLESHOOTING

### Problema: Script não executa
```powershell
# Verificar política de execução
Get-ExecutionPolicy

# Se necessário, permitir execução
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problema: Arquivos não movidos
```powershell
# Verificar se arquivos existem
ls *.sql
ls *.mjs

# Executar script com verbose
.\scripts\cleanup-project-root.ps1 -Verbose
```

### Problema: Muitos erros TypeScript após Fase 2
**Isso é esperado!** Os erros estavam escondidos pelo @ts-nocheck.

Estratégia:
1. Corrigir erros por arquivo
2. Começar pelos mais simples
3. Usar `// @ts-expect-error` temporariamente se necessário (com comentário)
4. Pedir ajuda se bloqueado

### Problema: Não sei como corrigir violação SSOT
1. Consultar `fix-ssot-violations.md`
2. Procurar exemplo similar
3. Verificar mapeamento tabela → serviço
4. Pedir code review

---

## 📚 REFERÊNCIAS

### Documentação Principal
- [INDICE_AUDITORIA.md](../INDICE_AUDITORIA.md) - Índice completo
- [RESUMO_VISUAL_PROBLEMAS.md](../RESUMO_VISUAL_PROBLEMAS.md) - Visão geral
- [RELATORIO_AUDITORIA_COMPLETA.md](../RELATORIO_AUDITORIA_COMPLETA.md) - Análise detalhada
- [PLANO_CORRECAO_EXECUTIVO.md](../PLANO_CORRECAO_EXECUTIVO.md) - Plano completo

### Documentação do Projeto
- [CURRENT_RULES.md](../docs/CURRENT_RULES.md) - Regras vigentes
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Arquitetura
- [DATA_MODELING.md](../docs/DATA_MODELING.md) - Modelagem

### Configurações
- [eslint.config.js](../eslint.config.js) - ESLint
- [eslint-plugin-ssot.cjs](../eslint-plugin-ssot.cjs) - Plugin SSOT

---

## 💡 DICAS

### Dica 1: Commits Incrementais
Não tente corrigir tudo de uma vez. Faça commits pequenos e frequentes:
```bash
git add arquivo1.ts
git commit -m "fix: corrigir violação SSOT em arquivo1"

git add arquivo2.ts
git commit -m "fix: corrigir violação SSOT em arquivo2"
```

### Dica 2: Validação Contínua
Valide após cada correção:
```bash
npm run lint
npm run typecheck
```

### Dica 3: Pedir Ajuda
Se ficar bloqueado:
1. Revisar documentação
2. Procurar exemplos similares
3. Criar issue
4. Pedir code review

### Dica 4: Documentar Decisões
Se tomar decisão não óbvia, documente:
```typescript
// DECISÃO: Usar @ts-expect-error aqui porque...
// TODO: Remover quando tipo correto estiver disponível
// @ts-expect-error - Tipo legado, será corrigido em #ISSUE
```

---

## ✅ CHECKLIST FINAL

Antes de considerar concluído:

- [ ] Fase 1 executada e commitada
- [ ] Fase 2 executada e commitada
- [ ] Fase 3 executada e commitada
- [ ] Fases 4, 5, 6 executadas e commitadas
- [ ] `npm run lint` passa (0 erros)
- [ ] `npm run typecheck` passa (0 erros)
- [ ] `npm run test` passa (todos os testes)
- [ ] `npm run audit:ssot-violations` passa
- [ ] Documentação atualizada
- [ ] PR criado e revisado
- [ ] Merge realizado
- [ ] Celebração! 🎉

---

**Última atualização**: 2026-04-10  
**Status**: ✅ SCRIPTS PRONTOS PARA USO

**🚀 Boa sorte com as correções!**
