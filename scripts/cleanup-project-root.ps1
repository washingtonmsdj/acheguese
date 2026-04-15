# Script de Limpeza da Raiz do Projeto
# Objetivo: Organizar arquivos SQL, scripts e temporarios seguindo SSOT

Write-Host "Iniciando limpeza da raiz do projeto..." -ForegroundColor Cyan

# Criar estrutura de diretorios
Write-Host "`nCriando estrutura de diretorios..." -ForegroundColor Yellow
$directories = @(
    "scripts/migrations/sql",
    "scripts/debug",
    "scripts/temp",
    "scripts/powershell",
    ".archive/sql",
    ".archive/images",
    ".archive/temp"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  [OK] Criado: $dir" -ForegroundColor Green
    }
}

# Mover arquivos SQL para migrations
Write-Host "`nMovendo arquivos SQL..." -ForegroundColor Yellow
$sqlFiles = Get-ChildItem -Path . -Filter "*.sql" -File -ErrorAction SilentlyContinue
$sqlCount = 0
foreach ($file in $sqlFiles) {
    try {
        Move-Item -Path $file.FullName -Destination "scripts/migrations/sql/" -Force -ErrorAction Stop
        $sqlCount++
    } catch {
        Write-Host "  [AVISO] Nao foi possivel mover: $($file.Name)" -ForegroundColor Yellow
    }
}
Write-Host "  [OK] Movidos $sqlCount arquivos SQL" -ForegroundColor Green

# Mover scripts de teste/debug
Write-Host "`nMovendo scripts de debug..." -ForegroundColor Yellow
$debugPatterns = @(
    "*_test*.mjs",
    "*_validar*.mjs",
    "*_diagnosticar*.mjs",
    "*_verificar*.mjs",
    "*_testar*.mjs",
    "*_aplicar*.mjs",
    "*_executar*.mjs",
    "*_criar*.mjs",
    "*_corrigir*.mjs",
    "*_gerar*.mjs",
    "*_simular*.mjs",
    "*_monitorar*.mjs",
    "*_inspecionar*.mjs",
    "*_forcar*.mjs",
    "*_limpar*.mjs",
    "*_cleanup*.mjs",
    "apply_*.mjs",
    "check_*.mjs",
    "validate_*.mjs",
    "verify_*.mjs"
)

$debugCount = 0
foreach ($pattern in $debugPatterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        try {
            Move-Item -Path $file.FullName -Destination "scripts/debug/" -Force -ErrorAction Stop
            $debugCount++
        } catch {
            Write-Host "  [AVISO] Nao foi possivel mover: $($file.Name)" -ForegroundColor Yellow
        }
    }
}
Write-Host "  [OK] Movidos $debugCount scripts de debug" -ForegroundColor Green

# Mover scripts PowerShell (exceto este script)
Write-Host "`nMovendo scripts PowerShell..." -ForegroundColor Yellow
$ps1Files = Get-ChildItem -Path . -Filter "*.ps1" -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne "cleanup-project-root.ps1" }
$ps1Count = 0
foreach ($file in $ps1Files) {
    try {
        Move-Item -Path $file.FullName -Destination "scripts/powershell/" -Force -ErrorAction Stop
        $ps1Count++
    } catch {
        Write-Host "  [AVISO] Nao foi possivel mover: $($file.Name)" -ForegroundColor Yellow
    }
}
Write-Host "  [OK] Movidos $ps1Count scripts PowerShell" -ForegroundColor Green

# Mover scripts TypeScript de teste
Write-Host "`nMovendo scripts TypeScript de teste..." -ForegroundColor Yellow
$tsTestPatterns = @(
    "apply_*.ts",
    "check_*.ts",
    "delete_*.ts",
    "execute_*.ts",
    "fix_*.ts",
    "test_*.ts",
    "verify_*.ts"
)

$tsCount = 0
foreach ($pattern in $tsTestPatterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        try {
            Move-Item -Path $file.FullName -Destination "scripts/debug/" -Force -ErrorAction Stop
            $tsCount++
        } catch {
            Write-Host "  [AVISO] Nao foi possivel mover: $($file.Name)" -ForegroundColor Yellow
        }
    }
}
Write-Host "  [OK] Movidos $tsCount scripts TypeScript de teste" -ForegroundColor Green

# Mover scripts JavaScript legados
Write-Host "`nMovendo scripts JavaScript legados..." -ForegroundColor Yellow
$jsFiles = Get-ChildItem -Path . -Filter "*.js" -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "apply|migration" }
$jsCount = 0
foreach ($file in $jsFiles) {
    try {
        Move-Item -Path $file.FullName -Destination "scripts/debug/" -Force -ErrorAction Stop
        $jsCount++
    } catch {
        Write-Host "  [AVISO] Nao foi possivel mover: $($file.Name)" -ForegroundColor Yellow
    }
}
Write-Host "  [OK] Movidos $jsCount scripts JavaScript" -ForegroundColor Green

# Arquivar temporarios
Write-Host "`nArquivando temporarios..." -ForegroundColor Yellow
$tempPatterns = @(
    "_tmp_*.sql",
    "audit_results.txt",
    "auditoria_banco_resultado.txt",
    "test-output.txt"
)

$archiveCount = 0
foreach ($pattern in $tempPatterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        try {
            Move-Item -Path $file.FullName -Destination ".archive/temp/" -Force -ErrorAction Stop
            $archiveCount++
        } catch {
            Write-Host "  [AVISO] Nao foi possivel arquivar: $($file.Name)" -ForegroundColor Yellow
        }
    }
}

# Arquivar imagens
$imageFiles = Get-ChildItem -Path . -Filter "*.png" -File -ErrorAction SilentlyContinue
foreach ($file in $imageFiles) {
    try {
        Move-Item -Path $file.FullName -Destination ".archive/images/" -Force -ErrorAction Stop
        $archiveCount++
    } catch {
        Write-Host "  [AVISO] Nao foi possivel arquivar: $($file.Name)" -ForegroundColor Yellow
    }
}

# Arquivar locks
$lockFiles = Get-ChildItem -Path . -Filter "*.lock*" -File -ErrorAction SilentlyContinue
foreach ($file in $lockFiles) {
    try {
        Move-Item -Path $file.FullName -Destination ".archive/temp/" -Force -ErrorAction Stop
        $archiveCount++
    } catch {
        Write-Host "  [AVISO] Nao foi possivel arquivar: $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "  [OK] Arquivados $archiveCount arquivos temporarios" -ForegroundColor Green

# Remover binarios
Write-Host "`nRemovendo binarios..." -ForegroundColor Yellow
if (Test-Path "ngrok.exe") {
    Remove-Item "ngrok.exe" -Force
    Write-Host "  [OK] Removido ngrok.exe" -ForegroundColor Green
}

# Atualizar .gitignore
Write-Host "`nAtualizando .gitignore..." -ForegroundColor Yellow
$gitignoreContent = @"

# Arquivos temporarios e debug (adicionado pela limpeza automatica)
.archive/
scripts/temp/
scripts/debug/*.log
*.tmp
_tmp_*

# Binarios
*.exe
*.dll

# Logs de auditoria
audit_results.txt
*_resultado.txt
test-output.txt
"@

try {
    Add-Content -Path ".gitignore" -Value $gitignoreContent -ErrorAction Stop
    Write-Host "  [OK] .gitignore atualizado" -ForegroundColor Green
} catch {
    Write-Host "  [AVISO] Nao foi possivel atualizar .gitignore" -ForegroundColor Yellow
}

# Resumo
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "LIMPEZA CONCLUIDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nResumo:" -ForegroundColor Cyan
Write-Host "  - $sqlCount arquivos SQL movidos para scripts/migrations/sql/" -ForegroundColor White
Write-Host "  - $debugCount scripts de debug movidos para scripts/debug/" -ForegroundColor White
Write-Host "  - $ps1Count scripts PowerShell movidos para scripts/powershell/" -ForegroundColor White
Write-Host "  - $tsCount scripts TypeScript movidos para scripts/debug/" -ForegroundColor White
Write-Host "  - $jsCount scripts JavaScript movidos para scripts/debug/" -ForegroundColor White
Write-Host "  - $archiveCount arquivos arquivados em .archive/" -ForegroundColor White

Write-Host "`nProximos passos:" -ForegroundColor Yellow
Write-Host "  1. Revisar arquivos movidos" -ForegroundColor White
Write-Host "  2. Executar: npm run lint" -ForegroundColor White
Write-Host "  3. Commit das mudancas" -ForegroundColor White
Write-Host "  4. Iniciar Fase 2: Remover @ts-nocheck" -ForegroundColor White
Write-Host ""
