# Seletor de Território - Cidade Âncora Implementada

## Problema Resolvido

Quando o usuário estava em `/ba/salvador/complexo-do-nordeste-de-amaralina` (grupo/bairro), o seletor mostrava apenas o grupo mas não mostrava Salvador (cidade) como opção de navegação.

## Solução Implementada

### 1. Detecção de Cidade Âncora

Adicionado `anchorCity` que detecta automaticamente a cidade pai quando o usuário está em um bairro/grupo:

```typescript
const anchorCity = useMemo(() => {
  // Se já está na cidade, não precisa mostrar novamente
  if (activeLocation?.type === 'city') {
    return null;
  }
  
  // Se está em um bairro (district), pegar a cidade pai
  if (activeLocation?.type === 'district' && activeLocation.parent_id) {
    const parentCity = allLocations.find(l => l.id === activeLocation.parent_id);
    if (parentCity && parentCity.type === 'city') {
      // Não mostrar se já é "Minha Cidade"
      if (homeCity && parentCity.id === homeCity.id) {
        return null;
      }
      return {
        id: parentCity.id,
        name: parentCity.name,
        path: parentCity.geographic_path.replace(/^\/br/, ''),
      };
    }
  }
  
  return null;
}, [activeLocation, allLocations, homeCity]);
```

### 2. Filtro de Duplicatas

Adicionado `filteredSelectorTerritories` para evitar mostrar a mesma cidade em múltiplas seções:

```typescript
const filteredSelectorTerritories = useMemo(() => {
  return selectorTerritories.filter(t => {
    // Não mostrar se já está em "Meu Bairro"
    if (homeDistrict && t.path === homeDistrict.path) return false;
    // Não mostrar se já está em "Minha Cidade"
    if (homeCity && t.path === homeCity.path) return false;
    // Não mostrar se já está em "Cidade Atual"
    if (anchorCity && t.path === anchorCity.path) return false;
    return true;
  });
}, [selectorTerritories, homeDistrict, homeCity, anchorCity]);
```

### 3. Renderização da Seção "Cidade Atual"

Adicionada nova seção no seletor que aparece entre "Minha Cidade" e "Territórios Disponíveis":

```typescript
{/* Cidade Atual/Âncora — sempre mostrar quando está em bairro/grupo */}
{anchorCity && (
  <button onClick={() => handleSelect(anchorCity.path)}>
    <Building2 />
    <div>
      <p>{anchorCity.name}</p>
      <Badge>CIDADE ATUAL</Badge>
    </div>
  </button>
)}
```

## Comportamento Final

### Quando usuário está em `/ba/salvador` (cidade)
```
Seletor mostra:
├── Meu Bairro: [se configurado]
├── Minha Cidade: [se configurado]
├── ─────────────────────────
├── Territórios Disponíveis:
│   └── Complexo do Nordeste de Amaralina
│   └── [outros territórios]
```

### Quando usuário está em `/ba/salvador/complexo-do-nordeste-de-amaralina` (grupo)
```
Seletor mostra:
├── Meu Bairro: [se configurado]
├── Minha Cidade: [se configurado]
├── Cidade Atual: Salvador ✅ (NOVO!)
├── ─────────────────────────
├── Territórios Disponíveis:
│   └── [outros territórios, sem Salvador duplicado]
```

## Princípios Seguidos

✅ **SSOT**: Usa `activeLocation` do store como fonte única de verdade
✅ **Sem gambiarras**: Lógica limpa baseada em hierarquia real do banco
✅ **Sem duplicação**: Filtro automático evita mostrar mesma cidade múltiplas vezes
✅ **Escalável**: Funciona para qualquer cidade/bairro/grupo
✅ **Profissional**: Código limpo, tipado e com comentários

## Arquivos Modificados

- `src/core/location/components/TerritorySelectorV2.tsx`

## Testes Recomendados

1. Acessar `/ba/salvador` → Seletor não deve mostrar "Cidade Atual"
2. Acessar `/ba/salvador/complexo-do-nordeste-de-amaralina` → Seletor deve mostrar "Salvador" como "Cidade Atual"
3. Clicar em "Salvador" no seletor → Deve navegar para `/ba/salvador`
4. Verificar que Salvador não aparece duplicado em "Territórios Disponíveis"
