# Script para Remover @ts-nocheck e Corrigir Erros TypeScript
# Fase 2 da Limpeza do Projeto

Write-Host "Iniciando remocao de @ts-nocheck..." -ForegroundColor Cyan

# Funcao para remover @ts-nocheck de um arquivo
function Remove-TsNocheck {
    param (
        [string]$FilePath
    )
    
    try {
        $content = Get-Content $FilePath -Raw -ErrorAction Stop
        if ($content -match '//\s*@ts-nocheck') {
            $newContent = $content -replace '//\s*@ts-nocheck\s*\n', ''
            Set-Content -Path $FilePath -Value $newContent -NoNewline -ErrorAction Stop
            return $true
        }
        return $false
    } catch {
        Write-Host "  [ERRO] Nao foi possivel processar: $FilePath" -ForegroundColor Red
        return $false
    }
}

# Prioridade 1: Core Admin Services (CRITICO)
Write-Host "`nFase 1: Core Admin Services..." -ForegroundColor Yellow
$adminServices = @(
    "src/core/admin/index.ts",
    "src/core/admin/services/AdminBusinessService.ts",
    "src/core/admin/services/AdminCommunityAlertsService.ts",
    "src/core/admin/services/AdminCommunityIssuesService.ts",
    "src/core/admin/services/AdminCommunityService.ts",
    "src/core/admin/services/AdminCrudService.ts",
    "src/core/admin/services/AdminDataService.ts",
    "src/core/admin/services/AdminFraudService.ts",
    "src/core/admin/services/AdminGastronomyService.ts",
    "src/core/admin/services/AdminMobilityService.ts",
    "src/core/admin/services/AdminNotificationsService.ts",
    "src/core/admin/services/AdminPickupPointsService.ts",
    "src/core/admin/services/AdminPromotionsService.ts"
)

$adminCount = 0
foreach ($file in $adminServices) {
    if (Test-Path $file) {
        if (Remove-TsNocheck -FilePath $file) {
            Write-Host "  [OK] Removido @ts-nocheck de: $file" -ForegroundColor Green
            $adminCount++
        }
    } else {
        Write-Host "  [AVISO] Arquivo nao encontrado: $file" -ForegroundColor Yellow
    }
}
Write-Host "  Total: $adminCount arquivos processados" -ForegroundColor Cyan

# Prioridade 2: Shared Types (CRITICO)
Write-Host "`nFase 2: Shared Types..." -ForegroundColor Yellow
if (Test-Path "src/shared/types") {
    $sharedTypes = Get-ChildItem -Path "src/shared/types" -Filter "*.ts" -Recurse -ErrorAction SilentlyContinue
    
    $typesCount = 0
    foreach ($file in $sharedTypes) {
        if (Remove-TsNocheck -FilePath $file.FullName) {
            Write-Host "  [OK] Removido @ts-nocheck de: $($file.FullName)" -ForegroundColor Green
            $typesCount++
        }
    }
    Write-Host "  Total: $typesCount arquivos processados" -ForegroundColor Cyan
} else {
    Write-Host "  [AVISO] Pasta src/shared/types nao encontrada" -ForegroundColor Yellow
    $typesCount = 0
}

# Prioridade 3: Shared Utils (CRITICO)
Write-Host "`nFase 3: Shared Utils..." -ForegroundColor Yellow
if (Test-Path "src/shared/utils") {
    $sharedUtils = Get-ChildItem -Path "src/shared/utils" -Filter "*.ts" -Recurse -ErrorAction SilentlyContinue
    
    $utilsCount = 0
    foreach ($file in $sharedUtils) {
        if (Remove-TsNocheck -FilePath $file.FullName) {
            Write-Host "  [OK] Removido @ts-nocheck de: $($file.FullName)" -ForegroundColor Green
            $utilsCount++
        }
    }
    Write-Host "  Total: $utilsCount arquivos processados" -ForegroundColor Cyan
} else {
    Write-Host "  [AVISO] Pasta src/shared/utils nao encontrada" -ForegroundColor Yellow
    $utilsCount = 0
}

# Prioridade 4: Validation Schemas (CRITICO)
Write-Host "`nFase 4: Validation Schemas..." -ForegroundColor Yellow
if (Test-Path "src/shared/validation") {
    $validationFiles = Get-ChildItem -Path "src/shared/validation" -Filter "*.ts" -Recurse -ErrorAction SilentlyContinue
    
    $validationCount = 0
    foreach ($file in $validationFiles) {
        if (Remove-TsNocheck -FilePath $file.FullName) {
            Write-Host "  [OK] Removido @ts-nocheck de: $($file.FullName)" -ForegroundColor Green
            $validationCount++
        }
    }
    Write-Host "  Total: $validationCount arquivos processados" -ForegroundColor Cyan
} else {
    Write-Host "  [AVISO] Pasta src/shared/validation nao encontrada" -ForegroundColor Yellow
    $validationCount = 0
}

# Prioridade 5: Shared Stores e Services
Write-Host "`nFase 5: Shared Stores e Services..." -ForegroundColor Yellow
$sharedOthers = @(
    "src/shared/stores/businessStore.ts",
    "src/shared/services/IBGEService.ts",
    "src/shared/schemas/professional/professionalSchemas.ts"
)

$othersCount = 0
foreach ($file in $sharedOthers) {
    if (Test-Path $file) {
        if (Remove-TsNocheck -FilePath $file) {
            Write-Host "  [OK] Removido @ts-nocheck de: $file" -ForegroundColor Green
            $othersCount++
        }
    }
}
Write-Host "  Total: $othersCount arquivos processados" -ForegroundColor Cyan

# Executar TypeCheck para ver erros
Write-Host "`nExecutando TypeCheck..." -ForegroundColor Yellow
Write-Host "  [AVISO] Isso pode revelar erros que estavam escondidos" -ForegroundColor Red
Write-Host ""

# Resumo
$totalProcessed = $adminCount + $typesCount + $utilsCount + $validationCount + $othersCount
Write-Host "========================================" -ForegroundColor Green
Write-Host "REMOCAO DE @ts-nocheck CONCLUIDA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nResumo:" -ForegroundColor Cyan
Write-Host "  - Core Admin Services: $adminCount arquivos" -ForegroundColor White
Write-Host "  - Shared Types: $typesCount arquivos" -ForegroundColor White
Write-Host "  - Shared Utils: $utilsCount arquivos" -ForegroundColor White
Write-Host "  - Validation Schemas: $validationCount arquivos" -ForegroundColor White
Write-Host "  - Outros: $othersCount arquivos" -ForegroundColor White
Write-Host "  - TOTAL: $totalProcessed arquivos processados" -ForegroundColor Cyan

Write-Host "`nProximos passos:" -ForegroundColor Yellow
Write-Host "  1. Revisar erros TypeScript revelados" -ForegroundColor White
Write-Host "  2. Corrigir erros um por um" -ForegroundColor White
Write-Host "  3. Executar: npm run typecheck" -ForegroundColor White
Write-Host "  4. Executar: npm run lint" -ForegroundColor White
Write-Host "  5. Commit das correcoes" -ForegroundColor White
Write-Host ""
