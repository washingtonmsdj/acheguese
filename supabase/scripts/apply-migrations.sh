#!/bin/bash

# Script para aplicar migrações de Reviews e Favoritos
# Uso: bash supabase/scripts/apply-migrations.sh

set -e

echo "🚀 Aplicando migrações de Gastronomia (Reviews e Favoritos)"
echo ""

# Verificar se supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado"
    echo "   Instale com: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI encontrado"
echo ""

# Verificar se está conectado ao projeto
echo "🔍 Verificando conexão com o projeto..."
supabase status || {
    echo "❌ Supabase local não está rodando"
    echo "   Inicie com: supabase start"
    exit 1
}

echo ""
echo "📄 Aplicando migração 1/2: Reviews Enhancements"
supabase db push --file supabase/migrations/20260412000001_add_gastronomy_reviews_enhancements.sql

echo ""
echo "📄 Aplicando migração 2/2: User Favorites"
supabase db push --file supabase/migrations/20260412000002_add_user_favorites.sql

echo ""
echo "✅ Migrações aplicadas com sucesso!"
echo ""
echo "🔍 Verificando tabelas criadas..."
supabase db execute "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('review_reports', 'review_helpfulness', 'user_favorite_businesses');"

echo ""
echo "🎉 Concluído!"
