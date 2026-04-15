# GATE 3: Aplicar Constraint e Executar Testes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GATE 3: FECHAMENTO RIGOROSO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ETAPA 1: Aplicar CHECK Constraint
Write-Host "ETAPA 1: Aplicar CHECK Constraint" -ForegroundColor Yellow
Write-Host "Abrindo SQL Editor no Supabase..." -ForegroundColor Gray
Write-Host ""

# Copiar SQL para clipboard
$sql = Get-Content "APLICAR_NO_SUPABASE_GATE3_CONSTRAINT.sql" -Raw
Set-Clipboard -Value $sql

Write-Host "OK SQL copiado para clipboard" -ForegroundColor Green
Write-Host ""
Write-Host "INSTRUCOES:" -ForegroundColor Yellow
Write-Host "1. Abra o SQL Editor no Supabase Dashboard" -ForegroundColor White
Write-Host "2. Cole o SQL (Ctrl+V)" -ForegroundColor White
Write-Host "3. Execute (Ctrl+Enter)" -ForegroundColor White
Write-Host "4. Verifique que constraint foi aplicada" -ForegroundColor White
Write-Host ""
Write-Host "Pressione ENTER apos aplicar o constraint..." -ForegroundColor Cyan
Read-Host

# ETAPA 2: Executar Testes Basicos
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ETAPA 2: Testes Basicos de Cancelamento" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run test tests/operational/gate3-cancellation-validation.test.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERRO Testes basicos falharam" -ForegroundColor Red
    Write-Host "Corrija os erros antes de continuar" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "OK Testes basicos passaram" -ForegroundColor Green

# ETAPA 3: Executar Testes de Concorrencia
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ETAPA 3: Testes de Concorrencia" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run test tests/operational/gate3-concurrency-validation.test.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "AVISO Testes de concorrencia falharam" -ForegroundColor Yellow
    Write-Host "Revise os resultados" -ForegroundColor Yellow
}

# ETAPA 4: Executar Testes de Realtime
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ETAPA 4: Testes de Realtime" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run test tests/operational/gate3-realtime-validation.test.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "AVISO Testes de realtime falharam" -ForegroundColor Yellow
    Write-Host "Revise os resultados" -ForegroundColor Yellow
}

# ETAPA 5: Relatorio Final
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GATE 3: RELATORIO FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Gerando relatorio final..." -ForegroundColor Gray
Write-Host ""
Write-Host "Pressione ENTER para continuar..." -ForegroundColor Cyan
Read-Host
