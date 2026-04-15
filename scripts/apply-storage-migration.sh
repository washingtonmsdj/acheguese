#!/bin/bash

# ============================================================================
# Script: Aplicar Migration do Storage Bucket
# Descrição: Aplica a migration para criar o bucket classified-images
# Uso: ./scripts/apply-storage-migration.sh
# ============================================================================

set -e

echo "🚀 Aplicando migration do Storage Bucket..."
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado!"
    echo ""
    echo "Instale com:"
    echo "  npm install -g supabase"
    echo ""
    echo "Ou aplique manualmente via Dashboard:"
    echo "  1. Acesse Supabase Dashboard"
    echo "  2. SQL Editor"
    echo "  3. Copie o conteúdo de: supabase/migrations/20260401000004_create_classified_images_bucket.sql"
    echo "  4. Execute"
    exit 1
fi

# Verificar se está no diretório correto
if [ ! -f "supabase/migrations/20260401000004_create_classified_images_bucket.sql" ]; then
    echo "❌ Migration não encontrada!"
    echo "Execute este script da raiz do projeto."
    exit 1
fi

# Aplicar migration
echo "📦 Aplicando migration..."
supabase db push

echo ""
echo "✅ Migration aplicada com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "  1. Verificar bucket no Dashboard: Storage > classified-images"
echo "  2. Testar upload: /test/upload-fotos"
echo "  3. Ver guia completo: GUIA_TESTE_UPLOAD_FOTOS.md"
echo ""
