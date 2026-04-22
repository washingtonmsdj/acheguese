#!/usr/bin/env python3
"""
Script para tornar migrations idempotentes adicionando IF NOT EXISTS
"""

import re
from pathlib import Path

MIGRATIONS_DIR = Path('supabase/migrations')

GASTRONOMY_MIGRATIONS = [
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

def make_idempotent(content):
    """Adiciona IF NOT EXISTS em CREATE TABLE e CREATE INDEX"""
    # CREATE TABLE
    content = re.sub(
        r'CREATE TABLE\s+([a-z_]+)\s*\(',
        r'CREATE TABLE IF NOT EXISTS \1 (',
        content
    )
    
    # CREATE INDEX
    content = re.sub(
        r'CREATE INDEX\s+([a-z_]+)\s+ON',
        r'CREATE INDEX IF NOT EXISTS \1 ON',
        content
    )
    
    # CREATE UNIQUE INDEX
    content = re.sub(
        r'CREATE UNIQUE INDEX\s+([a-z_]+)\s+ON',
        r'CREATE UNIQUE INDEX IF NOT EXISTS \1 ON',
        content
    )
    
    return content

def fix_migration(filepath):
    """Corrige uma migration"""
    print(f"\n📄 Processando: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Aplicar fix
    content = make_idempotent(content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {filepath.name} tornada idempotente")
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
    print(f"✅ Tornadas idempotentes: {updated}")
    print(f"⏭️  Já OK: {skipped}")
    print("="*60 + "\n")
    
    print("🎉 Migrations idempotentes!\n")

if __name__ == '__main__':
    main()
