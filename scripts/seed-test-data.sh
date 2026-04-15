#!/bin/bash

# Script para aplicar seed de dados de teste
# Uso: ./scripts/seed-test-data.sh [local|remote]

set -e

ENV=${1:-local}

echo "🌱 Aplicando seed de dados de teste..."
echo "   Ambiente: $ENV"

if [ "$ENV" = "local" ]; then
  echo "   Usando Supabase local"
  npx supabase db reset --db-url "postgresql://postgres:postgres@localhost:54321/postgres"
  npx supabase db query --db-url "postgresql://postgres:postgres@localhost:54321/postgres" -f supabase/seed.sql
elif [ "$ENV" = "remote" ]; then
  echo "   Usando Supabase remoto (linked)"
  npx supabase db query --linked -f supabase/seed.sql
else
  echo "❌ Ambiente inválido: $ENV"
  echo "   Use: local ou remote"
  exit 1
fi

echo "✅ Seed aplicado com sucesso!"
echo ""
echo "Dados de teste disponíveis:"
echo "  - Farol da Barra (Barra)"
echo "  - Largo do Pelourinho (Pelourinho)"
echo "  - Praia do Porto da Barra (Barra)"
echo "  - Shopping da Bahia (Pituba)"
