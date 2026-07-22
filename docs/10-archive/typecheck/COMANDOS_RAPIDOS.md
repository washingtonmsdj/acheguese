# ⚡ Comandos Rápidos - Referência

## 🚀 Desenvolvimento

```bash
npm run dev                    # Servidor de desenvolvimento
```

## ✅ Verificação

```bash
npm run typecheck              # Instantâneo (< 1s)
npm run lint                   # ESLint (~30s)
```

## 🏗️ Build

```bash
npm run build:fast             # Rápido (~30s)
npm run build:dev              # Desenvolvimento (~2min)
npm run build                  # Produção (~3-5min)
```

## 🔍 Diagnóstico

```bash
npm run typecheck:diagnose     # Diagnóstico de typecheck
npm run build:analyze          # Análise de bundle
```

## 🧹 Limpeza

```bash
npm run typecheck:clean        # Limpar cache TS
rm -rf dist                    # Limpar build
rm -rf node_modules            # Limpar dependências
```

## 🤖 CI/CD

```bash
npm run typecheck:ci           # Typecheck completo (10-30min)
npm run lint                   # Verificação de código
npm run build                  # Build de produção
```

## 📊 Tempos Esperados

| Comando | Tempo |
|---------|-------|
| `dev` | ~5s |
| `typecheck` | < 1s |
| `lint` | ~30s |
| `build:fast` | ~30s |
| `build:dev` | ~2min |
| `build` | ~3-5min |
| `typecheck:ci` | 10-30min |

## 💡 Dicas

- Use `typecheck` (instantâneo) em vez de `typecheck:ci` (lento)
- Use `build:fast` para testes rápidos
- Deixe o CI/CD fazer `typecheck:ci`
- Confie no seu editor para erros de tipo

## 🆘 Problemas?

```bash
# Editor lento
Cmd/Ctrl + Shift + P → "Restart TS Server"

# Cache corrompido
npm run typecheck:clean

# Build quebrado
rm -rf dist node_modules
npm install
```

## 📚 Mais Informações

- `PERFORMANCE_GUIDE.md` - Guia completo
- `TYPECHECK_README.md` - Guia de typecheck
- `QUICK_START_TYPECHECK.md` - Início rápido
