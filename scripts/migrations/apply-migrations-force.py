#!/usr/bin/env python3
"""
Script para aplicar migrations do núcleo Gastronomia diretamente no Supabase
Pula migrations antigas e aplica apenas as necessárias
"""

import os
import sys
import subprocess
from pathlib import Path

# Migrations do núcleo Gastronomia (em ordem)
GASTRONOMY_MIGRATIONS = [
    '20260413100000_create_business_subscriptions.sql',
    '20260413100001_create_business_premium_links.sql',
    '20260413100002_migrate_gastronomy_to_business_subscriptions.sql',
    '20260413110000_create_qr_codes_system.sql',
    '20260413120000_create_menu_categories.sql',
    '20260413120001_expand_menu_items.sql',
    '20260413120002_create_menu_item_variations.sql',
    '20260413120003_create_menu_addons_combos.sql',
    '20260413130000_create_business_hours.sql',
    '20260413140000_create_delivery_areas.sql',
    '20260413150000_create_orders.sql',
    '20260413160000_create_delivery_system.sql',
    '20260413170000_create_analytics_system.sql',
]

def run_command(cmd):
    """Executa comando e retorna output"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def apply_migration(filename):
    """Aplica uma migration específica"""
    print(f"\n📄 Aplicando: {filename}")
    
    filepath = Path('supabase/migrations') / filename
    if not filepath.exists():
        print(f"❌ Arquivo não encontrado: {filepath}")
        return False
    
    # Ler conteúdo da migration
    with open(filepath, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    # Salvar em arquivo temporário
    temp_file = Path('temp_migration.sql')
    with open(temp_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    # Aplicar via supabase db execute
    cmd = f'supabase db execute --file {temp_file}'
    success, stdout, stderr = run_command(cmd)
    
    # Limpar arquivo temporário
    if temp_file.exists():
        temp_file.unlink()
    
    if success:
        print(f"✅ {filename} aplicada com sucesso!")
        return True
    else:
        print(f"❌ Erro ao aplicar {filename}")
        if stderr:
            print(f"Erro: {stderr}")
        return False

def main():
    print("🚀 Aplicando migrations do núcleo Gastronomia...\n")
    print(f"📋 Total de migrations: {len(GASTRONOMY_MIGRATIONS)}\n")
    
    success_count = 0
    failed_count = 0
    
    for migration in GASTRONOMY_MIGRATIONS:
        if apply_migration(migration):
            success_count += 1
        else:
            failed_count += 1
            print("\n⚠️  Continuando com próxima migration...\n")
    
    print("\n" + "="*60)
    print("📊 RESUMO:")
    print(f"✅ Sucesso: {success_count}/{len(GASTRONOMY_MIGRATIONS)}")
    print(f"❌ Falhas: {failed_count}/{len(GASTRONOMY_MIGRATIONS)}")
    print("="*60 + "\n")
    
    if failed_count > 0:
        print("⚠️  Algumas migrations falharam.")
        sys.exit(1)
    else:
        print("🎉 Todas as migrations foram aplicadas com sucesso!\n")
        sys.exit(0)

if __name__ == '__main__':
    main()
