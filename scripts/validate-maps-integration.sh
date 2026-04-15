#!/bin/bash
# Script de Validação Rápida - Maps V4 Integration
# Executa validações essenciais antes de deploy

set -e

echo "🔍 Validação de Integração - Maps V4"
echo "===================================="
echo ""

# 1. Verificar feature flag
echo "1️⃣ Verificando feature flag..."
if grep -q 'VITE_FEATURE_MAPS_V4="true"' .env; then
  echo "✅ Feature flag ATIVA"
else
  echo "⚠️  Feature flag INATIVA"
fi
echo ""

# 2. Lint do módulo maps
echo "2️⃣ Executando lint:maps..."
npm run lint:maps
echo "✅ Lint passou"
echo ""

# 3. Testes unitários
echo "3️⃣ Executando testes unitários..."
npm run test:maps
echo "✅ Testes unitários passaram"
echo ""

# 4. Validação de tipos
echo "4️⃣ Validando tipos TypeScript..."
npx tsc --noEmit --project tsconfig.json
echo "✅ Tipos válidos"
echo ""

# 5. Build de produção (dry-run)
echo "5️⃣ Testando build de produção..."
npm run build
echo "✅ Build bem-sucedido"
echo ""

echo "✅ VALIDAÇÃO COMPLETA"
echo ""
echo "Próximos passos:"
echo "1. Executar testes E2E: npx playwright test --config=playwright.mapa.config.ts"
echo "2. Validar manualmente em navegador com GPU"
echo "3. Deploy em staging"
echo "4. Monitorar métricas"
