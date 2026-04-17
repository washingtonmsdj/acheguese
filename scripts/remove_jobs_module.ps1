# ═══════════════════════════════════════════════════════════════════════════════
# SCRIPT: Remover Módulo Jobs Obsoleto
# ═══════════════════════════════════════════════════════════════════════════════
#
# Este script remove completamente o módulo jobs obsoleto após a consolidação
# com o módulo vagas. Execute apenas após validar que não há imports ativos.
#
# ⚠️  ATENÇÃO: Este script é DESTRUTIVO. Faça backup antes de executar.
# ═══════════════════════════════════════════════════════════════════════════════

# Verificar se estamos na raiz do projeto
if (-not (Test-Path "src\modules\jobs")) {
    Write-Host "❌ Erro: Diretório src\modules\jobs não encontrado." -ForegroundColor Red
    Write-Host "Execute este script na raiz do projeto." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  REMOÇÃO DO MÓDULO JOBS OBSOLETO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Verificar imports ativos no código
Write-Host "🔍 Passo 1: Verificando imports ativos de 'jobs'..." -ForegroundColor Yellow

$importsFromJobs = @()
$filesToCheck = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" -ErrorAction SilentlyContinue

foreach ($file in $filesToCheck) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match "from ['\"]@/modules/jobs" -or $content -match "from ['\"]\.\./jobs" -or $content -match "from ['\"]\.\/jobs") {
        $importsFromJobs += $file.FullName
    }
}

if ($importsFromJobs.Count -gt 0) {
    Write-Host "⚠️  Atenção: Foram encontrados imports ativos de 'jobs':" -ForegroundColor Red
    foreach ($file in $importsFromJobs) {
        Write-Host "   - $file" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "❌ Abortando: Corrija os imports antes de prosseguir." -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Nenhum import ativo encontrado." -ForegroundColor Green
Write-Host ""

# Passo 2: Listar arquivos que serão removidos
Write-Host "📁 Passo 2: Arquivos a serem removidos:" -ForegroundColor Yellow

$jobsDir = "src\modules\jobs"
$filesToRemove = Get-ChildItem -Path $jobsDir -Recurse -File

foreach ($file in $filesToRemove) {
    $relativePath = $file.FullName.Replace($PWD.Path + "\", "")
    Write-Host "   - $relativePath" -ForegroundColor Gray
}

Write-Host ""
Write-Host "   Total: $($filesToRemove.Count) arquivos" -ForegroundColor Cyan
Write-Host ""

# Passo 3: Confirmar remoção
Write-Host "⚠️  CONFIRMAÇÃO" -ForegroundColor Red
$confirmation = Read-Host "Digite 'REMOVER' para confirmar a exclusão permanente do módulo jobs"

if ($confirmation -ne "REMOVER") {
    Write-Host ""
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Yellow
    exit 0
}

# Passo 4: Executar remoção
Write-Host ""
Write-Host "🗑️  Passo 4: Removendo módulo jobs..." -ForegroundColor Yellow

try {
    Remove-Item -Path $jobsDir -Recurse -Force -ErrorAction Stop
    Write-Host "   ✅ Módulo jobs removido com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao remover: $_" -ForegroundColor Red
    exit 1
}

# Passo 5: Verificar se há referências em package.json, tsconfig, etc.
Write-Host ""
Write-Host "🔍 Passo 5: Verificando referências em arquivos de configuração..." -ForegroundColor Yellow

$configFiles = @("package.json", "tsconfig.json", "vite.config.ts", ".eslintrc.json")
$foundReferences = @()

foreach ($configFile in $configFiles) {
    if (Test-Path $configFile) {
        $content = Get-Content $configFile -Raw -ErrorAction SilentlyContinue
        if ($content -match "jobs") {
            $foundReferences += $configFile
        }
    }
}

if ($foundReferences.Count -gt 0) {
    Write-Host "   ⚠️  Referências encontradas em:" -ForegroundColor Yellow
    foreach ($file in $foundReferences) {
        Write-Host "      - $file" -ForegroundColor Gray
    }
    Write-Host "   Revise manualmente estes arquivos." -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Nenhuma referência encontrada em arquivos de configuração." -ForegroundColor Green
}

# Resumo final
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ REMOÇÃO CONCLUÍDA COM SUCESSO" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Execute: npm run type-check" -ForegroundColor Gray
Write-Host "   2. Execute: npm run lint" -ForegroundColor Gray
Write-Host "   3. Execute: npm run build" -ForegroundColor Gray
Write-Host "   4. Teste as páginas de vagas no navegador" -ForegroundColor Gray
Write-Host ""
Write-Host "Módulo vagas consolidado e pronto para uso! 🚀" -ForegroundColor Cyan
Write-Host ""
