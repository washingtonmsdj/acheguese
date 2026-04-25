#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Aplica o seed da Pizzaria Bella Napoli no Supabase usando diferentes métodos.
.DESCRIPTION
    Tenta aplicar o seed via Supabase CLI, Node.js ou instruções manuais.
#>

$ErrorActionPreference = "Stop"

Write-Host "🍕 Aplicando Seed da Pizzaria Bella Napoli" -ForegroundColor Cyan
Write-Host ""

$seedFile = "$PSScriptRoot\..\supabase\seed_bella_napoli_mock.sql"

# Método 1: Supabase CLI (preferido)
Write-Host "📡 Tentando via Supabase CLI..." -ForegroundColor Yellow
$cliCheck = supabase --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   CLI encontrada: $cliCheck" -ForegroundColor Green
    try {
        supabase sql -f "$seedFile"
        Write-Host "✅ Seed aplicado via Supabase CLI!" -ForegroundColor Green
        exit 0
    } catch {
        Write-Host "   ⚠️  CLI falhou, tentando próximo método..." -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Supabase CLI não encontrada" -ForegroundColor Yellow
}

# Método 2: Node.js
Write-Host "📡 Tentando via Node.js..." -ForegroundColor Yellow
$nodeCheck = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Node encontrado: $nodeCheck" -ForegroundColor Green
    Push-Location "$PSScriptRoot\.."
    try {
        node scripts\apply-bella-napoli-seed.js
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Seed aplicado via Node.js!" -ForegroundColor Green
            exit 0
        }
    } catch {
        Write-Host "   ⚠️  Node falhou, tentando próximo método..." -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
} else {
    Write-Host "   ⚠️  Node.js não encontrado" -ForegroundColor Yellow
}

# Método 3: psql (PostgreSQL client)
Write-Host "📡 Tentando via psql..." -ForegroundColor Yellow
$psqlCheck = psql --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   psql encontrado: $psqlCheck" -ForegroundColor Green
    # Nota: psql requer connection string, que pode variar
    Write-Host "   ⚠️  psql encontrado mas requer configuração manual" -ForegroundColor Yellow
}

# Fallback: Instruções manuais
Write-Host ""
Write-Host "📋 INSTRUÇÕES MANUAIS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Acesse o Supabase Dashboard:" -ForegroundColor White
Write-Host "   https://app.supabase.com/project/_/sql" -ForegroundColor Blue
Write-Host ""
Write-Host "2. No SQL Editor, execute o conteúdo de:" -ForegroundColor White
Write-Host "   $seedFile" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Ou copie e cole o SQL abaixo:" -ForegroundColor White
Write-Host ""

# Mostra as primeiras linhas do SQL
$lines = Get-Content $seedFile -TotalCount 30
$lines | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray }
Write-Host "   ... (arquivo completo tem $( (Get-Content $seedFile).Count ) linhas)" -ForegroundColor DarkGray

Write-Host ""
Write-Host "✅ Pronto! O seed irá ATUALIZAR a pizzaria existente com:" -ForegroundColor Green
Write-Host "   • niche_key = 'pizza'" -ForegroundColor White
Write-Host "   • 9 categorias de cardápio" -ForegroundColor White
Write-Host "   • 56 itens (pizzas, bebidas, sobremesas)" -ForegroundColor White
Write-Host "   • 5 tamanhos, 18 sabores, 5 bordas, 5 massas" -ForegroundColor White
