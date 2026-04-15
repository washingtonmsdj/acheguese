# Guia de Ativacao de Territorios

**Sistema**: controle territorial publico  
**SSOT vigente**: 2026-04-08

## Regra correta

Cada flag controla uma responsabilidade diferente:

- `metadata.is_selector_active`: controla apenas aparicao no seletor territorial
- `metadata.is_navigable`: controla acesso por URL publica
- `metadata.is_landing_enabled`: controla landing e listagem agregada

Regras de rollout especificas de modulo continuam dentro do proprio modulo.
Exemplo: restricoes da comunidade ficam em `src/modules/community`.

## O que cada flag faz

### 1. Seletor territorial

Use `is_selector_active` quando a decisao for:

- mostrar ou ocultar um territorio no seletor
- permitir escolha manual no seletor principal

Nao use `is_selector_active` para:

- bloquear deep-link publico
- esconder detail page publica
- controlar landing nacional ou estadual
- aplicar rollout de comunidade

### 2. Navegacao publica

Use `is_navigable` quando a decisao for:

- permitir ou bloquear acesso por URL publica
- decidir se `/ba/salvador/pituba` pode abrir
- exibir tela de territorio indisponivel

Regra:

- `is_navigable = false` bloqueia a rota publica
- ausencia da flag significa navegavel por padrao

### 3. Landing e listagens

Use `is_landing_enabled` quando a decisao for:

- mostrar ou ocultar o territorio em landing nacional
- mostrar ou ocultar o territorio em landing estadual
- mostrar ou ocultar o territorio em listagens agregadas

Regra:

- `is_landing_enabled = false` tira o territorio das landings e listagens
- isso nao deve bloquear a detail page se `is_navigable` continuar `true`

## Combinacoes validas

### Fora do seletor, mas publico

```json
{
  "is_selector_active": false,
  "is_navigable": true,
  "is_landing_enabled": true
}
```

Resultado:

- nao aparece no seletor
- URL publica abre normalmente
- pode aparecer em landing e listagem

### Publico, mas fora da landing

```json
{
  "is_selector_active": false,
  "is_navigable": true,
  "is_landing_enabled": false
}
```

Resultado:

- nao aparece no seletor
- URL publica abre normalmente
- nao aparece em landing e listagem

### Bloqueado por URL publica

```json
{
  "is_selector_active": true,
  "is_navigable": false,
  "is_landing_enabled": true
}
```

Resultado:

- pode aparecer no seletor, dependendo da UX de operacao
- URL publica bloqueada
- nao deve ser usado como substituto de rollout de modulo

## Operacoes SQL

### Colocar territorio no seletor

```sql
UPDATE locations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{is_selector_active}',
  'true'
)
WHERE slug = 'pituba'
  AND type = 'district';
```

### Tirar territorio do seletor

```sql
UPDATE locations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{is_selector_active}',
  'false'
)
WHERE slug = 'pituba'
  AND type = 'district';
```

### Bloquear URL publica

```sql
UPDATE locations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{is_navigable}',
  'false'
)
WHERE slug = 'pituba'
  AND type = 'district';
```

### Remover da landing sem bloquear detail page

```sql
UPDATE locations
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{is_landing_enabled}',
  'false'
)
WHERE slug = 'pituba'
  AND type = 'district';
```

## Fluxos corretos

### Detail page publica

1. Resolver a URL
2. Validar status do territorio
3. Validar `is_navigable`
4. Renderizar a pagina se navegavel

`is_selector_active` nao participa dessa decisao.

### Seletor territorial

1. Buscar territorios com `is_selector_active = true`
2. Filtrar itens nao navegaveis se necessario
3. Exibir apenas o que faz sentido para escolha manual

### Landing e listagem

1. Buscar territorios ativos
2. Aplicar `is_landing_enabled`
3. Aplicar `is_navigable`
4. Exibir listagem agregada

## Referencias do projeto

- `src/core/routing/utils/territoryVisibility.ts`
- `src/core/location/hooks/useSelectorTerritories.ts`
- `src/core/routing/hooks/useResolveTerritoryFromUrl.ts`
- `src/modules/community/components/CommunityRolloutGate.tsx`

## Nota

Este guia substitui a regra antiga que tratava `is_selector_active` como bloqueio de acesso publico. Essa modelagem estava errada e foi removida do runtime.
