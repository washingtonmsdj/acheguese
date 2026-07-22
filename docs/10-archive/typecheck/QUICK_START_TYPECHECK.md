# ⚡ Typecheck - Guia Rápido

## 🚀 Comandos Principais

```bash
# ✅ Desenvolvimento (instantâneo)
npm run typecheck

# 🔍 Diagnóstico (5 segundos)
npm run typecheck:diagnose

# 🧹 Limpar cache
npm run typecheck:clean

# ⚠️ Verificação completa (10-30 minutos - apenas CI/CD)
npm run typecheck:ci
```

## 💡 FAQ

### Por que o typecheck é instantâneo agora?

Porque pulamos a verificação em desenvolvimento. Seu editor (VS Code) já faz isso em tempo real!

### Como sei se tenho erros de tipo?

1. **VS Code** mostra erros em tempo real (sublinhado vermelho)
2. **Build** falha se houver erros: `npm run build`
3. **CI/CD** executa verificação completa automaticamente

### Quando devo usar `typecheck:ci`?

Apenas se você realmente precisar de verificação completa local. Normalmente, deixe o CI/CD fazer isso.

### O typecheck:ci ainda demora muito?

Sim, 10-30 minutos. Mas você não precisa executá-lo localmente! Use apenas em CI/CD.

## 🎯 Workflow Recomendado

```bash
# 1. Desenvolvimento
npm run dev

# 2. Antes de commit (opcional)
npm run lint

# 3. Build local (opcional)
npm run build:dev

# 4. CI/CD faz automaticamente
# npm run typecheck:ci
# npm run build
```

## 🔧 Troubleshooting

### Editor lento?
```
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Muitos erros no editor?
```bash
npm run typecheck:diagnose  # Ver arquivos problemáticos
```

### Cache corrompido?
```bash
npm run typecheck:clean
```

## ✅ Resumo

- ⚡ **Desenvolvimento**: Instantâneo (SKIP mode)
- 🔍 **Editor**: Typecheck em tempo real
- 🏗️ **Build**: Detecta erros
- 🤖 **CI/CD**: Verificação completa

**Você está pronto! 🎉**
