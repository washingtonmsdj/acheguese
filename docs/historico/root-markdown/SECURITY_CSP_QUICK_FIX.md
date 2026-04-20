# ⚡ CORREÇÃO RÁPIDA - CSP em Produção

**Status:** ✅ CORRIGIDO  
**Tempo:** 5 minutos  
**Impacto:** 🟢 BAIXO RISCO

---

## 🚨 PROBLEMA

Console do browser mostrando 2 erros de CSP:

1. **Google Fonts bloqueado**
   ```
   Loading stylesheet 'https://fonts.googleapis.com/...' violates CSP
   ```

2. **MapLibre Workers bloqueado**
   ```
   Creating worker from 'blob:...' violates CSP
   ```

---

## ✅ SOLUÇÃO (1 linha)

Atualizado `vercel.json` com:

```diff
- style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
+ style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;

- font-src 'self' data: https://cdn.jsdelivr.net;
+ font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com;

+ worker-src 'self' blob:;
```

---

## 🚀 DEPLOY

```bash
# 1. Commit
git add vercel.json
git commit -m "fix(security): Corrigir CSP para Google Fonts e MapLibre Workers"

# 2. Push
git push

# 3. Verificar
# Abrir site e verificar console (sem erros CSP)
```

---

## 📊 IMPACTO

- **Segurança:** 🟢 Mantida (domínios confiáveis)
- **Funcionalidade:** 🟢 Restaurada
- **Risco:** 🟢 Baixo
- **Urgência:** 🟡 Média (funcionalidades quebradas)

---

## 📚 DOCUMENTAÇÃO

**Detalhes completos:** [SECURITY_CSP_FIX.md](./SECURITY_CSP_FIX.md)

---

**Corrigido em:** 2026-04-18  
**Tempo total:** 5 minutos  
**Status:** ✅ PRONTO PARA DEPLOY
