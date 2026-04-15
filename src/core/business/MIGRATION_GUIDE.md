# Guia de Migração - business_data

## Objetivo

Migrar `business_data` do modelo legado misto para o modelo canônico:
- `location_id`: território principal de exibição
- `address_id`: endereço físico da sede (quando houver)

## Semântica Crítica

```
location_id  = território principal (onde empresa aparece)
address_id   = endereço físico da sede (opcional)
service_areas = cobertura de atendimento (não alterado)
```

### NÃO confundir

- `service_areas` NÃO substitui `location_id`
- `location_id` NÃO infere toda a cobertura
- Empresa pode ter `location_id` sem `address_id` (ex: empresa online)

## Pré-requisitos

1. ETAPA 1 completa (tabela `addresses`)
2. ETAPA 3 completa (governança territorial)
3. ETAPA 4 completa (PostGIS)
4. Migration 20260328000020 aplicada (coluna `address_id`)

## Executar Migração

### 1. Preparação

Certifique-se de que:
- Dados em `locations` estão corretos
- Aliases territoriais configurados
- Backup do banco realizado

### 2. Executar Script

```typescript
import { migrateBusinessDataToCanonical, formatMigrationReport } from '@/core/business';

const result = await migrateBusinessDataToCanonical();
const report = formatMigrationReport(result);

console.log(report);
```

Ou via CLI:

```bash
npx tsx src/core/business/migrations/runMigration.ts
```

### 3. Analisar Relatório

O relatório mostra:
- Total de empresas
- location_id já válido (preservado)
- location_id resolvido na migração
- address_id criado
- Empresas sem endereço físico
- Coordenadas reaproveitadas
- Falhas por categoria
- Taxa de sucesso

## Estratégia de Resolução

### location_id

#### Preservar existente

Se `location_id` já existe:
1. Validar que é válido (existe em `locations`, status='active')
2. Validar que NÃO é `territorial_group`
3. Se válido, preservar
4. Se inválido, registrar falha

#### Resolver por dados legados

Se `location_id` ausente:
1. Extrair cidade de `metadata.city`
2. Extrair bairro de `metadata.neighborhood` ou `address`
3. Normalizar (trim, lowercase, remove acentos)
4. Buscar cidade em `locations` (type='city')
5. Buscar bairro em `locations` (type='district', parent_id=cidade)
6. Usar aliases como fallback
7. Se ambíguo ou não encontrado, registrar falha

### address_id

Criar `address_id` APENAS quando houver endereço físico suficiente:

#### Critério mínimo

- Campo `address` com conteúdo utilizável (> 5 caracteres)

#### Processo

1. Validar que há endereço físico
2. Criar registro em `addresses`:
   ```typescript
   {
     location_id: resolvedLocationId,
     street: business.address,
     address_type: determineAddressType(business),
     latitude: business.latitude,  // se válido
     longitude: business.longitude, // se válido
     geocoding_source: 'migration_legacy',
     geocoding_confidence: 0.7,
   }
   ```
3. Atualizar `business_data.address_id`

#### Determinação de address_type

- `exact`: endereço contém número e tem > 10 caracteres
- `approximate`: endereço sem número claro mas > 5 caracteres
- `landmark`: apenas referência

#### Coordenadas

- Reaproveitar `latitude`/`longitude` se válidos (-90 a 90, -180 a 180)
- NÃO inventar coordenadas quando ausentes

### Empresas sem endereço físico

Empresas podem ter `location_id` sem `address_id`:
- Empresas online/digitais
- Empresas sem sede física
- Empresas com dados insuficientes

Isso é válido e esperado. NÃO criar `address` fake.

## Relatório Exemplo

```
# RELATÓRIO DE MIGRAÇÃO - business_data

Total de empresas: 100
location_id já válido: 60
location_id resolvido: 30
address_id criado: 70
Sem endereço físico: 20
Coordenadas reaproveitadas: 50
Já migradas (skip): 5

## Falhas
Cidade não encontrada: 5
Bairro não encontrado: 3
Ambíguas: 1
Dados mínimos ausentes: 1
Outros erros: 0

## Taxa de Sucesso
90.00% (90/100)

## Endereços Físicos
70.00% com endereço físico (70/100)
```

## Uso do Adapter

### Verificar migração

```typescript
import { isBusinessMigrated, hasPhysicalAddress } from '@/core/business';

if (isBusinessMigrated(business)) {
  // Usar modelo canônico
}

if (hasPhysicalAddress(business)) {
  // Empresa tem sede física
}
```

### Obter coordenadas (com fallback)

```typescript
import { getBusinessCoordinates } from '@/core/business';

// Prefere address.latitude/longitude, fallback para business.latitude/longitude
const coords = getBusinessCoordinates(businessWithRelations);
```

### Obter território

```typescript
import { getBusinessTerritory, getBusinessTerritoryName } from '@/core/business';

const territoryId = getBusinessTerritory(business);
const territoryName = getBusinessTerritoryName(businessWithRelations);
```

## Regras de Segurança

1. **Não inventa dados**: Sem chute de coordenadas ou territórios
2. **Mantém legado intacto**: Campos legados não são removidos
3. **Skip automático**: Empresas já migradas são puladas
4. **Relatório detalhado**: Todas as falhas registradas
5. **address_id opcional**: Empresas podem não ter endereço físico

## Validações

- Empresa NUNCA resolve para `territorial_groups`
- Empresa SEMPRE resolve para `locations` (território oficial)
- `address_type` segue regras de validação
- Coordenadas válidas são reaproveitadas
- Coordenadas inválidas são ignoradas

## Próximas Etapas (Fora de Escopo)

- Remover campos legados (`address`, `latitude`, `longitude`)
- Migrar `professional_data`
- Migrar `ride_requests`
- Alterar `service_areas`
- UI de correção manual
- Integração com geocoding providers
