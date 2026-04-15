# Implementacao de Visibilidade Territorial

**Data de consolidacao**: 2026-04-08  
**Status**: vigente

## Objetivo

Separar corretamente:

- seletor territorial
- navegacao publica
- landing e listagem
- rollout de modulos

Sem acoplamento indevido entre essas responsabilidades.

## SSOT atual

As regras ficam centralizadas em `src/core/routing/utils/territoryVisibility.ts`.

### Flags

- `is_selector_active`: controla apenas seletor
- `is_navigable`: controla URL publica
- `is_landing_enabled`: controla landing e listagem

### Fora do escopo global

Rollout funcional de modulo nao pertence ao resolvedor territorial global.

Exemplo:

- comunidade restrita -> bloquear em `src/modules/community`
- nao bloquear na resolucao global da rota publica

## Onde a regra vive

### 1. Resolucao global de rota

Arquivo: `src/core/routing/hooks/useResolveTerritoryFromUrl.ts`

Responsabilidade:

- resolver cidade, bairro ou grupo
- bloquear somente quando `is_navigable = false`

Nao deve:

- bloquear por `is_selector_active`
- aplicar rollout de comunidade

### 2. Layout de rota territorial

Arquivo: `src/core/routing/components/TerritorialLayout.tsx`

Responsabilidade:

- mostrar estado restrito apenas quando a navegacao publica estiver bloqueada

Mensagem correta:

- territorio indisponivel para navegacao publica

Nao deve:

- sugerir que o problema seja estar fora do seletor

### 3. Seletor

Arquivo: `src/core/location/hooks/useSelectorTerritories.ts`

Responsabilidade:

- buscar territorios com `is_selector_active = true`
- manter a UX do seletor territorial

### 4. Landing e listagem

Arquivos principais:

- `src/core/routing/components/CountryLandingPage.tsx`
- `src/core/routing/components/StateLandingPage.tsx`
- `src/core/landing/useNationalFeatured.ts`
- `src/modules/landing/services/LandingService.impl.ts`

Responsabilidade:

- usar `is_landing_enabled`
- respeitar `is_navigable`
- nao depender de `is_selector_active`

### 5. Rollout de comunidade

Arquivos principais:

- `src/modules/community/components/CommunityRolloutGate.tsx`
- `src/modules/community/services/CommunityRolloutService.ts`

Responsabilidade:

- bloquear comunidade quando o modulo ainda nao estiver liberado

Nao deve ser empurrado para o resolvedor global.

## Matriz de comportamento

| Condicao | is_selector_active | is_navigable | is_landing_enabled | Resultado |
| --- | --- | --- | --- | --- |
| Fora do seletor, mas publico | false | true | true | detail page abre |
| Fora da landing, mas publico | false | true | false | detail page abre, landing nao lista |
| Bloqueado publicamente | true ou false | false | true ou false | rota publica bloqueada |
| Comunidade restrita | qualquer | true | qualquer | bloqueio apenas no modulo community |

## Casos de teste obrigatorios

- bairro fora do seletor mas navegavel -> rota publica abre
- bairro nao navegavel -> rota publica bloqueia
- comunidade restrita -> bloqueio apenas no modulo community
- landing desabilitada -> sai da landing, nao da detail page publica

## Decisao arquitetural

O erro anterior foi usar `is_selector_active` como se fosse controle de acesso publico. Isso gerava falso bloqueio de deep-link legitimo e misturava responsabilidade de UX do seletor com politica de navegacao.

Esse acoplamento foi removido.
