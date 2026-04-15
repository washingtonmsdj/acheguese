# ⚠️ AÇÃO MANUAL NECESSÁRIA

## CONTEXTO
Safety operacional está 100% implementado no código, mas a tabela `emergency_contacts` precisa ser criada manualmente no banco de dados.

## AÇÃO OBRIGATÓRIA

### 1. Abrir Supabase Dashboard
- Acesse: https://supabase.com/dashboard
- Selecione seu projeto

### 2. Ir para SQL Editor
- Menu lateral: "SQL Editor"
- Clique em "New query"

### 3. Executar SQL
- Abra o arquivo: `CREATE_EMERGENCY_CONTACTS_TABLE.sql`
- Copie TODO o conteúdo
- Cole no SQL Editor
- Clique em "Run" ou pressione Ctrl+Enter

### 4. Verificar Sucesso
Você deve ver a mensagem:
```
Tabela emergency_contacts criada com sucesso!
```

### 5. Validar Criação
Execute no terminal:
```bash
node check_emergency_contacts_table.mjs
```

Resultado esperado:
```
✅ Tabela emergency_contacts EXISTE!
   Registros: 0
✅ Tabela pronta para uso!
```

## POR QUE MANUAL?

O Supabase não permite execução de DDL (CREATE TABLE, CREATE TRIGGER) via API REST por segurança. Apenas via SQL Editor do Dashboard.

## APÓS EXECUTAR

Todos os fluxos de safety estarão 100% operacionais:
- ✅ Notificações automáticas
- ✅ Contatos de emergência (CRUD completo)
- ✅ Alertas notificam contatos
- ✅ Auditoria completa

## VALIDAÇÃO FINAL

Após criar a tabela, execute:
```bash
node validar_safety_notificacoes_contatos.mjs
```

Score esperado: **6/6 (100%)**
