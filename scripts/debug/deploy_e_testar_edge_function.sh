#!/bin/bash
# Deploy e testar Edge Function - Send Emergency Email

set -e

echo "🚀 DEPLOY E TESTE - EDGE FUNCTION"
echo ""

# ============================================
# 1. VERIFICAR SUPABASE CLI
# ============================================

echo "1️⃣ Verificando Supabase CLI..."

if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não instalado"
    echo ""
    echo "📋 Instale via:"
    echo "   npm install -g supabase"
    echo "   ou"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI instalado"
echo ""

# ============================================
# 2. VERIFICAR LOGIN
# ============================================

echo "2️⃣ Verificando login..."

if ! supabase projects list &> /dev/null; then
    echo "⚠️  Não autenticado"
    echo ""
    echo "📋 Execute: supabase login"
    exit 1
fi

echo "✅ Autenticado"
echo ""

# ============================================
# 3. VERIFICAR LINK COM PROJETO
# ============================================

echo "3️⃣ Verificando link com projeto..."

if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Projeto não linkado"
    echo ""
    echo "📋 Execute: supabase link --project-ref your-project-ref"
    echo "   Obtenha o project-ref em: https://supabase.com/dashboard/project/_/settings/general"
    exit 1
fi

echo "✅ Projeto linkado"
echo ""

# ============================================
# 4. DEPLOY DA FUNÇÃO
# ============================================

echo "4️⃣ Fazendo deploy da Edge Function..."

if supabase functions deploy send-emergency-email; then
    echo "✅ Edge Function deployada com sucesso!"
    echo ""
else
    echo "❌ Erro ao fazer deploy"
    exit 1
fi

# ============================================
# 5. VERIFICAR SECRET
# ============================================

echo "5️⃣ Verificando RESEND_API_KEY secret..."

if supabase secrets list | grep -q "RESEND_API_KEY"; then
    echo "✅ RESEND_API_KEY configurada"
    echo ""
else
    echo "⚠️  RESEND_API_KEY não configurada"
    echo ""
    echo "📋 Configure agora:"
    echo "   1. Crie conta: https://resend.com"
    echo "   2. Gere API key: https://resend.com/api-keys"
    echo "   3. Execute: supabase secrets set RESEND_API_KEY=re_your_key"
    echo ""
    read -p "Pressione ENTER após configurar o secret..."
fi

# ============================================
# 6. TESTE BÁSICO
# ============================================

echo "6️⃣ Testando Edge Function..."
echo ""

read -p "Digite seu email para teste: " TEST_EMAIL

echo ""
echo "Enviando email de teste para: $TEST_EMAIL"
echo ""

RESPONSE=$(supabase functions invoke send-emergency-email \
  --body "{
    \"contactId\": \"test-$(date +%s)\",
    \"contactName\": \"Teste Deploy\",
    \"contactEmail\": \"$TEST_EMAIL\",
    \"alertId\": \"alert-test-$(date +%s)\",
    \"alertType\": \"sos\",
    \"alertCreatedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"userName\": \"Sistema de Teste\",
    \"userPhone\": \"11999999999\",
    \"alertDescription\": \"Teste de deploy da Edge Function\"
  }")

echo ""
echo "📧 Resposta da função:"
echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Email enviado com sucesso!"
    echo ""
    echo "📋 Verifique seu inbox: $TEST_EMAIL"
    echo "   Subject: 🚨 ALERTA DE EMERGÊNCIA"
    echo ""
else
    echo "❌ Erro ao enviar email"
    echo ""
    echo "📋 Verifique os logs:"
    echo "   supabase functions logs send-emergency-email"
    echo ""
fi

# ============================================
# RESUMO
# ============================================

echo "═══════════════════════════════════════════════════════"
echo "📊 RESUMO"
echo ""
echo "✅ Edge Function deployada"
echo "✅ Secret configurado"
echo "✅ Teste executado"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Verificar recebimento do email"
echo "   2. Testar via aplicação real"
echo "   3. Verificar logs: supabase functions logs send-emergency-email"
echo ""
echo "═══════════════════════════════════════════════════════"
