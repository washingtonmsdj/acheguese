# INSTRUÇÕES - APLICAR POLICIES SAFETY

## AÇÃO OBRIGATÓRIA

As 4 tabelas safety estão bloqueadas por RLS sem policies. Para desbloquear:

### Passo 1: Abrir SQL Editor

1. Acessar [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecionar projeto
3. Menu lateral → **SQL Editor**
4. Clicar em **New Query**

### Passo 2: Copiar SQL

Abrir o arquivo: `APLICAR_TUDO_VIA_SQL_EDITOR.sql`

Copiar TODO o conteúdo do arquivo.

### Passo 3: Executar

1. Colar no SQL Editor
2. Clicar em **Run** (ou Ctrl+Enter)
3. Aguardar execução
4. Verificar mensagem: "✅ Policies aplicadas com sucesso!"

### Passo 4: Validar

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

## O QUE SERÁ CRIADO

### Função exec_sql
- Permite executar SQL dinâmico via RPC
- Usado para testes automatizados
- Acesso restrito a service_role

### Policies para ride_shares
- service_role: acesso total
- authenticated: CRUD próprios shares (created_by = auth.uid())

### Policies para safety_incidents
- service_role: acesso total
- authenticated: CRUD próprios incidentes (reported_by = auth.uid())

### Policies para safety_evidence
- service_role: acesso total
- authenticated: CR próprias evidências (uploaded_by = auth.uid())

### Policies para safety_audit_log
- service_role: acesso total
- authenticated: CR próprios logs (performed_by = auth.uid())

---

## APÓS APLICAR

1. ✅ Validar RLS: `node verificar_rls_completo.mjs`
2. ✅ Testar E2E: `node hardening_teste_e2e_fluxos.mjs`
3. ✅ Atualizar relatório de staging

---

## TROUBLESHOOTING

### Erro: "policy already exists"
- Normal, significa que a policy já foi criada
- Continuar execução

### Erro: "permission denied"
- Verificar se está usando conta com permissões de admin
- Verificar se service_role key está correta

### Erro: "table does not exist"
- Verificar se migrations foram aplicadas
- Executar migrations pendentes

---

## PRÓXIMOS PASSOS

Após aplicar policies com sucesso:

1. Reativar autenticação
2. Validar RLS com auth real
3. Testar fluxos via navegador
4. Fechar staging
