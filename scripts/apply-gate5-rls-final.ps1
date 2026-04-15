# GATE 5: Aplicar RLS Fix via Supabase CLI

Write-Host "GATE 5: Aplicando RLS Fix"
Write-Host ""

# Ler SQL do arquivo
$sqlFile = Join-Path $PSScriptRoot ".." "APLICAR_GATE5_RLS_FIX.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "Erro: arquivo SQL nao encontrado: $sqlFile"
    exit 1
}

$sql = Get-Content $sqlFile -Raw

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
    Write-Host "Erro: variaveis de ambiente nao definidas"
    exit 1
}

# Extrair project ref
if ($supabaseUrl -match 'https://([^.]+)\.supabase\.co') {
    $projectRef = $matches[1]
} else {
    Write-Host "Erro: nao foi possivel extrair project ref"
    exit 1
}

Write-Host "Project: $projectRef"
Write-Host ""

# Salvar SQL em arquivo temporário
$tempSqlFile = Join-Path $env:TEMP "gate5-rls-fix.sql"
$sql | Out-File -FilePath $tempSqlFile -Encoding UTF8 -NoNewline

Write-Host "SQL salvo em: $tempSqlFile"
Write-Host ""

# Construir DB URL
$dbUrl = "postgresql://postgres.$projectRef`:$supabaseKey@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

Write-Host "Executando via Supabase CLI..."
Write-Host ""

# Executar
$output = & supabase db execute --db-url $dbUrl --file $tempSqlFile 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "SQL executado com sucesso!"
    Write-Host $output
} else {
    Write-Host "Erro ao executar SQL:"
    Write-Host $output
    Write-Host ""
    Write-Host "Solucao manual:"
    Write-Host "1. Abra Supabase Dashboard > SQL Editor"
    Write-Host "2. Copie e cole o conteudo de APLICAR_GATE5_RLS_FIX.sql"
    Write-Host "3. Execute"
    
    # Limpar
    Remove-Item $tempSqlFile -ErrorAction SilentlyContinue
    exit 1
}

# Limpar
Remove-Item $tempSqlFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Processo concluido!"
