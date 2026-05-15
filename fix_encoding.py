#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import glob

# Mapeamento de caracteres com problemas para caracteres corretos
fixes = {
    'PÃ¡gina': 'Página',
    'VersÃ£o': 'Versão',
    'SeÃ§Ã£o': 'Seção',
    'inscriÃ§Ãµes': 'inscrições',
    'DescriÃ§Ã£o': 'Descrição',
    'ProgramaÃ§Ã£o': 'Programação',
    'localizaÃ§Ã£o': 'localização',
    'LocalizaÃ§Ã£o': 'Localização',
    'indisponÃvel': 'indisponível',
    'NÃ£o': 'Não',
    'possÃvel': 'possível',
    'FaÃ§a': 'Faça',
    'inscriÃ§Ã£o': 'inscrição',
    'InscriÃ§Ã£o': 'Inscrição',
    'jÃ¡': 'já',
    'VocÃª': 'Você',
    'estÃ¡': 'está',
    'prÃ³ximos': 'próximos',
    'disponÃveis': 'disponíveis',
    'Ãšltimas': 'Últimas',
    'HorÃ¡rio': 'Horário',
    'DuraÃ§Ã£o': 'Duração',
    'apÃ³s': 'após',
    'OcupaÃ§Ã£o': 'Ocupação',
    'visualizaÃ§Ãµes': 'visualizações',
    'VisualizaÃ§Ãµes': 'Visualizações',
    'GrÃ¡ficos': 'Gráficos',
    'mÃ©tricas': 'métricas',
    'TrÃ¡fego': 'Tráfego',
    'ReferÃªncia': 'Referência',
    'calendÃ¡rio': 'calendário',
    'SÃ¡b': 'Sáb',
    'vocÃª': 'você',
    'ClassificaÃ§Ã£o': 'Classificação',
    'AlimentaÃ§Ã£o': 'Alimentação',
    'GravaÃ§Ã£o': 'Gravação',
    'disponÃvel': 'disponível',
    'AcessÃ­vel': 'Acessível',
    'â­': '⭐',
    'â€¢': '•',
    'ðŸŽ­': '🎭',
    'ðŸ"Š': '📊',
    'ðŸ"…': '📅',
    'ðŸ"': '📝',
}

# Arquivos para corrigir
patterns = [
    'src/features/events/**/*.tsx',
    'src/features/events/**/*.ts',
]

files_fixed = 0
for pattern in patterns:
    for filepath in glob.glob(pattern, recursive=True):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for wrong, correct in fixes.items():
                content = content.replace(wrong, correct)
            
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'✓ Fixed: {filepath}')
                files_fixed += 1
        except Exception as e:
            print(f'✗ Error in {filepath}: {e}')

print(f'\n{files_fixed} files fixed!')
