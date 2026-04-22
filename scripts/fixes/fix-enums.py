#!/usr/bin/env python3
"""
Script para tornar CREATE TYPE idempotente usando DO blocks
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

def fix_enum(content):
    """Converte CREATE TYPE em DO block idempotente"""
    # Pattern: CREATE TYPE name AS ENUM (...)
    pattern = r'CREATE TYPE\s+(\w+)\s+AS\s+ENUM\s*\(((?:[^)]|\n)*)\);'
    
    def replacer(match):
        type_name = match.group(1)
        enum_values = match.group(2)
        
        return f'''DO $$ BEGIN
  CREATE TYPE {type_name} AS ENUM ({enum_values});
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;'''
    
    return re.sub(pattern, replacer, content, flags=re.MULTILINE | re.DOTALL)

def fix_migration(filepath):
    """Corrige ENUMs em uma migration"""
    print(f"\n📄 Processando: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Aplicar fix
    content = fix_enum(content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {filepath.name} atualizada")
        return True
    else:
        print(f"⏭️  {filepath.name} já está OK")
        return False

def main():
    print("🚀 Corrigindo ENUMs...\n")
    
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
    
    print("🎉 ENUMs corrigidos!\n")

if __name__ == '__main__':
    main()
