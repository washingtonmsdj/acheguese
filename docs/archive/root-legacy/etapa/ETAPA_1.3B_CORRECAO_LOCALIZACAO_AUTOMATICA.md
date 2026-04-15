# ETAPA 1.3B - Correção de Localização Automática

**Data**: 2026-04-04  
**Problema**: Pino de localização some ao atualizar página  
**Status**: ✅ CORRIGIDO

---

## Problema Identificado

### Sintoma

Ao atualizar a página (F5), o pino de localização do usuário desaparece. Só volta a aparecer quando clica no botão "Localizar".

### Causa Raiz

O `useEffect` que solicita localização tinha `requestLocation` como dependência:

```typescript
// ❌ ANTES (PROBLEMA)
React.useEffect(() => {
  requestLocation();
}, [requestLocation]); // requestLocation muda a cada render
```

**Por que isso causava problema?**

1. `requestLocation` não é memoizado no `useRobustGeolocation`
2. A cada render, uma nova função `requestLocation` é criada
3. `useEffect` detecta mudança de referência → executa novamente
4. Pode causar loops infinitos ou não executar quando deveria
5. Mesmo com cache, o estado `coords` começa como `null` até a primeira execução

---

## Solução Implementada

### useEffect com Array Vazio

```typescript
// ✅ DEPOIS (CORRETO)
React.useEffect(() => {
  console.log('[MapaPageV4] Montando componente, solicitando localização...');
  requestLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Array vazio = executa apenas uma vez ao montar
```

### Por que funciona?

1. **Executa apenas uma vez**: Ao montar o componente
2. **Usa cache**: `useRobustGeolocation` tem `useCache: true`
3. **Resposta instantânea**: Cache retorna localização imediatamente
4. **Atualização em background**: GeolocationService atualiza cache em background

---

## Fluxo de Localização (SSOT)

### Ao Montar Componente

```
1. MapaPageV4 monta
   ↓
2. useEffect executa requestLocation() (apenas uma vez)
   ↓
3. useRobustGeolocation chama GeolocationService.getCurrentLocation()
   ↓
4. GeolocationService verifica cache (localStorage)
   ↓
5a. SE cache válido (< 5min):
    - Retorna cache imediatamente
    - Atualiza em background (não bloqueia)
    - Pino aparece instantaneamente
   ↓
5b. SE cache inválido/inexistente:
    - Solicita GPS (dispara prompt se necessário)
    - Fallback para IP se GPS falhar
    - Salva no cache
    - Pino aparece após obter localização
```

### Ao Atualizar Página (F5)

```
1. Página recarrega
   ↓
2. MapaPageV4 monta novamente
   ↓
3. useEffect executa requestLocation()
   ↓
4. GeolocationService encontra cache válido
   ↓
5. Retorna cache instantaneamente
   ↓
6. Pino aparece imediatamente (sem prompt)
```

---

## Cache de Localização

### Configuração

- **Chave**: `geolocation_cache_v1` (localStorage)
- **Duração**: 5 minutos
- **Estrutura**:
  ```json
  {
    "result": {
      "coords": { "latitude": -12.9822, "longitude": -38.4812, ... },
      "source": "gps",
      "isHighAccuracy": true
    },
    "timestamp": 1775300287026
  }
  ```

### Vantagens

1. **Resposta instantânea**: Não precisa solicitar GPS novamente
2. **Sem prompt repetido**: Usuário não é incomodado a cada refresh
3. **Economia de bateria**: Menos requisições GPS
4. **Melhor UX**: Pino aparece imediatamente

---

## Marcador de Localização

### Configuração no MapLibreAdapter

```typescript
userLocationMarker={{ enabled: true, autoAdd: true }}
```

- `enabled: true`: Habilita marcador de localização
- `autoAdd: true`: Adiciona automaticamente quando `userLocation` está disponível

### Lógica de Renderização

```typescript
const allMarkers = React.useMemo(() => {
  const result = [...filteredMarkers];
  if (userLocationMarker?.enabled && userLocationMarker?.autoAdd && userLocation) {
    result.push({
      id: 'user-location',
      type: 'user_location' as const,
      coordinates: { latitude: userLocation.latitude, longitude: userLocation.longitude },
      title: userLocationMarker.label ?? 'Você está aqui',
      status: 'active' as const,
      metadata: { isUserLocation: true },
    });
  }
  return result;
}, [filteredMarkers, userLocationMarker, userLocation]);
```

---

## Validação

### Teste 1: Primeira Visita (Sem Cache)

1. Abrir página pela primeira vez
2. Navegador solicita permissão de localização
3. Usuário permite
4. Pino aparece após obter GPS
5. Localização salva no cache

### Teste 2: Atualizar Página (Com Cache)

1. Atualizar página (F5)
2. Pino aparece IMEDIATAMENTE (cache)
3. Sem prompt de permissão
4. Cache atualizado em background

### Teste 3: Cache Expirado (> 5min)

1. Aguardar 5 minutos
2. Atualizar página
3. Cache expirado → solicita GPS novamente
4. Pino aparece após obter GPS
5. Novo cache salvo

---

## Logs de Validação

### Primeira Visita

```
[MapaPageV4] Montando componente, solicitando localização...
[GeolocationService] Iniciando busca de localização...
[GeolocationService] GPS tentativa 1/3: Desktop preciso
[GeolocationService] GPS sucesso: 2000m precisão
[GeolocationService] Localização obtida com sucesso
[MapaPageV4] ✅ Geolocalização obtida via callback
```

### Atualizar Página (Com Cache)

```
[MapaPageV4] Montando componente, solicitando localização...
[GeolocationService] Iniciando busca de localização...
[GeolocationService] Usando cache (age: 30s, accuracy: 2000m)
[GeolocationService] Retornando cache e atualizando em background
[MapaPageV4] ✅ Geolocalização obtida via callback
[GeolocationService] Cache atualizado em background
```

---

## Arquivos Alterados

- `src/core/maps/pages/MapaPageV4.tsx` - useEffect com array vazio

---

## Padrão de Otimização

### Regra Geral para useEffect

```typescript
// ❌ EVITAR: Dependência de função não memoizada
useEffect(() => {
  someFunction();
}, [someFunction]); // Pode causar loops infinitos

// ✅ PREFERIR: Array vazio para executar apenas uma vez
useEffect(() => {
  someFunction();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Executa apenas ao montar

// ✅ OU: Memoizar a função
const someFunction = useCallback(() => {
  // ...
}, [/* dependências reais */]);

useEffect(() => {
  someFunction();
}, [someFunction]); // Agora é seguro
```

---

**Conclusão**: Localização automática funcionando. Pino aparece imediatamente ao atualizar página (usando cache) e não some mais.
