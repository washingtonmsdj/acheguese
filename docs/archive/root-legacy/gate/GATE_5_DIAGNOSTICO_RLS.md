# GATE 5: DIAGNÓSTICO - PROBLEMA RLS IDENTIFICADO

**Data:** 07/04/2026  
**Status:** BLOQUEADO POR RLS

---

## PROBLEMA IDENTIFICADO

### Causa Raiz
A tabela `driver_availability` tem RLS (Row Level Security) habilitado, mas NÃO tem policy para o `service_role`.

### Evidência
1. ✅ Migration do Gate 5 aplicada (campos existem)
2. ✅ Upsert funciona com `service_role` direto
3. ❌ Upsert falha nos testes (client Supabase usa RLS)
4. ❌ Nenhuma policy definida para `service_role`

### Por que falha
- Testes usam client Supabase normal
- Client respeita RLS policies
- Sem policy para `service_role`, operações são bloqueadas
- Erro retornado: `[object Object]` (não mostra detalhes)

---

## SOLUÇÃO

### Migration Criada
`supabase/migrations/20260407000008_gate5_fix_rls.sql`

### Policies Necessárias
1. **Service role full access** - permite testes e backend
2. **Drivers can manage own availability** - motoristas gerenciam própria disponibilidade
3. **Public can read online drivers** - dispatch pode ler motoristas disponíveis

### Aplicar Agora
**Arquivo:** `APLICAR_GATE5_RLS_FIX.sql`

**Instruções:**
1. Abrir Supabase Dashboard
2. Ir em SQL Editor
3. Copiar e colar conteúdo de `APLICAR_GATE5_RLS_FIX.sql`
4. Executar
5. Verificar resultado (deve mostrar 3 policies criadas)

---

## APÓS APLICAR

### Executar Testes
```bash
npm test tests/operational/gate5-availability-test.test.ts
```

### Resultado Esperado
- Todos os testes de transição de estado devem passar
- Todos os testes de integração devem passar
- Taxa de sucesso: ~100% (26/26 testes)

---

## TIMELINE

### Antes (27% sucesso)
- 7 testes passaram (validações negativas)
- 19 testes falharam (operações principais)
- Causa: RLS bloqueando upserts

### Depois (esperado: 100% sucesso)
- 26 testes devem passar
- 0 testes devem falhar
- Gate 5 pode ser fechado

---

## PRÓXIMOS PASSOS

1. ✅ Diagnóstico completo
2. ✅ Solução identificada
3. ✅ Migration criada
4. ⏳ **AGUARDANDO:** Aplicar `APLICAR_GATE5_RLS_FIX.sql` no Supabase
5. ⏳ Executar testes novamente
6. ⏳ Validar cenários obrigatórios
7. ⏳ Fechar Gate 5

---

**STATUS:** BLOQUEADO - AGUARDANDO APLICAÇÃO DE RLS FIX NO SUPABASE
