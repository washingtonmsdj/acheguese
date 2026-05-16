#!/usr/bin/env python3
"""
Script para tornar todas as migrations idempotentes
Adiciona DROP IF EXISTS antes de CREATE TRIGGER e CREATE POLICY
"""

import re
from pathlib import Path

MIGRATIONS_DIR = Path('supabase/migrations')

# Migrations do núcleo Gastronomia
GASTRONOMY_MIGRATIONS = [
    '20260413100000_create_business_subscriptions.sql',
    '20260413100001_create_business_premium_links.sql',
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

def fix_triggers(content):
    """Adiciona DROP TRIGGER IF EXISTS antes de CREATE TRIGGER"""
    # Pattern: CREATE TRIGGER trigger_name
    pattern = r'CREATE TRIGGER\s+(\w+)'
    
    def replacer(match):
        trigger_name = match.group(1)
        # Tentar encontrar o nome da tabela na linha seguinte
        lines_after = content[match.end():match.end()+200]
        table_match = re.search(r'ON\s+(\w+)', lines_after)
        if table_match:
            table_name = table_match.group(1)
            return f'DROP TRIGGER IF EXISTS {trigger_name} ON {table_name};\nCREATE TRIGGER {trigger_name}'
        return match.group(0)
    
    return re.sub(pattern, replacer, content)

def fix_policies(content):
    """Adiciona DROP POLICY IF EXISTS antes de CREATE POLICY"""
    # Pattern: CREATE POLICY "policy_name" ON table_name
    pattern = r'CREATE POLICY\s+"([^"]+)"\s+ON\s+(\w+)'
    
    def replacer(match):
        policy_name = match.group(1)
        table_name = match.group(2)
        return f'DROP POLICY IF EXISTS "{policy_name}" ON {table_name};\nCREATE POLICY "{policy_name}" ON {table_name}'
    
    return re.sub(pattern, replacer, content)

def fix_migration(filepath):
    """Torna uma migration idempotente"""
    print(f"\n📄 Processando: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Aplicar fixes
    content = fix_triggers(content)
    content = fix_policies(content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {filepath.name} atualizada")
        return True
    else:
        print(f"⏭️  {filepath.name} já está OK")
        return False

def main():
    print("🚀 Tornando migrations idempotentes...\n")
    
    updated = 0
    skipped = 0
    
    for migration_name in GASTRONOMY_MIGRATIONS:
        filepath = MIGRATIONS_DIR / migration_name
        if not filepath.exists():
            print(f"⚠️  Não encontrado: {migration_name}")
            continue
        
        if fix_migration(filepath):
            updated += 1
        else:
            skipped += 1
    
    print("\n" + "="*60)
    print("📊 RESUMO:")
    print(f"✅ Atualizadas: {updated}")
    print(f"⏭️  Já OK: {skipped}")
    print("="*60 + "\n")
    
    print("🎉 Migrations prontas para aplicação!\n")

if __name__ == '__main__':
    main()
