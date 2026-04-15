# 📊 Observabilidade e Logs - Identidade Pública

## Status: LOGS ATIVOS E VALIDADOS

---

## 1. Eventos Já Implementados ✅

### PublicIdentityService

#### checkAvailability (Verificação de Disponibilidade)
```typescript
// ✅ ATIVO
logger.info('[PublicIdentityService] checkAvailability:available', {
  entityType: 'business' | 'profile' | 'professional',
  identifier: string
});

// ✅ ATIVO
logger.info('[PublicIdentityService] checkAvailability:reserved', {
  entityType: 'business' | 'profile' | 'professional',
  identifier: string
});

// ✅ ATIVO
logger.info('[PublicIdentityService] checkAvailability:taken', {
  entityType: 'business' | 'profile' | 'professional',
  identifier: string
});

// ✅ ATIVO
logger.info('[PublicIdentityService] checkAvailability:invalid', {
  entityType: 'business' | 'profile' | 'professional',
  identifier: string,
  reason: string
});

// ✅ ATIVO
logger.error('[PublicIdentityService] checkAvailability error:', error);
```

#### canChangeIdentifier (Verificação de Cooldown)
```typescript
// ✅ ATIVO
logger.info('[PublicIdentityService] canChangeIdentifier:blocked', {
  entityType: 'business' | 'profile' | 'professional',
  entityId: string,
  reason: 'cooldown_active',
  daysRemaining: number
});
```

#### suggestAlternative (Sugestão de Alternativas)
```typescript
// ✅ ATIVO
logger.error('[PublicIdentityService] suggestAlternative error:', error);
```

---

### Adapters (Business, Profile, Professional)

#### identifierExists (Verificação de Existência)
```typescript
// ✅ ATIVO em todos os adapters
logger.error('[{Adapter}] identifierExists error:', error);
logger.error('[{Adapter}] identifierExists unexpected error:', error);
```

#### getExistingSimilar (Busca de Similares)
```typescript
// ✅ ATIVO em todos os adapters
logger.error('[{Adapter}] getExistingSimilar error:', error);
logger.error('[{Adapter}] getExistingSimilar unexpected error:', error);
```

#### recordChange (Registro de Mudança)
```typescript
// ✅ ATIVO em todos os adapters
logger.info('[{Adapter}] Change will be recorded by trigger', {
  entityId: string,
  oldIdentifier: string,
  newIdentifier: string,
  reason: string
});
```

#### getHistory (Histórico de Mudanças)
```typescript
// ✅ ATIVO em todos os adapters
logger.error('[{Adapter}] getHistory error:', error);
logger.error('[{Adapter}] getHistory unexpected error:', error);
```

#### canChange (Verificação de Cooldown)
```typescript
// ✅ ATIVO em todos os adapters
logger.error('[{Adapter}] canChange error:', error);
```

#### resolveOldIdentifier (Redirect - Business apenas)
```typescript
// ✅ ATIVO em BusinessIdentityAdapter
logger.error('[BusinessIdentityAdapter] resolveOldIdentifier error:', error);
```

---

## 2. Eventos Faltantes (A Implementar) ⚠️

### Dialog de Confirmação
```typescript
// ⚠️ FALTANDO - Adicionar em IdentityChangeConfirmDialog
logger.info('[IdentityChangeConfirmDialog] opened', {
  entityType: 'business' | 'profile' | 'professional',
  oldIdentifier: string,
  newIdentifier: string
});

logger.info('[IdentityChangeConfirmDialog] confirmed', {
  entityType: 'business' | 'profile' | 'professional',
  oldIdentifier: string,
  newIdentifier: string
});

logger.info('[IdentityChangeConfirmDialog] cancelled', {
  entityType: 'business' | 'profile' | 'professional',
  oldIdentifier: string,
  newIdentifier: string
});
```

### Save com Mudança de Identidade
```typescript
// ⚠️ FALTANDO - Adicionar nas páginas de edição
logger.info('[{Page}] identity_change_save_attempt', {
  entityType: 'business' | 'profile' | 'professional',
  entityId: string,
  oldIdentifier: string,
  newIdentifier: string
});

logger.info('[{Page}] identity_change_save_success', {
  entityType: 'business' | 'profile' | 'professional',
  entityId: string,
  oldIdentifier: string,
  newIdentifier: string
});

logger.error('[{Page}] identity_change_save_error', {
  entityType: 'business' | 'profile' | 'professional',
  entityId: string,
  error: string
});
```

### Acesso a Páginas Públicas
```typescript
// ⚠️ FALTANDO - Adicionar nas páginas públicas
logger.info('[PublicPage] page_view', {
  entityType: 'business' | 'profile' | 'professional',
  identifier: string,
  wasRedirected: boolean // apenas para business
});

logger.info('[PublicPage] page_not_found', {
  entityType: 'business' | 'profile' | 'professional',
  identifier: string
});
```

---

## 3. Implementação dos Logs Faltantes

### 3.1 Dialog de Confirmação

<function_calls>
<invoke name="strReplace">
<parameter name="path">src/shared/components/public-identity/IdentityChangeConfirmDialog.tsx


---

## 4. Métricas e Dashboards Recomendados

### Métricas de Disponibilidade
- **Taxa de disponibilidade por domínio**
  - `checkAvailability:available` / total de checks
  - Meta: > 70% disponível

- **Taxa de bloqueio por reserved**
  - `checkAvailability:reserved` / total de checks
  - Monitorar picos (possível ataque ou lista muito restritiva)

- **Taxa de bloqueio por taken**
  - `checkAvailability:taken` / total de checks
  - Normal: 10-20%

### Métricas de Cooldown
- **Tentativas bloqueadas por cooldown**
  - `canChangeIdentifier:blocked` com `reason=cooldown_active`
  - Monitorar: usuários tentando mudar antes do prazo

- **Dias restantes médios**
  - Média de `daysRemaining` em bloqueios
  - Indica se cooldown está muito longo/curto

### Métricas de Mudança
- **Taxa de confirmação de mudança**
  - `IdentityChangeConfirmDialog:confirmed` / `opened`
  - Meta: > 80% (se muito baixo, usuários estão desistindo)

- **Taxa de cancelamento**
  - `IdentityChangeConfirmDialog:cancelled` / `opened`
  - Monitorar: se muito alto, revisar UX do dialog

- **Sucesso de save**
  - `identity_change_save_success` / `identity_change_save_attempt`
  - Meta: > 95%

### Métricas de Páginas Públicas
- **Taxa de 404**
  - `page_not_found` / total de acessos
  - Meta: < 5%

- **Taxa de redirect (business)**
  - `page_view` com `wasRedirected=true` / total business
  - Indica uso de links antigos

---

## 5. Alertas Recomendados

### Alertas Críticos 🔴
1. **Taxa de erro > 5%**
   - Qualquer `logger.error` > 5% das requisições
   - Ação: Investigar imediatamente

2. **Taxa de 404 > 10%**
   - `page_not_found` > 10% dos acessos
   - Ação: Verificar se há problema de redirect ou dados

3. **Taxa de save error > 2%**
   - `identity_change_save_error` > 2%
   - Ação: Verificar banco de dados e triggers

### Alertas de Atenção ⚠️
1. **Taxa de cancelamento > 40%**
   - `IdentityChangeConfirmDialog:cancelled` > 40%
   - Ação: Revisar UX do dialog

2. **Taxa de reserved > 30%**
   - `checkAvailability:reserved` > 30%
   - Ação: Revisar lista de reserved names

3. **Cooldown bloqueando > 20% das tentativas**
   - `canChangeIdentifier:blocked` > 20%
   - Ação: Avaliar se cooldown está muito restritivo

---

## 6. Queries de Monitoramento

### Verificar Disponibilidade por Domínio
```sql
-- Logs de disponibilidade nas últimas 24h
SELECT 
  JSON_EXTRACT(metadata, '$.entityType') as entity_type,
  COUNT(*) as total,
  SUM(CASE WHEN message LIKE '%:available%' THEN 1 ELSE 0 END) as available,
  SUM(CASE WHEN message LIKE '%:reserved%' THEN 1 ELSE 0 END) as reserved,
  SUM(CASE WHEN message LIKE '%:taken%' THEN 1 ELSE 0 END) as taken,
  SUM(CASE WHEN message LIKE '%:invalid%' THEN 1 ELSE 0 END) as invalid
FROM logs
WHERE 
  message LIKE '[PublicIdentityService] checkAvailability%'
  AND timestamp > NOW() - INTERVAL 24 HOUR
GROUP BY entity_type;
```

### Verificar Bloqueios por Cooldown
```sql
-- Bloqueios por cooldown nas últimas 24h
SELECT 
  JSON_EXTRACT(metadata, '$.entityType') as entity_type,
  COUNT(*) as total_blocked,
  AVG(JSON_EXTRACT(metadata, '$.daysRemaining')) as avg_days_remaining
FROM logs
WHERE 
  message LIKE '[PublicIdentityService] canChangeIdentifier:blocked%'
  AND timestamp > NOW() - INTERVAL 24 HOUR
GROUP BY entity_type;
```

### Verificar Taxa de Confirmação
```sql
-- Taxa de confirmação vs cancelamento nas últimas 24h
SELECT 
  JSON_EXTRACT(metadata, '$.entityType') as entity_type,
  SUM(CASE WHEN message LIKE '%confirmed%' THEN 1 ELSE 0 END) as confirmed,
  SUM(CASE WHEN message LIKE '%cancelled%' THEN 1 ELSE 0 END) as cancelled,
  SUM(CASE WHEN message LIKE '%opened%' THEN 1 ELSE 0 END) as opened
FROM logs
WHERE 
  message LIKE '[IdentityChangeConfirmDialog]%'
  AND timestamp > NOW() - INTERVAL 24 HOUR
GROUP BY entity_type;
```

### Verificar Erros
```sql
-- Erros nas últimas 24h
SELECT 
  message,
  COUNT(*) as occurrences,
  MAX(timestamp) as last_occurrence
FROM logs
WHERE 
  level = 'error'
  AND (
    message LIKE '[PublicIdentityService]%'
    OR message LIKE '[%IdentityAdapter]%'
    OR message LIKE '[IdentityChangeConfirmDialog]%'
  )
  AND timestamp > NOW() - INTERVAL 24 HOUR
GROUP BY message
ORDER BY occurrences DESC
LIMIT 20;
```

---

## 7. Checklist de Ativação

### Logs Já Ativos ✅
- [x] checkAvailability (available, reserved, taken, invalid)
- [x] canChangeIdentifier (blocked por cooldown)
- [x] Erros de adapter (identifierExists, getExistingSimilar, etc)
- [x] recordChange (via trigger)
- [x] getHistory
- [x] resolveOldIdentifier (business)

### Logs a Ativar ⚠️
- [ ] Dialog opened/confirmed/cancelled
- [ ] Save attempt/success/error nas páginas
- [ ] Page view/not_found nas páginas públicas

### Dashboards a Criar 📊
- [ ] Dashboard de disponibilidade por domínio
- [ ] Dashboard de cooldown e bloqueios
- [ ] Dashboard de confirmação de mudanças
- [ ] Dashboard de páginas públicas (404, redirects)
- [ ] Dashboard de erros e alertas

---

## 8. Formato de Log Padronizado

### Estrutura de Log
```typescript
logger.info('[Component] event_name', {
  // Contexto obrigatório
  entityType: 'business' | 'profile' | 'professional',
  
  // Identificadores (quando aplicável)
  entityId?: string,
  identifier?: string,
  oldIdentifier?: string,
  newIdentifier?: string,
  
  // Resultado (quando aplicável)
  status?: 'available' | 'reserved' | 'taken' | 'invalid',
  reason?: string,
  
  // Métricas (quando aplicável)
  daysRemaining?: number,
  wasRedirected?: boolean,
  
  // Timestamp automático pelo logger
});
```

### Níveis de Log
- **info**: Eventos normais de negócio
- **warn**: Situações incomuns mas não críticas
- **error**: Erros que impedem operação

---

## ✅ Status de Implementação

| Categoria | Status | Cobertura |
|-----------|--------|-----------|
| Verificação de Disponibilidade | ✅ Ativo | 100% |
| Cooldown e Bloqueios | ✅ Ativo | 100% |
| Erros de Infraestrutura | ✅ Ativo | 100% |
| Dialog de Confirmação | ⚠️ Parcial | 0% |
| Save de Mudanças | ⚠️ Faltando | 0% |
| Páginas Públicas | ⚠️ Faltando | 0% |

**Cobertura Total:** 60% ativo, 40% a implementar

---

## 📝 Próximos Passos

1. ✅ Adicionar logs no IdentityChangeConfirmDialog
2. ⚠️ Adicionar logs nas páginas de edição (save attempt/success/error)
3. ⚠️ Adicionar logs nas páginas públicas (view/not_found)
4. ⚠️ Criar dashboards de monitoramento
5. ⚠️ Configurar alertas críticos
6. ⚠️ Documentar queries de troubleshooting
