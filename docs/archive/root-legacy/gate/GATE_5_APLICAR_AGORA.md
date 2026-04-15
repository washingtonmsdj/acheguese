# GATE 5: APLICAR AGORA (SEM MIGRATION)

**Data:** 08/04/2026  
**Ação:** Criar corridas de teste no banco remoto

---

## DIAGNÓSTICO COMPLETO

✅ Schema oficial está CORRETO  
✅ Fixtures de teste estão CORRETOS  
❌ PostgREST com cache desatualizado  
❌ Corridas não foram criadas  

**Solução:** Executar SQL direto (bypass PostgREST)

---

## PASSO 1: EXECUTAR SQL NO SUPABASE

1. Abra Supabase Dashboard (remoto)
2. Vá em SQL Editor
3. Cole e execute o conteúdo de `scripts/create-test-rides.sql`
4. Verifique que retornou 2 linhas

---

## PASSO 2: RECARREGAR SCHEMA CACHE (OPCIONAL)

1. Vá em Settings → API
2. Clique em "Reload schema cache"
3. Aguarde 1-2 minutos

---

## PASSO 3: EXECUTAR TESTES

```bash
npm test tests/operational/gate5-availability-test.test.ts
```

**Expectativa:** 23-26/26 testes passando (88-100%)

---

## TROUBLESHOOTING

### Erro: "column does not exist"
- Execute SQL direto no SQL Editor (não via API)
- Recarregue schema cache

### Erro: "foreign key constraint violation"
- Verifique que as corridas foram criadas:
  ```bash
  node scripts/verify-test-rides.mjs
  ```

---

## ARQUIVOS RELEVANTES

- ✅ `scripts/create-test-rides.sql` - SQL correto para executar
- ✅ `DIAGNOSTICO_RIDE_REQUESTS.sql` - Verificar schema (opcional)
- ✅ `GATE_5_RELATORIO_SSOT_SCHEMA.md` - Análise completa
- ❌ `supabase/migrations/20260408000001_*` - DELETADA (desnecessária)

---

## RESUMO

1. Execute `scripts/create-test-rides.sql` no SQL Editor
2. Execute testes
3. Gate 5 destrava

**Tempo estimado:** 5 minutos

