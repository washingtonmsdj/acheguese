# 🚀 INSTRUÇÕES RÁPIDAS - VALIDAÇÃO DE PRODUTO FASE 1

## ✅ Status Atual

- ✅ **Validação técnica:** APROVADA
- ✅ **Migration aplicada:** Sucesso
- ✅ **Gates:** Lint, typecheck e build passando
- ✅ **Nomenclatura de intents:** PADRONIZADA (`business_search`, `service_search`, `unknown`)
- ⏳ **Validação de produto:** PENDENTE (aguardando testes com dados reais)

---

## 📋 O Que Fazer Agora

### 1. Aplicar Seed de Dados (5 minutos)

**Abra o Supabase Dashboard:**
1. Acesse https://supabase.com/dashboard
2. Selecione o projeto
3. Vá em **SQL Editor**
4. Copie TODO o conteúdo de `scripts/seed-ai-phase1-sql.sql`
5. Execute
6. Verifique que as queries de verificação retornaram dados

**Resultado esperado:**
```
✅ 3 empresas criadas
✅ 1 perfil gastronômico criado
✅ 2 profissionais criados
```

---

### 2. Testar as 6 Queries em `/buscar` (10 minutos)

**Acesse `/buscar` e teste:**

1. ✅ "pizzaria barata com delivery"
2. ✅ "restaurante aberto agora"
3. ✅ "eletricista perto de mim"
4. ✅ "encanador urgente"
5. ✅ "empresa no meu bairro"
6. ✅ "me conte uma piada"

**Para cada query, anote:**
- Intent gerada
- Quantidade de resultados
- URLs geradas
- Se abriu corretamente

---

### 3. Validar URLs Gastronômicas (3 minutos)

**Confirme que as URLs seguem as regras:**

- ✅ Premium → `/p/consultoria-premium-test`
- ✅ Gastronômica → `/gastronomia/ba/salvador/pituba/pizzaria-bella-test`
- ✅ Comum → `/empresas/ba/salvador/pituba/mercadinho-pituba-test`

---

### 4. Enviar Resultados

**Me envie:**
- Screenshot ou log textual dos resultados
- Quais queries funcionaram
- Quais URLs foram geradas
- Se encontrou algum problema

---

## 📊 Critério de Aprovação

**Aprovada para produto se:**
- ✅ Pelo menos 4/6 queries retornaram resultados
- ✅ URLs gastronômicas corretas
- ✅ URLs abrem corretamente
- ✅ Sem erros SQL

**Reprovada se:**
- ❌ Menos de 4/6 queries funcionaram
- ❌ URLs incorretas
- ❌ Erros SQL

---

## 📁 Arquivos Criados

1. **`scripts/seed-ai-phase1-sql.sql`** - SQL para aplicar no Dashboard
2. **`VALIDACAO_PRODUTO_FASE1.md`** - Guia completo de validação
3. **`INSTRUCOES_VALIDACAO_PRODUTO.md`** - Este arquivo (resumo)

---

## 🎯 Decisões Tomadas

### Nomenclatura de Intents: ✅ PADRONIZADA

| Intent | Uso |
|--------|-----|
| `business_search` | Busca de empresas |
| `service_search` | Busca de profissionais |
| `unknown` | Query não relacionada |

**Motivo:** `/buscar` não deve virar chat genérico. Intent `unknown` retorna mensagem amigável.

**Código já está correto:** Nenhuma alteração necessária.

---

## ⚡ Próximo Passo

**Aplicar o seed SQL no Supabase Dashboard e testar as 6 queries.**

Depois me envie os resultados para eu gerar o relatório final de aprovação/reprovação.
