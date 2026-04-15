# PRÓXIMO PASSO - DEPLOY EDGE FUNCTION

## ✅ CONCLUÍDO
- Tabela `ride_dispatch_audit` criada
- RLS configurado
- Policies aplicadas

## 🔴 AGORA: DEPLOY DA EDGE FUNCTION

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Instalar CLI (se não tiver)
npm install -g supabase

# 2. Login
supabase login

# 3. Link ao projeto
supabase link --project-ref xhdowzacfujckjelqhtd

# 4. Deploy da função
supabase functions deploy auto-dispatch-ride

# 5. Verificar
supabase functions list
```

### Opção 2: Via Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/functions
2. Clique em "Create a new function"
3. Nome: `auto-dispatch-ride`
4. Copie o conteúdo de `supabase/functions/auto-dispatch-ride/index.ts`
5. Cole no editor
6. Clique em "Deploy"

### Opção 3: Criar Trigger Manual (Alternativa Simples)

Se não conseguir fazer deploy da Edge Function, podemos criar um trigger SQL que chama um RPC:

```sql
-- Executar no SQL Editor
CREATE OR REPLACE FUNCTION start_auto_dispatch(p_ride_id UUID)
RETURNS void AS $$
BEGIN
  -- Aqui você pode implementar a lógica de dispatch em PL/pgSQL
  -- Ou apenas logar que o dispatch foi solicitado
  RAISE NOTICE 'Auto-dispatch solicitado para ride: %', p_ride_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que chama a função
CREATE OR REPLACE FUNCTION trigger_auto_dispatch()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'searching_driver' AND (OLD.status IS NULL OR OLD.status != 'searching_driver') THEN
    PERFORM start_auto_dispatch(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_dispatch_on_searching ON ride_requests;
CREATE TRIGGER trigger_auto_dispatch_on_searching
  AFTER INSERT OR UPDATE OF status
  ON ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_dispatch();
```

## VALIDAR DEPLOY

Após deploy, execute:

```bash
# Ver logs em tempo real
supabase functions logs auto-dispatch-ride --tail

# Ou via dashboard
# https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/logs/edge-functions
```

## TESTAR

1. Crie uma corrida via interface
2. Verifique que status muda para `searching_driver`
3. Verifique logs da edge function
4. Confirme que motorista recebe oferta

## TROUBLESHOOTING

### "Command not found: supabase"
```bash
npm install -g supabase
```

### "Not logged in"
```bash
supabase login
```

### "Project not linked"
```bash
supabase link --project-ref xhdowzacfujckjelqhtd
```

### Edge Function não dispara
- Verificar se trigger foi criado
- Verificar logs do Supabase
- Testar manualmente: criar corrida e ver se status muda

## PRÓXIMO RELATÓRIO

Após deploy, vou gerar relatório final com:
- ✅ SQL aplicado
- ✅ Edge Function deployada
- ✅ Trigger ativo
- ✅ Fluxo testado
- ✅ Evidência objetiva
