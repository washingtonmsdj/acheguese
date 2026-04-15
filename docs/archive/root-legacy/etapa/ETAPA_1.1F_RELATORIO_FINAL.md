# ETAPA 1.1F - ROBUSTEZ E CORREÇÃO DE INCONSISTÊNCIAS

**Data**: 04/04/2026  
**Status**: ✅ CONCLUÍDO

---

## 🎯 OBJETIVO

Corrigir inconsistências técnicas e de comportamento do modo raio identificadas na ETAPA 1.1E.

---

## ✅ IMPLEMENTAÇÕES

### 1. Corrigido Formato de Dados ✅

**Problema Identificado**:

O relatório da ETAPA 1.1E mostrava que o RPC retorna `{ id, name, latitude, longitude, distance_meters, location_id }`, mas o código frontend usava `entity_id` e `entity_data` (estrutura aninhada que não existe).

**Investigação**:

Verificado `supabase/migrations/20260404000002_add_spatial_search_functions.sql`:

```sql
CREATE OR REPLACE FUNCTION search_entities_by_radius(...)
RETURNS TABLE (
  id UUID,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_meters NUMERIC,
  location_id UUID
)
```

**Conclusão**: RPC retorna estrutura plana, não aninhada.

**Correção Aplicada**:

**ANTES** (código incorreto):
```typescript
const businessMarkers = mapEntityProjection.projectEntities(
  (nearbyBusinesses || []).map((result) => ({
    id: result.entity_id,  // ❌ Campo não existe
    name: result.entity_data?.title,  // ❌ Estrutura não existe
    latitude: result.entity_data?.latitude,
    longitude: result.entity_data?.longitude,
    // ...
  })),
  'business',
  { includeMetadata: true, calculateScore: true, baseUrl: '/empresas' },
);
```

**DEPOIS** (código correto):
```typescript
const businessMarkers = mapEntityProjection.projectEntities(
  (nearbyBusinesses || []).map((result) => ({
    id: result.id,  // ✅ Campo correto
    name: result.name,  // ✅ Campo correto
    latitude: result.latitude,  // ✅ Campo correto
    longitude: result.longitude,  // ✅ Campo correto
    status: 'active',
    location_id: result.location_id,
  })),
  'business',
  { includeMetadata: true, calculateScore: true, baseUrl: '/empresas' },
);
```

**Resultado**: ✅ Código alinhado com formato real do RPC

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

**Documentação Adicionada**:
```typescript
// FORMATO DE DADOS:
// O RPC `search_entities_by_radius` retorna diretamente:
// { id, name, latitude, longitude, distance_meters, location_id }
// NÃO usa estrutura aninhada entity_id/entity_data.
```

---

### 2. Adicionado Estados de Loading e Erro ✅

**Problema Identificado**:

Hooks `useSpatialSearchByRadius` retornam estados de loading e erro, mas o código não os usava. Isso causava fallback incorreto para marcadores normais durante loading/erro.

**Implementação**:

**Estados Agregados**:
```typescript
// Estados agregados do modo raio
const isLoadingRadius = isLoadingBusinesses || isLoadingEvents || isLoadingAlerts;
const hasErrorRadius = isErrorBusinesses || isErrorEvents || isErrorAlerts;
```

**Uso nos Marcadores**:
```typescript
const markers = React.useMemo(() => {
  if (radiusSearchEnabled) {
    // CASO 1: Erro na busca espacial
    if (hasErrorRadius) {
      return [];  // Mapa vazio (não volta para marcadores normais)
    }
    
    // CASO 2: Ainda carregando
    if (isLoadingRadius) {
      return [];  // Mapa vazio (não volta para marcadores normais)
    }
    
    // CASO 3: Carregado com sucesso
    return [...businessMarkers, ...eventMarkers, ...alertMarkers];
  }

  // Modo normal
  return Object.values(layerData).flat();
}, [radiusSearchEnabled, hasErrorRadius, isLoadingRadius, ...]);
```

**Resultado**: ✅ Fallback correto durante loading e erro

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

---

### 3. Corrigido Fallback de Loading ✅

**Problema Identificado**:

Durante loading da busca por raio, mapa voltava temporariamente para marcadores do viewport (confuso para usuário).

**Comportamento Correto**:

Com raio ativo:
- Loading → Mapa vazio + indicador de loading
- NÃO volta para marcadores normais

**Implementação**:

**Indicador de Loading**:
```tsx
{radiusSearchEnabled && isLoadingRadius && (
  <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-6 py-4">
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="text-4xl animate-pulse">📍</div>
      <div>
        <p className="text-lg font-semibold text-gray-900">Buscando...</p>
        <p className="text-sm text-gray-600 mt-1">
          Procurando empresas, eventos e alertas em {searchRadius} km
        </p>
      </div>
    </div>
  </div>
)}
```

**Resultado**: ✅ Usuário vê indicador claro de loading, não marcadores incorretos

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

---

### 4. Corrigido Fallback de Erro ✅

**Problema Identificado**:

Em caso de erro na busca por raio, mapa voltava para marcadores normais (confuso para usuário).

**Comportamento Correto**:

Com raio ativo:
- Erro → Mapa vazio + mensagem de erro explícita
- NÃO volta para marcadores normais

**Implementação**:

**Indicador de Erro**:
```tsx
{radiusSearchEnabled && hasErrorRadius && !isLoadingRadius && (
  <div className="bg-white border border-red-200 rounded-xl shadow-xl px-6 py-4 max-w-md">
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="text-4xl">⚠️</div>
      <div>
        <p className="text-lg font-semibold text-red-900">Erro na busca</p>
        <p className="text-sm text-red-700 mt-1">
          Não foi possível buscar entidades próximas.
        </p>
        <p className="text-xs text-red-600 mt-2">
          Tente novamente ou desative o filtro.
        </p>
      </div>
    </div>
  </div>
)}
```

**Resultado**: ✅ Usuário vê mensagem clara de erro, não marcadores incorretos

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

---

### 5. Corrigido Inconsistência do Intervalo ✅

**Problema Identificado**:

- Código: `minRadius: 1`, `maxRadius: 50`
- Slider: `step: 0.5` (permitia 0.5 km, 1.5 km, etc.)
- Documentação: mencionava 0.5 km em testes

**Decisão de Produto**:

Intervalo oficial: 1–50 km, passo de 1 km (valores inteiros).

**Justificativa**:
- Mais simples e direto
- Evita valores fracionários confusos (1.5 km, 2.5 km)
- Alinhado com minRadius oficial

**Correção Aplicada**:

**ANTES**:
```typescript
<Slider
  value={[radius]}
  onValueChange={handleRadiusChange}
  min={minRadius}
  max={maxRadius}
  step={0.5}  // ❌ Permitia 0.5 km
  className="w-full"
/>
```

**DEPOIS**:
```typescript
<Slider
  value={[radius]}
  onValueChange={handleRadiusChange}
  min={minRadius}
  max={maxRadius}
  step={1}  // ✅ Apenas valores inteiros
  className="w-full"
/>
```

**Resultado**: ✅ Slider alinhado com intervalo oficial (1–50 km, passo 1 km)

**Arquivo**: `src/core/maps/components/v3/controls/MapRadiusControl.tsx`

---

### 6. Esclarecido Situação de Serviços ✅

**Investigação Realizada**:

1. Verificado `MapaPageV4.tsx`: NÃO há fetcher de serviços
2. Verificado layer control: lista 'services' mas não há dados
3. Verificado banco de dados: serviços NÃO têm coluna `point`

**Conclusão Definitiva**:

Serviços NÃO aparecem no mapa (nem em modo normal, nem em modo raio).

**Motivo**: Não têm coordenadas geográficas (coluna `point` não existe).

**Situação Atual**:

| Tipo | Modo Normal | Modo Raio | Motivo |
|------|------------|-----------|--------|
| Empresas | ✅ Aparecem | ✅ Filtrado | Têm coluna `point` + fetcher |
| Eventos | ✅ Aparecem | ✅ Filtrado | Têm coluna `point` + fetcher |
| Alertas | ✅ Aparecem | ✅ Filtrado | Têm coluna `point` + fetcher |
| Serviços | ❌ NÃO aparecem | ❌ NÃO aparecem | NÃO têm coluna `point` |

**Layer Control**:

O layer control lista 'services', mas é apenas UI (não há dados para mostrar/ocultar).

**Trabalho Futuro** (se necessário):

1. Adicionar coluna `point` à tabela `services`
2. Criar trigger de sincronização
3. Criar fetcher `makeServiceFetcher`
4. Adicionar ao `useMapViewportFetch`
5. Adicionar ao modo raio

**Resultado**: ✅ Situação esclarecida sem ambiguidade

---

### 7. Documentado Semântica dos Filtros de Camada ✅

**Decisão de Produto**:

O modo raio IGNORA filtros de camadas (sempre mostra todos os tipos disponíveis).

**Justificativa**:
- Modo raio é busca espacial focada (usuário quer ver tudo próximo)
- Filtros de camada são para exploração visual (usuário quer focar em um tipo)
- Combinar os dois seria confuso (raio + camada = muita complexidade)

**Comportamento Atual**:

| Modo | Filtros de Camada | Tipos Mostrados |
|------|------------------|-----------------|
| Normal | ✅ Respeitados | Apenas tipos selecionados |
| Raio | ❌ Ignorados | Todos os tipos (empresas, eventos, alertas) |

**Alternativa Futura** (se houver demanda):

Permitir usuário escolher quais tipos filtrar no modo raio (checkbox por tipo).

**Resultado**: ✅ Semântica documentada e justificada

---

## 📋 SEMÂNTICA FINAL DO MODO RAIO (ATUALIZADA)

### Estados do Modo Raio

#### Estado 1: Loading

**Condição**: `radiusSearchEnabled === true && isLoadingRadius === true`

**Comportamento**:
- Mapa mostra ZERO marcadores (não volta para viewport)
- Indicador de loading aparece no centro
- Mensagem: "Buscando... Procurando empresas, eventos e alertas em X km"

**Justificativa**: Evitar confusão (usuário não vê marcadores incorretos temporariamente)

---

#### Estado 2: Erro

**Condição**: `radiusSearchEnabled === true && hasErrorRadius === true`

**Comportamento**:
- Mapa mostra ZERO marcadores (não volta para viewport)
- Indicador de erro aparece no centro
- Mensagem: "Erro na busca. Não foi possível buscar entidades próximas."
- Sugestão: "Tente novamente ou desative o filtro."

**Justificativa**: Erro explícito é melhor que fallback silencioso

---

#### Estado 3: Zero Resultados

**Condição**: `radiusSearchEnabled === true && todos os arrays vazios`

**Comportamento**:
- Mapa mostra ZERO marcadores
- Indicador de zero resultados aparece no centro
- Mensagem: "Nada encontrado. Não há empresas, eventos ou alertas em um raio de X km."
- Sugestão: "Tente aumentar o raio de busca ou desativar o filtro."

**Justificativa**: Usuário entende que filtro está ativo mas não encontrou nada

---

#### Estado 4: Sucesso com Resultados

**Condição**: `radiusSearchEnabled === true && pelo menos um array não vazio`

**Comportamento**:
- Mapa mostra marcadores de empresas, eventos e alertas
- Badge "Ativo" com ponto pulsante
- Aviso: "Mostrando empresas, eventos e alertas em X km"
- Botão "Desativar filtro"

**Justificativa**: Usuário vê resultados e sabe que filtro está ativo

---

### Formato de Dados (SSOT)

**RPC**: `search_entities_by_radius`

**Retorno**:
```typescript
{
  id: UUID,
  name: TEXT,
  latitude: DOUBLE PRECISION,
  longitude: DOUBLE PRECISION,
  distance_meters: NUMERIC,
  location_id: UUID
}
```

**NÃO usa estrutura aninhada** (`entity_id`, `entity_data`).

**Transformação no Frontend**:
```typescript
const markers = mapEntityProjection.projectEntities(
  results.map((result) => ({
    id: result.id,  // Direto do RPC
    name: result.name,  // Direto do RPC
    latitude: result.latitude,  // Direto do RPC
    longitude: result.longitude,  // Direto do RPC
    status: 'active',  // Assumido (RPC já filtra por status)
    location_id: result.location_id,  // Direto do RPC
  })),
  entityType,
  options,
);
```

---

## 📁 ARQUIVOS MODIFICADOS

1. **src/core/maps/pages/MapaPageV4.tsx**
   - Corrigido formato de dados (entity_id/entity_data → id/name/latitude/longitude)
   - Adicionado estados agregados (isLoadingRadius, hasErrorRadius)
   - Corrigido fallback de loading (mapa vazio + indicador)
   - Corrigido fallback de erro (mapa vazio + mensagem)
   - Adicionado indicador de loading
   - Adicionado indicador de erro
   - Documentado formato de dados real
   - Documentado semântica dos filtros de camada

2. **src/core/maps/components/v3/controls/MapRadiusControl.tsx**
   - Corrigido step do slider (0.5 → 1)
   - Alinhado com intervalo oficial (1–50 km, passo 1 km)

**Total**: 2 arquivos modificados

---

## ✅ VALIDAÇÃO OBJETIVA

### Teste 1: Loading Não Mostra Marcadores Incorretos

**Objetivo**: Validar que durante loading, mapa não volta para marcadores normais

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider para 50 km (busca lenta)
4. Observar comportamento durante loading

**Resultado Esperado**:
- [ ] Mapa mostra ZERO marcadores (não volta para viewport)
- [ ] Indicador de loading aparece no centro
- [ ] Mensagem diz: "Buscando... Procurando empresas, eventos e alertas em 50 km"
- [ ] Após loading, marcadores aparecem

**Critério de Sucesso**: Todos os itens marcados

---

### Teste 2: Erro Não Mostra Marcadores Incorretos

**Objetivo**: Validar que em caso de erro, mapa não volta para marcadores normais

**Pré-requisito**: Simular erro (desconectar internet ou modificar RPC)

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Desconectar internet
4. Arrastar slider para 10 km
5. Observar comportamento

**Resultado Esperado**:
- [ ] Mapa mostra ZERO marcadores (não volta para viewport)
- [ ] Indicador de erro aparece no centro
- [ ] Mensagem diz: "Erro na busca. Não foi possível buscar entidades próximas."
- [ ] Sugestão: "Tente novamente ou desative o filtro."

**Critério de Sucesso**: Todos os itens marcados

---

### Teste 3: Formato de Dados Correto

**Objetivo**: Validar que marcadores aparecem corretamente (sem erros de console)

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Abrir DevTools (F12) → Console
3. Permitir localização
4. Arrastar slider para 10 km
5. Verificar console

**Resultado Esperado**:
- [ ] Marcadores aparecem no mapa
- [ ] Console NÃO mostra erros de `undefined` ou `null`
- [ ] Console NÃO mostra avisos de `entity_id` ou `entity_data`
- [ ] Marcadores têm nome, coordenadas e tipo corretos

**Critério de Sucesso**: Todos os itens marcados

---

### Teste 4: Intervalo do Slider Correto

**Objetivo**: Validar que slider só permite valores inteiros de 1–50 km

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider para mínimo
4. Verificar valor
5. Arrastar slider lentamente
6. Observar valores intermediários
7. Arrastar slider para máximo
8. Verificar valor

**Resultado Esperado**:
- [ ] Valor mínimo é 1 km (não 0.5 km)
- [ ] Valores intermediários são inteiros (2, 3, 4, ..., não 1.5, 2.5)
- [ ] Valor máximo é 50 km
- [ ] Indicador mostra valores inteiros (ex: "5 km", não "5.5 km")

**Critério de Sucesso**: Todos os itens marcados

---

### Teste 5: Serviços Não Aparecem

**Objetivo**: Validar que serviços não aparecem no mapa (nem em modo normal, nem em modo raio)

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Verificar marcadores no modo normal
3. Permitir localização
4. Arrastar slider para 20 km
5. Verificar marcadores no modo raio
6. Abrir layer control
7. Verificar opção "Serviços"

**Resultado Esperado**:
- [ ] Modo normal: apenas empresas, eventos, alertas (sem serviços)
- [ ] Modo raio: apenas empresas, eventos, alertas (sem serviços)
- [ ] Layer control: opção "Serviços" existe mas não faz nada
- [ ] Console: sem erros relacionados a serviços

**Critério de Sucesso**: Todos os itens marcados

---

## 📊 RESUMO EXECUTIVO

| Item | Status |
|------|--------|
| Formato de dados corrigido | ✅ |
| Estados de loading/erro adicionados | ✅ |
| Fallback de loading corrigido | ✅ |
| Fallback de erro corrigido | ✅ |
| Inconsistência do intervalo corrigida | ✅ |
| Situação de serviços esclarecida | ✅ |
| Semântica dos filtros documentada | ✅ |

**Total**: 7/7 itens concluídos (100%)

---

## 🎯 DECISÕES DE PRODUTO

### 1. Intervalo do Slider: 1–50 km, Passo 1 km

**Decisão**: Slider permite apenas valores inteiros de 1 a 50 km.

**Justificativa**:
- Mais simples e direto
- Evita valores fracionários confusos (1.5 km, 2.5 km)
- Alinhado com minRadius oficial
- Usuário não precisa de precisão sub-quilométrica

**Alternativa Rejeitada**: Passo de 0.5 km (complexidade desnecessária)

---

### 2. Fallback de Loading/Erro: Mapa Vazio

**Decisão**: Durante loading ou erro, mapa fica vazio (não volta para marcadores normais).

**Justificativa**:
- Evita confusão (usuário não vê marcadores incorretos temporariamente)
- Torna explícito que filtro está ativo
- Indicadores visuais claros (loading/erro)

**Alternativa Rejeitada**: Voltar para marcadores normais (confuso e inconsistente)

---

### 3. Modo Raio Ignora Filtros de Camada

**Decisão**: Quando raio está ativo, filtros de camada são ignorados (sempre mostra todos os tipos).

**Justificativa**:
- Modo raio é busca espacial focada (usuário quer ver tudo próximo)
- Filtros de camada são para exploração visual (usuário quer focar em um tipo)
- Combinar os dois seria confuso (raio + camada = muita complexidade)

**Alternativa Futura**: Permitir usuário escolher quais tipos filtrar no modo raio (se houver demanda)

---

### 4. Serviços Não Aparecem no Mapa

**Decisão**: Serviços não aparecem no mapa (nem em modo normal, nem em modo raio).

**Justificativa**:
- Serviços não têm coordenadas geográficas (coluna `point` não existe)
- Adicionar serviços requer trabalho adicional (migration, trigger, fetcher)
- Foco em entidades que já funcionam

**Quando Adicionar**: Quando houver demanda real de usuários

---

## 🚀 PRÓXIMOS PASSOS (TRABALHO FUTURO)

### Curto Prazo (1-2 horas)

1. Adicionar testes automatizados para estados de loading/erro
2. Adicionar métricas de performance (tempo de busca, quantidade de resultados)
3. Adicionar cache de resultados (evitar re-buscar ao desativar/reativar)

### Médio Prazo (2-4 horas)

1. Permitir usuário escolher quais tipos filtrar no modo raio
2. Adicionar ordenação customizada (por distância, por rating, por data)
3. Adicionar filtro de categoria (ex: apenas restaurantes em 5 km)

### Longo Prazo (4+ horas)

1. Adicionar serviços ao mapa (migration + trigger + fetcher)
2. Adicionar busca por múltiplos raios (ex: 2 km para empresas, 10 km para eventos)
3. Adicionar modo híbrido (raio + território + camadas)

---

## 📝 NOTAS TÉCNICAS

### Formato de Dados: RPC vs Frontend

**RPC** (`search_entities_by_radius`):
```sql
RETURNS TABLE (
  id UUID,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_meters NUMERIC,
  location_id UUID
)
```

**Frontend** (`SpatialSearchResult`):
```typescript
export interface SpatialSearchResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance_meters?: number;
  location_id?: string;
  in_territory?: boolean;
}
```

**Transformação**: Direta (sem aninhamento)

---

### Estados do Modo Raio

```typescript
// Estados individuais (por tipo)
const { data: nearbyBusinesses, isLoading: isLoadingBusinesses, isError: isErrorBusinesses } = ...
const { data: nearbyEvents, isLoading: isLoadingEvents, isError: isErrorEvents } = ...
const { data: nearbyAlerts, isLoading: isLoadingAlerts, isError: isErrorAlerts } = ...

// Estados agregados (todos os tipos)
const isLoadingRadius = isLoadingBusinesses || isLoadingEvents || isLoadingAlerts;
const hasErrorRadius = isErrorBusinesses || isErrorEvents || isErrorAlerts;

// Lógica de marcadores
if (radiusSearchEnabled) {
  if (hasErrorRadius) return [];  // Erro
  if (isLoadingRadius) return [];  // Loading
  return [...businessMarkers, ...eventMarkers, ...alertMarkers];  // Sucesso
}
return Object.values(layerData).flat();  // Modo normal
```

---

### Intervalo do Slider

```typescript
// Configuração
initialRadius = 5,   // Raio inicial
minRadius = 1,       // Mínimo (não permite 0.5 km)
maxRadius = 50,      // Máximo
step = 1,            // Passo (apenas valores inteiros)

// Valores possíveis
[1, 2, 3, 4, 5, ..., 48, 49, 50]  // 50 valores

// Valores NÃO possíveis
[0.5, 1.5, 2.5, ...]  // Fracionários
[0, 51, 100, ...]     // Fora do intervalo
```

---

**Elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Status**: ✅ ETAPA 1.1F CONCLUÍDA
