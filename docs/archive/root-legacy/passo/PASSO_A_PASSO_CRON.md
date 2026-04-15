# PASSO A PASSO - CONFIGURAR CRON EXTERNO

**Tempo estimado**: 5 minutos  
**Dificuldade**: Fácil  
**Serviço**: cron-job.org (gratuito)

---

## PASSO 1: CRIAR CONTA (1 minuto)

1. Abrir: https://cron-job.org/en/signup/
2. Preencher:
   - Email: [seu email]
   - Password: [sua senha]
3. Clicar em "Sign up"
4. Confirmar email (verificar caixa de entrada)

---

## PASSO 2: CRIAR CRON JOB (2 minutos)

1. Fazer login: https://cron-job.org/en/members/
2. Clicar em "Create cronjob"
3. Preencher formulário:

### Aba "General"

**Title**:
```
Dispatch Timeout Processor
```

**Address (URL)**:
```
https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts
```

**Schedule**:
- Selecionar: "Every 10 seconds"
- Ou usar cron expression: `*/10 * * * * *`

### Aba "Advanced"

**Request method**:
- Selecionar: `GET`

**Request timeout**:
- Valor: `30` segundos

**Custom request headers**:
Clicar em "Add header" e adicionar:

**Header 1**:
- Name: `apikey`
- Value: `[VITE_SUPABASE_PUBLISHABLE_KEY do .env]`

**Header 2** (opcional):
- Name: `Authorization`
- Value: `Bearer [VITE_SUPABASE_PUBLISHABLE_KEY do .env]`

### Aba "Notifications"

**Email notifications** (opcional):
- Marcar: "On failure"
- Email: [seu email]

4. Clicar em "Create cronjob"

---

## PASSO 3: ATIVAR CRON JOB (10 segundos)

1. Na lista de cron jobs, encontrar "Dispatch Timeout Processor"
2. Verificar que o status está "Enabled" (verde)
3. Se estiver "Disabled" (vermelho), clicar no botão de toggle para ativar

---

## PASSO 4: VALIDAR EXECUÇÃO (2 minutos)

### Aguardar 1 minuto

Deixar o cron executar pelo menos 6 vezes (6 × 10s = 1 minuto)

### Verificar logs no cron-job.org

1. Clicar no cron job "Dispatch Timeout Processor"
2. Ir para aba "History"
3. Verificar últimas execuções:
   - Status: ✅ Success (HTTP 200)
   - Response time: < 1000ms
   - Response body: `{"success":true,"processed":...}`

### Executar health check local

```powershell
./health-check-dispatch.ps1
```

Deve retornar:
```
1. Edge Function...
   OK: Edge Function respondendo
   Processados: [número]

Status: OK
```

### Verificar auditoria no banco (opcional)

```sql
SELECT 
  COUNT(*) as total_processados,
  MAX(created_at) as ultimo_processamento
FROM ride_dispatch_audit
WHERE status = 'timeout'
  AND created_at > NOW() - INTERVAL '5 minutes';
```

Se houver corridas ativas, deve retornar registros recentes.

---

## TROUBLESHOOTING

### Erro: HTTP 401 Unauthorized

**Causa**: Header `apikey` não configurado ou incorreto

**Solução**:
1. Editar cron job
2. Ir para aba "Advanced"
3. Verificar header `apikey`
4. Valor correto: `[VITE_SUPABASE_PUBLISHABLE_KEY do .env]`

### Erro: HTTP 500 Internal Server Error

**Causa**: Erro na Edge Function

**Solução**:
1. Verificar logs da Edge Function:
   ```bash
   supabase functions logs process-timeouts --tail
   ```
2. Verificar se função SQL existe:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'process_dispatch_timeouts';
   ```

### Erro: Timeout (>30s)

**Causa**: Edge Function demorando muito

**Solução**:
1. Verificar se há muitas corridas ativas
2. Aumentar timeout no cron-job.org para 60s
3. Otimizar query SQL se necessário

### Cron não executa

**Causa**: Job desabilitado ou conta suspensa

**Solução**:
1. Verificar status do job (deve estar "Enabled")
2. Verificar email por notificações de suspensão
3. Verificar limite de execuções (plano gratuito: 50 jobs)

---

## ALTERNATIVAS

### Se cron-job.org não funcionar

**Opção 1 - EasyCron**:
- URL: https://www.easycron.com
- Suporta 1 segundo de intervalo
- Configuração similar

**Opção 2 - GitHub Actions**:
- Ver arquivo: `.github/workflows/dispatch-timeout.yml`
- Limitação: Mínimo 1 minuto (executa 6x em loop)
- Gratuito e integrado ao repositório

**Opção 3 - Vercel Cron**:
- Requer deploy no Vercel
- Plano Pro para <1 minuto
- Ver guia: `CONFIGURAR_CRON_EXTERNO.md`

---

## CHECKLIST FINAL

- [ ] Conta criada no cron-job.org
- [ ] Cron job criado com URL correta
- [ ] Intervalo configurado: A cada 10 segundos
- [ ] Header `apikey` adicionado
- [ ] Cron job ativado (status: Enabled)
- [ ] Aguardado 1 minuto
- [ ] Verificado logs no cron-job.org (HTTP 200)
- [ ] Executado health check local (Status: OK)
- [ ] (Opcional) Verificado auditoria no banco

---

## CONCLUSÃO

Após completar todos os passos, o dispatch automático estará 100% operacional.

O cron externo chamará a Edge Function a cada 10 segundos, que processará timeouts e retry automaticamente.

**Próximos passos**:
1. Monitorar primeiras 24h
2. Configurar alertas
3. Deploy em produção

---

**Última atualização**: 07/04/2026, 03:10  
**Status**: Pronto para execução  
**Tempo estimado**: 5 minutos
