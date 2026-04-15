# GATE 3: Aplicar correção de constraint e executar testes

$url = "https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new"
$sqlFile = "APLICAR_NO_SUPABASE_GATE3_CONSTRAINT.sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GATE 3: Corrigir Constraint de Status" -ForegroundColor Cyan
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
Write-Host "5. Verifique se apareceu 'Success' e a query de verificação retornou o constraint"
Write-Host ""
Write-Host "O que esta correção faz:" -ForegroundColor Cyan
Write-Host "- Atualiza CHECK constraint para incluir todos os estados da state machine"
Write-Host "- Adiciona colunas cancelled_at e cancellation_reason"
Write-Host "- Cria índice para consultas de cancelamento"
Write-Host ""
Write-Host "Após aplicar, execute:" -ForegroundColor Yellow
Write-Host "npm run test tests/operational/gate3-cancellation-validation.test.ts"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan