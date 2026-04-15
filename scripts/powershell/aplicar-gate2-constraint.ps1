# Script para aplicar UNIQUE constraint do GATE 2

Write-Host "🚀 GATE 2: Aplicando UNIQUE Constraint" -ForegroundColor Cyan
Write-Host ""

# URL do SQL Editor
$sqlEditorUrl = "https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql"

# Caminho da migration
$migrationPath = Join-Path $PSScriptRoot "supabase\migrations\20260407000003_gate2_add_unique_constraint.sql"

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
    Write-Host "  5. Valide que aparece: 'Success'"
    Write-Host "  6. Execute: npm run test tests/operational/gate2-operational-validation.test.ts"
    Write-Host ""
    
    Write-Host "📋 SQL A SER EXECUTADO:" -ForegroundColor Cyan
    Write-Host $migrationContent -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "❌ Arquivo de migration não encontrado!" -ForegroundColor Red
    Write-Host "   Esperado em: $migrationPath" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "✨ Pronto! O SQL está na sua área de transferência." -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Após aplicar, execute o teste operacional:" -ForegroundColor Yellow
Write-Host "   npm run test tests/operational/gate2-operational-validation.test.ts" -ForegroundColor White
Write-Host ""
