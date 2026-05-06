# 🚀 INSTRUÇÕES ATUALIZADAS - VALIDAÇÃO DE PRODUTO

**Data:** 2026-05-03  
**Status:** ✅ Seed corrigido e pronto

---

## ⚠️ ATUALIZAÇÃO IMPORTANTE

O seed foi **corrigido** para incluir `profile_id` nas empresas (coluna NOT NULL).

**Correção aplicada:** Ver `CORRECAO_SEED_PROFILE_ID.md`

---

## 📋 O Que Fazer Agora

### 1. Aplicar Seed CORRIGIDO (5 minutos)

1. Abra https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Copie TODO o conteúdo **ATUALIZADO** de `scripts/seed-ai-phase1-sql.sql`
4. Execute
5. Verifique que as queries de verificação retornaram:
   - ✅ 3 empresas
   - ✅ 1 perfil gastronômico
   - ✅ 2 profissionais

**Resultado esperado:**
```
✅ 3 profiles de donos criados
✅ 3 empresas criadas (com profile_id)
✅ 1 perfil gastronômico criado
✅ 2 profiles de profissionais criados
✅ 2 profissionais criados
```

---

### 2. Testar 6 Queries em `/buscar` (10 minutos)

1. ✅ "pizzaria barata com delivery"
2. ✅ "restaurante aberto agora"
3. ✅ "eletricista perto de mim"
4. ✅ "encanador urgente"
5. ✅ "empresa no meu bairro"
6. ✅ "me conte uma piada"

**Para cada query, anote:**
- Intent gerada
- Quantidade de resultados
- Títulos retornados
- URLs geradas
- Se abriu corretamente

---

### 3. Validar URLs Gastronômicas (3 minutos)

Confirme que as URLs seguem as regras:

| Empresa | URL Esperada |
|---------|--------------|
| Consultoria Premium | `/p/consultoria-premium-test` |
| Pizzaria Bella Napoli | `/gastronomia/ba/salvador/pituba/pizzaria-bella-test` |
| Mercadinho da Pituba | `/empresas/ba/salvador/pituba/mercadinho-pituba-test` |

---

### 4. Enviar Resultados

Me envie:
- Screenshot ou log textual dos resultados
- Quais queries funcionaram
- Quais URLs foram geradas
- Problemas encontrados (se houver)

---

## 📊 Critério de Aprovação

**✅ Aprovada para produto se:**
- Pelo menos 4/6 queries retornaram resultados
- URLs gastronômicas corretas
- URLs abrem corretamente
- Sem erros SQL

**❌ Reprovada se:**
- Menos de 4/6 queries funcionaram
- URLs incorretas
- Erros SQL

---

## 📁 Arquivos Atualizados

1. **`scripts/seed-ai-phase1-sql.sql`** ✅ CORRIGIDO
   - Agora cria profiles para donos de empresas
   - Empresas têm profile_id válido

2. **`CORRECAO_SEED_PROFILE_ID.md`** ✅ NOVO
   - Explica a correção aplicada

3. **`INSTRUCOES_ATUALIZADAS.md`** ✅ NOVO (este arquivo)
   - Instruções atualizadas

---

## 🎯 Próximo Passo

**Aplicar o seed SQL CORRIGIDO no Supabase Dashboard**

Depois testar as 6 queries e me enviar os resultados.

---

**Última atualização:** 2026-05-03 (após correção de profile_id)
