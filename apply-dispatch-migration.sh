#!/bin/bash

# ============================================
# APPLY DISPATCH MIGRATION
# ============================================
# Script para aplicar migration do RPC accept_ride_atomic
# 
# Uso:
#   ./apply-dispatch-migration.sh

set -e

echo "🚀 Aplicando migration do dispatch híbrido..."
echo ""

# Verificar se arquivo existe
MIGRATION_FILE="src/modules/mobility/migrations/create_accept_ride_atomic_rpc.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Erro: Arquivo de migration não encontrado: $MIGRATION_FILE"
  exit 1
fi

echo "✅ Arquivo de migration encontrado"
echo ""

# Verificar variáveis de ambiente
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "❌ Erro: VITE_SUPABASE_URL não definida"
  echo "   Configure no arquivo .env"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Erro: SUPABASE_SERVICE_ROLE_KEY não definida"
  echo "   Configure no arquivo .env"
  exit 1
fi

echo "✅ Variáveis de ambiente configuradas"
echo ""

# Extrair host e database do URL
SUPABASE_URL="$VITE_SUPABASE_URL"
SUPABASE_HOST=$(echo "$SUPABASE_URL" | sed -E 's|https?://([^/]+).*|\1|')
SUPABASE_DB="postgres"

echo "📊 Informações da conexão:"
echo "   Host: $SUPABASE_HOST"
echo "   Database: $SUPABASE_DB"
echo ""

# Perguntar confirmação
read -p "Deseja aplicar a migration? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo "❌ Operação cancelada"
  exit 0
fi

echo ""
echo "🔄 Aplicando migration..."
echo ""

# Aplicar migration via Supabase REST API
# (Alternativa ao psql que funciona com Supabase hosted)

SQL_CONTENT=$(cat "$MIGRATION_FILE")

RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

if [ $? -eq 0 ]; then
  echo "✅ Migration aplicada com sucesso!"
  echo ""
  echo "📝 Próximos passos:"
  echo "   1. Testar aceite de corrida"
  echo "   2. Testar concorrência"
  echo "   3. Atualizar componentes UI"
  echo ""
else
  echo "❌ Erro ao aplicar migration"
  echo "   Resposta: $RESPONSE"
  echo ""
  echo "💡 Alternativa: Aplicar manualmente via Supabase Dashboard"
  echo "   1. Acesse: $SUPABASE_URL/project/_/sql"
  echo "   2. Cole o conteúdo de: $MIGRATION_FILE"
  echo "   3. Execute"
  exit 1
fi
