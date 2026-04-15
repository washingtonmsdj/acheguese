# GATE 5: Aplicar RLS Fix via Supabase CLI

Write-Host "🚀 GATE 5: Aplicando RLS Fix" -ForegroundColor Green
Write-Host ""

# Ler variáveis de ambiente
$envFile = Join-Path $PSScriptRoot ".." ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Erro: variáveis de ambiente não definidas" -ForegroundColor Red
    exit 1
}

# Extrair project ref
if ($supabaseUrl -match 'https://([^.]+)\.supabase\.co') {
    $projectRef = $matches[1]
} else {
    Write-Host "❌ Erro: não foi possível extrair project ref" -ForegroundColor Red
    exit 1
}

Write-Host "📍 Project: $projectRef" -ForegroundColor Cyan
Write-Host ""

# Ler SQL do arquivo
$sqlFile = Join-Path $PSScriptRoot ".." "APLICAR_GATE5_RLS_FIX.sql"
$sql = Get-Content $sqlFile -Raw

# Salvar SQL em arquivo temporário
$tempSqlFile = Join-Path $env:TEMP "gate5-rls-fix.sql"
$sql | Out-File -FilePath $tempSqlFile -Encoding UTF8

Write-Host "📝 SQL salvo em: $tempSqlFile" -ForegroundColor Cyan
Write-Host ""

# Tentar executar via supabase db execute
Write-Host "🔄 Executando via Supabase CLI..." -ForegroundColor Yellow
Write-Host ""

$dbUrl = "postgresql://postgres.$projectRef`:$supabaseKey@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

try {
    # Usar supabase db execute
    $output = & supabase db execute --db-url $dbUrl --file $tempSqlFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SQL executado com sucesso!" -ForegroundColor Green
        Write-Host $output
    } else {
        Write-Host "❌ Erro ao executar SQL:" -ForegroundColor Red
        Write-Host $output
        
        Write-Host ""
        Write-Host "📝 Solução manual:" -ForegroundColor Yellow
        Write-Host "1. Abra Supabase Dashboard > SQL Editor"
        Write-Host "2. Copie e cole o conteúdo de APLICAR_GATE5_RLS_FIX.sql"
        Write-Host "3. Execute"
        exit 1
    }
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Solução manual:" -ForegroundColor Yellow
    Write-Host "1. Abra Supabase Dashboard > SQL Editor"
    Write-Host "2. Copie e cole o conteúdo de APLICAR_GATE5_RLS_FIX.sql"
    Write-Host "3. Execute"
    exit 1
}

# Limpar arquivo temporário
Remove-Item $tempSqlFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Processo concluído!" -ForegroundColor Green
