# Script para aplicar seed final no Supabase
# Lê o arquivo SQL e executa via Supabase CLI

# Carregar variáveis de ambiente
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$dbUrl = $env:SUPABASE_DB_URL

if (-not $dbUrl) {
    Write-Host "ERRO: SUPABASE_DB_URL não configurada" -ForegroundColor Red
    Write-Host "Configure no arquivo .env:" -ForegroundColor Red
    Write-Host "SUPABASE_DB_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" -ForegroundColor Yellow
    exit 1
}

$sqlContent = Get-Content -Path "seed_final.sql" -Raw

# Salvar em arquivo temporário
$tempFile = "temp_seed.sql"
$sqlContent | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "Executando seed no banco remoto..." -ForegroundColor Cyan

# Executar via supabase db execute
supabase db execute --file $tempFile --db-url $dbUrl

# Limpar arquivo temporário
Remove-Item $tempFile

Write-Host "Seed aplicado com sucesso!" -ForegroundColor Green
