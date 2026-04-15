# Seed de Gastronomia Aplicado com Sucesso ✅

## Resumo da Operação

O seed de gastronomia foi aplicado com sucesso no banco de dados remoto após corrigir o problema de validação do `BusinessUrlService`.

## Problema Identificado

O `BusinessUrlService` exige que empresas tenham `location_id` apontando para um bairro (4 segmentos no path: `/país/estado/cidade/bairro`). O seed anterior estava apontando as empresas diretamente para a cidade Salvador.

## Solução Implementada

1. Criada hierarquia territorial completa:
   - País: Brasil (`/br`)
   - Estado: Bahia (`/br/ba`)
   - Cidade: Salvador (`/br/ba/salvador`)
   - 5 Bairros: Barra, Rio Vermelho, Pelourinho, Itaigara, Pituba

2. Empresas associadas aos bairros:
   - Restaurante Barra Mar → Barra
   - Bar do Rio → Rio Vermelho
   - Casa da Moqueca → Pelourinho
   - Pizzaria Bella Napoli → Itaigara
   - Sushi House Pituba → Pituba

## Dados Inseridos

### Hierarquia Territorial
- 1 país (Brasil)
- 1 estado (Bahia)
- 1 cidade (Salvador)
- 5 bairros

### Gastronomia
- 5 categorias (Restaurantes, Bares, Cafeterias, Comida Rápida, Padarias)
- 10 tags (tipos de cozinha + características)
- 5 empresas de gastronomia
- 5 associações empresa-categoria
- 17 associações empresa-tag

## Arquivos Criados

1. `seed_final_corrigido.sql` - Seed completo com DELETEs
2. `seed_insert_only.sql` - Seed apenas com INSERTs (usado)
3. `create_missing_tables.sql` - Script para criar tabelas faltantes
4. `verify_seed.sql` - Script de verificação

## Comandos Executados

```bash
# Criar tabelas faltantes
npx supabase db query -f create_missing_tables.sql --linked

# Aplicar seed
npx supabase db query -f seed_insert_only.sql --linked

# Verificar dados
npx supabase db query -f verify_seed.sql --linked
```

## Próximos Passos

1. Testar as URLs no frontend:
   - `/gastronomia/br/ba/salvador/barra/restaurante-barra-mar`
   - `/gastronomia/br/ba/salvador/rio-vermelho/bar-do-rio`
   - `/gastronomia/br/ba/salvador/pelourinho/casa-da-moqueca`
   - `/gastronomia/br/ba/salvador/itaigara/pizzaria-bella-napoli`
   - `/gastronomia/br/ba/salvador/pituba/sushi-house-pituba`

2. Verificar se o `BusinessUrlService` está gerando as URLs corretamente

3. Testar a navegação e listagem de empresas por bairro

## Observações

- Todos os UUIDs foram corrigidos para formato válido
- Campo `full_name` foi adicionado em todas as locations
- Usado `ON CONFLICT DO NOTHING` para evitar duplicações
- Geographic paths seguem o padrão: `/país/estado/cidade/bairro`
