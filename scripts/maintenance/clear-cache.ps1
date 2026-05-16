# Script para limpar cache do Vite e reiniciar ambiente local
# Uso: .\scripts\maintenance\clear-cache.ps1

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")
Set-Location $repoRoot

Write-Host "Limpando cache do Vite..." -ForegroundColor Cyan

if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "Cache do Vite limpo" -ForegroundColor Green
} else {
    Write-Host "Cache do Vite ja estava limpo" -ForegroundColor Yellow
}

if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "Pasta dist limpa" -ForegroundColor Green
}

if (Test-Path ".tmp") {
    Remove-Item -Recurse -Force ".tmp"
    Write-Host "Pasta .tmp limpa" -ForegroundColor Green
}

Write-Host ""
Write-Host "Cache limpo com sucesso." -ForegroundColor Green
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute: npm run dev"
Write-Host "2. Limpe o cache do navegador (Ctrl+Shift+R)"
Write-Host "3. Acesse: http://localhost:5173/comunicacao"
