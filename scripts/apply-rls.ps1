# GATE 5: Aplicar RLS Fix

Write-Host "GATE 5: Aplicando RLS Fix"

# Carregar .env
$envPath = "..\.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

$url = $env:VITE_SUPABASE_URL
$key = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $url -or -not $key) {
    Write-Host "Erro: variaveis nao definidas"
    exit 1
}

# Extrair project
$url -match 'https://([^.]+)\.supabase\.co' | Out-Null
$project = $matches[1]

Write-Host "Project: $project"

# SQL
$sqlPath = "..\APLICAR_GATE5_RLS_FIX.sql"
$sql = Get-Content $sqlPath -Raw

# Salvar temp
$temp = "$env:TEMP\gate5.sql"
$sql | Out-File $temp -Encoding UTF8

# DB URL
$dbUrl = "postgresql://postgres.$project`:$key@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Executar
Write-Host "Executando..."
& supabase db execute --db-url $dbUrl --file $temp

Remove-Item $temp -ErrorAction SilentlyContinue

Write-Host "Concluido!"
