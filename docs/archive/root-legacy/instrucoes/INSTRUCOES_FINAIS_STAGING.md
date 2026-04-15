# INSTRUÇÕES FINAIS - STAGING

## PROBLEMA

As 4 tabelas safety não existem no banco de dados.

## SOLUÇÃO

Criar as tabelas via SQL Editor do Supabase.

---

## PASSO A PASSO

### 1. Abrir SQL Editor

1. Acessar [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecionar projeto
3. Menu lateral → **SQL Editor**
4. Clicar em **New Query**

### 2. Executar SQL

Abrir arquivo: **`CRIAR_TABELAS_E_POLICIES_SAFETY.sql`**

Copiar TODO o conteúdo e colar no SQL Editor.

Clicar em **Run** (ou Ctrl+Enter).

Aguardar execução (pode levar 10-20 segundos).

### 3. Validar

Executar no terminal:

```bash
node verificar_rls_completo.mjs
```

Resultado esperado:
```
✅ OK: 11/11
🎉 TODAS AS TABELAS CRÍTICAS ESTÃO ACESSÍVEIS!
```

### 4. Testar E2E

```bash
node hardening_teste_e2e_fluxos.mjs
```

Resultado esperado:
```
📈 Score: 7/7 (100%)
🎉 TODOS OS FLUXOS CRÍTICOS ESTÃO FUNCIONANDO!
```

---

## O QUE SERÁ CRIADO

### Função
- `exec_sql()` - Executa SQL dinâmico via RPC

### Tabelas (4)
1. **ride_shares** - Compartilhamento de viagens
2. **safety_incidents** - Incidentes de segurança
3. **safety_evidence** - Evidências de incidentes
4. **safety_audit_log** - Log de auditoria

### Policies
- Service role: acesso total a todas as 4 tabelas
- RLS habilitado em todas

---

## APÓS APLICAR

✅ **Validações automáticas:**
1. `node verificar_rls_completo.mjs` → 11/11
2. `node hardening_teste_e2e_fluxos.mjs` → 7/7

⚠️ **Validações manuais pendentes:**
1. Reativar autenticação
2. Validar RLS com auth real
3. Testar fluxos via navegador

---

## TROUBLESHOOTING

### Erro: "already exists"
- Normal para tabelas/policies que já existem
- Continuar execução

### Erro: "foreign key violation"
- Verificar se tabelas `ride_requests` e `profiles` existem
- Executar migrations base primeiro

### Tabelas criadas mas ainda bloqueadas
- Aguardar alguns segundos para schema cache atualizar
- Re-executar validação

---

## PRÓXIMOS PASSOS

1. ✅ Aplicar SQL
2. ✅ Validar 11/11 tabelas
3. ✅ Testar E2E 7/7
4. ⏳ Reativar autenticação
5. ⏳ Validar com auth real
6. ⏳ Testar via navegador
7. ✅ Fechar staging

---

**Tempo estimado:** 5 minutos para aplicar + validar
