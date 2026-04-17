#!/usr/bin/env pwsh

# Script para aplicar a migration de correção do enum vaga_status

$MigrationFile = "supabase/migrations/20260416190000_migrate_vaga_status_enum.sql"

Write-Host "🚀 Aplicando migration: migrate_vaga_status_enum" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Corrige: invalid input value for enum vaga_status: 'published'" -ForegroundColor Yellow
Write-Host "   Migra:   'ativa' → 'published', 'pausada' → 'paused', etc." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $MigrationFile)) {
    Write-Host "❌ Arquivo não encontrado: $MigrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo encontrado" -ForegroundColor Green

# Ler SQL e copiar para clipboard
$sql = Get-Content $MigrationFile -Raw
$sql | Set-Clipboard

Write-Host "📋 SQL copiado para o clipboard!" -ForegroundColor Green
Write-Host ""

# Tentar carregar URL do .env.local
$supabaseUrl = ""
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" | Where-Object { $_ -match "VITE_SUPABASE_URL" }
    if ($envContent) {
        $supabaseUrl = ($envContent -split "=")[1].Trim().Trim('"')
    }
}

if (-not $supabaseUrl -and (Test-Path ".env")) {
    $envContent = Get-Content ".env" | Where-Object { $_ -match "VITE_SUPABASE_URL" }
    if ($envContent) {
        $supabaseUrl = ($envContent -split "=")[1].Trim().Trim('"')
    }
}

Write-Host "📝 Instruções:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Acesse o Supabase Dashboard > SQL Editor" -ForegroundColor White
Write-Host "   2. Clique em 'New Query'" -ForegroundColor White
Write-Host "   3. Cole o SQL (Ctrl+V) — já está no clipboard" -ForegroundColor White
Write-Host "   4. Clique em 'Run'" -ForegroundColor White
Write-Host ""

if ($supabaseUrl) {
    $projectRef = ($supabaseUrl -split "\.")[0] -replace "https://", ""
    $dashboardUrl = "https://app.supabase.com/project/$projectRef/sql/new"
    Write-Host "   🔗 Abrindo: $dashboardUrl" -ForegroundColor Cyan
    Start-Process $dashboardUrl
} else {
    Write-Host "   🔗 Acesse: https://app.supabase.com" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "⚠️  ATENÇÃO: Esta migration irá:" -ForegroundColor Yellow
Write-Host "   - Recriar o enum vaga_status com os valores corretos" -ForegroundColor White
Write-Host "   - Migrar dados existentes (ativa→published, pausada→paused, etc.)" -ForegroundColor White
Write-Host "   - Atualizar a RLS policy de leitura pública" -ForegroundColor White
Write-Host "   - Recriar índices condicionais" -ForegroundColor White
Write-Host ""
