# Script para abrir SQL Editor do Supabase e copiar migration do GATE 2

Write-Host "🚀 GATE 2: Abrindo SQL Editor do Supabase..." -ForegroundColor Cyan
Write-Host ""

# URL do SQL Editor
$sqlEditorUrl = "https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql"

# Caminho da migration
$migrationPath = Join-Path $PSScriptRoot "supabase\migrations\20260407000002_gate2_driver_locations_minimal.sql"

# Verificar se arquivo existe
if (Test-Path $migrationPath) {
    Write-Host "✅ Migration encontrada: $migrationPath" -ForegroundColor Green
    Write-Host ""
    
    # Ler conteúdo da migration
    $migrationContent = Get-Content $migrationPath -Raw
    
    # Copiar para clipboard
    Set-Clipboard -Value $migrationContent
    Write-Host "📋 SQL copiado para a área de transferência!" -ForegroundColor Green
    Write-Host ""
    
    # Abrir navegador
    Write-Host "🌐 Abrindo SQL Editor no navegador..." -ForegroundColor Cyan
    Start-Process $sqlEditorUrl
    Write-Host ""
    
    Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "  1. Aguarde o SQL Editor abrir no navegador"
    Write-Host "  2. Clique em 'New query'"
    Write-Host "  3. Cole o SQL (Ctrl+V) - já está na área de transferência!"
    Write-Host "  4. Clique em 'Run' ou pressione Ctrl+Enter"
    Write-Host "  5. Valide que aparece: 'NOTICE: GATE 2 Migration: All columns created successfully'"
    Write-Host "  6. Execute: npm run apply:gate2 (para confirmar)"
    Write-Host ""
    
} else {
    Write-Host "❌ Arquivo de migration não encontrado!" -ForegroundColor Red
    Write-Host "   Esperado em: $migrationPath" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "✨ Pronto! O SQL está na sua área de transferência." -ForegroundColor Green
Write-Host ""
