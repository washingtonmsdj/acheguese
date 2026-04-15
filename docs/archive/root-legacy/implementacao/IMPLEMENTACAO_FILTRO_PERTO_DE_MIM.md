# Implementação: Filtro "Perto de Mim" com Geolocalização

## Visão Geral

Implementação profissional de filtro de proximidade usando geolocalização do navegador e cálculo de distância via fórmula de Haversine. O filtro ordena empresas por distância real da posição do usuário.

## Arquitetura

### 1. Hook de Posição do Usuário (`useUserPosition`)

**Arquivo:** `src/modules/business/hooks/useUserPosition.ts`

**Responsabilidades:**
- Solicitar permissão de geolocalização
- Obter coordenadas GPS do usuário
- Armazenar posição no localStorage (cache de 5 minutos)
- Gerenciar estados de loading e erro

**Features:**
- ✅ Cache inteligente (5 minutos)
- ✅ Persistência no localStorage
- ✅ Tratamento de erros (permissão negada, timeout, etc)
- ✅ High accuracy GPS
- ✅ Type-safe

**Interface:**
```typescript
interface UserPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseUserPositionResult {
  position: UserPosition | null;
  requestPosition: () => void;
  clearPosition: () => void;
  loading: boolean;
  error: string | null;
  isAvailable: boolean;
  hasPermission: boolean;
}
```

### 2. Hook de Cálculo de Distância (`useBusinessDistance`)

**Arquivo:** `src/modules/business/hooks/useBusinessDistance.ts`

**Responsabilidades:**
- Calcular distância entre usuário e cada empresa
- Adicionar campo `distance` (em metros) às empresas
- Ordenar empresas por distância
- Filtrar empresas dentro de um raio

**Features:**
- ✅ Usa fórmula de Haversine (já existente em `geolocation.ts`)
- ✅ Memoização para performance
- ✅ Suporta empresas sem coordenadas
- ✅ Três hooks especializados:
  - `useBusinessDistance` - Adiciona distância
  - `useSortedByDistance` - Ordena por distância
  - `useBusinessesWithinRadius` - Filtra por raio

**Cálculo de Distância:**
```typescript
// Usa a fórmula de Haversine existente
import { calculateDistance } from '@/shared/utils/geolocation';

const distance = calculateDistance(
  userLat, userLng,
  businessLat, businessLng
); // Retorna metros
```

### 3. Integração na UI (`CategoryBusinessPage`)

**Arquivo:** `src/modules/business/pages/CategoryBusinessPage.tsx`

**Mudanças:**
1. Importação dos novos hooks
2. Gerenciamento de estado do filtro "Perto de mim"
3. Botão de filtro com ícone de localização
4. Exibição de distância nos cards
5. Mensagens de erro de GPS

**Fluxo:**
```
1. Usuário clica em "Perto de mim"
2. Se não tem posição → solicita permissão GPS
3. Obtém coordenadas do usuário
4. Calcula distância para cada empresa
5. Ordena por distância (mais próximas primeiro)
6. Exibe badge com distância em cada card
```

## Componentes da UI

### Botão "Perto de Mim"

```tsx
<button
  onClick={() => {
    if (!userPosition && !positionLoading) {
      requestPosition();
    }
    setNearbyFilterActive(!nearbyFilterActive);
  }}
  disabled={positionLoading}
>
  {positionLoading ? (
    <Loader2 className="animate-spin" />
  ) : (
    <Locate />
  )}
  Perto de mim
</button>
```

**Estados:**
- Inativo: Cinza, ícone Locate
- Loading: Spinner animado
- Ativo: Verde/Primary, mostra X para remover
- Erro: Mensagem abaixo do botão

### Badge de Distância

```tsx
{business.distance !== null && nearbyFilterActive && (
  <Badge variant="secondary">
    <Navigation />
    {formatDistance(business.distance)}
  </Badge>
)}
```

**Formato:**
- < 1km: "150m", "850m"
- >= 1km: "1.2km", "5.7km"

### Mensagem de Erro

```tsx
{positionError && nearbyFilterActive && (
  <div className="bg-destructive/10 border border-destructive/20">
    <AlertCircle />
    <p>{positionError}</p>
    <button onClick={requestPosition}>
      Tentar novamente
    </button>
  </div>
)}
```

## Lógica de Ordenação

### Sem Filtro "Perto de Mim"
```typescript
// Ordenação padrão (rating, nome, recente, reviews)
switch (sortBy) {
  case "rating":
    result.sort((a, b) => b.rating - a.rating);
    break;
  // ...
}
```

### Com Filtro "Perto de Mim"
```typescript
// Usa lista pré-ordenada por distância
const result = nearbyFilterActive && userPosition 
  ? [...sortedByDistance] 
  : [...businessesWithDistance];

// sortedByDistance já está ordenado:
// 1. Empresas com distância (mais próximas primeiro)
// 2. Empresas sem coordenadas (no final)
```

## Tratamento de Erros

### Permissão Negada
```
"Permissão de localização negada. Ative nas configurações do navegador."
```
- Usuário pode tentar novamente
- Filtro permanece visível mas inativo

### Posição Indisponível
```
"Localização indisponível no momento."
```
- GPS não conseguiu obter coordenadas
- Pode ser problema de sinal

### Timeout
```
"Tempo esgotado ao buscar localização."
```
- GPS demorou mais de 10 segundos

### Navegador Sem Suporte
- Botão "Perto de mim" não aparece
- `gpsAvailable === false`

## Performance

### Otimizações Implementadas

1. **Memoização:**
   - `useBusinessDistance` usa `useMemo`
   - `useSortedByDistance` usa `useMemo`
   - Recalcula apenas quando necessário

2. **Cache de Posição:**
   - localStorage com TTL de 5 minutos
   - Evita múltiplas solicitações GPS

3. **Lazy Loading:**
   - GPS só é acionado quando usuário clica
   - Não solicita permissão automaticamente

4. **Cálculo Eficiente:**
   - Fórmula de Haversine otimizada
   - Cálculo em memória (não requer backend)

## Dados Necessários

### Empresas Precisam Ter:
```typescript
business.address?.latitude: number | null
business.address?.longitude: number | null
```

### Empresas Sem Coordenadas:
- `distance` será `null`
- Aparecem no final da lista
- Não mostram badge de distância

## Extensões Futuras (Opcional)

### 1. Filtro por Raio
```typescript
const nearbyBusinesses = useBusinessesWithinRadius(
  businessesWithDistance,
  5000 // 5km
);
```

### 2. Mapa com Marcadores
- Mostrar empresas próximas no mapa
- Usar `business.distance` para raio visual

### 3. Notificações de Proximidade
- Alertar quando usuário está perto de empresa favorita
- Usar Geolocation API com `watchPosition`

### 4. Ordenação Híbrida
```typescript
// Combinar distância + rating
score = (1 / distance) * rating
```

## Testes Sugeridos

### Casos de Teste

1. **Permissão Concedida:**
   - Clicar em "Perto de mim"
   - Verificar loading
   - Verificar ordenação por distância
   - Verificar badges de distância

2. **Permissão Negada:**
   - Negar permissão
   - Verificar mensagem de erro
   - Clicar em "Tentar novamente"

3. **Cache:**
   - Obter posição
   - Recarregar página
   - Verificar que posição foi restaurada

4. **Empresas Sem Coordenadas:**
   - Verificar que aparecem no final
   - Verificar que não mostram badge

5. **Navegador Sem GPS:**
   - Testar em ambiente sem geolocation
   - Verificar que botão não aparece

## Compatibilidade

### Navegadores Suportados:
- ✅ Chrome/Edge (desktop e mobile)
- ✅ Firefox (desktop e mobile)
- ✅ Safari (desktop e mobile)
- ✅ Opera

### Requisitos:
- HTTPS (geolocation não funciona em HTTP)
- Permissão do usuário
- GPS/Wi-Fi habilitado no dispositivo

## Segurança e Privacidade

### Boas Práticas Implementadas:

1. **Opt-in:** Usuário precisa clicar para ativar
2. **Transparência:** Mensagens claras sobre uso de localização
3. **Cache Local:** Posição armazenada apenas no dispositivo
4. **TTL:** Cache expira em 5 minutos
5. **Sem Tracking:** Posição não é enviada para servidor

## Conclusão

Implementação profissional e completa de filtro de proximidade:
- ✅ SSOT (hooks centralizados)
- ✅ Type-safe (TypeScript)
- ✅ Performance (memoização + cache)
- ✅ UX (loading, erros, feedback visual)
- ✅ Privacidade (opt-in, cache local)
- ✅ Escalável (fácil adicionar raio, mapa, etc)
- ✅ Sem gambiarras (usa APIs nativas + fórmula matemática)
