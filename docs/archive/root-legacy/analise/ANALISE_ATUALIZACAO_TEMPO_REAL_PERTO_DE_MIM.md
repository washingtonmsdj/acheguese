# Análise: Atualização em Tempo Real - "Perto de Mim"

**Data**: 2026-04-04  
**Pergunta do Usuário**: "A busca é em tempo real? Ou atualiza quando clico no raio? Se uma empresa criar agora e estiver no raio, a página atualiza sozinha?"

---

## Comportamento Atual

### ❌ NÃO É TEMPO REAL

A página **NÃO atualiza automaticamente** quando novas entidades são criadas.

### Como Funciona Hoje

1. **Busca inicial**: Quando a página carrega
2. **Busca ao mudar raio**: Quando você clica em outro raio (1km, 2km, 5km, etc.)
3. **Busca ao mudar filtros**: Quando você seleciona/deseleciona tipos
4. **Cache de 5 minutos**: React Query guarda os resultados por 5 minutos

### Código Atual

```typescript
// useSpatialSearchByRadius
export function useSpatialSearchByRadius(options) {
  return useQuery({
    queryKey: ['spatial-search', 'radius', ...],
    queryFn: async () => {
      return await spatialSearchService.searchByRadius({...});
    },
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 5, // ⚠️ 5 MINUTOS DE CACHE
  });
}
```

### Exemplo Prático

**Cenário**:
1. Você abre a página às 10:00
2. Vê 5 empresas em um raio de 2km
3. Às 10:02, uma nova padaria é cadastrada a 500m de você
4. **Resultado**: Você NÃO vê a padaria até:
   - Mudar o raio (ex: clicar em 5km e voltar para 2km)
   - Recarregar a página (F5)
   - Esperar 5 minutos (cache expirar)

---

## Opções de Melhoria

### Opção 1: Polling (Atualização Periódica) ⭐ RECOMENDADO

**Como funciona**: Busca novos dados a cada X segundos

**Vantagens**:
- ✅ Simples de implementar
- ✅ Funciona com qualquer backend
- ✅ Controle total sobre frequência
- ✅ Não sobrecarrega o servidor

**Desvantagens**:
- ⚠️ Não é instantâneo (delay de X segundos)
- ⚠️ Consome mais requisições

**Implementação**:
```typescript
export function useSpatialSearchByRadius(options) {
  return useQuery({
    queryKey: [...],
    queryFn: async () => {...},
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 30000, // ⭐ Atualiza a cada 30 segundos
    refetchIntervalInBackground: false, // Só atualiza se aba estiver ativa
  });
}
```

**Configurações sugeridas**:
- 30 segundos: Bom equilíbrio (recomendado)
- 15 segundos: Mais responsivo (mais requisições)
- 60 segundos: Mais econômico (menos responsivo)

---

### Opção 2: Realtime com Supabase Subscriptions

**Como funciona**: Supabase notifica quando há mudanças no banco

**Vantagens**:
- ✅ Atualização instantânea
- ✅ Eficiente (só envia quando há mudança)
- ✅ Experiência premium

**Desvantagens**:
- ⚠️ Mais complexo de implementar
- ⚠️ Requer configuração no Supabase
- ⚠️ Pode ser caro em escala (muitas conexões)

**Implementação**:
```typescript
export function useNearbyEntities(options) {
  const [entities, setEntities] = useState([]);
  
  // Busca inicial
  const query = useSpatialSearchByRadius(options);
  
  // Subscription para atualizações
  useEffect(() => {
    const subscription = supabase
      .channel('nearby-entities')
      .on('postgres_changes', {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'businesses',
        filter: `location_id=eq.${options.locationId}`
      }, (payload) => {
        // Atualizar lista quando houver mudança
        query.refetch();
      })
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [options.locationId]);
  
  return query;
}
```

---

### Opção 3: Botão "Atualizar" Manual

**Como funciona**: Usuário clica para buscar novos dados

**Vantagens**:
- ✅ Muito simples
- ✅ Usuário tem controle
- ✅ Zero overhead

**Desvantagens**:
- ⚠️ Requer ação do usuário
- ⚠️ Menos moderno

**Implementação**:
```typescript
// NearbyPage.tsx
const { entities, refetch, isRefetching } = useNearbyEntities({...});

return (
  <div>
    <Button onClick={() => refetch()} disabled={isRefetching}>
      {isRefetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      Atualizar
    </Button>
    {/* ... resto da página */}
  </div>
);
```

---

### Opção 4: Invalidação ao Mudar Raio/Filtros

**Como funciona**: Sempre busca dados frescos ao mudar parâmetros

**Vantagens**:
- ✅ Simples
- ✅ Dados sempre atualizados ao interagir

**Desvantagens**:
- ⚠️ Não atualiza se usuário não interagir

**Implementação**:
```typescript
export function useSpatialSearchByRadius(options) {
  return useQuery({
    queryKey: [...],
    queryFn: async () => {...},
    enabled: options.enabled !== false,
    staleTime: 0, // ⭐ Sempre considera dados "velhos"
    cacheTime: 1000 * 60 * 5, // Mas mantém cache por 5 min
  });
}
```

---

## Comparação

| Opção | Tempo Real | Complexidade | Custo | UX | Recomendação |
|-------|------------|--------------|-------|----|--------------| 
| Polling 30s | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ✅ MELHOR |
| Realtime | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 🔮 Futuro |
| Botão Manual | ⭐ | ⭐ | ⭐ | ⭐⭐ | ⚠️ Básico |
| Invalidação | ⭐⭐ | ⭐ | ⭐ | ⭐⭐⭐ | ✅ Bom |

---

## Proposta: Abordagem Híbrida ⭐

Combinar múltiplas estratégias para melhor experiência:

### 1. Polling Inteligente (Base)
```typescript
refetchInterval: 30000, // Atualiza a cada 30s
refetchIntervalInBackground: false, // Só se aba ativa
```

### 2. Invalidação ao Mudar Parâmetros
```typescript
staleTime: 0, // Sempre busca dados frescos ao mudar raio/filtros
```

### 3. Botão "Atualizar" Manual (Fallback)
```typescript
<Button onClick={() => refetch()}>
  <RefreshCw /> Atualizar
</Button>
```

### 4. Indicador Visual de Atualização
```typescript
{isRefetching && (
  <Badge variant="secondary" className="animate-pulse">
    <Loader2 className="h-3 w-3 animate-spin" />
    Atualizando...
  </Badge>
)}
```

---

## Implementação Recomendada

### Passo 1: Atualizar `useSpatialSearchByRadius`

```typescript
export function useSpatialSearchByRadius(options: UseSpatialSearchByRadiusOptions) {
  return useQuery({
    queryKey: [
      'spatial-search',
      'radius',
      options.entityType,
      options.center.latitude,
      options.center.longitude,
      options.radiusKm,
      options.locationId,
      options.limit,
      options.offset,
    ],
    queryFn: async (): Promise<SpatialSearchResult[]> => {
      return await spatialSearchService.searchByRadius({
        center: options.center,
        radiusKm: options.radiusKm,
        entityType: options.entityType,
        locationId: options.locationId,
        limit: options.limit,
        offset: options.offset,
      });
    },
    enabled: options.enabled !== false,
    staleTime: 0, // ⭐ Sempre busca dados frescos ao mudar parâmetros
    cacheTime: 1000 * 60 * 5, // Mantém cache por 5 min
    refetchInterval: 30000, // ⭐ Atualiza a cada 30 segundos
    refetchIntervalInBackground: false, // ⭐ Só se aba ativa
  });
}
```

### Passo 2: Adicionar Botão "Atualizar" em `NearbyPage`

```typescript
// NearbyPage.tsx
export default function NearbyPage() {
  const { entities, userLocation, isLoading, isError } = useNearbyEntities({
    radiusKm,
    entityTypes: selectedTypes,
    limit: 100,
  });
  
  // ⭐ Adicionar acesso ao refetch
  const queryClient = useQueryClient();
  const [isRefetching, setIsRefetching] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefetching(true);
    await queryClient.invalidateQueries({ queryKey: ['spatial-search'] });
    setIsRefetching(false);
  };
  
  return (
    <>
      {/* ... hero ... */}
      
      {/* ⭐ Barra de controles com botão atualizar */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleRefresh}
          disabled={isRefetching}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </Button>
        
        {/* ... resto dos controles ... */}
      </div>
      
      {/* ⭐ Indicador de atualização automática */}
      {isRefetching && (
        <Badge variant="secondary" className="animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Buscando novos locais...
        </Badge>
      )}
    </>
  );
}
```

---

## Benefícios da Implementação

### UX
- ✅ Dados sempre atualizados (máximo 30s de atraso)
- ✅ Usuário pode forçar atualização manual
- ✅ Feedback visual claro
- ✅ Não sobrecarrega o servidor

### Performance
- ✅ Polling só quando aba ativa
- ✅ Cache mantido por 5 minutos
- ✅ Invalidação inteligente ao mudar parâmetros

### Escalabilidade
- ✅ Funciona com qualquer número de usuários
- ✅ Não requer infraestrutura adicional
- ✅ Fácil de ajustar frequência

---

## Resposta Direta

### Hoje
- ❌ **NÃO é tempo real**
- ❌ **NÃO atualiza sozinha**
- ✅ Atualiza ao mudar raio/filtros
- ✅ Cache de 5 minutos

### Com a Melhoria
- ⭐ **Quase tempo real** (30s de delay)
- ✅ **Atualiza automaticamente** a cada 30s
- ✅ Atualiza ao mudar raio/filtros
- ✅ Botão manual para atualizar na hora
- ✅ Indicador visual de atualização

---

## Próximos Passos

1. ✅ Implementar polling de 30s
2. ✅ Adicionar botão "Atualizar"
3. ✅ Adicionar indicador visual
4. 🔮 Futuro: Realtime com Supabase Subscriptions

---

**Quer que eu implemente a solução recomendada?**

