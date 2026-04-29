# ============================================================================
# Script: executar_seed_education_analytics.ps1
# Descricao: Executa o seed de analytics para o modulo Education
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Seed Education Analytics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o Supabase CLI está instalado
try {
    $supabaseVersion = supabase --version 2>$null
    Write-Host "✓ Supabase CLI encontrado: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase CLI não encontrado." -ForegroundColor Red
    Write-Host "  Instale via: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Verificar se está no diretório correto
if (-not (Test-Path "seed_education_analytics.sql")) {
    Write-Host "✗ Arquivo seed_education_analytics.sql não encontrado" -ForegroundColor Red
    Write-Host "  Execute este script do diretório supabase/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Passos que serão executados:" -ForegroundColor Yellow
Write-Host "  1. Verificar status do Supabase local" -ForegroundColor Gray
Write-Host "  2. Executar seed de analytics" -ForegroundColor Gray
Write-Host "  3. Verificar dados inseridos" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Deseja continuar? (s/n)"
if ($confirm -ne 's') {
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    exit 0
}

# Verificar status do Supabase
Write-Host ""
Write-Host "Verificando status do Supabase..." -ForegroundColor Cyan
$status = supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Supabase não está rodando localmente." -ForegroundColor Red
    Write-Host "  Inicie com: supabase start" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Supabase está rodando" -ForegroundColor Green

# Verificar conexão com banco
Write-Host ""
Write-Host "Verificando conexão com banco de dados..." -ForegroundColor Cyan
try {
    $env:PGPASSWORD = "postgres"
    $result = psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Conexão com banco OK" -ForegroundColor Green
    } else {
        throw "Falha na conexão"
    }
} catch {
    Write-Host "✗ Não foi possível conectar ao banco via psql" -ForegroundColor Red
    Write-Host "  Tentando via Supabase CLI..." -ForegroundColor Yellow
}

# Verificar se o profile existe
Write-Host ""
Write-Host "Verificando se o profile de teste existe..." -ForegroundColor Cyan
$checkProfile = @"
SELECT COUNT(*) FROM education_profiles WHERE id = '550e8400-e29b-41d4-a716-446655440001';
"@

try {
    $result = psql -h localhost -p 54322 -U postgres -d postgres -c $checkProfile 2>&1
    if ($result -match "0") {
        Write-Host "⚠ Profile de teste não encontrado." -ForegroundColor Yellow
        Write-Host "  Execute primeiro o seed principal ou crie manualmente." -ForegroundColor Yellow
        Write-Host "  Veja instruções em: SEED_EDUCATION_ANALYTICS.md" -ForegroundColor Yellow
        
        $criar = Read-Host "Deseja criar os dados mínimos necessários? (s/n)"
        if ($criar -eq 's') {
            Write-Host ""
            Write-Host "Criando dados mínimos..." -ForegroundColor Cyan
            
            $setupScript = @"
-- Criar business
INSERT INTO business_data (id, business_name, category_id, owner_id, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Escola Horizonte',
  (SELECT id FROM categories WHERE slug = 'educacao' LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- Criar education_profile
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
  'Escola completa com ensino fundamental e médio.',
  '71999999999',
  'published',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Criar programas
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

-- Criar eventos
INSERT INTO education_events (education_profile_id, title, description, starts_at, ends_at, location, is_public)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Visita Guiada', 'Conheça nossa escola', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours', 'Escola Horizonte', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Aula Experimental', 'Experimente uma aula', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 1 hour', 'Sala 101', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Feira de Matrícula', 'Evento de matrículas', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days 4 hours', 'Auditório', true)
ON CONFLICT DO NOTHING;
"@
            $setupScript | psql -h localhost -p 54322 -U postgres -d postgres 2>&1
            Write-Host "✓ Dados mínimos criados" -ForegroundColor Green
        } else {
            Write-Host "Operação cancelada." -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "✓ Profile de teste encontrado" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Não foi possível verificar o profile. Continuando mesmo assim..." -ForegroundColor Yellow
}

# Executar o seed
Write-Host ""
Write-Host "Executando seed de analytics..." -ForegroundColor Cyan
Write-Host "Isso pode levar alguns segundos..." -ForegroundColor Gray

$result = Get-Content "seed_education_analytics.sql" | psql -h localhost -p 54322 -U postgres -d postgres 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Seed executado com sucesso!" -ForegroundColor Green
    Write-Host ""
    
    # Verificar dados inseridos
    Write-Host "Verificando dados inseridos..." -ForegroundColor Cyan
    
    $verifyQuery = @"
SELECT 
  event_type,
  COUNT(*) as count
FROM education_analytics_events
WHERE education_profile_id = '550e8400-e29b-41d4-a716-446655440001'
GROUP BY event_type
ORDER BY count DESC;
"@
    
    Write-Host ""
    Write-Host "Eventos criados:" -ForegroundColor Yellow
    psql -h localhost -p 54322 -U postgres -d postgres -c $verifyQuery 2>&1 | ForEach-Object {
        if ($_ -match "^\s*(\w+)\s*\|\s*(\d+)\s*$") {
            $eventType = $matches[1]
            $count = $matches[2]
            Write-Host "  $eventType`: $count" -ForegroundColor Gray
        }
    }
    
    $totalQuery = @"
SELECT 
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as unique_sessions
FROM education_analytics_events
WHERE education_profile_id = '550e8400-e29b-41d4-a716-446655440001';
"@
    
    Write-Host ""
    psql -h localhost -p 54322 -U postgres -d postgres -c $totalQuery 2>&1 | ForEach-Object {
        if ($_ -match "^\s*(\d+)\s*\|\s*(\d+)\s*$") {
            Write-Host "Total: $($matches[1]) eventos, $($matches[2]) sessões únicas" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Seed concluído!" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "  1. Acesse a página pública:" -ForegroundColor Gray
    Write-Host "     /educacao/ba/salvador/escola-horizonte" -ForegroundColor White
    Write-Host ""
    Write-Host "  2. Acesse o dashboard de analytics:" -ForegroundColor Gray
    Write-Host "     /perfil/empresas/550e8400-e29b-41d4-a716-446655440000/education/analytics" -ForegroundColor White
    Write-Host ""
    Write-Host "  3. Verifique o funil de conversão com os dados simulados" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "✗ Erro ao executar seed:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}
