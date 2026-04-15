#!/usr/bin/env python3
"""
Script para corrigir referências incorretas a profile_links
"""

import re
from pathlib import Path

MIGRATIONS_DIR = Path('supabase/migrations')

GASTRONOMY_MIGRATIONS = [
    '20260413160000_create_delivery_system.sql',
    '20260413170000_create_analytics_system.sql',
]

def fix_profile_links(content):
    """Substitui verificação via profile_links por verificação direta"""
    
    # Pattern antigo:
    # business_id IN (
    #   SELECT id FROM business_data
    #   WHERE id IN (
    #     SELECT entity_id FROM profile_links
    #     WHERE profile_id = auth.uid()
    #     AND entity_type = 'business'
    #   )
    # )
    
    # Pattern novo:
    # business_id IN (
    #   SELECT id FROM business_data
    #   WHERE profile_id = auth.uid()
    # )
    
    pattern = r'''business_id IN \(
      SELECT id FROM business_data
      WHERE id IN \(
        SELECT entity_id FROM profile_links
        WHERE profile_id = auth\.uid\(\)
        AND entity_type = 'business'
      \)
    \)'''
    
    replacement = '''business_id IN (
      SELECT id FROM business_data
      WHERE profile_id = auth.uid()
    )'''
    
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    # Também corrigir para driver_data
    pattern_driver = r'''driver_id IN \(
      SELECT id FROM driver_data
      WHERE id IN \(
        SELECT entity_id FROM profile_links
        WHERE profile_id = auth\.uid\(\)
        AND entity_type = 'driver'
      \)
    \)'''
    
    replacement_driver = '''driver_id IN (
      SELECT id FROM driver_data
      WHERE profile_id = auth.uid()
    )'''
    
    content = re.sub(pattern_driver, replacement_driver, content, flags=re.MULTILINE)
    
    return content

def fix_migration(filepath):
    """Corrige uma migration"""
    print(f"\n📄 Processando: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Aplicar fix
    content = fix_profile_links(content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {filepath.name} corrigida")
        return True
    else:
        print(f"⏭️  {filepath.name} já está OK")
        return False

def main():
    print("🚀 Corrigindo referências de profile_links...\n")
    
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
