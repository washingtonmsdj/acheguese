# Script para aplicar seed de gastronomia no Supabase
# Execute: .\apply-seed.ps1

Write-Host "🌱 Aplicando seed de gastronomia..." -ForegroundColor Green

# Ler o arquivo SQL
$sqlContent = Get-Content -Path "supabase/seed_gastronomy_mock.sql" -Raw

# Criar arquivo temporário
$tempFile = [System.IO.Path]::GetTempFileName()
$sqlContent | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "📄 Arquivo SQL preparado: $tempFile" -ForegroundColor Cyan

# Instruções para o usuário
Write-Host ""
Write-Host "⚠️  O Supabase CLI não suporta execução direta de SQL." -ForegroundColor Yellow
Write-Host ""
Write-Host "Por favor, siga estes passos:" -ForegroundColor White
Write-Host ""
Write-Host "1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor" -ForegroundColor Cyan
Write-Host "2. Clique em 'SQL Editor' → 'New Query'" -ForegroundColor Cyan
Write-Host "3. Copie o conteúdo do arquivo:" -ForegroundColor Cyan
Write-Host "   $tempFile" -ForegroundColor Yellow
Write-Host "4. Cole no SQL Editor e clique em 'Run'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ou copie diretamente de: supabase/seed_gastronomy_mock.sql" -ForegroundColor White
Write-Host ""

# Abrir o arquivo no notepad para facilitar
Write-Host "Abrindo arquivo no Notepad para você copiar..." -ForegroundColor Green
Start-Process notepad.exe -ArgumentList "supabase/seed_gastronomy_mock.sql"

Write-Host ""
Write-Host "✅ Pronto! Copie o conteúdo e execute no Supabase Dashboard." -ForegroundColor Green
