# Professional Module

Módulo de gerenciamento de profissionais.

## Modelo Canônico (ETAPA 7)

A partir da ETAPA 7, profissionais usam o modelo canônico:

```typescript
{
  location_id: UUID,   // FK para locations (território principal de atuação)
  address_id: UUID,    // FK para addresses (endereço físico do consultório/escritório, opcional)
}
```

## Semântica Obrigatória

- **location_id**: Território principal onde o profissional atua/aparece (cidade ou bairro)
- **address_id**: Endereço físico do consultório/escritório (quando houver)
- **service_areas**: Cobertura de atendimento (não alterado nesta etapa)

### Regras Críticas

1. **NÃO usar service_areas para substituir location_id**
2. **NÃO usar location_id para inferir toda a cobertura**
3. **NÃO criar coverage nova nesta etapa**

## Compatibilidade Transitória

Durante a migração, o sistema suporta ambos os modelos:

- **Modelo canônico**: `address_id` + `location_id` (preferido)
- **Modelo legado**: `metadata.location` (address, neighborhood, city, state, cep, latitude, longitude)

### Verificar se migrado

```typescript
import { isProfessionalMigrated, hasPhysicalAddress } from '@/core/professional';

const isMigrated = isProfessionalMigrated(professional);
const hasAddress = hasPhysicalAddress(professional);
```

### Obter coordenadas (com fallback)

```typescript
import { getProfessionalCoordinates } from '@/core/professional';

// Prefere address canônico, fallback para metadata.location
const coords = getProfessionalCoordinates(professionalWithRelations);
```

## Migração

### Script de Migração

```typescript
import { migrateProfessionalDataToCanonical, formatMigrationReport } from '@/core/professional';

const result = await migrateProfessionalDataToCanonical();
console.log(formatMigrationReport(result));
```

### Estratégia de Resolução

#### location_id

1. **Preservar existente**: Se `location_id` já existe e é válido, manter
2. **Resolver por cidade**: Busca em `locations` (type='city') usando `metadata.location.city`
3. **Resolver por bairro**: Busca em `locations` (type='district') usando `metadata.location.neighborhood`
4. **Normalização**: trim + lowercase + remove acentos
5. **Aliases**: Usa `location_aliases` como fallback
6. **Ambiguidade**: NÃO chuta, registra falha

#### address_id

Cria `address_id` APENAS quando houver endereço físico suficiente:

- Campo `metadata.location.address` utilizável (> 5 caracteres)
- Cria registro em `addresses`
- Reaproveita `metadata.location.latitude`/`longitude` válidos
- Define `address_type`:
  - `exact`: endereço com número
  - `approximate`: endereço sem número claro
  - `landmark`: apenas referência
- Define `geocoding_source: 'migration_legacy'`
- Define `geocoding_confidence: 0.7`

#### Profissionais sem endereço físico

Profissionais podem ter `location_id` sem `address_id`:
- Profissionais que atendem apenas remotamente
- Profissionais sem consultório físico
- Profissionais com dados insuficientes

Isso é válido e esperado.

### Relatório de Migração

```
Total de profissionais: 100
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

1. **Profissional aponta para território oficial**: `location_id` deve referenciar `locations`, NUNCA `territorial_groups`
2. **Sem chute silencioso**: Dados ambíguos ou não resolvidos são registrados como falha
3. **metadata.location mantido**: Nesta etapa, metadata.location permanece intacto
4. **address_id opcional**: Profissionais podem não ter consultório físico
5. **Coordenadas reaproveitadas**: `metadata.location.latitude`/`longitude` válidos são migrados para `addresses`

## Próximas Etapas (Fora de Escopo)

- Remover `metadata.location`
- Migrar `ride_requests`
- Alterar `service_areas`
- UI de correção manual
- Integração com geocoding providers
