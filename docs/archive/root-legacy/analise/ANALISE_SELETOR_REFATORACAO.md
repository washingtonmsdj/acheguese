# Análise Minuciosa - TerritorySelectorV2

## Problemas Identificados

### 1. CÓDIGO DUPLICADO - Renderização de Botões

O componente tem 4 blocos quase idênticos de renderização de botões:
- Meu Bairro
- Minha Cidade
- Cidade Atual
- Territórios Disponíveis (loop)
- Resultados de Busca (loop)

**Duplicação:** ~150 linhas de JSX repetido com pequenas variações.

### 2. GAMBIARRA - Dois ChevronDown no Trigger Compacto

```typescript
<ChevronDown className="h-3.5 w-3.5 text-primary flex-shrink-0" />
<ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
```

**Problema:** Dois ícones idênticos renderizados sem motivo aparente.

### 3. LÓGICA COMPLEXA - getFullLocationLabel()

Função com múltiplos níveis de fallback e parsing manual de paths:
- Parsing de `geographic_path` para extrair UF
- Busca manual de `parentCity` em `allLocations`
- Parsing de `homeDistrict.path` para extrair UF
- Múltiplos fallbacks

**Problema:** Lógica que deveria estar no hook/store, não no componente.

### 4. PROPS DESNECESSÁRIAS

```typescript
interface TerritorySelectorV2Props {
  currentTerritoryName: string | null; // ❌ Não usado (usa activeLocation)
  currentPath: string;                 // ✅ Usado
  compact?: boolean;                   // ✅ Usado
  contextMessage?: string;             // ✅ Usado
}
```

**Problema:** `currentTerritoryName` é passado mas nunca usado (usa `activeLocation.name`).

### 5. LÓGICA DUPLICADA - Detecção de Ícone

```typescript
// Em 3 lugares diferentes:
{territory.kind === 'location' && territory.type === 'city' ? (
  <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
) : (
  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
)}
```

### 6. INCONSISTÊNCIA - Estilos Hardcoded

Classes CSS repetidas em múltiplos lugares com pequenas variações:
- `"h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"`
- `"w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left"`
- `"text-sm font-semibold text-foreground"`

### 7. BUSCA INEFICIENTE

```typescript
const searchResults = useMemo(() => {
  if (!searchQuery.trim()) return null;
  const q = searchQuery.toLowerCase();
  const matched = selectorTerritories.filter(t =>
    t.name.toLowerCase().includes(q)
  );
  return { territories: matched };
}, [searchQuery, selectorTerritories]);
```

**Problema:** Busca apenas em `selectorTerritories`, não inclui `homeDistrict`, `homeCity` ou `anchorCity`.

## Refatoração Proposta

### 1. Extrair Componente de Botão Reutilizável

```typescript
interface TerritoryButtonProps {
  territory: {
    id: string;
    name: string;
    path: string;
    description?: string;
    badge?: string;
    icon: 'home' | 'city' | 'district';
  };
  isActive: boolean;
  onClick: () => void;
}

function TerritoryButton({ territory, isActive, onClick }: TerritoryButtonProps) {
  // Renderização única reutilizável
}
```

### 2. Criar Hook para Label Formatado

```typescript
function useFormattedTerritoryLabel() {
  const { activeLocation } = useActiveTerritory();
  const { homeDistrict, homeCity } = useUserTerritory();
  const { data: allLocations = [] } = useLocations();
  
  return useMemo(() => {
    // Lógica centralizada
  }, [activeLocation, homeDistrict, homeCity, allLocations]);
}
```

### 3. Unificar Lista de Territórios

```typescript
const allSelectableTerritories = useMemo(() => {
  const territories = [];
  
  if (homeDistrict) {
    territories.push({
      ...homeDistrict,
      badge: 'MEU BAIRRO',
      icon: 'home',
      priority: 1,
    });
  }
  
  if (homeCity) {
    territories.push({
      ...homeCity,
      badge: 'CIDADE',
      icon: 'city',
      priority: 2,
    });
  }
  
  if (anchorCity) {
    territories.push({
      ...anchorCity,
      badge: 'CIDADE ATUAL',
      icon: 'city',
      priority: 3,
    });
  }
  
  filteredSelectorTerritories.forEach(t => {
    territories.push({
      ...t,
      icon: t.kind === 'location' && t.type === 'city' ? 'city' : 'district',
      priority: 4,
    });
  });
  
  return territories;
}, [homeDistrict, homeCity, anchorCity, filteredSelectorTerritories]);
```

### 4. Simplificar Busca

```typescript
const searchResults = useMemo(() => {
  if (!searchQuery.trim()) return allSelectableTerritories;
  
  const q = searchQuery.toLowerCase();
  return allSelectableTerritories.filter(t =>
    t.name.toLowerCase().includes(q)
  );
}, [searchQuery, allSelectableTerritories]);
```

### 5. Remover Props Desnecessárias

```typescript
interface TerritorySelectorV2Props {
  currentPath: string;
  compact?: boolean;
  contextMessage?: string;
}
```

### 6. Extrair Constantes de Estilo

```typescript
const BUTTON_STYLES = {
  base: "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left",
  active: "border-primary bg-primary/10 shadow-sm",
  inactive: "border-border hover:border-primary/40 hover:bg-accent/50",
};

const ICON_CONTAINER_STYLES = {
  base: "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
  active: "bg-primary text-primary-foreground",
  inactive: "bg-primary/10 text-primary",
};
```

## Benefícios da Refatoração

1. **-200 linhas de código** (de ~450 para ~250)
2. **Manutenibilidade**: Mudanças em um lugar afetam todos os botões
3. **Testabilidade**: Componentes menores e isolados
4. **Performance**: Menos re-renders desnecessários
5. **Legibilidade**: Código mais limpo e fácil de entender
6. **SSOT**: Uma única fonte de verdade para lista de territórios

## Próximos Passos

1. Criar `TerritoryButton.tsx` componente reutilizável
2. Criar `useFormattedTerritoryLabel.ts` hook
3. Refatorar `TerritorySelectorV2.tsx` usando os novos componentes
4. Adicionar testes unitários
5. Documentar API pública
