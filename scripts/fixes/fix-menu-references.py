#!/usr/bin/env python3
"""
Script para corrigir referências de gastronomy_menus para menus
"""

import re
from pathlib import Path

MIGRATIONS_DIR = Path('supabase/migrations')

GASTRONOMY_MIGRATIONS = [
    '20260413120000_create_menu_categories.sql',
    '20260413120001_expand_menu_items.sql',
    '20260413120002_create_menu_item_variations.sql',
    '20260413120003_create_menu_addons_combos.sql',
]

def fix_menu_references(content):
    """Substitui gastronomy_menus por menus"""
    # Substituir gastronomy_menus por menus
    content = content.replace('gastronomy_menus', 'menus')
    
    # Substituir gastronomy_menu_items por menu_items
    content = content.replace('gastronomy_menu_items', 'menu_items')
    
    # Substituir gastronomy_menu_categories por menu_categories
    content = content.replace('gastronomy_menu_categories', 'menu_categories')
    
    # Substituir gastronomy_menu_combos por menu_combos
    content = content.replace('gastronomy_menu_combos', 'menu_combos')
    
    # Substituir gastronomy_menu_addons por menu_addons
    content = content.replace('gastronomy_menu_addons', 'menu_addons')
    
    return content

def fix_migration(filepath):
    """Corrige uma migration"""
    print(f"\n📄 Processando: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Aplicar fix
    content = fix_menu_references(content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {filepath.name} corrigida")
        return True
    else:
        print(f"⏭️  {filepath.name} já está OK")
        return False

def main():
    print("🚀 Corrigindo referências de menu...\n")
    
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
    print(f"✅ Corrigidas: {updated}")
    print(f"⏭️  Já OK: {skipped}")
    print("="*60 + "\n")
    
    print("🎉 Referências corrigidas!\n")

if __name__ == '__main__':
    main()
