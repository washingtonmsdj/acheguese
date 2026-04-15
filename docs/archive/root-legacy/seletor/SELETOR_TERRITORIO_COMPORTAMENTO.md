# Seletor de Território - Comportamento Atual

## Situação Reportada

Quando o usuário está em `/ba/salvador` (cidade), o seletor mostra:
- ✅ "Complexo do Nordeste de Amaralina" (grupo)
- ❌ Salvador (cidade) não aparece como opção

## Análise do Código

### TerritorySelectorV2.tsx

O seletor tem 3 seções:

1. **Meu Bairro** (se configurado)
```typescript
{homeDistrict && (
  <button onClick={() => handleSelect(homeDistrict.path)}>
    {homeDistrict.name}
  </button>
)}
```

2. **Minha Cidade** (se configurada)
```typescript
{homeCity && (
  <button onClick={() => handleSelect(homeCity.path)}>
    {homeCity.name}
  </button>
)}
```

3. **Territórios Disponíveis** (do banco)
```typescript
{selectorTerritories.map(territory => (
  <button onClick={() => handleSelect(territory.path)}>
    {territory.name}
  </button>
))}
```

## Problema Identificado

O seletor mostra:
- `homeCity` (se o usuário configurou "Minha Cidade" no perfil)
- `selectorTerritories` (territórios com `is_selector_active = true`)

**Mas:** Se o usuário não configurou "Minha Cidade" no perfil, Salvador só aparece se estiver em `selectorTerritories`.

## Verificação

Salvador está com `is_selector_active = true` ✅

Então o problema pode ser:
1. O usuário não tem `homeCity` configurado
2. Salvador está em `selectorTerritories` mas não está sendo exibida por algum filtro

## Solução Proposta

### Opção 1: Sempre Mostrar a Cidade Atual (Recomendado)

Adicionar uma seção "Cidade Atual" que sempre mostra a cidade onde o usuário está:

```typescript
// Detectar cidade atual da URL
const currentCity = useMemo(() => {
  if (activeLocation?.type === 'city') {
    return activeLocation;
  }
  if (activeLocation?.type === 'district' && activeLocation.parent_id) {
    return allLocations.find(l => l.id === activeLocation.parent_id);
  }
  return null;
}, [activeLocation, allLocations]);

// No render:
{currentCity && currentCity.id !== homeCity?.id && (
  <button onClick={() => handleSelect(currentCity.path)}>
    <Building2 />
    {currentCity.name}
    <Badge>CIDADE ATUAL</Badge>
  </button>
)}
```

### Opção 2: Filtrar Duplicatas

Garantir que `selectorTerritories` não seja filtrado se for a cidade atual:

```typescript
const visibleTerritories = useMemo(() => {
  return selectorTerritories.filter(t => {
    // Não mostrar se já está em "Meu Bairro" ou "Minha Cidade"
    if (homeDistrict && t.path === homeDistrict.path) return false;
    if (homeCity && t.path === homeCity.path) return false;
    return true;
  });
}, [selectorTerritories, homeDistrict, homeCity]);
```

### Opção 3: Sempre Incluir Cidade Âncora

Quando está em um bairro/grupo, sempre mostrar a cidade âncora como opção:

```typescript
const anchorCity = useMemo(() => {
  if (!activeLocation) return null;
  
  // Se está em um bairro, pegar a cidade pai
  if (activeLocation.type === 'district' && activeLocation.parent_id) {
    return allLocations.find(l => l.id === activeLocation.parent_id);
  }
  
  // Se está em um grupo, pegar a cidade âncora
  if (resolved?.kind === 'group' && resolved.group.anchor_city_id) {
    return allLocations.find(l => l.id === resolved.group.anchor_city_id);
  }
  
  return null;
}, [activeLocation, resolved, allLocations]);
```

## Recomendação

**Implementar Opção 1 + Opção 3:**

1. Sempre mostrar a cidade atual/âncora como opção destacada
2. Filtrar duplicatas em "Territórios Disponíveis"
3. Ordem de exibição:
   - Meu Bairro (se configurado)
   - Minha Cidade (se configurado)
   - Cidade Atual/Âncora (se diferente de "Minha Cidade")
   - Territórios Disponíveis (sem duplicatas)

## Exemplo de Fluxo

### Usuário em /ba/salvador (cidade)
```
Seletor mostra:
├── Meu Bairro: Nordeste de Amaralina (se configurado)
├── Minha Cidade: Salvador (se configurado)
├── ─────────────────────────
├── Territórios Disponíveis:
│   └── Complexo do Nordeste de Amaralina
```

### Usuário em /ba/salvador/complexo-do-nordeste (grupo)
```
Seletor mostra:
├── Meu Bairro: Nordeste de Amaralina (se configurado)
├── Minha Cidade: Salvador (se configurado)
├── Cidade Atual: Salvador (sempre, pois é a âncora do grupo)
├── ─────────────────────────
├── Territórios Disponíveis:
│   └── (outros territórios, sem duplicatas)
```

## Implementação

Vou implementar a solução recomendada no próximo passo.
