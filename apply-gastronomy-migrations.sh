#!/bin/bash

# Script para aplicar apenas as migrations de Gastronomy Billing
# Usa o Supabase CLI para aplicar migrations específicas

echo "🚀 Aplicando migrations de Gastronomy Billing..."
echo ""

# Criar pasta temporária
mkdir -p .temp-migrations

# Copiar apenas as migrations de gastronomy
cp supabase/migrations/20260413000010_add_plan_tier_to_gastronomy.sql .temp-migrations/
cp supabase/migrations/20260413000011_create_gastronomy_subscriptions.sql .temp-migrations/
cp supabase/migrations/20260413000012_sync_gastronomy_plan_tier.sql .temp-migrations/
cp supabase/migrations/20260413000013_seed_free_subscriptions.sql .temp-migrations/

echo "📦 Migrations copiadas para .temp-migrations/"
echo ""

# Aplicar cada migration individualmente
for file in .temp-migrations/*.sql; do
  echo "📄 Aplicando: $(basename $file)"
  supabase db execute --file "$file" --linked
  
  if [ $? -eq 0 ]; then
    echo "✅ $(basename $file) aplicada com sucesso!"
  else
    echo "❌ Erro ao aplicar $(basename $file)"
  fi
  echo ""
done

# Limpar pasta temporária
rm -rf .temp-migrations

echo "🎉 Processo concluído!"
