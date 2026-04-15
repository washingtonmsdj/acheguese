#!/usr/bin/env python3
"""
Script para corrigir referências de bd.owner_id para bd.profile_id
"""

import re
from pathlib import Path

MIGRATIONS_DIR = Path('supabase/migrations')

GASTRONOMY_MIGRATIONS = [
    '20260413130000_create_business_hours.sql',
    '20260413140000_create_delivery_areas.sql',
    '20260413150000_create_orders.sql',
    '20260413160000_create_delivery_system.sql',
    '20260413170000_create_analytics_system.sql',
]

def fix_owner_id(content):
    """Substitui bd.owner_id por bd.profile_id"""
    content = content.replace('bd.owner_id', 'bd.profile_id')
    content = content.replace('WHERE bd.owner_id', 'WHERE bd.profile_id')
    content = content.replace('AND bd.owner_id', 'AND bd.profile_id')
    return content

def fix_migration(filepath):
    """Corrige uma migration"""
    print(f"\n📄 Processando: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Aplicar fix
    content = fix_owner_id(content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {filepath.name} corrigida")
        return True
    else:
        print(f"⏭️  {filepath.name} já está OK")
        return False

def main():
    print("🚀 Corrigindo referências de owner_id...\n")
    
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
