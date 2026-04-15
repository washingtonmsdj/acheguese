# Guia de Migração - professional_data

## Objetivo

Migrar `professional_data` do modelo legado misto para o modelo canônico:
- `location_id`: território principal de atuação
- `address_id`: endereço físico do consultório/escritório (quando houver)

## Semântica Crítica

```
location_id  = território principal (onde profissional aparece)
address_id   = endereço físico do consultório/escritório (opcional)
service_areas = cobertura de atendimento (não alterado)
```

### NÃO confundir

- `service_areas` NÃO substitui `location_id`
- `location_id` NÃO infere toda a cobertura
- Profissional pode ter `location_id` sem `address_id` (ex: atendimento remoto)

## Pré-requisitos

1. ETAPA 1 completa (tabela `addresses`)
2. ETAPA 3 completa (governança territorial)
3. ETAPA 4 completa (PostGIS)
4. Migration 20260328000021 aplicada (coluna `address_id`)

## Executar Migração

### 1. Preparação

Certifique-se de que:
- Dados em `locations` estão corretos
- Aliases territoriais configurados
- Backup do banco realizado

### 2. Executar Script

```typescript
import { migrateProfessionalDataToCanonical, formatMigrationReport } from '@/core/professional';

const result = await migrateProfessionalDataToCanonical();
const report = formatMigrationReport(result);

console.log(report);
```

Ou via CLI:

```bash
npx tsx src/core/professional/migrations/runMigration.ts
```

### 3. Analisar Relatório

O relatório mostra:
- Total de profissionais
- location_id já válido (preservado)
- location_id resolvido na migração
- address_id criado
- Profissionais sem endereço físico
- Coordenadas reaproveitadas de metadata.location
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

#### Resolver por metadata.location

Se `location_id` ausente:
1. Extrair cidade de `metadata.location.city`
2. Extrair bairro de `metadata.location.neighborhood`
3. Normalizar (trim, lowercase, remove acentos)
4. Buscar cidade em `locations` (type='city')
5. Buscar bairro em `locations` (type='district', parent_id=cidade)
6. Usar aliases como fallback
7. Se ambíguo ou não encontrado, registrar falha

### address_id

Criar `address_id` APENAS quando houver endereço físico suficiente:

#### Critério mínimo

- Campo `metadata.location.address` com conteúdo utilizável (> 5 caracteres)

#### Processo

1. Validar que há endereço físico
2. Criar registro em `addresses`:
   ```typescript
   {
     location_id: resolvedLocationId,
     street: metadata.location.address,
     postal_code: metadata.location.cep,
     address_type: determineAddressType(professional),
     latitude: metadata.location.latitude,  // se válido
     longitude: metadata.location.longitude, // se válido
     geocoding_source: 'migration_legacy',
     geocoding_confidence: 0.7,
   }
   ```
3. Atualizar `professional_data.address_id`

#### Determinação de address_type

- `exact`: endereço contém número e tem > 10 caracteres
- `approximate`: endereço sem número claro mas > 5 caracteres
- `landmark`: apenas referência

#### Coordenadas

- Reaproveitar `metadata.location.latitude`/`longitude` se válidos (-90 a 90, -180 a 180)
- NÃO inventar coordenadas quando ausentes

### Profissionais sem endereço físico

Profissionais podem ter `location_id` sem `address_id`:
- Atendimento remoto/online
- Atendimento domiciliar (sem consultório fixo)
- Dados insuficientes

Isso é válido e esperado. NÃO criar `address` fake.

## Relatório Exemplo

```
# RELATÓRIO DE MIGRAÇÃO - professional_data

Total de profissionais: 100
location_id já válido: 60
location_id resolvido: 30
address_id criado: 70
Sem endereço físico: 20
Coordenadas reaproveitadas: 50
Já migrados (skip): 5

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
import { isProfessionalMigrated, hasPhysicalAddress } from '@/core/professional';

if (isProfessionalMigrated(professional)) {
  // Usar modelo canônico
}

if (hasPhysicalAddress(professional)) {
  // Profissional tem consultório físico
}
```

### Obter coordenadas (com fallback)

```typescript
import { getProfessionalCoordinates } from '@/core/professional';

// Prefere address.latitude/longitude, fallback para metadata.location
const coords = getProfessionalCoordinates(professionalWithRelations);
```

### Obter território

```typescript
import { getProfessionalTerritory, getProfessionalTerritoryName } from '@/core/professional';

const territoryId = getProfessionalTerritory(professional);
const territoryName = getProfessionalTerritoryName(professionalWithRelations);
```

## Regras de Segurança

1. **Não inventa dados**: Sem chute de coordenadas ou territórios
2. **Mantém legado intacto**: metadata.location não é removido
3. **Skip automático**: Profissionais já migrados são pulados
4. **Relatório detalhado**: Todas as falhas registradas
5. **address_id opcional**: Profissionais podem não ter consultório físico

## Validações

- Profissional NUNCA resolve para `territorial_groups`
- Profissional SEMPRE resolve para `locations` (território oficial)
- `address_type` segue regras de validação
- Coordenadas válidas são reaproveitadas de metadata.location
- Coordenadas inválidas são ignoradas

## Próximas Etapas (Fora de Escopo)

- Remover `metadata.location`
- Migrar `ride_requests`
- Alterar `service_areas`
- UI de correção manual
- Integração com geocoding providers
