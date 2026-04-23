# 🚀 COMECE AQUI - Executar Seed Gastronomy

---

## ⚠️ IMPORTANTE

Sua versão do Supabase CLI (v2.39.2) está desatualizada e não suporta o comando necessário.

**Use o Supabase Dashboard (mais fácil e confiável)**

---

## 📋 PASSO A PASSO (2 minutos)

### 1. Abrir Dashboard
```
https://supabase.com/dashboard
```

### 2. Ir para SQL Editor
- Menu lateral → **SQL Editor**

### 3. Nova Query
- Clique em **"New Query"**

### 4. Copiar e Colar
1. Abra: `supabase/seed_gastronomy_mock.sql`
2. Copie TODO (Ctrl+A, Ctrl+C)
3. Cole no editor (Ctrl+V)

### 5. Executar
- Clique em **"Run"** (ou Ctrl+Enter)
- Aguarde ~30 segundos

### 6. Validar
Cole e execute:
```sql
SELECT business_name, rating 
FROM business_data 
WHERE id = '22222222-2222-2222-2222-222222222222';
```

**Deve retornar**: `Pizzaria Bella Napoli | 4.90`

### 7. Testar
```
http://localhost:5173/gastronomia/pizzaria-bella-napoli
```

---

## ✅ SUCESSO!

Se o cardápio aparecer, você tem:
- ✅ 5 restaurantes mock
- ✅ 5 menus completos
- ✅ 30+ itens de cardápio
- ✅ Frontend funcionando

---

## 📚 DOCUMENTAÇÃO COMPLETA

- **EXECUTAR_NO_DASHBOARD.md** - Guia detalhado com screenshots
- **README_SEED_GASTRONOMY.md** - Documentação técnica
- **SEED_CORRIGIDO_FINAL.md** - Análise das correções

---

## 🆘 PROBLEMAS?

Consulte: **EXECUTAR_NO_DASHBOARD.md** (seção Troubleshooting)

---

**Tempo**: 2 minutos  
**Dificuldade**: ⭐ Fácil  
**Status**: ✅ Pronto para usar
