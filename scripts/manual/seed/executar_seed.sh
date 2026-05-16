#!/bin/bash

# ============================================================================
# Script: Executar Seed Gastronomy Mock no Supabase
# ============================================================================
# Uso: ./scripts/manual/seed/executar_seed.sh
# Ou: bash scripts/manual/seed/executar_seed.sh
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

SEED_FILE="supabase/seed_gastronomy_mock.sql"
CLEANUP_FILE="scripts/manual/sql/LIMPAR_DADOS_MOCK.sql"

echo "Executando Seed Gastronomy Mock..."
echo ""

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI nao encontrado."
  echo "Instale com: npm install -g supabase"
  exit 1
fi

if ! supabase projects list >/dev/null 2>&1; then
  echo "Voce nao esta logado no Supabase."
  echo "Faca login com: supabase login"
  exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
  echo "Arquivo $SEED_FILE nao encontrado."
  exit 1
fi

echo "Arquivo encontrado: $SEED_FILE"
echo ""

read -r -p "Deseja limpar dados mock antigos antes? (s/N): " limpar
echo ""

if [[ $limpar =~ ^[Ss]$ ]]; then
  echo "Limpando dados antigos..."
  if [ -f "$CLEANUP_FILE" ]; then
    supabase db execute --file "$CLEANUP_FILE"
    echo "Dados antigos removidos."
  else
    echo "Arquivo $CLEANUP_FILE nao encontrado, pulando limpeza."
  fi
  echo ""
fi

echo "Executando seed..."
echo ""

if supabase db execute --file "$SEED_FILE"; then
  echo ""
  echo "Seed executado com sucesso."
  echo ""
  echo "Proximos passos:"
  echo "  1. Acesse: http://localhost:5173/gastronomia/pizzaria-bella-napoli"
  echo "  2. Verifique se o cardapio aparece"
else
  echo ""
  echo "Erro ao executar seed."
  echo ""
  echo "Troubleshooting:"
  echo "  1. Verifique se as migrations foram executadas: supabase db reset"
  echo "  2. Verifique os logs de erro acima"
  exit 1
fi
