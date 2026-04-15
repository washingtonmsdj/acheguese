# GATE 6: PASSO A PASSO PARA FECHAMENTO

---

## PASSO 1: Aplicar Migração no Banco Remoto

### Via Supabase CLI (recomendado)

```bash
supabase db push
```

### Via SQL Editor (alternativa)

1. Abrir https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new
2. Copiar conteúdo completo de `APLICAR_GATE6_TIMESTAMPS.sql`
3. Colar no editor
4. Clicar em "Run"
5. Verificar resultado da query de validação (deve mostrar 5 colunas)

---

## PASSO 2: Executar Testes do Bloco A

```bash
npm test tests/operational/gate6-runtime-with-drivers.test.ts
```

**Resultado esperado:**
```
✓ A.1. Fluxo completo: motorista disponível → auto-dispatch → aceitar → completar
✓ A.2. Cancelamento após aceite libera motorista

Test Files  1 passed (1)
Tests  2 passed (2)
```

---

## PASSO 3: Executar Testes do Bloco B

```bash
npm test tests/operational/gate6-runtime-no-drivers.test.ts
```

**Resultado esperado:**
```
✓ B.1. Corrida sem motoristas disponíveis → auto-dispatch expira
✓ B.2. Múltiplas corridas sem motoristas → todas expiram

Test Files  1 passed (1)
Tests  2 passed (2)
```

---

## PASSO 4: Validar Fechamento

Se todos os 4 testes passarem:

✅ **GATE 6 FECHADO**

Fluxo E2E do passageiro com dispatch automático está 100% validado:
- Criação de corrida
- Auto-dispatch via edge function
- Atribuição de motorista
- Aceite
- Estados intermediários
- Completar corrida
- Cancelamento com liberação
- Expiração sem motoristas

---

## SE ALGO FALHAR

1. Verificar logs do teste (stdout/stderr)
2. Verificar se migração foi aplicada:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'ride_requests' 
     AND column_name = 'started_at';
   ```
3. Verificar se edge function está ativa no Supabase Dashboard
4. Consultar `GATE_6_DIAGNOSTICO_TIMESTAMPS.md` para detalhes

---

## ARQUIVOS DE REFERÊNCIA

- `APLICAR_GATE6_TIMESTAMPS.sql` - Script para aplicar no banco
- `GATE_6_DIAGNOSTICO_TIMESTAMPS.md` - Diagnóstico completo
- `GATE_6_RELATORIO_FINAL_CORRECOES.md` - Relatório detalhado
- `GATE_6_ACAO_IMEDIATA.md` - Resumo executivo
