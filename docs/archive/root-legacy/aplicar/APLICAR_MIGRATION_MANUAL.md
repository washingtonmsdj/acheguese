# APLICAR MIGRATION MANUALMENTE - RPC SEGURO

**Motivo**: CLI do Supabase não consegue conectar ao pooler com as credenciais atuais.

**Solução**: Aplicar via Supabase Dashboard (SQL Editor) - 2 minutos.

---

## MÉTODO 1: SQL EDITOR (RECOMENDADO)

### Passo a Passo

1. **Abrir Dashboard**
   - URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd
   - Login com suas credenciais

2. **Ir para SQL Editor**
   - Menu lateral esquerdo
   - Clicar em "SQL Editor"

3. **Nova Query**
   - Clicar "+ New Query"

4. **Copiar SQL**
   - Abrir: `supabase/migrations/20260328000002_rpc_invite_member_secure.sql`
   - Selecionar tudo (Ctrl+A)
   - Copiar (Ctrl+C)

5. **Colar e Executar**
   - Colar no editor (Ctrl+V)
   - Clicar "Run" (ou Ctrl+Enter)

6. **Verificar Sucesso**
   - Output deve mostrar: "Success. No rows returned"
   - Ou: "CREATE FUNCTION"

7. **Testar RPC**
   - Nova query:
   ```sql
   SELECT invite_profile_member_by_email(
     '00000000-0000-0000-0000-000000000000',
     'teste@exemplo.com',
     'member'
   );
   ```
   - Executar
   - Esperado: `{"success": false, "error": "Não autenticado"}` ou similar
   - **Isso é BOM**: significa que RPC está validando corretamente

---

## MÉTODO 2: SUPABASE CLI (SE TIVER ACESSO)

Se você tiver o Supabase CLI configurado com link ao projeto:

```bash
npx supabase db push --linked
```

Ou:

```bash
npx supabase migration up --linked
```

---

## VALIDAÇÃO

Após aplicar, execute no SQL Editor:

```sql
-- Teste 1: Verificar se função existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'invite_profile_member_by_email';

-- Teste 2: Testar chamada (deve retornar erro de autenticação)
SELECT invite_profile_member_by_email(
  '00000000-0000-0000-0000-000000000000',
  'teste@exemplo.com',
  'member'
);
```

**Resultado Esperado**:
- Teste 1: 1 row (função existe)
- Teste 2: `{"success": false, "error": "..."}` (validação funcionando)

---

## APÓS APLICAR

✅ Migration aplicada

**Próxima Ação**: Testar 7 fluxos manualmente usando `CHECKLIST_TESTE_MANUAL_UI.md`

---

**Tempo Total**: 2 minutos via SQL Editor
