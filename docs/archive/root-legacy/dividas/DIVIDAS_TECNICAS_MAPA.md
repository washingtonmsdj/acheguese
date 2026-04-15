# DÍVIDAS TÉCNICAS - MAPA

**Data**: 04/04/2026  
**Status**: 📋 REGISTRADO

---

## 🎯 CONTEXTO

Este documento registra dívidas técnicas identificadas durante o desenvolvimento do modo raio do mapa central (ETAPAS 1.1A-1.1F).

---

## 📋 DÍVIDAS TÉCNICAS

### 1. Erro/Loading Parcial por Tipo no Modo Raio

**Severidade**: 🟡 Média

**Descrição**:

Atualmente, o modo raio agrega estados de loading/erro de todos os tipos (empresas, eventos, alertas):

```typescript
const isLoadingRadius = isLoadingBusinesses || isLoadingEvents || isLoadingAlerts;
const hasErrorRadius = isErrorBusinesses || isErrorEvents || isErrorAlerts;
```

**Problema**:

Se um tipo falhar (ex: eventos com erro), o mapa inteiro mostra erro, mesmo que empresas e alertas tenham carregado com sucesso.

**Cenário Problemático**:
- Empresas: ✅ 50 resultados
- Eventos: ❌ Erro de rede
- Alertas: ✅ 5 resultados

**Comportamento Atual**: Mapa mostra erro (perde 55 resultados válidos)

**Comportamento Ideal**: Mapa mostra 55 resultados + aviso de erro parcial

**Impacto**:
- Usuário perde dados válidos em caso de erro parcial
- Experiência degradada desnecessariamente

**Solução Proposta**:

1. Mostrar resultados parciais mesmo com erro em um tipo
2. Adicionar aviso visual: "⚠️ Eventos não puderam ser carregados"
3. Permitir retry por tipo

**Estimativa**: 2-3 horas

**Prioridade**: Média (não bloqueia uso, mas degrada experiência)

---

### 2. Serviços Não Aparecem no Mapa

**Severidade**: 🟢 Baixa

**Descrição**:

Serviços não têm coluna `point` geoespacial no banco de dados, portanto não aparecem no mapa (nem em modo normal, nem em modo raio).

**Situação Atual**:
- Empresas: ✅ Aparecem
- Eventos: ✅ Aparecem
- Alertas: ✅ Aparecem
- Serviços: ❌ Não aparecem

**Trabalho Necessário**:

1. Adicionar coluna `point` à tabela `services`
2. Criar trigger de sincronização (latitude/longitude → point)
3. Adicionar `WHEN 'service'` ao RPC `search_entities_by_radius`
4. Criar fetcher `makeServiceFetcher` no MapaPageV4
5. Adicionar ao `useMapViewportFetch`
6. Reativar opção "Serviços" no layer control

**Estimativa**: 3-4 horas

**Prioridade**: Baixa (aguardar demanda real de usuários)

**Decisão**: Opção "Serviços" removida do layer control até implementação completa

---

### 3. Cache de Resultados do Modo Raio

**Severidade**: 🟢 Baixa

**Descrição**:

Ao desativar e reativar o modo raio, a busca é refeita mesmo que localização e raio sejam os mesmos.

**Problema**:
- Usuário ativa raio 5 km → busca executada
- Usuário desativa raio → volta para modo normal
- Usuário reativa raio 5 km → busca executada novamente (desnecessário)

**Solução Proposta**:

Usar cache do React Query (já configurado com `staleTime: 5 minutos`):

```typescript
const { data, isLoading } = useSpatialSearchByRadius({
  center: userLocation,
  radiusKm: searchRadius,
  entityType: 'business',
  enabled: radiusSearchEnabled && !!userLocation,
  // Cache já está ativo via staleTime no hook
});
```

**Observação**: Cache já existe, mas pode ser otimizado com `keepPreviousData: true`.

**Estimativa**: 1 hora

**Prioridade**: Baixa (otimização de performance)

---

### 4. Modo Raio Ignora Filtros de Camada

**Severidade**: 🟡 Média

**Descrição**:

Quando modo raio está ativo, filtros de camada são ignorados (sempre mostra todos os tipos).

**Decisão de Produto Atual**: Modo raio é busca espacial focada (usuário quer ver tudo próximo).

**Alternativa Futura**:

Permitir usuário escolher quais tipos filtrar no modo raio:

```tsx
<MapRadiusControl
  radius={5}
  types={['businesses', 'events']}  // Usuário escolhe
  onTypesChange={(types) => setActiveTypes(types)}
/>
```

**Estimativa**: 2-3 horas

**Prioridade**: Média (aguardar feedback de usuários)

---

### 5. Intervalo do Slider Fixo (1-50 km)

**Severidade**: 🟢 Baixa

**Descrição**:

Intervalo do slider é fixo (1-50 km, passo 1 km). Não há configuração por contexto.

**Cenário Futuro**:

Diferentes contextos podem precisar de intervalos diferentes:
- Área urbana densa: 0.5-10 km
- Área rural: 5-100 km
- Busca de emergência: 0.1-5 km

**Solução Proposta**:

Tornar intervalo configurável:

```typescript
<MapRadiusControl
  minRadius={territoryType === 'urban' ? 0.5 : 5}
  maxRadius={territoryType === 'urban' ? 10 : 100}
  step={territoryType === 'urban' ? 0.5 : 1}
/>
```

**Estimativa**: 1-2 horas

**Prioridade**: Baixa (aguardar necessidade real)

---

### 6. Busca por Múltiplos Raios

**Severidade**: 🟢 Baixa

**Descrição**:

Atualmente, todos os tipos usam o mesmo raio. Pode ser útil ter raios diferentes por tipo.

**Cenário de Uso**:
- Empresas: 2 km (próximas)
- Eventos: 10 km (área metropolitana)
- Alertas: 5 km (região)

**Solução Proposta**:

```typescript
<MapRadiusControl
  radiusByType={{
    businesses: 2,
    events: 10,
    alerts: 5,
  }}
/>
```

**Estimativa**: 3-4 horas

**Prioridade**: Baixa (feature avançada)

---

### 7. Ordenação Customizada no Modo Raio

**Severidade**: 🟡 Média

**Descrição**:

Atualmente, resultados são ordenados apenas por distância (mais próximo primeiro).

**Ordenações Desejadas**:
- Por distância (atual)
- Por rating (melhores primeiro)
- Por data (mais recentes primeiro)
- Por relevância (score combinado)

**Solução Proposta**:

```typescript
<MapRadiusControl
  radius={5}
  sortBy="distance"  // ou "rating", "date", "relevance"
  onSortChange={(sort) => setSortBy(sort)}
/>
```

**Estimativa**: 2-3 horas

**Prioridade**: Média (melhora experiência)

---

### 8. Filtro de Categoria no Modo Raio

**Severidade**: 🟡 Média

**Descrição**:

Atualmente, modo raio mostra todas as empresas. Pode ser útil filtrar por categoria.

**Cenário de Uso**:
- Usuário quer apenas restaurantes em 5 km
- Usuário quer apenas farmácias em 2 km

**Solução Proposta**:

```typescript
<MapRadiusControl
  radius={5}
  categories={['restaurant', 'pharmacy']}
  onCategoriesChange={(cats) => setCategories(cats)}
/>
```

**Estimativa**: 3-4 horas

**Prioridade**: Média (feature valiosa)

---

## 📊 RESUMO

| Dívida | Severidade | Estimativa | Prioridade |
|--------|-----------|-----------|-----------|
| 1. Erro/loading parcial | 🟡 Média | 2-3h | Média |
| 2. Serviços no mapa | 🟢 Baixa | 3-4h | Baixa |
| 3. Cache de resultados | 🟢 Baixa | 1h | Baixa |
| 4. Filtros de camada | 🟡 Média | 2-3h | Média |
| 5. Intervalo configurável | 🟢 Baixa | 1-2h | Baixa |
| 6. Múltiplos raios | 🟢 Baixa | 3-4h | Baixa |
| 7. Ordenação customizada | 🟡 Média | 2-3h | Média |
| 8. Filtro de categoria | 🟡 Média | 3-4h | Média |

**Total**: 8 dívidas técnicas, 18-27 horas de trabalho estimado

---

## 🎯 RECOMENDAÇÕES

### Curto Prazo (1-2 sprints)

1. **Erro/loading parcial** (2-3h) - Melhora experiência significativamente
2. **Ordenação customizada** (2-3h) - Feature valiosa e relativamente simples

### Médio Prazo (3-4 sprints)

3. **Filtro de categoria** (3-4h) - Feature valiosa
4. **Filtros de camada** (2-3h) - Aguardar feedback de usuários

### Longo Prazo (5+ sprints)

5. **Serviços no mapa** (3-4h) - Aguardar demanda real
6. **Múltiplos raios** (3-4h) - Feature avançada
7. **Intervalo configurável** (1-2h) - Aguardar necessidade
8. **Cache de resultados** (1h) - Otimização de performance

---

**Elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Status**: 📋 REGISTRADO
