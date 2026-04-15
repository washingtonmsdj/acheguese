# INSTRUÇÕES - APLICAR SQL DO DISPATCH

## PASSO 1: Abrir SQL Editor do Supabase

1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd
2. No menu lateral, clique em "SQL Editor"
3. Clique em "New query"

## PASSO 2: Copiar e Colar SQL

Copie TODO o conteúdo do arquivo `APLICAR_DISPATCH_SIMPLES.sql` e cole no editor.

## PASSO 3: Executar

Clique em "Run" ou pressione `Ctrl+Enter`

## PASSO 4: Verificar Resultado

Você deve ver:
```
✅ Tabela ride_dispatch_audit criada com sucesso!
```

## PASSO 5: Validar Tabela

Execute esta query para confirmar:

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'ride_dispatch_audit'
ORDER BY ordinal_position;
```

Deve retornar 9 colunas:
- id
- ride_id
- driver_profile_id
- attempt_number
- offered_at
- timeout_at
- responded_at
- status
- created_at
- updated_at

## TROUBLESHOOTING

### Erro: "relation already exists"
- Tabela já foi criada anteriormente
- Pode continuar normalmente

### Erro: "permission denied"
- Verifique se está logado como owner do projeto
- Tente via Dashboard > SQL Editor (não via API)

### Erro: "foreign key constraint"
- Verifique se tabelas `ride_requests` e `profiles` existem
- Execute: `SELECT * FROM ride_requests LIMIT 1;`

## PRÓXIMO PASSO

Após aplicar o SQL com sucesso, volte para o terminal e continue com o deploy da Edge Function.
