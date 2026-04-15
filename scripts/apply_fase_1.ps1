# ============================================================================
# APLICAÇÃO PROFISSIONAL DA FASE 1
# ============================================================================
# Script para aplicar migrations da Fase 1 com validação e rollback
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "FASE 1: BANCO E MIGRATIONS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Supabase CLI está instalado
Write-Host "Verificando Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✓ Supabase CLI encontrado: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase CLI não encontrado" -ForegroundColor Red
    Write-Host "Instale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar se Supabase está rodando
Write-Host "Verificando se Supabase está rodando..." -ForegroundColor Yellow
try {
    $status = supabase status 2>&1
    if ($status -match "stopped" -or $status -match "not running") {
        Write-Host "✗ Supabase não está rodando" -ForegroundColor Red
        Write-Host "Iniciando Supabase..." -ForegroundColor Yellow
        supabase start
        Start-Sleep -Seconds 5
    } else {
        Write-Host "✓ Supabase está rodando" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Erro ao verificar status do Supabase" -ForegroundColor Red
    Write-Host "Execute: supabase start" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Listar migrations pendentes
Write-Host "Verificando migrations pendentes..." -ForegroundColor Yellow
Write-Host ""

$migrations = Get-ChildItem -Path "supabase/migrations" -Filter "20260327100*.sql" | Sort-Object Name

if ($migrations.Count -eq 0) {
    Write-Host "✗ Nenhuma migration da Fase 1 encontrada" -ForegroundColor Red
    exit 1
}

Write-Host "Migrations da Fase 1 encontradas:" -ForegroundColor Green
foreach ($migration in $migrations) {
    Write-Host "  - $($migration.Name)" -ForegroundColor White
}

Write-Host ""
Write-Host "Total: $($migrations.Count) migrations" -ForegroundColor Cyan
Write-Host ""

# Confirmar aplicação
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "ATENÇÃO: Esta operação irá:" -ForegroundColor Yellow
Write-Host "  • Criar extensões citext e postgis" -ForegroundColor White
Write-Host "  • Alterar tabelas existentes (profiles, profile_members, business_data, professional_data)" -ForegroundColor White
Write-Host "  • Criar novas tabelas (profile_links, driver_data, admin_users, profile_audit_log)" -ForegroundColor White
Write-Host "  • Criar 12 índices" -ForegroundColor White
Write-Host "  • Criar 6 triggers de validação" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Deseja continuar? (s/N)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "Operação cancelada pelo usuário" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Aplicar migrations
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "APLICANDO MIGRATIONS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "Executando: supabase db push" -ForegroundColor Yellow
    Write-Host ""
    
    supabase db push
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "✓ MIGRATIONS APLICADAS COM SUCESSO" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    
    # Verificar migrations aplicadas
    Write-Host "Verificando migrations aplicadas..." -ForegroundColor Yellow
    supabase migration list
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "PRÓXIMOS PASSOS" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Verificar logs acima para confirmar que não houve erros" -ForegroundColor White
    Write-Host "2. Testar triggers manualmente (ver FASE_1_ENTREGA.md)" -ForegroundColor White
    Write-Host "3. Validar estrutura criada no Supabase Studio (http://127.0.0.1:54323)" -ForegroundColor White
    Write-Host "4. Iniciar Fase 2 (RLS, Views, RPCs)" -ForegroundColor White
    Write-Host ""
    Write-Host "Documentação:" -ForegroundColor Cyan
    Write-Host "  • FASE_1_ENTREGA.md - Detalhes completos" -ForegroundColor White
    Write-Host "  • RESUMO_FASE_1.md - Resumo executivo" -ForegroundColor White
    Write-Host "  • STATUS_IMPLEMENTACAO.md - Status geral" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "✗ ERRO AO APLICAR MIGRATIONS" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ações recomendadas:" -ForegroundColor Yellow
    Write-Host "  1. Verificar logs acima para identificar o erro" -ForegroundColor White
    Write-Host "  2. Consultar FASE_1_ENTREGA.md seção G (Riscos)" -ForegroundColor White
    Write-Host "  3. Executar scripts/validate_before_migration.sql" -ForegroundColor White
    Write-Host "  4. Corrigir dados problemáticos" -ForegroundColor White
    Write-Host "  5. Tentar novamente" -ForegroundColor White
    Write-Host ""
    Write-Host "Para rollback:" -ForegroundColor Yellow
    Write-Host "  supabase db reset" -ForegroundColor White
    Write-Host ""
    exit 1
}
