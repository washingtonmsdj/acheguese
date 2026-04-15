# GATE 2: Validação Final Completa

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GATE 2 - VALIDAÇÃO FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Pré-requisitos:" -ForegroundColor Yellow
Write-Host "✅ Usuário motorista criado" -ForegroundColor Green
Write-Host "✅ Profile e driver_data criados" -ForegroundColor Green
Write-Host "✅ TrackingService corrigido (aceita cliente injetado)" -ForegroundColor Green
Write-Host "⏳ Policy RLS aplicada (verifique no SQL Editor)" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Policy RLS foi aplicada? (s/n)"

if ($continue -ne "s") {
    Write-Host ""
    Write-Host "❌ Aplique a policy RLS primeiro:" -ForegroundColor Red
    Write-Host ".\aplicar-gate2-policy.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Executando validação operacional..." -ForegroundColor Cyan
Write-Host ""

npm run test tests/operational/gate2-real-auth-validation.test.ts

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "✅ GATE 2 VALIDADO COM SUCESSO" -ForegroundColor Green
    Write-Host ""
    Write-Host "Evidências confirmadas:" -ForegroundColor Green
    Write-Host "✅ Autenticação real" -ForegroundColor Green
    Write-Host "✅ Publicação de localização" -ForegroundColor Green
    Write-Host "✅ Update (upsert)" -ForegroundColor Green
    Write-Host "✅ Realtime" -ForegroundColor Green
    Write-Host "✅ Latência < 5s" -ForegroundColor Green
    Write-Host "✅ Reconexão" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 GATE 2 PODE SER FECHADO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Atualizar AUDITORIA_MOBILIDADE_RIGOROSA.md" -ForegroundColor Gray
    Write-Host "2. Criar GATE_2_FECHAMENTO_FINAL.md" -ForegroundColor Gray
    Write-Host "3. Seguir para Gate 3" -ForegroundColor Gray
} else {
    Write-Host "❌ VALIDAÇÃO FALHOU" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verifique se a policy RLS foi aplicada corretamente" -ForegroundColor Gray
    Write-Host "2. Verifique se o profile é do tipo 'driver'" -ForegroundColor Gray
    Write-Host "3. Verifique logs acima para detalhes do erro" -ForegroundColor Gray
    Write-Host "4. Consulte GATE_2_DIAGNOSTICO_CAUSA_RAIZ.md" -ForegroundColor Gray
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
