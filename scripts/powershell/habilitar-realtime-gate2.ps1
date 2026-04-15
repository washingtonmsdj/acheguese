# GATE 2: Habilitar Realtime na tabela driver_locations

$url = "https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new"
$sqlFile = "APLICAR_NO_SUPABASE_HABILITAR_REALTIME.sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GATE 2: Habilitar Realtime" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

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
Write-Host "5. Verifique se apareceu 'Success' e a query de verificação retornou 1 linha"
Write-Host ""
Write-Host "O que esta configuração faz:" -ForegroundColor Cyan
Write-Host "- Adiciona driver_locations à publicação supabase_realtime"
Write-Host "- Habilita eventos de INSERT/UPDATE/DELETE via Realtime"
Write-Host "- Permite subscriptions receberem atualizações em tempo real"
Write-Host ""
Write-Host "Após aplicar, execute:" -ForegroundColor Yellow
Write-Host "npm run test tests/operational/gate2-real-auth-validation.test.ts"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

