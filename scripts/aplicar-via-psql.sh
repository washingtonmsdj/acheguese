#!/bin/bash

# Script para aplicar migration via psql
# Usa connection string direta

PGPASSWORD="Acheguese2024!" psql \
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

PGPASSWORD="Acheguese2024!" psql \
  -h aws-0-sa-east-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.xhdowzacfujckjelqhtd \
  -d postgres \
  -c "SELECT invite_profile_member_by_email('00000000-0000-0000-0000-000000000000', 'teste@exemplo.com', 'member');"
