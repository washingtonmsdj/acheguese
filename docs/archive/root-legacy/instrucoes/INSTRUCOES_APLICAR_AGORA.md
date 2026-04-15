# INSTRUÇÕES - APLICAR AGORA

## PROBLEMA IDENTIFICADO

As 4 tabelas safety existem mas estão bloqueadas por RLS sem policy de service_role.

## SOLUÇÃO RÁPIDA

Aplicar apenas policies de service_role para desbloquear as tabelas.

---

## PASSO A PASSO

### 1. Abrir SQL Editor

1. Acessar [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecionar projeto
3. Menu lateral → **SQL Editor**
4. Clicar em **New Query**

### 2. Copiar e Executar

Abrir arquivo: `APLICAR_POLICIES_SERVICE_ROLE_APENAS.sql`

Copiar TODO o conteúdo e colar no SQL Editor.

Clicar em **Run** (ou Ctrl+Enter).

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

---

## O QUE SERÁ APLICADO

1. **Função exec_sql**
   - Permite executar SQL dinâmico via RPC
   - Usado para testes automatizados

2. **Policies service_role** (4 tabelas)
   - ride_shares
   - safety_incidents
   - safety_evidence
   - safety_audit_log

Cada policy permite acesso total para service_role:
```sql
USING (true) WITH CHECK (true)
```

---

## APÓS APLICAR

1. ✅ Validar: `node verificar_rls_completo.mjs`
2. ✅ Testar E2E: `node hardening_teste_e2e_fluxos.mjs`
3. ✅ Confirmar 11/11 tabelas acessíveis

---

## PRÓXIMOS PASSOS

1. Reativar autenticação
2. Validar RLS com auth real
3. Testar fluxos via navegador
4. Fechar staging

---

## TROUBLESHOOTING

### Erro: "relation does not exist"
- Verificar se migrations foram aplicadas
- Executar: `supabase db push` (se usando CLI)

### Erro: "policy already exists"
- Normal, significa que a policy já existe
- Continuar execução

### Tabelas ainda bloqueadas após aplicar
- Verificar se está usando service_role key
- Verificar se policies foram criadas: ver query de verificação no final do SQL

---

**Tempo estimado:** 2 minutos
