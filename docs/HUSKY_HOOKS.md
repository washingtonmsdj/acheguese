# 🪝 Husky Git Hooks

**Data**: 2026-03-23  
**Status**: ✅ Configurado

---

## 📋 Visão Geral

Hooks do Git configurados com Husky para garantir qualidade de código automaticamente.

---

## 🎯 Hooks Configurados

### 1. pre-commit (Antes de Commitar)

Executado automaticamente antes de cada commit.

**Verificações**:
- 🔒 Validação de credenciais hardcoded
- 🎨 Lint e formatação automática
- 🔐 Validação de session context
- 📦 Validação de SSOT compliance
- 🔷 Verificação de tipos TypeScript

**Comandos executados**:
```bash
npm run security:validate
npm run lint:fix
npm run format
npm run lint
npm run validate:session-context
npm run validate:ssot
npm run typecheck
```

**Tempo estimado**: 10-30 segundos

---

### 2. commit-msg (Validação de Mensagem)

Executado após escrever a mensagem de commit.

**Validação**: Conventional Commits

**Formato obrigatório**:
```
tipo(escopo): descrição
```

**Tipos válidos**:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação, ponto e vírgula, etc
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Tarefas de manutenção
- `perf`: Melhoria de performance
- `ci`: Integração contínua
- `build`: Sistema de build
- `revert`: Reverter commit anterior

**Exemplos válidos**:
```bash
feat(auth): adicionar login com Google
fix(profile): corrigir upload de avatar
docs: atualizar README
refactor(services): simplificar AuthService
test(hooks): adicionar testes para useAuth
chore: atualizar dependências
```

**Exemplos inválidos**:
```bash
❌ Adicionar login
❌ fix bug
❌ Update README.md
❌ WIP
```

---

### 3. pre-push (Antes de Push)

Executado automaticamente antes de fazer push para o repositório remoto.

**Verificações**:
- 🔷 Verificação de tipos TypeScript
- 🎨 Verificação de lint
- 📦 Validação de dependências
- 📦 Validação de SSOT compliance

**Comandos executados**:
```bash
npm run typecheck
npm run lint
npm run validate:deps
npm run validate:ssot
```

**Tempo estimado**: 20-60 segundos

---

## 🚀 Como Usar

### Commit Normal
```bash
git add .
git commit -m "feat(auth): adicionar login com Google"
# ✅ Hooks executam automaticamente
```

### Push Normal
```bash
git push origin main
# ✅ Hook pre-push executa automaticamente
```

### Pular Hooks (Não Recomendado)
```bash
# Pular pre-commit
git commit -m "feat: nova feature" --no-verify

# Pular pre-push
git push origin main --no-verify
```

⚠️ **Atenção**: Pular hooks pode introduzir código com problemas no repositório.

---

## 🔧 Troubleshooting

### Hook falha com erro de lint
```bash
# Corrigir automaticamente
npm run lint:fix

# Verificar erros restantes
npm run lint
```

### Hook falha com erro de TypeScript
```bash
# Verificar erros
npm run typecheck

# Corrigir erros manualmente
```

### Hook falha com erro de SSOT
```bash
# Ver violações
npm run validate:ssot

# Corrigir imports diretos de supabase
# Use Services ao invés de importar supabase diretamente
```

### Mensagem de commit inválida
```bash
# Formato correto
git commit -m "tipo(escopo): descrição"

# Exemplos
git commit -m "feat(auth): adicionar login"
git commit -m "fix(profile): corrigir bug"
git commit -m "docs: atualizar README"
```

---

## 📊 Benefícios

### 1. Qualidade Automática
- Código sempre formatado
- Sem erros de TypeScript
- SSOT compliance garantido
- Commits padronizados

### 2. Prevenção de Problemas
- Detecta erros antes do commit
- Previne código quebrado no repositório
- Garante padrões de código

### 3. Produtividade
- Formatação automática
- Menos revisões de código
- Onboarding simplificado
- CI/CD mais rápido

### 4. Histórico Limpo
- Commits padronizados
- Fácil gerar changelog
- Melhor rastreabilidade
- Semantic versioning facilitado

---

## 🎓 Conventional Commits

### Por que usar?

1. **Changelog automático**: Gerar changelog baseado nos commits
2. **Semantic versioning**: Determinar versão automaticamente
3. **Histórico legível**: Commits claros e padronizados
4. **Melhor colaboração**: Todos seguem o mesmo padrão

### Estrutura completa

```
tipo(escopo): descrição curta

[corpo opcional]

[rodapé opcional]
```

### Exemplos completos

```bash
# Simples
feat(auth): adicionar login com Google

# Com corpo
fix(profile): corrigir upload de avatar

O upload falhava quando a imagem era maior que 5MB.
Agora comprime a imagem antes do upload.

# Com breaking change
feat(api)!: mudar formato de resposta da API

BREAKING CHANGE: A resposta agora retorna { data, meta }
ao invés de apenas os dados.
```

---

## 📁 Estrutura de Arquivos

```
.husky/
├── pre-commit       # Verificações antes de commit
├── commit-msg       # Validação de mensagem
└── pre-push         # Verificações antes de push
```

---

## 🔄 Atualização

### Adicionar novo hook
```bash
# Criar arquivo
echo '#!/usr/bin/env sh' > .husky/nome-do-hook
echo '. "$(dirname -- "$0")/_/husky.sh"' >> .husky/nome-do-hook
echo 'npm run seu-comando' >> .husky/nome-do-hook

# Tornar executável (Linux/Mac)
chmod +x .husky/nome-do-hook
```

### Modificar hook existente
```bash
# Editar arquivo diretamente
code .husky/pre-commit
```

---

## ✅ Verificação

### Testar hooks manualmente
```bash
# Testar pre-commit
.husky/pre-commit

# Testar commit-msg
echo "feat: teste" | .husky/commit-msg

# Testar pre-push
.husky/pre-push
```

### Verificar instalação
```bash
# Verificar se Husky está instalado
npm list husky

# Verificar se hooks existem
ls -la .husky/
```

---

## 🎯 Conclusão

Hooks configurados profissionalmente para:
- ✅ Garantir qualidade de código
- ✅ Prevenir problemas antes do commit
- ✅ Padronizar mensagens de commit
- ✅ Melhorar produtividade da equipe

**Status**: 100% Funcional 🚀

