# Health Check - Dispatch Automático
# Verifica se todos os componentes do dispatch estão funcionando

Write-Host "=== HEALTH CHECK - DISPATCH AUTOMATICO ===" -ForegroundColor Cyan
Write-Host ""

# Carregar variáveis de ambiente do .env
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$ANON_KEY = $env:VITE_SUPABASE_PUBLISHABLE_KEY

if (-not $SUPABASE_URL -or -not $ANON_KEY) {
    Write-Host "ERRO: Variáveis de ambiente não configuradas" -ForegroundColor Red
    Write-Host "Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env" -ForegroundColor Red
    exit 1
}

$allOk = $true

# 1. Edge Function
Write-Host "1. Edge Function..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $ANON_KEY"
        "apikey" = $ANON_KEY
    }
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/process-timeouts" -Method GET -Headers $headers -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   OK: Edge Function respondendo" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "   Processados: $($content.processed)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERRO: Edge Function nao responde" -ForegroundColor Red
    Write-Host "   Detalhes: $($_.Exception.Message)" -ForegroundColor Red
    $allOk = $false
}

Write-Host ""

# 2. Trigger SQL
Write-Host "2. Trigger SQL..." -ForegroundColor Yellow
try {
    $query = "SELECT COUNT(*) as count FROM information_schema.triggers WHERE trigger_name = 'trigger_start_dispatch'"
    $result = node -e "const { createClient } = require('@supabase/supabase-js'); const client = createClient('$SUPABASE_URL', '$ANON_KEY'); client.rpc('exec_sql', { query: '$query' }).then(r => console.log(JSON.stringify(r.data)));" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK: Trigger ativo" -ForegroundColor Green
    } else {
        Write-Host "   AVISO: Nao foi possivel verificar trigger" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   AVISO: Nao foi possivel verificar trigger" -ForegroundColor Yellow
}

Write-Host ""

# 3. Timeouts recentes
Write-Host "3. Timeouts recentes..." -ForegroundColor Yellow
Write-Host "   (Verificar manualmente no banco de dados)" -ForegroundColor Gray
Write-Host "   Query: SELECT MAX(created_at) FROM ride_dispatch_audit WHERE status = 'timeout'" -ForegroundColor Gray

Write-Host ""

# 4. Motoristas disponíveis
Write-Host "4. Motoristas disponiveis..." -ForegroundColor Yellow
Write-Host "   (Verificar manualmente no banco de dados)" -ForegroundColor Gray
Write-Host "   Query: SELECT COUNT(*) FROM driver_availability WHERE is_online = true AND is_available = true" -ForegroundColor Gray

Write-Host ""
Write-Host "=== RESUMO ===" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "Status: OK" -ForegroundColor Green
    Write-Host "Edge Function esta respondendo corretamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximo passo: Configurar cron externo (ver CONFIGURAR_CRON_EXTERNO.md)" -ForegroundColor Yellow
} else {
    Write-Host "Status: ERRO" -ForegroundColor Red
    Write-Host "Verifique os erros acima." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== FIM ===" -ForegroundColor Cyan
