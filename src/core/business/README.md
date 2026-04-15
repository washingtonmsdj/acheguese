# Business Module

Módulo de gerenciamento de empresas.

## Modelo Canônico (ETAPA 6)

A partir da ETAPA 6, empresas usam o modelo canônico:

```typescript
{
  location_id: UUID,   // FK para locations (território principal de exibição)
  address_id: UUID,    // FK para addresses (endereço físico da sede, opcional)
}
```

## Semântica Obrigatória

- **location_id**: Território principal onde a empresa aparece (cidade ou bairro)
- **address_id**: Endereço físico da sede (quando houver)
- **service_areas**: Cobertura de atendimento (não alterado nesta etapa)

### Regras Críticas

1. **NÃO usar service_areas para substituir location_id**
2. **NÃO usar location_id para inferir toda a cobertura**
3. **NÃO criar coverage nova nesta etapa**

## Compatibilidade Transitória

Durante a migração, o sistema suporta ambos os modelos:

- **Modelo canônico**: `address_id` + `location_id` (preferido)
- **Modelo legado**: campos textuais (`address`, `latitude`, `longitude`, metadata)

### Verificar se migrado

```typescript
import { isBusinessMigrated, hasPhysicalAddress } from '@/core/business';

const isMigrated = isBusinessMigrated(business);
const hasAddress = hasPhysicalAddress(business);
```

### Obter coordenadas (com fallback)

```typescript
import { getBusinessCoordinates } from '@/core/business';

// Prefere address canônico, fallback para legado
const coords = getBusinessCoordinates(businessWithRelations);
```

## Migração

### Script de Migração

```typescript
import { migrateBusinessDataToCanonical, formatMigrationReport } from '@/core/business';

const result = await migrateBusinessDataToCanonical();
console.log(formatMigrationReport(result));
```

### Estratégia de Resolução

#### location_id

1. **Preservar existente**: Se `location_id` já existe e é válido, manter
2. **Resolver por cidade**: Busca em `locations` (type='city') por nome normalizado
3. **Resolver por bairro**: Busca em `locations` (type='district') dentro da cidade
4. **Normalização**: trim + lowercase + remove acentos
5. **Aliases**: Usa `location_aliases` como fallback
6. **Ambiguidade**: NÃO chuta, registra falha

#### address_id

Cria `address_id` APENAS quando houver endereço físico suficiente:

- Campo `address` utilizável (> 5 caracteres)
- Cria registro em `addresses`
- Reaproveita `latitude`/`longitude` válidos
- Define `address_type`:
  - `exact`: endereço com número
  - `approximate`: endereço sem número claro
  - `landmark`: apenas referência
- Define `geocoding_source: 'migration_legacy'`
- Define `geocoding_confidence: 0.7`

#### Empresas sem endereço físico

Empresas podem ter `location_id` sem `address_id`:
- Empresas online
- Empresas sem sede física
- Empresas com dados insuficientes

Isso é válido e esperado.

### Relatório de Migração

```
Total de empresas: 100
location_id já válido: 60
location_id resolvido: 30
address_id criado: 70
Sem endereço físico: 20
Coordenadas reaproveitadas: 50

Falhas:
- Cidade não encontrada: 5
- Bairro não encontrado: 3
- Dados mínimos ausentes: 5

Taxa de Sucesso: 90.00% (90/100)
Endereços Físicos: 70.00% com endereço físico (70/100)
```

## Regras Obrigatórias

1. **Empresa aponta para território oficial**: `location_id` deve referenciar `locations`, NUNCA `territorial_groups`
2. **Sem chute silencioso**: Dados ambíguos ou não resolvidos são registrados como falha
3. **Campos legados mantidos**: Nesta etapa, campos legados permanecem intactos
4. **address_id opcional**: Empresas podem não ter endereço físico
5. **Coordenadas reaproveitadas**: `latitude`/`longitude` válidos são migrados para `addresses`

## Próximas Etapas (Fora de Escopo)

- Remover campos legados (`address`, `latitude`, `longitude`)
- Migrar `professional_data`
- Migrar `ride_requests`
- Alterar `service_areas`
- UI de correção manual
- Integração com geocoding providers
