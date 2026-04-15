# GATE 2: Script de Validação Operacional Real
# Executa teste E2E com autenticação real e gera relatório

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GATE 2 - VALIDAÇÃO OPERACIONAL REAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se .env.test existe
if (-not (Test-Path ".env.test")) {
    Write-Host "❌ Arquivo .env.test não encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Crie o arquivo .env.test com:" -ForegroundColor Yellow
    Write-Host "VITE_SUPABASE_URL=https://xhdowzacfujckjelqhtd.supabase.co" -ForegroundColor Gray
    Write-Host "VITE_SUPABASE_PUBLISHABLE_KEY=[SUA_ANON_KEY]" -ForegroundColor Gray
    Write-Host "TEST_DRIVER_EMAIL=test-driver@acheguese.local" -ForegroundColor Gray
    Write-Host "TEST_DRIVER_PASSWORD=TestDriver123!@#" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "✅ Arquivo .env.test encontrado" -ForegroundColor Green
Write-Host ""

# Executar teste
Write-Host "Executando validação operacional..." -ForegroundColor Cyan
Write-Host ""

npm run test tests/operational/gate2-real-auth-validation.test.ts

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "✅ VALIDAÇÃO OPERACIONAL PASSOU" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Revisar evidências no relatório de teste" -ForegroundColor Gray
    Write-Host "2. Atualizar AUDITORIA_MOBILIDADE_RIGOROSA.md" -ForegroundColor Gray
    Write-Host "3. Criar GATE_2_FECHAMENTO_FINAL.md" -ForegroundColor Gray
    Write-Host "4. Seguir para Gate 3" -ForegroundColor Gray
} else {
    Write-Host "❌ VALIDAÇÃO OPERACIONAL FALHOU" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verifique se criou o usuário test-driver@acheguese.local" -ForegroundColor Gray
    Write-Host "2. Verifique se executou scripts/create-test-driver.sql" -ForegroundColor Gray
    Write-Host "3. Verifique se .env.test tem as credenciais corretas" -ForegroundColor Gray
    Write-Host "4. Verifique logs acima para detalhes do erro" -ForegroundColor Gray
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
