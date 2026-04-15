# DEPLOY DISPATCH - EXECUTAR AGORA

## PASSO 1: APLICAR SQL (5 min)

1. Abra: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new
2. Copie TODO o conteúdo de `APLICAR_DISPATCH_SIMPLES.sql`
3. Cole no editor
4. Clique em "Run" (ou Ctrl+Enter)
5. Aguarde mensagem: "✅ Tabela ride_dispatch_audit criada com sucesso!"

**Validar**:
```sql
SELECT COUNT(*) FROM ride_dispatch_audit;
```
Deve retornar `0` (tabela vazia mas existente)

## PASSO 2: DEPLOY EDGE FUNCTION (2 min)

**Pré-requisito**: Supabase CLI instalado

```bash
# Se não tiver CLI, instalar:
npm install -g supabase

# Login (se necessário)
supabase login

# Link ao projeto
supabase link --project-ref xhdowzacfujckjelqhtd

# Deploy da função
supabase functions deploy auto-dispatch-ride
```

**Validar**:
```bash
supabase functions list
```
Deve mostrar: `auto-dispatch-ride`

## PASSO 3: TESTAR FLUXO (10 min)

### 3.1 Criar Corrida

1. Abra a aplicação
2. Vá para tela de passageiro
3. Crie uma corrida
4. Observe a tela de busca

### 3.2 Verificar Logs

```bash
supabase functions logs auto-dispatch-ride --tail
```

Deve mostrar:
```
[AutoDispatch] Starting for ride: <uuid>
[AutoDispatch] Found X eligible drivers
[AutoDispatch] Attempt 1: offering to <driver-id>
```

### 3.3 Verificar Auditoria

```sql
SELECT 
  ride_id,
  driver_profile_id,
  attempt_number,
  status,
  offered_at,
  responded_at
FROM ride_dispatch_audit
ORDER BY created_at DESC
LIMIT 10;
```

Deve mostrar registros das tentativas

### 3.4 Testar Aceite

1. Abra tela de motorista em outra aba/dispositivo
2. Aguarde oferta aparecer
3. Clique em "Aceitar"
4. Verifique que passageiro vê confirmação

### 3.5 Testar Timeout

1. Crie outra corrida
2. NÃO aceite a oferta
3. Aguarde 30 segundos
4. Verifique que próximo motorista recebe oferta

### 3.6 Testar Expiração

1. Crie corrida sem motoristas disponíveis
2. Aguarde 10 minutos OU 5 tentativas
3. Verifique que corrida expira
4. Passageiro vê mensagem "Não encontrado"

## TROUBLESHOOTING

### Erro: "Could not find the table 'ride_dispatch_audit'"
- SQL não foi aplicado
- Volte ao PASSO 1

### Erro: "Function not found"
- Edge Function não foi deployada
- Volte ao PASSO 2

### Motorista não recebe oferta
```sql
-- Verificar motoristas disponíveis
SELECT * FROM driver_availability 
WHERE is_online = true AND is_available = true;
```

Se não houver motoristas:
```sql
-- Criar motorista de teste
UPDATE driver_availability 
SET is_online = true, is_available = true,
    current_lat = -12.975, current_lng = -38.476
WHERE profile_id = '<seu-profile-id>';
```

### Logs não aparecem
```bash
# Verificar se função está deployada
supabase functions list

# Verificar status
supabase functions inspect auto-dispatch-ride
```

### Trigger não dispara
```sql
-- Verificar se trigger existe
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_dispatch_on_searching';
```

Se não existir, executar `APLICAR_DISPATCH_COMPLETO.sql` (com trigger)

## VALIDAÇÃO FINAL

Execute este checklist:

- [ ] Tabela `ride_dispatch_audit` existe
- [ ] Edge Function `auto-dispatch-ride` deployada
- [ ] Trigger `trigger_auto_dispatch_on_searching` ativo
- [ ] Corrida criada entra em `searching_driver`
- [ ] Logs da edge function aparecem
- [ ] Motorista recebe oferta em tempo real
- [ ] Aceite funciona
- [ ] Timeout funciona
- [ ] Expiração funciona
- [ ] Auditoria registra tentativas

## MÉTRICAS PÓS-DEPLOY

Após 24h de uso, verificar:

```sql
-- Taxa de sucesso
SELECT 
  COUNT(DISTINCT CASE WHEN status = 'accepted' THEN ride_id END) * 100.0 / 
  COUNT(DISTINCT ride_id) as taxa_sucesso_pct
FROM ride_dispatch_audit;

-- Tempo médio de aceite
SELECT 
  AVG(EXTRACT(EPOCH FROM (responded_at - offered_at))) as tempo_medio_seg
FROM ride_dispatch_audit
WHERE status = 'accepted';

-- Tentativas médias
SELECT 
  AVG(attempt_number) as media_tentativas
FROM ride_dispatch_audit
WHERE status = 'accepted';
```

**Metas**:
- Taxa de sucesso: > 70%
- Tempo médio: < 15s
- Tentativas médias: < 2

---

**Tempo total estimado**: 15-20 minutos
**Dificuldade**: Baixa (apenas copiar/colar e executar comandos)
