# 🚀 INSTRUÇÕES: APLICAR MIGRATION E VALIDAR FASE 1

**Data:** 2026-05-03  
**Status Atual:** Migration criada mas não aplicada

---

## 📋 PASSO 1: Aplicar Migration no Supabase Dashboard

1. Acesse: **Supabase Dashboard → SQL Editor**

2. Copie TODO o conteúdo do arquivo:
   ```
   supabase/migrations/20260503010000_create_public_search_views.sql
   ```

3. Cole no SQL Editor e clique em **Run**

4. Aguarde a confirmação de sucesso

**O que a migration faz:**
- ✅ Cria view `public_business_search` (apenas campos públicos)
- ✅ Cria view `public_professional_search` (apenas campos públicos)
- ✅ Configura grants mínimos (SELECT para anon/authenticated)
- ✅ Recarrega schema cache automaticamente
- ✅ Executa queries de verificação

---

## 📋 PASSO 2: Validar Programaticamente

Após aplicar a migration, execute:

```bash
node scripts/test-queries-final.mjs
```

**Resultado esperado:**
```
✅ 3 empresas encontradas
✅ 2 profissionais encontrados
✅ Queries bem-sucedidas: 5-6/6
✅ APROVADA: Pelo menos 4/6 queries funcionaram
```

**Se der erro:**
- Verifique se a migration foi aplicada com sucesso
- Verifique se o schema cache foi recarregado
- Execute manualmente no SQL Editor: `NOTIFY pgrst, 'reload schema';`

---

## 📋 PASSO 3: Testar Manualmente em `/buscar`

1. Acesse `/buscar` no navegador

2. Teste as 6 queries obrigatórias:
   - "pizzaria barata com delivery"
   - "restaurante aberto agora"
   - "eletricista perto de mim"
   - "encanador urgente"
   - "empresa no meu bairro"
   - "me conte uma piada"

3. Para cada query, registre:
   - Intent gerada (business_search, service_search, unknown)
   - Quantidade de resultados
   - Títulos dos resultados
   - URLs geradas
   - Se as URLs abrem corretamente

---

## 📋 PASSO 4: Validar URLs

Confirme que as URLs seguem as regras:

| Tipo | URL Esperada |
|------|--------------|
| Empresa Premium | `/p/:slug` |
| Empresa Gastronômica | `/gastronomia/ba/salvador/pituba/:slug` |
| Empresa Comum | `/empresas/ba/salvador/pituba/:slug` |
| Profissional | `/profissionais/:slug` |

---

## 📋 PASSO 5: Gates Finais

Execute os gates de qualidade:

```bash
npm run lint -- --max-warnings=0
npm run typecheck
npm run build
```

Todos devem passar sem erros.

---

## ⚠️ NOTA IMPORTANTE: Código Atual vs Views

**Situação atual:**
- ✅ Views públicas criadas (após aplicar migration)
- ⚠️ Código da aplicação ainda usa `business_data` e `professional_data` diretamente

**Isso é OK?**
- ✅ **SIM** - Para a validação da Fase 1, o código pode continuar usando as tabelas diretas
- ✅ As views são usadas apenas pelo script de teste
- ✅ O importante é que as tabelas `business_data` e `professional_data` estejam acessíveis via API

**Por que as views foram criadas?**
- 🔒 Demonstrar que é possível expor dados de forma segura
- 🔒 Preparar para futuras melhorias de segurança
- 🔒 Documentar quais campos são seguros para exposição pública

**Próximos passos (Fase 2 - NÃO FAZER AGORA):**
- Atualizar BusinessService para usar `public_business_search`
- Atualizar ProfessionalService para usar `public_professional_search`
- Remover acesso direto às tabelas brutas

---

## 📊 CRITÉRIO DE APROVAÇÃO

**APROVADA COMO PRODUTO se:**
- ✅ Migration aplicada com sucesso
- ✅ Validação programática passa (4/6 queries)
- ✅ Teste manual em `/buscar` funciona
- ✅ URLs corretas e funcionais
- ✅ Gates passando (lint, typecheck, build)
- ✅ Nenhum erro crítico

---

## 🆘 TROUBLESHOOTING

### Erro: "Could not find the table 'public_business_search'"
**Solução:** Migration não foi aplicada. Volte ao Passo 1.

### Erro: "Could not find the table 'public.business_data'"
**Solução:** 
1. Verifique se a tabela existe: Execute o SQL em `DIAGNOSTICO_COMPLETO.sql`
2. Verifique RLS policies
3. Recarregue schema cache: `NOTIFY pgrst, 'reload schema';`

### Queries retornam 0 resultados
**Solução:**
1. Verifique se o seed foi aplicado corretamente
2. Confirme location_id da Pituba: `384add59-4e53-489d-a7b5-97dea2b3f442`
3. Verifique se os registros têm `status = 'active'`

### URLs não abrem
**Solução:**
1. Verifique se os slugs estão corretos
2. Verifique se as rotas existem no frontend
3. Verifique se `geographic_path` está preenchido

---

**Próximo passo:** Aplicar migration no Supabase Dashboard (Passo 1)
