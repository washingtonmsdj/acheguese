# Script para abrir o SQL Editor do Supabase e copiar o SQL para o clipboard

$url = "https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new"
$sqlFile = "APLICAR_NO_SUPABASE.sql"

Write-Host "📋 Copiando SQL para o clipboard..." -ForegroundColor Cyan
Get-Content $sqlFile | Set-Clipboard

Write-Host "✅ SQL copiado!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Abrindo SQL Editor do Supabase..." -ForegroundColor Cyan
Start-Process $url

Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. O SQL Editor vai abrir no navegador"
Write-Host "2. Cole o SQL (Ctrl+V) - já está no clipboard!"
Write-Host "3. Clique em 'Run' ou pressione Ctrl+Enter"
Write-Host "4. Aguarde a execução"
Write-Host "5. Verifique se apareceu 'Success'"
Write-Host ""
Write-Host "✨ Pronto!" -ForegroundColor Green
