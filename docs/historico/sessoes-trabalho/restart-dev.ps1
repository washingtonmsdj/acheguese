# Script para reiniciar o servidor de desenvolvimento
# Limpa o cache do Vite e reinicia o servidor

Write-Host "🧹 Limpando cache do Vite..." -ForegroundColor Yellow

# Remove cache do Vite se existir
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "✅ Cache do Vite removido" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Nenhum cache encontrado" -ForegroundColor Cyan
}

# Remove cache do navegador se existir
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Pasta dist removida" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Green
Write-Host ""

# Inicia o servidor
npm run dev
