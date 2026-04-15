#!/usr/bin/env python3
"""
Script para corrigir TODAS as referências a profile_links
"""

import re
from pathlib import Path

MIGRATIONS_DIR = Path('supabase/migrations')

def fix_all_profile_links(content):
    """Remove todas as referências a profile_links"""
    
    # Pattern 1: business_data com profile_links
    content = re.sub(
        r'WHERE id IN \(\s*SELECT entity_id FROM profile_links\s*WHERE profile_id = auth\.uid\(\)\s*AND entity_type = \'business\'\s*\)',
        'WHERE profile_id = auth.uid()',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # Pattern 2: driver_data com profile_links
    content = re.sub(
        r'WHERE id IN \(\s*SELECT entity_id FROM profile_links\s*WHERE profile_id = auth\.uid\(\)\s*AND entity_type = \'driver\'\s*\)',
        'WHERE profile_id = auth.uid()',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    return content

def fix_migration(filepath):
    """Corrige uma migration"""
    print(f"\n📄 Processando: {filepath.name}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Aplicar fix
    content = fix_all_profile_links(content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ {filepath.name} corrigida")
        return True
    else:
        print(f"⏭️  {filepath.name} já está OK")
        return False

def main():
    print("🚀 Corrigindo TODAS as referências de profile_links...\n")
    
    updated = 0
    skipped = 0
    
    # Processar todas as migrations
    for filepath in sorted(MIGRATIONS_DIR.glob('*.sql')):
        if fix_migration(filepath):
            updated += 1
        else:
            skipped += 1
    
    print("\n" + "="*60)
    print("📊 RESUMO:")
    print(f"✅ Corrigidas: {updated}")
    print(f"⏭️  Já OK: {skipped}")
    print("="*60 + "\n")
    
    print("🎉 Todas as referências corrigidas!\n")

if __name__ == '__main__':
    main()
