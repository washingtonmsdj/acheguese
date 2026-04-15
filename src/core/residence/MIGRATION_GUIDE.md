# Guia de Migração - user_residences

## Objetivo

Migrar `user_residences` do modelo textual legado para o modelo canônico usando `address_id` e `location_id`.

## Pré-requisitos

1. ETAPA 1 completa (tabela `addresses` criada)
2. ETAPA 4 completa (PostGIS habilitado)
3. Migration 20260328000019 aplicada (colunas `address_id` e `location_id` adicionadas)

## Executar Migração

### 1. Preparação

Certifique-se de que:
- Dados em `locations` estão corretos (cidades e bairros ativos)
- Aliases territoriais estão configurados (se aplicável)
- Backup do banco foi realizado

### 2. Executar Script

```typescript
import { migrateUserResidencesToCanonical, formatMigrationReport } from '@/core/residence/migrations/migrateUserResidencesToCanonical';

const result = await migrateUserResidencesToCanonical();
const report = formatMigrationReport(result);

console.log(report);
```

### 3. Analisar Relatório

O relatório mostra:
- Total de residências processadas
- Quantas foram migradas com sucesso
- Quantas já estavam migradas (skip)
- Falhas por categoria:
  - Cidade não encontrada
  - Bairro não encontrado
  - Dados ambíguos
  - Dados mínimos ausentes
- Exemplos de falhas (primeiros 10)
- Taxa de sucesso

### 4. Corrigir Falhas (Opcional)

Para residências que falharam:

#### Cidade não encontrada
- Verificar se cidade existe em `locations`
- Adicionar alias em `location_aliases` se nome alternativo
- Corrigir dados manualmente se necessário

#### Bairro não encontrado
- Verificar se bairro existe em `locations` dentro da cidade
- Adicionar alias em `location_aliases` se nome alternativo
- Criar bairro se legítimo

#### Dados ambíguos
- Revisar manualmente
- Adicionar informação de desambiguação

### 5. Re-executar Migração

Após correções, re-executar o script. Residências já migradas serão puladas automaticamente.

## Estratégia de Resolução

### Resolução de Cidade

1. Normalizar nome da cidade (trim, lowercase, remove acentos)
2. Buscar em `locations` (type='city', status='active')
3. Se múltiplas cidades com mesmo nome, filtrar por estado
4. Se não encontrar ou ambíguo, registrar falha

### Resolução de Bairro

1. Normalizar nome do bairro
2. Buscar em `locations` (type='district', parent_id=cidade, status='active')
3. Tentar buscar por alias se não encontrar
4. Se não encontrar ou ambíguo, registrar falha

### Criação de Address

Para cada residência resolvida:

```typescript
{
  location_id: districtId,
  postal_code: residence.postal_code,
  street: residence.street,
  number: residence.number,
  complement: residence.complement,
  address_type: determineAddressType(residence),
  geocoding_source: 'migration_legacy',
  geocoding_confidence: 0.7,
}
```

#### Determinação de address_type

- `exact`: tem rua + número
- `approximate`: tem rua, sem número
- `landmark`: apenas bairro

## Regras de Segurança

1. **Não inventa dados**: Sem chute silencioso de coordenadas ou territórios
2. **Mantém legado intacto**: Campos legados não são removidos
3. **Skip automático**: Residências já migradas são puladas
4. **Relatório detalhado**: Todas as falhas são registradas com razão

## Validações

- Residência NUNCA resolve para `territorial_groups`
- Residência SEMPRE resolve para `locations` (território oficial)
- `address_type` segue regras de validação
- Coordenadas NÃO são inventadas

## Próximas Etapas (Fora de Escopo)

- Tornar `address_id` NOT NULL
- Tornar `location_id` NOT NULL
- Remover campos legados
- UI de correção manual
- Integração com geocoding providers
