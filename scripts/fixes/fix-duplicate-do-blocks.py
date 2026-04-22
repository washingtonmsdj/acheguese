#!/usr/bin/env python3
"""
Script para corrigir DO $ BEGIN duplicados nas migrations
"""

import re
from pathlib import Path

MIGRATIONS_DIR = Path('supabase/migrations')

GASTRONOMY_MIGRATIONS = [
    '20260413110000_create_qr_codes_system.sql',
    '20260413150000_create_orders.sql',
    '20260413160000_create_delivery_system.sql',
    '20260413170000_create_analytics_system.sql',
]

def fix_duplicate_do_blocks(content):
    """Remove DO $ BEGIN duplicados"""
    # Pattern: DO $ BEGIN\n  DO $ BEGIN
    pattern = r'DO \$ BEGIN\s+DO \$ BEGIN'
    content = re.sub(pattern, 'DO $ BEGIN', content)
    
    # Pattern: END $;\nEXCEPTION\n  WHEN duplicate_object THEN null;\nEND $;
    pattern = r'END \$;\s*EXCEPTION\s+WHEN duplicate_object THEN null;\s*END \$;'
    content = re.sub(pattern, 'EXCEPTION\n  WHEN duplicate_object THEN null;\nEND $;', content)
    
    return content

def fix_migration(filepath):
    """Corrige uma migration"""
    print(f"\n📄 Processando: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Aplicar fix
    content = fix_duplicate_do_blocks(content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {filepath.name} corrigida")
        return True
    else:
        print(f"⏭️  {filepath.name} já está OK")
        return False

def main():
    print("🚀 Corrigindo DO $ BEGIN duplicados...\n")
    
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
    
    print("🎉 DO blocks corrigidos!\n")

if __name__ == '__main__':
    main()
