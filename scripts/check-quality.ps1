# Script de verificacao de qualidade do codigo
# PowerShell version

Write-Host "Verificando qualidade do codigo..." -ForegroundColor Cyan
Write-Host ""

$issues = 0

# 1. Verificar lint
Write-Host "Verificando lint..." -ForegroundColor Yellow
$lintResult = npx eslint src/ --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Lint passou" -ForegroundColor Green
} else {
    Write-Host "ERRO Lint falhou" -ForegroundColor Red
    $issues++
}
Write-Host ""

# 2. Verificar TypeScript
Write-Host "Verificando TypeScript..." -ForegroundColor Yellow
$tscResult = npx tsc --noEmit
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK TypeScript passou" -ForegroundColor Green
} else {
    Write-Host "ERRO TypeScript falhou" -ForegroundColor Red
    $issues++
}
Write-Host ""

# 3. Contar as any
Write-Host "Contando 'as any'..." -ForegroundColor Yellow
$anyCount = (Select-String -Path "src/core/**/*.ts" -Pattern "as any" -ErrorAction SilentlyContinue | Measure-Object).Count
if ($anyCount -lt 100) {
    Write-Host "OK 'as any': $anyCount (meta: <100)" -ForegroundColor Green
} elseif ($anyCount -lt 300) {
    Write-Host "AVISO 'as any': $anyCount (meta: <100)" -ForegroundColor Yellow
} else {
    Write-Host "ERRO 'as any': $anyCount (meta: <100)" -ForegroundColor Red
    $issues++
}
Write-Host ""

# 4. Contar TODOs
Write-Host "Contando TODOs..." -ForegroundColor Yellow
$todoCount = (Select-String -Path "src/core/**/*.ts" -Pattern "TODO|FIXME" -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "INFO TODOs/FIXMEs: $todoCount" -ForegroundColor Blue
Write-Host ""

# 5. Verificar uso de enums
Write-Host "Verificando uso de enums..." -ForegroundColor Yellow
$enumImports = (Select-String -Path "src/core/**/*.ts" -Pattern "from '@/shared/types/enums'" -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "INFO Arquivos usando enums: $enumImports" -ForegroundColor Blue
Write-Host ""

# 6. Verificar uso de constantes
Write-Host "Verificando uso de constantes..." -ForegroundColor Yellow
$constImports = (Select-String -Path "src/core/**/*.ts" -Pattern "from '@/shared/constants'" -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "INFO Arquivos usando constantes: $constImports" -ForegroundColor Blue
Write-Host ""

# 7. Verificar uso de helpers tipados
Write-Host "Verificando uso de helpers tipados..." -ForegroundColor Yellow
$helperImports = (Select-String -Path "src/core/**/*.ts" -Pattern "from '@/shared/utils/supabase-helpers'" -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "INFO Arquivos usando helpers tipados: $helperImports" -ForegroundColor Blue
Write-Host ""

# Resultado final
Write-Host "========================================" -ForegroundColor Cyan
if ($issues -eq 0) {
    Write-Host "OK Todas as verificacoes passaram!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resumo de Qualidade:" -ForegroundColor Cyan
    Write-Host "  - Lint: OK" -ForegroundColor Green
    Write-Host "  - TypeScript: OK" -ForegroundColor Green
    Write-Host "  - 'as any': $anyCount"
    Write-Host "  - TODOs: $todoCount"
    Write-Host "  - Arquivos com enums: $enumImports"
    Write-Host "  - Arquivos com constantes: $constImports"
    Write-Host "  - Arquivos com helpers: $helperImports"
    Write-Host ""
    exit 0
} else {
    Write-Host "ERRO $issues verificacao(oes) falharam" -ForegroundColor Red
    Write-Host ""
    Write-Host "Dicas:" -ForegroundColor Yellow
    Write-Host "  - Execute 'npx eslint src/ --fix' para corrigir problemas de lint"
    Write-Host "  - Execute 'npx tsc --noEmit' para ver erros de TypeScript"
    Write-Host "  - Considere usar enums ao inves de strings hardcoded"
    Write-Host "  - Considere usar constantes ao inves de magic numbers"
    Write-Host ""
    exit 1
}
