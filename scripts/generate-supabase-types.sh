#!/bin/bash

# Script para gerar types TypeScript do Supabase
# 
# Uso: npm run generate:types

echo "🔧 Gerando types do Supabase..."

# Obter project ID do .env
PROJECT_ID=$(grep VITE_SUPABASE_PROJECT_ID .env | cut -d '=' -f2 | tr -d '"')

if [ -z "$PROJECT_ID" ]; then
  echo "❌ VITE_SUPABASE_PROJECT_ID não encontrado no .env"
  exit 1
fi

echo "📦 Project ID: $PROJECT_ID"

# Gerar types
npx supabase gen types typescript --project-id "$PROJECT_ID" > src/integrations/supabase/types.generated.ts

if [ $? -eq 0 ]; then
  echo "✅ Types gerados com sucesso em src/integrations/supabase/types.generated.ts"
else
  echo "❌ Erro ao gerar types"
  exit 1
fi
