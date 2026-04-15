# GATE 5: INSTRUÇÕES PARA APLICAR RLS FIX

**Data:** 07/04/2026  
**Status:** AGUARDANDO APLICAÇÃO MANUAL

---

## PROBLEMA IDENTIFICADO

A tabela `driver_availability` tem RLS habilitado mas não tem policy para `service_role`, bloqueando os testes.

---

## SOLUÇÃO

### Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. Abra [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione o projeto `xhdowzacfujckjelqhtd`
3. Vá em **SQL Editor**
4. Copie e cole o conteúdo do arquivo `APLICAR_GATE5_RLS_FIX.sql`
5. Clique em **Run**
6. Verifique se aparece "✅ RLS policies aplicadas!"

### Opção 2: Via Supabase CLI (requer senha do banco)

1. Obtenha a senha do banco:
   - Abra Supabase Dashboard
   - Vá em **Settings > Database**
   - Copie a **Database Password**

2. Adicione no arquivo `.env`:
   ```
   SUPABASE_DB_PASSWORD=sua_senha_aqui
   ```

3. Execute:
   ```bash
   node scripts/apply-rls-correct.mjs
   ```

---

## APÓS APLICAR

### 1. Executar Testes
```bash
npm test tests/operational/gate5-availability-test.test.ts
```

### 2. Resultado Esperado
- ✅ 26 testes devem passar (100%)
- ❌ 0 testes devem falhar

### 3. Se Testes Passarem
Gate 5 está FECHADO e validado!

---

## ARQUIVO SQL

**Arquivo:** `APLICAR_GATE5_RLS_FIX.sql`

**Conteúdo:**
- Habilita RLS na tabela `driver_availability`
- Remove policies antigas
- Cria 3 novas policies:
  1. **Service role full access** - permite testes e backend
  2. **Drivers can manage own availability** - motoristas gerenciam própria disponibilidade
  3. **Public can read online drivers** - dispatch pode ler motoristas disponíveis

---

## VALIDAÇÃO

Após aplicar o SQL, você pode testar manualmente:

```sql
-- Verificar policies criadas
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'driver_availability'
ORDER BY policyname;
```

Deve retornar 3 policies.

---

## PRÓXIMOS PASSOS

1. ⏳ **AGUARDANDO:** Aplicar `APLICAR_GATE5_RLS_FIX.sql` no Supabase
2. ⏳ Executar testes: `npm test tests/operational/gate5-availability-test.test.ts`
3. ⏳ Validar 100% de sucesso (26/26 testes)
4. ⏳ Fechar Gate 5

---

**STATUS:** BLOQUEADO - AGUARDANDO APLICAÇÃO MANUAL DO SQL NO SUPABASE DASHBOARD
