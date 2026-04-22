#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Aplica migration do dispatch híbrido no Supabase

.DESCRIPTION
    Script para aplicar a migration create_accept_ride_atomic_rpc.sql
    Usa as credenciais seguras armazenadas localmente

.EXAMPLE
    .\apply-dispatch-migration.ps1
#>

param(
    [string]$ProjectRef = "xhdowzacfujckjelqhtd",
    [string]$MigrationFile = "src/modules/mobility/migrations/create_accept_ride_atomic_rpc.sql"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "🚀 Aplicando migration do dispatch híbrido..." -ForegroundColor Cyan
Write-Host ""

# Verificar se arquivo de migration existe
if (-not (Test-Path $MigrationFile)) {
    Write-Host "❌ Erro: Arquivo de migration não encontrado: $MigrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivo de migration encontrado" -ForegroundColor Green
Write-Host ""

# Carregar secrets do Supabase
Write-Host "🔐 Carregando credenciais seguras..." -ForegroundColor Cyan

$secretsLoaded = $false
$errorMsg = ""

try {
    & .\scripts\security\Import-LocalSupabaseSecrets.ps1 -ProjectRef $ProjectRef
    $secretsLoaded = $true
    Write-Host "✅ Credenciais carregadas" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Message
    $secretsLoaded = $false
}

if (-not $secretsLoaded) {
    Write-Host "❌ Erro ao carregar credenciais" -ForegroundColor Red
    if ($errorMsg) {
        Write-Host "   Detalhes: $errorMsg" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "💡 Dica: Execute primeiro:" -ForegroundColor Yellow
    Write-Host "   .\scripts\security\Import-LocalSupabaseSecrets.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Ou obtenha a service role key em:" -ForegroundColor Yellow
    Write-Host "   Supabase Dashboard > Settings > API > service_role key" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verificar se variáveis foram carregadas
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ Erro: SUPABASE_SERVICE_ROLE_KEY não foi carregada" -ForegroundColor Red
    exit 1
}

if (-not $env:VITE_SUPABASE_URL) {
    Write-Host "❌ Erro: VITE_SUPABASE_URL não foi carregada" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Informações da conexão:" -ForegroundColor Cyan
Write-Host "   URL: $env:VITE_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   Projeto: $ProjectRef" -ForegroundColor Gray
Write-Host "   Migration: $MigrationFile" -ForegroundColor Gray
Write-Host ""

# Ler conteúdo do SQL
$sqlContent = Get-Content $MigrationFile -Raw

Write-Host "📝 Tamanho do SQL: $($sqlContent.Length) caracteres" -ForegroundColor Gray
Write-Host ""

# Copiar SQL para clipboard
Write-Host "📋 Copiando SQL para o clipboard..." -ForegroundColor Cyan
$sqlContent | Set-Clipboard
Write-Host "✅ SQL copiado!" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Aplique manualmente via Supabase Dashboard:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. Acesse: $env:VITE_SUPABASE_URL" -ForegroundColor White
Write-Host "      (Abrindo no navegador...)" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Vá para: SQL Editor > New Query" -ForegroundColor White
Write-Host ""
Write-Host "   3. Cole o SQL (Ctrl+V) - JÁ ESTÁ NO CLIPBOARD!" -ForegroundColor White
Write-Host ""
Write-Host "   4. Clique em 'Run' (ou Ctrl+Enter)" -ForegroundColor White
Write-Host ""

# Abrir Supabase Dashboard no navegador
$dashboardUrl = $env:VITE_SUPABASE_URL.Replace("/rest/v1", "") + "/project/_/sql"

try {
    Start-Process $dashboardUrl
    Write-Host "✅ Dashboard aberto no navegador" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Não foi possível abrir o navegador automaticamente" -ForegroundColor Yellow
    Write-Host "   Acesse manualmente: $dashboardUrl" -ForegroundColor Gray
}

Write-Host ""
Write-Host "💡 Alternativa via Supabase CLI:" -ForegroundColor Cyan
Write-Host "   supabase link --project-ref $ProjectRef" -ForegroundColor Gray
Write-Host "   supabase db execute --file $MigrationFile" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Documentação completa em: APLICAR_MIGRATION_MANUAL.md" -ForegroundColor Cyan
Write-Host ""

# Aguardar confirmação do usuário
Write-Host "Pressione qualquer tecla após aplicar a migration no dashboard..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "🧪 Verificando se a função foi criada..." -ForegroundColor Cyan
Write-Host ""

# Verificar se função existe via REST API
$headers = @{
    "apikey" = $env:SUPABASE_SERVICE_ROLE_KEY
    "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

try {
    # Tentar chamar a função com parâmetros inválidos (deve retornar erro "not_found")
    $testRideId = "00000000-0000-0000-0000-000000000000"
    $testDriverId = "00000000-0000-0000-0000-000000000000"
    
    $body = @{
        p_ride_id = $testRideId
        p_driver_profile_id = $testDriverId
        p_strategy = "exclusive_offer"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$env:VITE_SUPABASE_URL/rest/v1/rpc/accept_ride_atomic" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    if ($response.success -eq $false -and $response.reason -eq "not_found") {
        Write-Host "✅ Função accept_ride_atomic criada com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Resposta de teste:" -ForegroundColor Gray
        Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Gray
        Write-Host ""
        Write-Host "✅ Migration aplicada com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
        Write-Host "   1. Testar aceite de corrida no frontend" -ForegroundColor White
        Write-Host "   2. Testar concorrência (dois motoristas simultaneamente)" -ForegroundColor White
        Write-Host "   3. Atualizar componentes UI" -ForegroundColor White
        Write-Host "   4. Monitorar logs de erro" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "⚠️  Resposta inesperada da função:" -ForegroundColor Yellow
        Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    }
} catch {
    $errorMessage = $_.Exception.Message
    
    if ($errorMessage -like "*404*" -or $errorMessage -like "*not found*") {
        Write-Host "❌ Função accept_ride_atomic não foi encontrada" -ForegroundColor Red
        Write-Host "   Verifique se a migration foi aplicada corretamente no dashboard" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Erro ao verificar função: $errorMessage" -ForegroundColor Yellow
        Write-Host "   A função pode ter sido criada, mas não foi possível verificar" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "🎉 Script concluído!" -ForegroundColor Green
Write-Host ""
