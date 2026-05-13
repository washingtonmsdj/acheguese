#!/bin/bash

# Script para aplicar migration via psql
# Requer SUPABASE_DB_PASSWORD no ambiente

if [ -z "${SUPABASE_DB_PASSWORD}" ]; then
  echo "Erro: SUPABASE_DB_PASSWORD nao definida no ambiente."
  echo "Defina a variavel e execute novamente."
  exit 1
fi

PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
  -h aws-0-sa-east-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.xhdowzacfujckjelqhtd \
  -d postgres \
  -f supabase/migrations/20260328000002_rpc_invite_member_secure.sql

echo ""
echo "✅ Migration aplicada!"
echo ""
echo "🧪 Testando RPC..."
echo ""

PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql \
  -h aws-0-sa-east-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.xhdowzacfujckjelqhtd \
  -d postgres \
  -c "SELECT invite_profile_member_by_email('00000000-0000-0000-0000-000000000000', 'teste@exemplo.com', 'member');"
