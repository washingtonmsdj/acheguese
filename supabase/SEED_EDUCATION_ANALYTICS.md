# Seed de Analytics para Education

Arquivo: `seed_education_analytics.sql`

## Propósito

Popula a tabela `education_analytics_events` com dados de teste realistas para validar o funil de matrícula e o dashboard de analytics.

## Cenário Simulado

**Escola Horizonte** (`regular_school`) com 30 dias de atividade:

| Métrica | Valor | Taxa |
|---------|-------|------|
| Visualizações de Perfil | 150 | 100% |
| Cliques WhatsApp | 45 | 30% |
| Cliques CTA Matrícula | 30 | 20% |
| Programas Visualizados | 60 | 40% |
| Eventos Visualizados | 25 | 17% |
| Leads Enviados | 20 | 13% |
| Leads Contactados | 15 | 10% |
| Leads que Visitaram | 12 | 8% |
| Matrículas Confirmadas | 5 | 3% |

## Pré-requisitos

Antes de rodar este seed, certifique-se de que existem:

1. **Um business** em `business_data` com ID: `550e8400-e29b-41d4-a716-446655440000`
2. **Um education_profile** em `education_profiles` com ID: `550e8400-e29b-41d4-a716-446655440001`
3. **Alguns programs** em `education_programs` para esse profile
4. **Alguns events** em `education_events` para esse profile

### Criar dados mínimos (se não existirem):

```sql
-- 1. Criar business (se necessário)
INSERT INTO business_data (id, business_name, category_id, owner_id, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Escola Horizonte',
  (SELECT id FROM categories WHERE slug = 'educacao' LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar education_profile (se necessário)
INSERT INTO education_profiles (
  id, business_id, institution_type, niche_key, support_level, 
  summary, whatsapp_number, status, published_at
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Escola Regular',
  'regular_school',
  'full_enabled',
  'Escola completa com ensino fundamental e médio, focada em excelência acadêmica.',
  '71999999999',
  'published',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar alguns programas
INSERT INTO education_programs (education_profile_id, name, description, age_group, shift, modality, is_active)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  serie || ' Ano',
  'Turma de ' || serie || ' ano do ensino fundamental',
  (serie + 5) || '-' || (serie + 6) || ' anos',
  CASE (serie % 3) WHEN 0 THEN 'manha' WHEN 1 THEN 'tarde' ELSE 'integral' END,
  'presencial',
  true
FROM generate_series(1, 9) AS serie
ON CONFLICT DO NOTHING;

-- 4. Criar alguns eventos
INSERT INTO education_events (education_profile_id, title, description, starts_at, ends_at, location, is_public)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Visita Guiada', 'Conheça nossa escola', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours', 'Escola Horizonte', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Aula Experimental', 'Experimente uma aula', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 1 hour', 'Sala 101', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Feira de Matrícula', 'Evento de matrículas', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days 4 hours', 'Auditório', true)
ON CONFLICT DO NOTHING;
```

## Como Executar

### Opção 1: Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole o conteúdo de `seed_education_analytics.sql`
4. Execute

### Opção 2: Via CLI (psql)

```bash
# Local
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed_education_analytics.sql

# Ou via Supabase CLI
supabase db execute --file supabase/seed_education_analytics.sql
```

### Opção 3: Via Script PowerShell

```powershell
# Rodar seed completo
.\executar_seed_education.ps1
```

## Verificação

Após executar, verifique os dados:

```sql
-- Contar eventos por tipo
SELECT 
  event_type,
  COUNT(*) as count
FROM education_analytics_events
WHERE education_profile_id = '550e8400-e29b-41d4-a716-446655440001'
GROUP BY event_type
ORDER BY count DESC;

-- Ver funil de conversão
SELECT 
  COUNT(DISTINCT CASE WHEN event_type = 'profile_view' THEN session_id END) as profile_views,
  COUNT(DISTINCT CASE WHEN event_type = 'whatsapp_click' THEN session_id END) as whatsapp_clicks,
  COUNT(DISTINCT CASE WHEN event_type = 'enrollment_cta_click' THEN session_id END) as cta_clicks,
  COUNT(DISTINCT CASE WHEN event_type = 'lead_submitted' THEN session_id END) as leads
FROM education_analytics_events
WHERE education_profile_id = '550e8400-e29b-41d4-a716-446655440001';

-- Ver leads criados
SELECT status, COUNT(*) 
FROM education_leads 
WHERE education_profile_id = '550e8400-e29b-41d4-a716-446655440001'
GROUP BY status;
```

## Limpar Dados de Teste

```sql
-- Remover apenas eventos de teste
DELETE FROM education_analytics_events 
WHERE education_profile_id = '550e8400-e29b-41d4-a716-446655440001';

-- Remover leads de teste
DELETE FROM education_leads 
WHERE education_profile_id = '550e8400-e29b-41d4-a716-446655440001';
```

## Integração com Frontend

Após executar o seed, acesse:

- **Página pública**: `/educacao/ba/salvador/escola-horizonte`
- **Dashboard**: `/central/empresas/550e8400-e29b-41d4-a716-446655440000/education/analytics`

Os gráficos devem mostrar dados do funil e métricas de conversão.

## Notas

- Os dados são distribuídos ao longo de 30 dias para simular atividade real
- Cada evento tem um `session_id` único para tracking de usuários
- O metadata inclui informações extras para análise detalhada
- Leads são criados com diferentes status para testar o pipeline completo
