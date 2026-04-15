# CHECKLIST DE VALIDAÇÃO - DISPATCH AUTOMÁTICO

## PRÉ-REQUISITOS

### Banco de Dados
- [ ] Executar `CREATE_DISPATCH_AUDIT_TABLE.sql`
- [ ] Verificar que tabela `ride_dispatch_audit` foi criada
- [ ] Verificar RLS da tabela
- [ ] Executar `TESTAR_DISPATCH_AUTOMATICO.sql` para validar estrutura

### Dados de Teste
- [ ] Ter pelo menos 1 motorista cadastrado
- [ ] Motorista com `is_online = true`
- [ ] Motorista com `is_available = true`
- [ ] Motorista com coordenadas (`current_lat`, `current_lng`)
- [ ] Ter endereços cadastrados com coordenadas

## TESTES FUNCIONAIS

### 1. Criação de Corrida
- [ ] Criar corrida via interface
- [ ] Verificar que status inicial é `requested`
- [ ] Verificar que transiciona para `searching_driver` automaticamente
- [ ] Verificar que `AutoDispatchService.startDispatch()` foi chamado

**SQL para verificar:**
```sql
SELECT id, status, created_at 
FROM ride_requests 
WHERE id = 'uuid-da-corrida';
```

### 2. Busca de Motoristas
- [ ] Verificar que motoristas elegíveis foram encontrados
- [ ] Verificar que estão ordenados por proximidade
- [ ] Verificar que motoristas ocupados foram filtrados

**SQL para verificar:**
```sql
SELECT profile_id, is_online, is_available, current_lat, current_lng
FROM driver_availability
WHERE is_online = true AND is_available = true;
```

### 3. Oferta para Motorista
- [ ] Verificar que corrida mudou para `driver_assigned`
- [ ] Verificar que `driver_profile_id` foi preenchido
- [ ] Verificar que registro foi criado em `ride_dispatch_audit`
- [ ] Verificar que motorista recebeu notificação realtime

**SQL para verificar:**
```sql
SELECT * FROM ride_dispatch_audit 
WHERE ride_id = 'uuid-da-corrida' 
ORDER BY attempt_number;
```

### 4. Aceite do Motorista
- [ ] Motorista vê oferta na interface
- [ ] Motorista clica em "Aceitar"
- [ ] Status muda para `driver_accepted`
- [ ] Passageiro vê confirmação em tempo real
- [ ] Registro em `ride_dispatch_audit` atualizado com `status = 'accepted'`

**SQL para verificar:**
```sql
SELECT status, driver_profile_id, updated_at 
FROM ride_requests 
WHERE id = 'uuid-da-corrida';
```

### 5. Timeout e Retry
- [ ] Motorista NÃO aceita em 30s
- [ ] Status volta para `searching_driver`
- [ ] `driver_profile_id` é limpo
- [ ] Registro em `ride_dispatch_audit` marcado como `timeout`
- [ ] Próximo motorista recebe oferta
- [ ] Tentativa 2 registrada em `ride_dispatch_audit`

**SQL para verificar:**
```sql
SELECT attempt_number, driver_profile_id, status, offered_at, responded_at
FROM ride_dispatch_audit 
WHERE ride_id = 'uuid-da-corrida' 
ORDER BY attempt_number;
```

### 6. Expiração
- [ ] Nenhum motorista aceita após 5 tentativas
- [ ] Status muda para `expired`
- [ ] Passageiro vê mensagem de expiração
- [ ] Auditoria registra motivo da expiração

**SQL para verificar:**
```sql
SELECT status, updated_at 
FROM ride_requests 
WHERE id = 'uuid-da-corrida';

SELECT * FROM ride_state_audit 
WHERE ride_id = 'uuid-da-corrida' 
AND to_state = 'expired';
```

### 7. Realtime - Passageiro
- [ ] Passageiro vê "Procurando motorista..."
- [ ] Passageiro vê "Motorista encontrado!" quando atribuído
- [ ] Passageiro vê "Motorista confirmou!" quando aceito
- [ ] Passageiro vê "Não encontrado" quando expira
- [ ] Tudo SEM refresh manual da página

### 8. Realtime - Motorista
- [ ] Motorista recebe notificação de nova corrida
- [ ] Motorista vê card com detalhes da corrida
- [ ] Motorista vê contador de 30s
- [ ] Motorista pode aceitar ou recusar
- [ ] Após aceitar, card desaparece

### 9. Unicidade
- [ ] Criar corrida e atribuir para motorista A
- [ ] Motorista A aceita
- [ ] Tentar aceitar com motorista B (deve falhar)
- [ ] Verificar que apenas motorista A está atribuído

**SQL para verificar:**
```sql
SELECT driver_profile_id, status 
FROM ride_requests 
WHERE id = 'uuid-da-corrida';
```

### 10. Auditoria
- [ ] Cada tentativa registrada em `ride_dispatch_audit`
- [ ] `attempt_number` sequencial (1, 2, 3...)
- [ ] Timestamps corretos (`offered_at`, `responded_at`)
- [ ] Status correto (`pending`, `accepted`, `timeout`)
- [ ] Transições registradas em `ride_state_audit`

## TESTES DE EDGE CASES

### Motorista Ocupado
- [ ] Motorista com corrida ativa não recebe oferta
- [ ] Motorista que aceita fica indisponível (`is_available = false`)

### Corrida Cancelada
- [ ] Passageiro cancela durante busca
- [ ] Dispatch é interrompido
- [ ] Motorista não recebe mais ofertas

### Sem Motoristas
- [ ] Criar corrida sem motoristas disponíveis
- [ ] Corrida expira imediatamente
- [ ] Mensagem clara para passageiro

### Motorista Offline
- [ ] Motorista fica offline durante oferta
- [ ] Timeout acontece normalmente
- [ ] Próximo motorista recebe oferta

## TESTES DE PERFORMANCE

### Tempo de Resposta
- [ ] Busca de motoristas < 2s
- [ ] Atribuição de motorista < 1s
- [ ] Notificação realtime < 500ms
- [ ] Aceite de corrida < 1s

### Carga
- [ ] 10 corridas simultâneas
- [ ] 50 motoristas online
- [ ] Verificar que não há race conditions
- [ ] Verificar que auditoria está completa

## VALIDAÇÃO DE CÓDIGO

### TypeScript
- [ ] Sem erros de compilação
- [ ] Sem erros de tipo
- [ ] Imports corretos
- [ ] Exports corretos

**Comando:**
```bash
npm run type-check
```

### Linting
- [ ] Código segue padrões do projeto
- [ ] Sem warnings críticos

**Comando:**
```bash
npm run lint
```

### Testes Unitários (se houver)
- [ ] Testes passam
- [ ] Coverage adequado

**Comando:**
```bash
npm run test
```

## VALIDAÇÃO DE SEGURANÇA

### RLS (Row Level Security)
- [ ] Passageiro só vê suas corridas
- [ ] Motorista só vê corridas atribuídas a ele
- [ ] Admin vê tudo
- [ ] Auditoria protegida por RLS

### Optimistic Locking
- [ ] Aceite usa WHERE com status e driver_profile_id
- [ ] Segundo aceite falha com erro claro
- [ ] Não há race condition

## DOCUMENTAÇÃO

- [ ] README atualizado
- [ ] Exemplos de uso criados
- [ ] Comentários no código
- [ ] Diagramas de fluxo (se necessário)

## DEPLOY

### Staging
- [ ] SQL executado em staging
- [ ] Código deployado
- [ ] Testes manuais realizados
- [ ] Métricas coletadas

### Produção
- [ ] SQL executado em produção
- [ ] Código deployado
- [ ] Monitoramento ativo
- [ ] Rollback plan pronto

## MÉTRICAS PÓS-DEPLOY

### Monitorar
- [ ] Taxa de aceite (target: > 70%)
- [ ] Tempo médio de aceite (target: < 15s)
- [ ] Taxa de expiração (target: < 30%)
- [ ] Tentativas médias (target: < 2)
- [ ] Erros de dispatch (target: 0%)

### Queries de Monitoramento
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

## ASSINATURA

- [ ] Desenvolvedor validou código
- [ ] QA validou funcionalidade
- [ ] Product Owner aprovou
- [ ] Deploy autorizado

---

**Data**: ___/___/______  
**Responsável**: _________________  
**Status**: [ ] Aprovado [ ] Reprovado [ ] Pendente
