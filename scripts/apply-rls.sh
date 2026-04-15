#!/bin/bash

# GATE 5: Aplicar RLS Fix

echo "GATE 5: Aplicando RLS Fix"
echo ""

# Carregar .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Erro: variaveis nao definidas"
    exit 1
fi

# Extrair project ref
PROJECT=$(echo $VITE_SUPABASE_URL | sed -n 's/.*https:\/\/\([^.]*\)\.supabase\.co.*/\1/p')

echo "Project: $PROJECT"
echo ""

# DB URL
DB_URL="postgresql://postgres.$PROJECT:$SUPABASE_SERVICE_ROLE_KEY@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Executar SQL
echo "Executando SQL..."
supabase db execute --db-url "$DB_URL" --file APLICAR_GATE5_RLS_FIX.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "Sucesso!"
else
    echo ""
    echo "Erro ao executar"
    exit 1
fi
