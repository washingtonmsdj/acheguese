#!/usr/bin/env python3
"""
Script para limpar migrations removendo duplicatas e ${table_name}
"""

import re
from pathlib import Path

MIGRATIONS_DIR = Path('supabase/migrations')

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

def clean_migration(filepath):
    """Limpa uma migration"""
    print(f"\n📄 Limpando: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Remover linhas com ${table_name} e $([Environment]::NewLine)
    content = re.sub(r'DROP TRIGGER IF EXISTS .* ON \$\{table_name\};.*?\n', '', content)
    content = re.sub(r'\$\(\[Environment\]::NewLine\)', '', content)
    
    # Remover duplicatas de DROP TRIGGER (quando há duas linhas seguidas)
    content = re.sub(r'(DROP TRIGGER IF EXISTS \w+ ON \w+;)\s*\1', r'\1', content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {filepath.name} limpa")
        return True
    else:
        print(f"⏭️  {filepath.name} já está OK")
        return False

def main():
    print("🧹 Limpando migrations...\n")
    
    cleaned = 0
    skipped = 0
    
    for migration_name in GASTRONOMY_MIGRATIONS:
        filepath = MIGRATIONS_DIR / migration_name
        if not filepath.exists():
            print(f"⚠️  Não encontrado: {migration_name}")
            continue
        
        if clean_migration(filepath):
            cleaned += 1
        else:
            skipped += 1
    
    print("\n" + "="*60)
    print("📊 RESUMO:")
    print(f"✅ Limpas: {cleaned}")
    print(f"⏭️  Já OK: {skipped}")
    print("="*60 + "\n")
    
    print("🎉 Migrations limpas!\n")

if __name__ == '__main__':
    main()
