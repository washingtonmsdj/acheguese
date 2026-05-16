# ============================================================================
# Script: Executar Seed Gastronomy Mock no Supabase (PowerShell)
# ============================================================================
# Uso: .\scripts\manual\seed\executar_seed.ps1
# ============================================================================

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..\..")
Set-Location $repoRoot

$seedFile = "supabase/seed_gastronomy_mock.sql"
$cleanupFile = "scripts/manual/sql/LIMPAR_DADOS_MOCK.sql"

Write-Host "Executando Seed Gastronomy Mock..." -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Supabase CLI nao encontrado." -ForegroundColor Red
    Write-Host "Instale com: npm install -g supabase"
    exit 1
}

try {
    supabase projects list | Out-Null
} catch {
    Write-Host "Voce nao esta logado no Supabase." -ForegroundColor Red
    Write-Host "Faca login com: supabase login"
    exit 1
}

if (-not (Test-Path $seedFile)) {
    Write-Host "Arquivo $seedFile nao encontrado." -ForegroundColor Red
    exit 1
}

Write-Host "Arquivo encontrado: $seedFile" -ForegroundColor Green
Write-Host ""

$limpar = Read-Host "Deseja limpar dados mock antigos antes? (s/N)"
Write-Host ""

if ($limpar -match "^[Ss]$") {
    Write-Host "Limpando dados antigos..." -ForegroundColor Yellow
    if (Test-Path $cleanupFile) {
        supabase db execute --file $cleanupFile
        Write-Host "Dados antigos removidos." -ForegroundColor Green
    } else {
        Write-Host "Arquivo $cleanupFile nao encontrado, pulando limpeza." -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "Executando seed..." -ForegroundColor Cyan
Write-Host ""

try {
    supabase db execute --file $seedFile
    Write-Host ""
    Write-Host "Seed executado com sucesso." -ForegroundColor Green
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Acesse: http://localhost:5173/gastronomia/pizzaria-bella-napoli"
    Write-Host "  2. Verifique se o cardapio aparece"
} catch {
    Write-Host ""
    Write-Host "Erro ao executar seed." -ForegroundColor Red
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Verifique se as migrations foram executadas: supabase db reset"
    Write-Host "  2. Verifique os logs de erro acima"
    exit 1
}
