# Regras De Governanca Territorial E Postal

Data: 2026-05-23
Versao: 2.0.0
Status: oficial

## 1. Versionamento De Locations

`locations` e o SSOT do estado atual. `location_versions` guarda mudancas oficiais.

Criar nova versao quando houver:

- Mudanca de nome oficial.
- Mudanca de slug canonico.
- Mudanca de limites territoriais.
- Criacao, merge, split ou desativacao de territorio.

## 2. Aliases Historicos E Populares

Aliases existem para busca e auditoria, nao para redirect publico.

Tipos permitidos:

```ts
type LocationAliasType =
  | 'historical_name'
  | 'popular_name'
  | 'abbreviation'
  | 'old_slug'
  | 'other';
```

Regras:

- Alias unico por location, tipo e valor.
- Alias pode ter vigencia.
- Alias ambiguo deve exigir contexto territorial.

## 3. Mudanca De Slug

Quando um slug muda:

1. Registrar evento oficial em `territory_change_events`.
2. Criar nova versao em `location_versions`.
3. Registrar o slug antigo como alias `old_slug`, se precisar preservar busca interna.
4. Atualizar `locations.slug` e `locations.geographic_path`.

Nao criar redirect publico. Rota publica fora do canonico deve falhar de forma explicita.

## 4. Eventos De Mudanca Territorial

Eventos sao trilha oficial de auditoria. Devem ter:

- `location_id`.
- `event_type`.
- `official_source`.
- `effective_date`.

## 5. Historico Postal

`postal_code_history` registra CEP e logradouro por periodo. A fonte pode ser `correios`, `ibge`, `prefeitura`, `manual` ou `other`.

## 6. Responsabilidade Do Runtime

- Runtime publico consome rotas canonicas.
- Runtime nao consulta tabela de redirect de slug.
- Busca pode usar alias, desde que nao altere a URL canonica automaticamente.
- Dados territoriais sempre passam por `core/location` e pelo contrato de governanca.
