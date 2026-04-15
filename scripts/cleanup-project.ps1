#!/usr/bin/env pwsh
# Script de limpeza profissional do projeto

param(
    [switch]$DryRun = $false
)

Write-Host "Iniciando limpeza do projeto..." -ForegroundColor Cyan

# Criar estrutura de diretórios
Write-Host "`nVerificando estrutura de diretorios..." -ForegroundColor Cyan
$archiveDirs = @(
    "docs/archive/migrations",
    "docs/archive/audits",
    "docs/archive/reports",
    "docs/archive/gates",
    "docs/archive/plans",
    "docs/archive/logs"
)

foreach ($dir in $archiveDirs) {
    if (-not (Test-Path $dir)) {
        if (-not $DryRun) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            Write-Host "  Criado: $dir" -ForegroundColor Green
        }
    }
}

# Mover documentação histórica
Write-Host "`nOrganizando documentacao historica..." -ForegroundColor Cyan

# Migrações
if (-not $DryRun) {
    Get-ChildItem -Path "." -Filter "MIGRACAO_*.md" -ErrorAction SilentlyContinue | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "docs/archive/migrations/" -Force -ErrorAction SilentlyContinue
        Write-Host "  Movido: $($_.Name)" -ForegroundColor Green
    }
}

# Auditorias
if (-not $DryRun) {
    Get-ChildItem -Path "." -Filter "AUDITORIA_*.md" -ErrorAction SilentlyContinue | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "docs/archive/audits/" -Force -ErrorAction SilentlyContinue
        Write-Host "  Movido: $($_.Name)" -ForegroundColor Green
    }
}

# Relatórios
if (-not $DryRun) {
    $reportPatterns = @("PROGRESSO_*.md", "STATUS_*.md", "RESUMO_*.md", "LOTE_*.md", 
                        "SUMARIO_*.md", "BASELINE_*.md", "DEPENDENCY_*.md", "TESTE_*.md",
                        "CORRECAO_*.md", "CORRECOES_*.md", "ANALISE_*.md", "PROPOSTA_*.md",
                        "RESPOSTA_*.md", "SOLUCAO_*.md", "USUARIO_*.md", "REMOCAO_*.md")

    foreach ($pattern in $reportPatterns) {
        Get-ChildItem -Path "." -Filter $pattern -ErrorAction SilentlyContinue | ForEach-Object {
            Move-Item -Path $_.FullName -Destination "docs/archive/reports/" -Force -ErrorAction SilentlyContinue
            Write-Host "  Movido: $($_.Name)" -ForegroundColor Green
        }
    }
}

# Gates
if (-not $DryRun) {
    Get-ChildItem -Path "." -Filter "GATE_*.md" -ErrorAction SilentlyContinue | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "docs/archive/gates/" -Force -ErrorAction SilentlyContinue
        Write-Host "  Movido: $($_.Name)" -ForegroundColor Green
    }
}

# Planos
if (-not $DryRun) {
    Get-ChildItem -Path "." -Filter "PLANO_*.md" -ErrorAction SilentlyContinue | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "docs/archive/plans/" -Force -ErrorAction SilentlyContinue
        Write-Host "  Movido: $($_.Name)" -ForegroundColor Green
    }
    Get-ChildItem -Path "." -Filter "INSTRUCOES_*.md" -ErrorAction SilentlyContinue | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "docs/archive/plans/" -Force -ErrorAction SilentlyContinue
        Write-Host "  Movido: $($_.Name)" -ForegroundColor Green
    }
}

# Mover logs
Write-Host "`nOrganizando logs..." -ForegroundColor Cyan
if (-not $DryRun) {
    Get-ChildItem -Path "." -Filter "*.txt" -ErrorAction SilentlyContinue | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "docs/archive/logs/" -Force -ErrorAction SilentlyContinue
        Write-Host "  Movido: $($_.Name)" -ForegroundColor Green
    }
    if (Test-Path "test-results.json") {
        Move-Item -Path "test-results.json" -Destination "docs/archive/logs/" -Force -ErrorAction SilentlyContinue
        Write-Host "  Movido: test-results.json" -ForegroundColor Green
    }
}

# Limpar arquivos temporários
Write-Host "`nRemovendo arquivos temporarios..." -ForegroundColor Cyan
if (-not $DryRun) {
    if (Test-Path "bun.lock") {
        Remove-Item "bun.lock" -Force -ErrorAction SilentlyContinue
        Write-Host "  Removido: bun.lock" -ForegroundColor Green
    }
}

# Limpar dist
Write-Host "`nLimpando build artifacts..." -ForegroundColor Cyan
if (-not $DryRun) {
    if (Test-Path "dist") {
        Remove-Item -Path "dist" -Force -Recurse -ErrorAction SilentlyContinue
        Write-Host "  Removido: dist/" -ForegroundColor Green
    }
}

# Relatório final
Write-Host "`nRelatorio de Limpeza" -ForegroundColor Cyan
Write-Host "  Documentacao organizada em docs/archive/" -ForegroundColor Green
Write-Host "  Logs movidos para docs/archive/logs/" -ForegroundColor Green
Write-Host "  Arquivos temporarios removidos" -ForegroundColor Green
Write-Host "  Build artifacts limpos" -ForegroundColor Green

if ($DryRun) {
    Write-Host "`nMODO DRY RUN - Nenhuma alteracao foi feita" -ForegroundColor Yellow
    Write-Host "  Execute sem -DryRun para aplicar as mudancas" -ForegroundColor Yellow
}

Write-Host "`nLimpeza concluida!" -ForegroundColor Green
