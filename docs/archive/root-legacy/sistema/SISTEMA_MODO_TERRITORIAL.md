# Sistema de Modo Territorial

## Visão Geral

O sistema de modo territorial permite que usuários cadastrados escolham entre visualizar conteúdo apenas do seu bairro ou de toda a cidade. Visitantes veem apenas o modo cidade.

## Modos Disponíveis

### 🏠 Modo Bairro
- **Quem pode usar**: Apenas usuários cadastrados com bairro definido
- **Comportamento**: Filtra conteúdo APENAS do bairro do usuário
- **Característica**: O bairro é FIXO - não muda para outro bairro
- **Exemplo**: Usuário mora no Nordeste de Amaralina → vê apenas conteúdo do Nordeste

### 🏙️ Modo Cidade
- **Quem pode usar**: Todos (cadastrados e visitantes)
- **Comportamento**: Mostra conteúdo de toda a cidade com filtros por bairro
- **Característica**: A cidade é DINÂMICA - pode mudar ao navegar
- **Exemplo**: Usuário em Salvador → vê toda Salvador com opção de filtrar por bairro

### 👤 Modo Visitante (null)
- **Quem usa**: Usuários não cadastrados
- **Comportamento**: Igual ao modo cidade, sem personalização
- **Característica**: Sem opção de "Meu Bairro"

## Regra Fundamental: Bairro Fixo

### ⚠️ IMPORTANTE: O bairro do usuário NUNCA muda

Quando um usuário está em "Modo Bairro" e clica em um link de outro bairro:

1. ❌ Sistema NÃO muda o bairro para o novo bairro
2. ✅ Sistema muda automaticamente para "Modo Cidade"
3. ✅ Banner aparece explicando a mudança
4. ✅ Usuário pode voltar para "Meu Bairro" com um clique

### Exemplo Prático

```
Situação Inicial:
- Usuário: João (mora no Nordeste de Amaralina)
- Modo: "Meu Bairro"
- Seletor: "Nordeste de Amaralina - Meu Bairro"

Ação:
- João clica em link de empresa da Pituba

Resultado:
- Modo: Muda automaticamente para "Minha Cidade"
- Seletor: "Salvador - Minha Cidade"
- Banner: "Você saiu de Nordeste de Amaralina e está visualizando Salvador"
- Botões: [Meu Bairro] [Minha Cidade] [X]

Por quê?
- O sistema NÃO pode mudar o bairro de João para Pituba
- João mora no Nordeste, não na Pituba
- A solução é mostrar toda a cidade (modo cidade)
```

## Componentes do Sistema

### 1. LocationContextStore (SSOT)
**Arquivo**: `src/core/location/stores/LocationContextStore.ts`

Store centralizado que mantém:
- `activeTerritory`: Território atual (Location)
- `territoryMode`: Modo atual ('bairro' | 'cidade' | null)

```typescript
export type TerritoryMode = 'bairro' | 'cidade' | null;
```

### 2. TerritorySelectorV2
**Arquivo**: `src/core/location/components/TerritorySelectorV2.tsx`

Componente visual do seletor territorial:
- Mostra modo atual ("Meu Bairro" ou "Minha Cidade")
- Permite alternar entre modos
- Permite explorar outros territórios
- Busca de territórios

### 3. TerritoryMismatchBanner
**Arquivo**: `src/core/location/components/TerritoryMismatchBanner.tsx`

Banner que aparece quando o usuário sai do seu bairro:
- Detecta quando usuário em "Modo Bairro" acessa outro bairro
- Muda automaticamente para "Modo Cidade"
- Mostra aviso: "Você saiu de [Bairro] e está visualizando [Cidade]"
- Oferece botões para voltar

### 4. TerritoryModeInitializer
**Arquivo**: `src/core/location/hooks/useTerritoryModeInitializer.ts`

Hook que inicializa o modo territorial automaticamente:
- Visitantes: modo null
- Usuário no próprio bairro: modo 'bairro'
- Usuário fora do bairro: modo 'cidade'

## Fluxo de Navegação

### Navegação no Mapa (Preserva Contexto)

```typescript
// ✅ CORRETO: Mantém território atual
onBusinessClick={(id) => {
  const biz = businessesToShow.find(b => b.id === id);
  if (biz && biz.slug) {
    const currentPath = moduleUrls.business.list; // /empresas/ba/salvador
    navigate(`${currentPath}/${biz.slug}`);
  }
}}
```

### Navegação por Link (Muda Contexto)

```typescript
// ✅ CORRETO: Usa território da empresa
const url = BusinessUrlService.getCanonicalUrl({
  id: business.id,
  slug: business.slug,
  geographic_path: business.geographic_path, // Inclui bairro
});
navigate(url);
```

## Matriz de Comportamento

| Situação | Modo Inicial | Ação | Modo Final | Banner? |
|----------|--------------|------|------------|---------|
| Usuário no Nordeste | Bairro | Clica empresa do Nordeste no mapa | Bairro | ❌ |
| Usuário no Nordeste | Bairro | Clica link empresa da Pituba | Cidade | ✅ |
| Usuário no Nordeste | Bairro | Clica empresa do Nordeste no mapa | Bairro | ❌ |
| Usuário em Salvador | Cidade | Clica empresa da Pituba | Cidade | ❌ |
| Usuário em Salvador | Cidade | Clica empresa do Nordeste no mapa | Cidade | ❌ |
| Visitante | null | Clica qualquer empresa | null | ❌ |

## Configuração Admin

### Visibilidade no Seletor

Apenas territórios com `metadata.is_selector_active = true` aparecem no seletor.

**Painel Admin**: Gestão de Territórios

```sql
-- Ativar Salvador no seletor
UPDATE locations 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb), 
  '{is_selector_active}', 
  'true'
)
WHERE slug = 'salvador';

-- Ativar grupo Nordeste no seletor
UPDATE territorial_groups 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb), 
  '{is_selector_active}', 
  'true'
)
WHERE slug = 'complexo-do-nordeste-de-amaralina';
```

### Flags de Visibilidade

| Flag | Descrição | Padrão |
|------|-----------|--------|
| `is_selector_active` | Aparece no seletor territorial | false |
| `is_landing_enabled` | Tem página de landing própria | true |
| `is_navigable` | Pode ser acessado via URL | true |

## Hooks Disponíveis

### useActiveTerritory()
Retorna território e modo ativos:
```typescript
const { 
  activeLocation,      // Location atual
  territoryMode,       // 'bairro' | 'cidade' | null
  setTerritoryMode,    // Função para mudar modo
} = useActiveTerritory();
```

### useUserTerritory()
Retorna território do usuário:
```typescript
const { 
  homeDistrict,  // Bairro do usuário
  homeCity,      // Cidade do usuário
  hasHome,       // Tem bairro cadastrado?
} = useUserTerritory();
```

### useTerritoryFilter()
Retorna filtro territorial para queries:
```typescript
const filter = useTerritoryFilter();
// { location_id: 'uuid-do-bairro' } ou
// { city_id: 'uuid-da-cidade' }
```

## Boas Práticas

### ✅ DO

1. **Preserve contexto no mapa**: Não mude território ao clicar em marcadores
2. **Use território da empresa em links**: Navegação intencional deve levar ao território correto
3. **Confie no TerritoryMismatchBanner**: Ele gerencia a mudança automática de modo
4. **Use hooks oficiais**: `useActiveTerritory()`, `useUserTerritory()`, etc.

### ❌ DON'T

1. **Não mude o bairro do usuário**: Sistema muda para cidade automaticamente
2. **Não ignore o modo territorial**: Sempre respeite o filtro ativo
3. **Não crie stores paralelos**: Use `LocationContextStore` (SSOT)
4. **Não force modo bairro em outro bairro**: Deixe o sistema gerenciar

## Debugging

### Logs Úteis

```typescript
// Ver modo atual
console.log('[TerritoryMode]', territoryMode);

// Ver território ativo
console.log('[ActiveTerritory]', activeLocation);

// Ver território do usuário
console.log('[UserTerritory]', { homeDistrict, homeCity });
```

### Ferramentas DevTools

```javascript
// No console do navegador
window.__LOCATION_STORE__ = locationContextStore;

// Ver estado atual
window.__LOCATION_STORE__.getActiveTerritory();
window.__LOCATION_STORE__.getTerritoryMode();
```

## Referências

- **Código**: `src/core/location/`
- **Tipos**: `src/core/location/types/index.ts`
- **Store**: `src/core/location/stores/LocationContextStore.ts`
- **Componentes**: `src/core/location/components/`
- **Hooks**: `src/core/location/hooks/`

---

**Versão**: 1.0.0  
**Data**: 2026-04-03  
**Status**: ✅ Documentado
