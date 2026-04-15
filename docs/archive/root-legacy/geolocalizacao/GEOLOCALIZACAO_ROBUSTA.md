# Sistema Robusto de Geolocalização

## Visão Geral

Implementação de geolocalização de alta precisão com múltiplas estratégias de fallback, seguindo SSOT.

## Hook: `useRobustGeolocation`

### Estratégias de Precisão (em ordem)

1. **Cache Local** (resposta instantânea)
   - Localização armazenada nos últimos 5 minutos
   - Fornece resposta imediata enquanto busca localização fresca

2. **GPS de Alta Precisão** (mais preciso)
   - `enableHighAccuracy: true`
   - Múltiplas tentativas com timeout progressivo
   - Precisão típica: 5-50 metros

3. **IP Geolocation** (fallback)
   - Usado quando GPS falha
   - Precisão típica: ~5km
   - Serviço: ipapi.co (gratuito)

### Características

✅ **Múltiplas Tentativas**
- Até 3 tentativas de GPS com timeout progressivo
- Timeout aumenta a cada tentativa (10s, 20s, 30s)

✅ **Cache Inteligente**
- Armazena última localização por 5 minutos
- Resposta instantânea + atualização em background

✅ **Rastreamento Contínuo**
- Modo `watch` para atualização em tempo real
- Ideal para navegação e tracking

✅ **Tratamento de Erros**
- Fallback automático para IP geolocation
- Mensagens de erro claras
- Callbacks de sucesso/erro

✅ **Informações Detalhadas**
- Latitude, longitude, precisão
- Altitude, velocidade, direção
- Timestamp e fonte (GPS/IP/cache)

## Uso Básico

```typescript
import { useRobustGeolocation } from '@/shared/hooks';

function MyComponent() {
  const {
    coords,
    loading,
    error,
    source,
    isHighAccuracy,
    requestLocation,
  } = useRobustGeolocation({
    onSuccess: (coords) => {
      console.log('Localização obtida:', coords);
    },
    onError: (error) => {
      console.error('Erro:', error);
    },
  });

  return (
    <div>
      <button onClick={requestLocation} disabled={loading}>
        {loading ? 'Obtendo localização...' : 'Obter Localização'}
      </button>

      {coords && (
        <div>
          <p>Lat: {coords.latitude}</p>
          <p>Lng: {coords.longitude}</p>
          <p>Precisão: {Math.round(coords.accuracy)}m</p>
          <p>Fonte: {source}</p>
          {isHighAccuracy && <span>✅ Alta precisão</span>}
        </div>
      )}

      {error && <p>Erro: {error}</p>}
    </div>
  );
}
```

## Uso com Rastreamento Contínuo

```typescript
const {
  coords,
  startWatching,
  stopWatching,
} = useRobustGeolocation({
  watch: true, // Inicia automaticamente
  onSuccess: (coords) => {
    // Atualizado continuamente
    updateMapPosition(coords);
  },
});

// Ou controlar manualmente
useEffect(() => {
  startWatching();
  return () => stopWatching();
}, []);
```

## Opções Avançadas

```typescript
useRobustGeolocation({
  // Ativar rastreamento contínuo
  watch: false,
  
  // Timeout por tentativa (ms)
  timeout: 10000,
  
  // Número máximo de tentativas GPS
  maxRetries: 3,
  
  // Usar cache de localização
  useCache: true,
  
  // Callbacks
  onSuccess: (coords) => {},
  onError: (error) => {},
});
```

## API Completa

### Estado Retornado

```typescript
{
  // Coordenadas atuais
  coords: GeolocationCoords | null;
  
  // Estado de carregamento
  loading: boolean;
  
  // Mensagem de erro
  error: string | null;
  
  // Estado da permissão
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  
  // Fonte da localização
  source: 'gps' | 'ip' | 'cache' | null;
  
  // Alta precisão (< 100m)
  isHighAccuracy: boolean;
}
```

### Métodos

```typescript
{
  // Solicitar localização única
  requestLocation: () => Promise<void>;
  
  // Iniciar rastreamento contínuo
  startWatching: () => void;
  
  // Parar rastreamento
  stopWatching: () => void;
  
  // Verificar permissão
  checkPermission: () => Promise<PermissionState>;
  
  // Limpar cache
  clearCache: () => void;
}
```

### Interface GeolocationCoords

```typescript
{
  latitude: number;
  longitude: number;
  accuracy: number;              // Precisão em metros
  altitude: number | null;       // Altitude em metros
  altitudeAccuracy: number | null;
  heading: number | null;        // Direção (0-360°)
  speed: number | null;          // Velocidade em m/s
  timestamp: number;             // Unix timestamp
}
```

## Fluxo de Execução

```
1. requestLocation() chamado
   ↓
2. Verificar cache (< 5min)
   ├─ Cache válido → Retorna imediatamente + atualiza em background
   └─ Sem cache → Continua
   ↓
3. Tentativa GPS #1 (timeout: 10s)
   ├─ Sucesso → Retorna coordenadas GPS
   └─ Falha → Próxima tentativa
   ↓
4. Tentativa GPS #2 (timeout: 20s)
   ├─ Sucesso → Retorna coordenadas GPS
   └─ Falha → Próxima tentativa
   ↓
5. Tentativa GPS #3 (timeout: 30s)
   ├─ Sucesso → Retorna coordenadas GPS
   └─ Falha → Fallback IP
   ↓
6. IP Geolocation (ipapi.co)
   ├─ Sucesso → Retorna coordenadas IP (~5km precisão)
   └─ Falha → Retorna erro
```

## Precisão Esperada

| Fonte | Precisão Típica | Tempo de Resposta |
|-------|----------------|-------------------|
| Cache | Mesma da fonte original | < 10ms |
| GPS (móvel) | 5-50m | 2-10s |
| GPS (desktop) | 50-500m | 5-30s |
| IP Geolocation | ~5km | 1-3s |

## Tratamento de Erros

### Erros Comuns

1. **Permissão Negada**
   - Usuário bloqueou acesso à localização
   - Fallback: IP geolocation

2. **Timeout**
   - GPS demorou muito para responder
   - Solução: Retry com timeout maior

3. **Posição Indisponível**
   - GPS não conseguiu obter sinal
   - Fallback: IP geolocation

4. **Navegador Não Suporta**
   - API de geolocalização não disponível
   - Fallback: IP geolocation

## Boas Práticas

### ✅ Fazer

- Usar cache para resposta rápida
- Mostrar indicador de carregamento
- Informar usuário sobre precisão
- Tratar todos os casos de erro
- Limpar watch ao desmontar componente

### ❌ Evitar

- Múltiplas requisições simultâneas
- Ignorar erros de permissão
- Não informar fonte da localização
- Esquecer de parar watch
- Confiar cegamente na precisão

## Integração com Mapas

```typescript
function MapWithLocation() {
  const { coords, requestLocation, isHighAccuracy } = useRobustGeolocation();
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  useEffect(() => {
    if (coords && map) {
      // Centralizar mapa na localização
      map.flyTo({
        center: [coords.longitude, coords.latitude],
        zoom: isHighAccuracy ? 16 : 13,
      });

      // Adicionar marcador
      new maplibregl.Marker({ color: '#3b82f6' })
        .setLngLat([coords.longitude, coords.latitude])
        .addTo(map);
    }
  }, [coords, map, isHighAccuracy]);

  return (
    <div>
      <button onClick={requestLocation}>
        📍 Minha Localização
      </button>
      <MapLibreMap onLoad={setMap} />
    </div>
  );
}
```

## Comparação com Hook Antigo

| Característica | useGeolocation (antigo) | useRobustGeolocation (novo) |
|----------------|------------------------|----------------------------|
| Tentativas | 1 | 3 com timeout progressivo |
| Fallback | ❌ | ✅ IP geolocation |
| Cache | ❌ | ✅ 5 minutos |
| Precisão | Média | Alta |
| Fonte | Não informa | GPS/IP/cache |
| Retry automático | ❌ | ✅ |
| Background update | ❌ | ✅ |

## Migração

### Antes (useGeolocation)

```typescript
const { latitude, longitude, requestPermission } = useGeolocation();

await requestPermission();
```

### Depois (useRobustGeolocation)

```typescript
const { coords, requestLocation } = useRobustGeolocation();

await requestLocation();

// Acessar coordenadas
const lat = coords?.latitude;
const lng = coords?.longitude;
```

## Performance

- **Cache hit**: < 10ms
- **GPS (sucesso 1ª tentativa)**: 2-10s
- **GPS (com retries)**: 10-60s
- **IP fallback**: 1-3s adicional

## Privacidade

- Localização armazenada apenas localmente (localStorage)
- Cache pode ser limpo com `clearCache()`
- IP geolocation não identifica usuário
- Respeita permissões do navegador

## Suporte de Navegadores

✅ Chrome/Edge: Suporte completo
✅ Firefox: Suporte completo
✅ Safari: Suporte completo
✅ Mobile: Suporte completo
⚠️ IE11: Não suportado (usar polyfill)

## Troubleshooting

### GPS não funciona

1. Verificar permissões do navegador
2. Verificar se HTTPS está ativo (obrigatório)
3. Verificar se dispositivo tem GPS
4. Tentar em ambiente externo (melhor sinal)

### Precisão baixa

1. Aguardar mais tempo (GPS precisa "esquentar")
2. Usar modo `watch` para melhorar com tempo
3. Verificar se `enableHighAccuracy` está ativo
4. Mover para área com melhor visão do céu

### IP geolocation imprecisa

- Normal, precisão de ~5km
- Usar apenas como fallback
- Informar usuário sobre baixa precisão

## Próximos Passos

1. ✅ Implementado hook robusto
2. 🔄 Integrar com páginas existentes
3. 📊 Adicionar métricas de precisão
4. 🗺️ Integrar com sistema de mapas
5. 📱 Otimizar para mobile
