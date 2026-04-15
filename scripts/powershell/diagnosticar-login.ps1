# ============================================================================
# Script de Diagnóstico de Login - SSOT
# ============================================================================
# Este script ajuda a diagnosticar problemas de autenticação
# Execute: .\diagnosticar-login.ps1

Write-Host "🔍 Diagnóstico de Login - Seguindo SSOT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar variáveis de ambiente
Write-Host "1️⃣ Verificando variáveis de ambiente..." -ForegroundColor Yellow

if (Test-Path .env) {
    $envContent = Get-Content .env
    
    $supabaseUrl = $envContent | Select-String "VITE_SUPABASE_URL" | Select-Object -First 1
    $supabaseKey = $envContent | Select-String "VITE_SUPABASE_PUBLISHABLE_KEY" | Select-Object -First 1
    
    if ($supabaseUrl) {
        Write-Host "   ✅ VITE_SUPABASE_URL encontrada" -ForegroundColor Green
        Write-Host "      $supabaseUrl" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ VITE_SUPABASE_URL não encontrada" -ForegroundColor Red
    }
    
    if ($supabaseKey) {
        Write-Host "   ✅ VITE_SUPABASE_PUBLISHABLE_KEY encontrada" -ForegroundColor Green
        $keyPreview = ($supabaseKey -split "=")[1].Substring(0, 20) + "..."
        Write-Host "      Chave: $keyPreview" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ VITE_SUPABASE_PUBLISHABLE_KEY não encontrada" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Arquivo .env não encontrado" -ForegroundColor Red
    Write-Host "      Copie .env.example para .env e configure as variáveis" -ForegroundColor Yellow
}

Write-Host ""

# Verificar conexão com Supabase
Write-Host "2️⃣ Verificando conexão com Supabase..." -ForegroundColor Yellow

$envContent = Get-Content .env -ErrorAction SilentlyContinue
$supabaseUrlLine = $envContent | Select-String "VITE_SUPABASE_URL" | Select-Object -First 1
if ($supabaseUrlLine) {
    $url = ($supabaseUrlLine -split "=")[1].Trim('"')
    
    try {
        $response = Invoke-WebRequest -Uri "$url/rest/v1/" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   ✅ Supabase está acessível" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Não foi possível conectar ao Supabase" -ForegroundColor Red
        Write-Host "      Erro: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host ""

# Instruções para diagnóstico no painel
Write-Host "3️⃣ Próximos passos no painel do Supabase:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   a) Acesse: https://app.supabase.com" -ForegroundColor White
Write-Host "   b) Selecione seu projeto" -ForegroundColor White
Write-Host "   c) Vá em SQL Editor" -ForegroundColor White
Write-Host "   d) Execute o script: diagnostico-auth.sql" -ForegroundColor White
Write-Host ""

# Checklist
Write-Host "4️⃣ Checklist de verificação:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   [ ] Usuário existe no auth.users" -ForegroundColor White
Write-Host "   [ ] Email está confirmado (email_confirmed_at não é NULL)" -ForegroundColor White
Write-Host "   [ ] Usuário não está banido (banned_until é NULL)" -ForegroundColor White
Write-Host "   [ ] Senha está correta" -ForegroundColor White
Write-Host "   [ ] Site URL configurada: http://localhost:8080" -ForegroundColor White
Write-Host ""

# Solução rápida
Write-Host "5️⃣ Solução rápida - Criar usuário de teste:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Vá em Authentication > Users" -ForegroundColor White
Write-Host "   2. Clique em 'Add user' > 'Create new user'" -ForegroundColor White
Write-Host "   3. Email: teste@exemplo.com" -ForegroundColor White
Write-Host "   4. Password: Teste123!" -ForegroundColor White
Write-Host "   5. ✅ MARQUE 'Auto Confirm User'" -ForegroundColor Green
Write-Host "   6. Clique em 'Create user'" -ForegroundColor White
Write-Host ""

# Documentação
Write-Host "📚 Documentação completa:" -ForegroundColor Cyan
Write-Host "   - SOLUCAO_LOGIN_SSOT.md (guia passo a passo)" -ForegroundColor White
Write-Host "   - diagnostico-auth.sql (queries de diagnóstico)" -ForegroundColor White
Write-Host "   - criar-usuario-teste.sql (script de criação)" -ForegroundColor White
Write-Host ""

Write-Host "✅ Diagnóstico concluído!" -ForegroundColor Green
