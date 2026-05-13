# Education Module - Guia de Deploy

> Documento de deploy para o módulo Education. Versão 1.0.0

## Overview

Este documento descreve o processo de deploy do módulo Education, incluindo ordem de execução, rollback procedures, smoke tests e checklist de validação.

## Pré-requisitos

- [ ] Todas as migrations foram executadas em staging
- [ ] Build passou em CI/CD
- [ ] 156 testes unitários passando
- [ ] Feature flags configuradas corretamente
- [ ] RLS policies testadas em staging

## Ordem de Deploy

### 1. Database Migrations (Priority: CRITICAL)

```bash
# Aplicar migrations na ordem correta
supabase db push

# Verificar migrations aplicadas
supabase migration list
```

**Migrations do Education:**

1. `20260426130000_create_education_profiles.sql` - Tabela principal
2. `20260426130001_create_education_programs.sql` - Programas/turmas
3. `20260426130002_create_education_leads.sql` - Leads/pipeline
4. `20260426130003_create_education_lead_events.sql` - Eventos de auditoria
5. `20260426130004_create_education_events.sql` - Eventos/visitas
6. `20260426130005_add_education_indexes.sql` - Índices de performance
7. `20260426130006_create_education_audit_function.sql` - Trigger de auditoria

**Rollback:**
```bash
# Criar migration de rollback se necessário
supabase migration new rollback_education_module
```

### 2. Feature Flags (Priority: HIGH)

```typescript
// Verificar flags no código
FEATURE_FLAGS.EDUCATION_MODULE    // enabled: true
FEATURE_FLAGS.EDUCATION_PREMIUM   // enabled: true (dev/staging)
FEATURE_FLAGS.EDUCATION_NICHES    // enabled: true
```

**Ambientes:**

| Flag | Development | Staging | Production |
|------|------------|---------|------------|
| EDUCATION_MODULE | ✅ | ✅ | ✅ |
| EDUCATION_PREMIUM | ✅ | ✅ | ⚠️ Review |
| EDUCATION_NICHES | ✅ | ✅ | ✅ |

**Ativação gradual:**
```bash
# Para rollout gradual, ajustar rolloutPercentage
# Ex: 10% -> 50% -> 100%
```

### 3. Backend/Edge Functions (Priority: HIGH)

Nenhuma edge function específica para o módulo Education (usa Supabase client direto).

### 4. Frontend Build (Priority: HIGH)

```bash
# Build de produção
npm run build

# Verificar chunks do Education
# - EducationLandingPage
# - EducationDetailPage
# - EducationDashboardPage
# - EducationSetupPage
# - EducationProgramsPage
# - EducationLeadsPage
# - EducationEventsPage
# - EducationAnalyticsPage
# - EducationPlansPage
```

### 5. Smoke Tests (Priority: CRITICAL)

#### 5.1 Testes de Rota

```bash
# Públicas
GET /educacao/ba/salvador
GET /educacao/ba/salvador/caminho-das-arvores/escola-exemplo

# Admin (requer autenticação)
GET /central/empresas/:businessId/education
GET /central/empresas/:businessId/education/setup
GET /central/empresas/:businessId/education/programas
GET /central/empresas/:businessId/education/leads
GET /central/empresas/:businessId/education/eventos
GET /central/empresas/:businessId/education/analytics
GET /central/empresas/:businessId/education/planos
```

#### 5.2 Testes de API

```typescript
// Testar CRUD via Supabase client
const { data: profile } = await supabase
  .from('education_profiles')
  .select('*')
  .eq('business_id', 'test-business-id')
  .single();

// Verificar RLS - usuário não autenticado deve falhar
const { data: unauthorized } = await supabase
  .from('education_leads')
  .select('*');
// unauthorized should be null/empty for non-admin users
```

#### 5.3 Testes de Performance

```bash
# Lighthouse scores mínimos
# Performance: > 70
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

## Checklist de Validação

### Database

- [ ] Todas as 7 migrations aplicadas
- [ ] Índices criados corretamente
- [ ] RLS policies ativas
- [ ] Triggers funcionando (updated_at, auditoria)
- [ ] ENUMs criados: `education_profile_status`, `education_lead_status`

### API/Services

- [ ] EducationService.getOrCreateProfile funciona
- [ ] EducationService.createLead valida email/telefone
- [ ] Pipeline moveLeadInPipeline funciona
- [ ] Queries retornam dados paginados
- [ ] Mutations respeitam RLS

### UI

- [ ] Landing page carrega em < 3s
- [ ] Detail page mostra programas e form de lead
- [ ] Dashboard admin funcional
- [ ] Setup page salva configurações
- [ ] Programs page CRUD completo
- [ ] Leads page pipeline kanban
- [ ] Events page CRUD com datas
- [ ] Analytics page mostra métricas
- [ ] Plans page exibe planos corretamente

### Security

- [ ] RLS: leitura pública apenas para profiles published
- [ ] RLS: escrita apenas para owners
- [ ] GDPR: consentimento capturado em leads
- [ ] Audit: lead_events registram mudanças de status

### Feature Flags

- [ ] EDUCATION_MODULE ativo no ambiente
- [ ] EDUCATION_NICHES ativo
- [ ] EDUCATION_PREMIUM configurado conforme ambiente

## Monitoramento

### Métricas a observar

```
# Database
- education_profiles: row count growth
- education_leads: conversion rate (new -> enrolled)
- education_programs: active programs per profile
- education_events: upcoming events count

# Performance
- Page load time (landing, detail)
- API response time (queries, mutations)
- Error rate (4xx, 5xx)

# Business
- Leads captured per day
- Conversion rate by status
- Events created per week
- Program views
```

### Alertas

```
# Critical
- Error rate > 5%
- Database connection failures
- RLS bypass attempts

# Warning
- Page load > 5s
- API response > 2s
- Lead drop-off rate > 50%
```

## Rollback Plan

### Cenário 1: Erro no Database

```bash
# 1. Desativar feature flags
FEATURE_FLAGS.EDUCATION_MODULE.enabled = false

# 2. Reverter migrations (se possível)
supabase db reset --linked
# OU criar migration de rollback

# 3. Redeploy versão anterior
```

### Cenário 2: Erro no Frontend

```bash
# 1. Reverter para commit anterior
git revert <commit-hash>

# 2. Redeploy
npm run build
npm run deploy
```

### Cenário 3: Performance

```bash
# 1. Desativar gradualmente (feature flag)
FEATURE_FLAGS.EDUCATION_MODULE.rolloutPercentage = 0

# 2. Verificar logs e métricas

# 3. Corrigir e redeploy
```

## Timelines

| Fase | Estimativa | Dependências |
|------|-----------|-------------|
| Database migrations | 5 min | Nenhuma |
| Feature flags | 2 min | Migrations |
| Frontend build | 10 min | Tests passando |
| Smoke tests | 15 min | Deploy completo |
| Monitoramento | 24h | Smoke tests OK |

## Contatos

- **Tech Lead**: [Nome]
- **DBA**: [Nome]
- **DevOps**: [Nome]
- **QA**: [Nome]

---

**Última atualização**: Abril 2026  
**Versão**: 1.0.0  
**Status**: Pronto para deploy
