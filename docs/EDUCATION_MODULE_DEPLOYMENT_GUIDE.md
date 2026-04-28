# EDUCATION MODULE - GUIA DE DEPLOY

**Versão**: 1.0.0  
**Data**: 2026-04-28  
**Módulo**: Education  
**Status**: Pronto para Produção

---

## ÍNDICE

1. [Pré-Requisitos](#pré-requisitos)
2. [Checklist Pré-Deploy](#checklist-pré-deploy)
3. [Ordem de Deploy](#ordem-de-deploy)
4. [Smoke Tests](#smoke-tests)
5. [Rollback Plan](#rollback-plan)
6. [Monitoramento](#monitoramento)
7. [Troubleshooting](#troubleshooting)

---

## PRÉ-REQUISITOS

### Ambiente

- [ ] Acesso ao Supabase (produção)
- [ ] Acesso ao Vercel/plataforma de deploy
- [ ] Acesso ao repositório Git
- [ ] Permissões de admin no sistema

### Validações Técnicas

- [x] TypeCheck passando (0 erros)
- [x] Lint passando (4 warnings não-bloqueantes)
- [x] SSOT 100% conforme
- [x] 220 testes passando
- [x] Migrations validadas (9 arquivos)
- [x] RLS implementado

### Comunicação

- [ ] Stakeholders notificados
- [ ] Janela de manutenção agendada (se necessário)
- [ ] Time de suporte em standby
- [ ] Documentação de usuário pronta

---

## CHECKLIST PRÉ-DEPLOY

### 1. Validação de Código

```bash
# Executar validações completas
npm run typecheck
npm run lint
npm run validate:ssot
npm test src/modules/business/education
```

**Critérios de Aprovação**:
- ✅ TypeCheck: 0 erros
- ✅ Lint: Apenas warnings não-bloqueantes
- ✅ SSOT: 100% conforme
- ✅ Testes: 220/220 passando

### 2. Backup de Dados

```bash
# Backup do banco de dados (Supabase)
# Via dashboard do Supabase ou CLI
supabase db dump > backup_pre_education_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Feature Flags

Verificar que os feature flags estão configurados:

```typescript
// src/shared/utils/featureFlags.ts
EDUCATION_MODULE: {
  key: 'education_module',
  enabled: false, // Iniciar desabilitado
  rolloutPercentage: 0,
  environments: ['production'],
}
```

### 4. Variáveis de Ambiente

Verificar que todas as variáveis necessárias estão configuradas:

```bash
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
# Adicionar outras variáveis específicas se necessário
```

---

## ORDEM DE DEPLOY

### FASE 1: Deploy de Migrations (Database First)

**Duração Estimada**: 5-10 minutos  
**Janela de Manutenção**: Não necessária (migrations são aditivas)

#### 1.1. Conectar ao Supabase

```bash
# Via Supabase CLI
supabase login
supabase link --project-ref your-project-ref
```

#### 1.2. Aplicar Migrations

```bash
# Aplicar migrations em ordem
supabase db push

# Ou manualmente via SQL Editor no dashboard:
# 1. 20260426130000_create_education_profiles.sql
# 2. 20260426130001_create_education_programs.sql
# 3. 20260426130002_create_education_leads.sql
# 4. 20260426130003_create_education_lead_events.sql
# 5. 20260426130004_create_education_events.sql
# 6. 20260426130005_add_education_indexes.sql
# 7. 20260426130006_create_education_audit_function.sql
# 8. 20260427130000_add_regular_school_fields.sql
# 9. 20260427140000_create_education_analytics_events.sql
```

#### 1.3. Validar Migrations

```sql
-- Verificar que todas as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'education_%';

-- Resultado esperado:
-- education_profiles
-- education_programs
-- education_leads
-- education_lead_events
-- education_events
-- education_analytics_events

-- Verificar RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'education_%';

-- Resultado esperado: 10+ políticas RLS
```

#### 1.4. Verificar Índices

```sql
-- Verificar índices criados
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename LIKE 'education_%';

-- Resultado esperado: 5+ índices
```

**Critério de Sucesso**: Todas as tabelas, políticas RLS e índices criados sem erros.

---

### FASE 2: Deploy de Código (Application)

**Duração Estimada**: 10-15 minutos  
**Janela de Manutenção**: Não necessária (feature flags desabilitados)

#### 2.1. Merge para Main/Production

```bash
# Criar tag de release
git tag -a v1.0.0-education -m "Education Module v1.0.0"
git push origin v1.0.0-education

# Merge para main
git checkout main
git merge feature/education-module
git push origin main
```

#### 2.2. Deploy Automático

Se usando Vercel/Netlify, o deploy será automático após push para main.

Monitorar logs de build:
```bash
# Vercel
vercel logs

# Ou via dashboard
```

#### 2.3. Verificar Build

**Critérios de Sucesso**:
- ✅ Build completo sem erros
- ✅ Assets gerados corretamente
- ✅ Tamanho do bundle aceitável (< 5MB adicional)

---

### FASE 3: Rollout Gradual (Feature Flags)

**Duração Estimada**: 1-7 dias  
**Estratégia**: Rollout gradual com monitoramento

#### 3.1. Rollout 10% (Dia 1)

```typescript
// Atualizar via dashboard ou código
EDUCATION_MODULE: {
  enabled: true,
  rolloutPercentage: 10,
  environments: ['production'],
}
```

**Monitorar por 24h**:
- Taxa de erro < 1%
- Tempo de resposta < 2s (p95)
- Sem incidentes críticos

#### 3.2. Rollout 50% (Dia 2-3)

```typescript
EDUCATION_MODULE: {
  enabled: true,
  rolloutPercentage: 50,
  environments: ['production'],
}
```

**Monitorar por 48h**:
- Métricas de conversão
- Feedback de usuários
- Performance do sistema

#### 3.3. Rollout 100% (Dia 4-7)

```typescript
EDUCATION_MODULE: {
  enabled: true,
  rolloutPercentage: 100,
  environments: ['production'],
}
```

**Monitorar continuamente**:
- Todas as métricas estáveis
- Feedback positivo
- Sem degradação de performance

---

## SMOKE TESTS

### Testes Manuais Pós-Deploy

#### 1. Teste de Acesso Público

```
URL: https://seu-dominio.com/educacao/ba/salvador

Verificar:
- [ ] Página carrega sem erros
- [ ] Lista de instituições aparece
- [ ] Filtros funcionam
- [ ] Cards clicáveis
```

#### 2. Teste de Detalhes

```
URL: https://seu-dominio.com/educacao/ba/salvador/escola-exemplo

Verificar:
- [ ] Detalhes da instituição carregam
- [ ] Programas listados
- [ ] Eventos listados
- [ ] CTA WhatsApp funciona
- [ ] Formulário de lead abre
```

#### 3. Teste de Lead

```
Ação: Preencher e enviar formulário de lead

Verificar:
- [ ] Formulário valida campos
- [ ] Submissão bem-sucedida
- [ ] Lead aparece no backoffice
- [ ] Email de confirmação enviado (se configurado)
```

#### 4. Teste de Backoffice

```
URL: https://seu-dominio.com/perfil/empresas/{businessId}/education

Verificar:
- [ ] Dashboard carrega
- [ ] Setup funciona
- [ ] Programas podem ser criados
- [ ] Leads aparecem
- [ ] Pipeline funciona
- [ ] Analytics carregam
```

### Testes Automatizados

```bash
# Executar suite de testes E2E (se disponível)
npm run test:e2e:education

# Ou testes de integração
npm run test:integration:education
```

---

## ROLLBACK PLAN

### Cenário 1: Erro Crítico no Código

**Sintomas**: Erros 500, crashes, funcionalidade quebrada

**Ação Imediata** (< 5 minutos):
```typescript
// Desabilitar feature flag
EDUCATION_MODULE: {
  enabled: false,
  rolloutPercentage: 0,
}
```

**Rollback Completo** (< 30 minutos):
```bash
# Reverter deploy
git revert HEAD
git push origin main

# Ou via Vercel
vercel rollback
```

### Cenário 2: Problema nas Migrations

**Sintomas**: Erros de banco, dados corrompidos

**Ação Imediata** (< 10 minutos):
```sql
-- Desabilitar RLS temporariamente (se necessário)
ALTER TABLE education_profiles DISABLE ROW LEVEL SECURITY;

-- Ou dropar tabelas (CUIDADO!)
DROP TABLE IF EXISTS education_analytics_events CASCADE;
DROP TABLE IF EXISTS education_events CASCADE;
DROP TABLE IF EXISTS education_lead_events CASCADE;
DROP TABLE IF EXISTS education_leads CASCADE;
DROP TABLE IF EXISTS education_programs CASCADE;
DROP TABLE IF EXISTS education_profiles CASCADE;
```

**Restaurar Backup**:
```bash
# Restaurar do backup
psql -h your-db-host -U postgres -d your-db < backup_pre_education_YYYYMMDD_HHMMSS.sql
```

### Cenário 3: Performance Degradada

**Sintomas**: Lentidão, timeouts, alta carga

**Ação Imediata** (< 5 minutos):
```typescript
// Reduzir rollout
EDUCATION_MODULE: {
  enabled: true,
  rolloutPercentage: 10, // Voltar para 10%
}
```

**Investigação**:
- Verificar queries lentas
- Verificar índices
- Verificar carga do servidor

---

## MONITORAMENTO

### Métricas Críticas

#### 1. Disponibilidade
- **Target**: > 99.9%
- **Alerta**: < 99.5%

#### 2. Performance
- **Target**: < 2s (p95)
- **Alerta**: > 3s (p95)

#### 3. Taxa de Erro
- **Target**: < 1%
- **Alerta**: > 2%

#### 4. Conversão
- **Target**: > 5%
- **Alerta**: < 3%

### Dashboards

#### Supabase Dashboard
```
Monitorar:
- Query performance
- Database connections
- Storage usage
- API requests
```

#### Application Logs
```bash
# Vercel
vercel logs --follow

# Filtrar por education
vercel logs --follow | grep education
```

#### Analytics
```
Monitorar:
- education_lead_created
- education_lead_converted
- education_profile_published
- education_*_failed
```

### Alertas

Configurar alertas para:
- [ ] Taxa de erro > 2%
- [ ] Tempo de resposta > 3s
- [ ] Disponibilidade < 99.5%
- [ ] Conversão < 3%

---

## TROUBLESHOOTING

### Problema: Migrations não aplicam

**Sintomas**: Erro ao executar migrations

**Solução**:
```bash
# Verificar conexão
supabase status

# Verificar migrations pendentes
supabase db diff

# Aplicar manualmente via SQL Editor
```

### Problema: RLS bloqueando acesso

**Sintomas**: Usuários não conseguem acessar dados

**Solução**:
```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'education_profiles';

-- Testar política manualmente
SET ROLE authenticated;
SELECT * FROM education_profiles WHERE status = 'published';
```

### Problema: Feature flag não funciona

**Sintomas**: Módulo não aparece mesmo com flag habilitado

**Solução**:
```typescript
// Verificar implementação
import { isFeatureEnabled } from '@/shared/utils/featureFlags';

console.log(isFeatureEnabled('EDUCATION_MODULE')); // Deve retornar true
```

### Problema: Performance lenta

**Sintomas**: Queries lentas, timeouts

**Solução**:
```sql
-- Verificar queries lentas
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%education_%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Verificar índices
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename LIKE 'education_%';

-- Adicionar índice se necessário
CREATE INDEX IF NOT EXISTS idx_education_leads_profile_status 
ON education_leads(education_profile_id, status, created_at DESC);
```

---

## CHECKLIST FINAL

### Pré-Deploy
- [ ] Validações técnicas passando
- [ ] Backup realizado
- [ ] Feature flags configurados
- [ ] Stakeholders notificados
- [ ] Time de suporte em standby

### Deploy
- [ ] Migrations aplicadas com sucesso
- [ ] Código deployado sem erros
- [ ] Smoke tests passando
- [ ] Rollout gradual iniciado

### Pós-Deploy
- [ ] Monitoramento ativo
- [ ] Métricas dentro do target
- [ ] Sem incidentes críticos
- [ ] Feedback de usuários coletado
- [ ] Documentação atualizada

---

## CONTATOS DE EMERGÊNCIA

**Liderança Técnica**: [Nome/Email]  
**DevOps**: [Nome/Email]  
**Produto**: [Nome/Email]  
**Suporte**: [Nome/Email]

**Canais de Comunicação**:
- Slack: #education-deploy
- Email: tech@empresa.com
- Telefone: +55 (XX) XXXX-XXXX

---

## HISTÓRICO DE DEPLOYS

| Data | Versão | Ambiente | Status | Responsável | Notas |
|------|--------|----------|--------|-------------|-------|
| 2026-04-28 | 1.0.0 | Staging | ✅ Sucesso | Time Tech | Deploy inicial |
| - | - | Production | ⏳ Pendente | - | Aguardando aprovação |

---

**Última Atualização**: 2026-04-28  
**Próxima Revisão**: Após primeiro deploy em produção
