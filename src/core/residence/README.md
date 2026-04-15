# Residence Module

Módulo de gerenciamento de residências de usuários.

## Modelo Canônico (ETAPA 5)

A partir da ETAPA 5, residências usam o modelo canônico:

```typescript
{
  address_id: UUID,    // FK para addresses (SSOT de endereços)
  location_id: UUID,   // FK para locations (território oficial)
}
```

## Compatibilidade Transitória

Durante a migração, o sistema suporta ambos os modelos:

- **Modelo canônico**: `address_id` + `location_id` (preferido)
- **Modelo legado**: campos textuais (`street`, `city`, etc.)

### Verificar se migrado

```typescript
const isMigrated = residenceService.isMigrated(residence);
```

## Migração

### Script de Migração

```typescript
import { migrateUserResidencesToCanonical, formatMigrationReport } from '@/core/residence/migrations/migrateUserResidencesToCanonical';

const result = await migrateUserResidencesToCanonical();
console.log(formatMigrationReport(result));
```

### Estratégia de Resolução

1. **Resolver cidade**: Busca em `locations` (type='city') por nome normalizado
2. **Resolver bairro**: Busca em `locations` (type='district') dentro da cidade
3. **Normalização**: trim + lowercase + remove acentos
4. **Aliases**: Usa `location_aliases` como fallback
5. **Ambiguidade**: NÃO chuta, registra falha

### Criação de Address

Para cada residência resolvida:

- Cria registro em `addresses`
- Define `address_type`:
  - `exact`: tem rua + número
  - `approximate`: tem rua, sem número
  - `landmark`: apenas bairro
- Define `geocoding_source: 'migration_legacy'`
- Define `geocoding_confidence: 0.7`
- NÃO inventa coordenadas

### Relatório de Migração

```
Total de residências: 100
Migradas com sucesso: 85
Já migradas (skip): 5

Falhas:
- Cidade não encontrada: 7
- Bairro não encontrado: 2
- Dados mínimos ausentes: 1

Taxa de Sucesso: 85.00% (85/100)
```

## Regras Obrigatórias

1. **Residência aponta para território oficial**: `location_id` deve referenciar `locations`, NUNCA `territorial_groups`
2. **Sem chute silencioso**: Dados ambíguos ou não resolvidos são registrados como falha
3. **Campos legados mantidos**: Nesta etapa, campos legados permanecem intactos
4. **Compatibilidade**: Service lê modelo canônico com fallback para legado

## Próximas Etapas (Fora de Escopo)

- Tornar `address_id` NOT NULL
- Tornar `location_id` NOT NULL
- Remover campos legados
- Migrar `business_data`
- Migrar `professional_data`
- Migrar `ride_requests`
