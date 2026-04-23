# 🚀 EXECUTAR SEED - Escolha Seu Caminho

---

## 🎯 3 Formas de Executar

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1️⃣  SUPABASE DASHBOARD (Mais Fácil) ⭐ RECOMENDADO       │
│     ↓                                                       │
│     https://supabase.com/dashboard                          │
│     → SQL Editor → Cole o seed → Run                        │
│     ✅ 2 minutos                                            │
│     ✅ Não precisa de Docker                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  2️⃣  SCRIPT AUTOMATIZADO (Rápido)                          │
│     ↓                                                       │
│     Windows: .\executar_seed.ps1                            │
│     Linux/Mac: bash executar_seed.sh                        │
│     ✅ 2 minutos                                            │
│     ⚠️  Precisa de Supabase CLI                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  3️⃣  SUPABASE CLI MANUAL (Avançado)                        │
│     ↓                                                       │
│     supabase db execute --file seed.sql                     │
│     ✅ Controle total                                       │
│     ⚠️  Precisa de Docker + CLI                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Opção 1: Dashboard (RECOMENDADO)

### 📋 Passo a Passo

```
1. Abrir → https://supabase.com/dashboard
2. Selecionar → Seu projeto
3. Ir para → SQL Editor (menu lateral)
4. Clicar → "New Query"
5. Abrir → supabase/seed_gastronomy_mock.sql
6. Copiar → TODO o conteúdo (Ctrl+A, Ctrl+C)
7. Colar → No editor (Ctrl+V)
8. Executar → "Run" (ou Ctrl+Enter)
9. Aguardar → ~30 segundos
10. Validar → Query de validação (veja abaixo)
```

### ✅ Query de Validação

```sql
SELECT 
  business_name,
  rating,
  (SELECT COUNT(*) FROM menus WHERE business_id = bd.id) as menus
FROM business_data bd
WHERE bd.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
ORDER BY business_name;
```

**Resultado esperado: 5 restaurantes com menus = 1**

---

## 🤖 Opção 2: Script Automatizado

### Windows
```powershell
.\executar_seed.ps1
```

### Linux/Mac
```bash
bash executar_seed.sh
```

### O que o script faz:
- ✅ Verifica se CLI está instalado
- ✅ Verifica se você está logado
- ✅ Pergunta se quer limpar dados antigos
- ✅ Executa o seed
- ✅ Valida automaticamente
- ✅ Mostra próximos passos

---

## 🔧 Opção 3: CLI Manual

### Pré-requisitos
```bash
# Verificar se CLI está instalado
supabase --version

# Se não estiver, instalar:
npm install -g supabase
```

### Executar

#### Cloud (Produção/Staging)
```bash
# Login (se necessário)
supabase login

# Executar seed
supabase db execute --file supabase/seed_gastronomy_mock.sql

# Validar
supabase db execute --sql "SELECT business_name FROM business_data WHERE id = '22222222-2222-2222-2222-222222222222';"
```

#### Local (Desenvolvimento)
```bash
# Iniciar Supabase local (precisa de Docker)
supabase start

# Executar seed
supabase db execute --file supabase/seed_gastronomy_mock.sql --local

# Validar
supabase db execute --local --sql "SELECT business_name FROM business_data WHERE id = '22222222-2222-2222-2222-222222222222';"
```

---

## 🎯 Após Executar

### 1. Testar no Frontend
```
http://localhost:5173/gastronomia/pizzaria-bella-napoli
```

### 2. Você Deve Ver:
- ✅ Nome: "Pizzaria Bella Napoli"
- ✅ Rating: 4.9 ⭐ (243 avaliações)
- ✅ Cardápio com 3 categorias
- ✅ 4 pizzas com preços
- ✅ Promoção "Happy Hour - 20% OFF"
- ✅ Fotos do restaurante

### 3. Testar Outros:
```
/gastronomia/acaraje-da-dinha
/gastronomia/sushi-house-salvador
/gastronomia/burger-station
/gastronomia/cantina-da-nonna
```

---

## 🐛 Problemas Comuns

### ❌ "Supabase CLI não encontrado"
```bash
npm install -g supabase
```

### ❌ "column does not exist"
**Causa**: Migrations não executadas  
**Solução**:
```bash
supabase db reset  # Local
# ou execute migrations no Dashboard
```

### ❌ "duplicate key value"
**Causa**: Dados já existem  
**Solução**:
```bash
supabase db execute --file LIMPAR_DADOS_MOCK.sql
```

### ❌ Docker não está rodando
**Solução**:
1. Abra Docker Desktop
2. Aguarde inicializar
3. Tente novamente

---

## 📚 Documentação Completa

| Arquivo | Descrição |
|---------|-----------|
| **COMO_EXECUTAR_SEED.md** | Guia completo e detalhado |
| **EXECUTAR_AGORA.md** | Guia rápido com 3 opções |
| **README_SEED_GASTRONOMY.md** | Documentação técnica completa |
| **SEED_CORRIGIDO_FINAL.md** | Análise das correções |
| **ANTES_DEPOIS_SEED.md** | Comparação visual |

---

## ✅ Checklist

- [ ] Escolhi minha opção (Dashboard, Script ou CLI)
- [ ] Executei o seed
- [ ] Query de validação retorna 5 restaurantes
- [ ] Frontend mostra "Pizzaria Bella Napoli"
- [ ] Cardápio aparece com itens
- [ ] Testei outros restaurantes

---

## 🎉 Sucesso!

Se tudo funcionou, você tem:
- ✅ 5 restaurantes mock
- ✅ 5 menus completos
- ✅ 30+ itens de cardápio
- ✅ Variações e adicionais
- ✅ Fotos e promoções
- ✅ Frontend funcionando

**Parabéns! Seu módulo de gastronomia está pronto!** 🚀

---

## 🆘 Precisa de Ajuda?

1. Veja: `COMO_EXECUTAR_SEED.md` (guia detalhado)
2. Consulte: `README_SEED_GASTRONOMY.md` (documentação completa)
3. Troubleshooting: `EXECUTAR_SEED_AGORA.md` (seção de problemas)

---

**Última atualização**: 2026-04-23  
**Status**: ✅ Pronto para uso
