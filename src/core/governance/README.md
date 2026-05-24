# Core Governance Module

Status: oficial
Versao: 2.0.0
Data: 2026-05-23

## Visao Geral

Modulo responsavel por governanca territorial e postal. Ele registra versoes oficiais de territorios, aliases historicos/populares, eventos oficiais de mudanca e historico postal.

Este modulo nao cria redirects publicos. Slug antigo pode ser registrado como alias administrativo, mas rota publica divergente deve retornar 404 ou ser resolvida por fluxo canonico explicito.

## Responsabilidades

- Versionamento de locations em `location_versions`.
- Aliases historicos e populares em `location_aliases`.
- Eventos oficiais em `territory_change_events`.
- Historico postal em `postal_code_history`.
- Validacao de existencia da location antes de registrar governanca.

## Fora Do Escopo

- Hierarquia territorial atual: usar `core/location`.
- Grupos territoriais: usar `core/territorial`.
- Enderecos postais ativos: usar `core/address`.
- Redirect publico de slug antigo: nao suportado no runtime final.
- Dados mockados: nao suportados em runtime.

## Uso Basico

### Criar versao de location

```ts
import { territoryGovernanceService } from '@/core/governance';

await territoryGovernanceService.createLocationVersion({
  location_id: 'loc-nordeste-de-amaralina',
  name: 'Nordeste de Amaralina',
  full_name: 'Nordeste de Amaralina, Salvador',
  slug: 'nordeste-de-amaralina',
  geographic_path: '/br/ba/salvador/nordeste-de-amaralina',
  change_type: 'creation',
  change_reason: 'Criacao inicial',
  official_source: 'IBGE',
  valid_from: '2020-01-01T00:00:00Z',
});
```

### Adicionar alias

```ts
await territoryGovernanceService.addLocationAlias({
  location_id: 'loc-nordeste-de-amaralina',
  alias_type: 'popular_name',
  alias_value: 'Nordeste',
});
```

### Registrar evento oficial

```ts
await territoryGovernanceService.registerTerritoryChangeEvent({
  location_id: 'loc-nordeste-de-amaralina',
  event_type: 'name_change',
  old_value: 'Nordeste',
  new_value: 'Nordeste de Amaralina',
  official_source: 'Prefeitura de Salvador',
  effective_date: '2024-01-01',
});
```

### Registrar historico postal

```ts
await territoryGovernanceService.registerPostalCodeHistory({
  location_id: 'loc-nordeste-de-amaralina',
  postal_code: '40000-000',
  street: 'Rua Principal',
  valid_from: '2020-01-01',
  source: 'correios',
});
```

## Regras

- `locations` representa o estado territorial atual.
- `location_versions` preserva mudancas oficiais.
- Alias deve ser unico por `location_id`, `alias_type` e `alias_value`.
- Eventos oficiais devem ter fonte e data efetiva.
- Historico postal deve ter CEP, location e data inicial.
- Slug antigo nao gera redirect publico automatico.
