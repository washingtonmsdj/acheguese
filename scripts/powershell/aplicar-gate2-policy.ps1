# Script para aplicar correção de policy RLS do Gate 2

$url = "https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new"
$sqlFile = "APLICAR_NO_SUPABASE_GATE2_POLICY.sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GATE 2: Aplicar Correção de Policy RLS" -ForegroundColor Cyan
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
Write-Host "5. Verifique se apareceu 'Success'"
Write-Host ""
Write-Host "O que esta correção faz:" -ForegroundColor Cyan
Write-Host "- Remove policy ambígua 'FOR ALL'"
Write-Host "- Cria policies separadas por operação (SELECT, INSERT, UPDATE, DELETE)"
Write-Host "- Adiciona WITH CHECK explícito para INSERT"
Write-Host "- Garante que motorista só pode inserir/atualizar própria localização"
Write-Host ""
Write-Host "Após aplicar, execute:" -ForegroundColor Yellow
Write-Host "npm run test tests/operational/gate2-real-auth-validation.test.ts"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

