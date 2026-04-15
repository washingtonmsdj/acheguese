# Script para fazer push com autenticação
# 
# INSTRUÇÕES:
# 1. Crie um Personal Access Token no GitHub:
#    https://github.com/settings/tokens
# 2. Marque a opção "repo"
# 3. Copie o token gerado
# 4. Execute: .\push-to-github.ps1
# 5. Cole o token quando solicitado

Write-Host "=== Push para GitHub com Token ===" -ForegroundColor Cyan
Write-Host ""

$token = Read-Host "Cole seu GitHub Personal Access Token" -AsSecureString
$tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
)

$remote = "https://$tokenPlain@github.com/washingtonmsdj/acheguese.git"

Write-Host ""
Write-Host "Fazendo push..." -ForegroundColor Yellow

git push $remote main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
    Write-Host "A Vercel detectará automaticamente e fará novo deploy." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erro ao fazer push." -ForegroundColor Red
    Write-Host "Verifique se o token tem permissões corretas." -ForegroundColor Red
}
