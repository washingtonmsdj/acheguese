# Script para aplicar migration do dispatch hibrido

$MigrationFile = "src/modules/mobility/migrations/create_accept_ride_atomic_rpc.sql"

Write-Host "Aplicando migration do dispatch hibrido..." -ForegroundColor Cyan
Write-Host ""

# Verificar arquivo
if (-not (Test-Path $MigrationFile)) {
    Write-Host "Erro: Arquivo nao encontrado: $MigrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Arquivo encontrado" -ForegroundColor Green
Write-Host ""

# Carregar secrets
Write-Host "Carregando credenciais..." -ForegroundColor Cyan

try {
    & .\scripts\security\Import-LocalSupabaseSecrets.ps1
    Write-Host "Credenciais carregadas" -ForegroundColor Green
} catch {
    Write-Host "Erro ao carregar credenciais" -ForegroundColor Red
    Write-Host ""
    Write-Host "Obtenha a service role key em:" -ForegroundColor Yellow
    Write-Host "Supabase Dashboard > Settings > API > service_role key" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Ler SQL
$sql = Get-Content $MigrationFile -Raw
Write-Host "SQL: $($sql.Length) caracteres" -ForegroundColor Gray
Write-Host ""

# Copiar para clipboard
$sql | Set-Clipboard
Write-Host "SQL copiado para o clipboard!" -ForegroundColor Green
Write-Host ""

# Abrir dashboard
$url = $env:VITE_SUPABASE_URL.Replace("/rest/v1", "") + "/project/_/sql"

Write-Host "Instrucoes:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Abrindo Supabase Dashboard..." -ForegroundColor White
Write-Host "2. Va para: SQL Editor > New Query" -ForegroundColor White
Write-Host "3. Cole o SQL (Ctrl+V)" -ForegroundColor White
Write-Host "4. Clique em Run" -ForegroundColor White
Write-Host ""

Start-Process $url

Write-Host "Pressione qualquer tecla apos aplicar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Testando funcao..." -ForegroundColor Cyan

# Testar funcao
$headers = @{
    "apikey" = $env:SUPABASE_SERVICE_ROLE_KEY
    "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    p_ride_id = "00000000-0000-0000-0000-000000000000"
    p_driver_profile_id = "00000000-0000-0000-0000-000000000000"
    p_strategy = "exclusive_offer"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "$env:VITE_SUPABASE_URL/rest/v1/rpc/accept_ride_atomic" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    Write-Host "Funcao criada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resposta:" -ForegroundColor Gray
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Erro ao testar: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Verifique se aplicou corretamente no dashboard" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Concluido!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Testar aceite de corrida" -ForegroundColor White
Write-Host "2. Testar concorrencia" -ForegroundColor White
Write-Host "3. Atualizar componentes UI" -ForegroundColor White
Write-Host ""
