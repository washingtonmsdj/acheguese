# Integração useResolvedUserLocation no Mapa Central

## Resumo
O mapa central (`/mapa`) agora usa o hook `useResolvedUserLocation` para resolver a localização do usuário com fallback territorial automático quando o GPS é negado.

## Mudanças Implementadas

### 1. Substituição do Hook de Geolocalização
- **Antes**: `useRobustGeolocation` (apenas GPS, sem fallback)
- **Depois**: `useResolvedUserLocation` (GPS + fallback territorial)

### 2. Estratégia de Resolução
O hook resolve a localização seguindo esta ordem:
1. **GPS** - Se o usuário permitir acesso à localização
2. **Território Ativo** - Se GPS for negado, usa o centro do território selecionado
3. **Cidade Padrão** - Fallback final (Salvador, BA)

### 3. Indicador Visual
Um badge na parte inferior do mapa mostra a fonte da localização:
- 🟢 Verde com 📍: "Usando sua localização GPS"
- 🔵 Azul com 📌: "Mostrando resultados em [território]" ou "Mostrando resultados da região padrão"

### 4. Comportamento
- **Auto-resolve**: Solicita localização automaticamente ao montar
- **Reativo**: Atualiza quando o território muda (se não estiver usando GPS)
- **Transparente**: Usuário sempre sabe qual fonte está sendo usada

## Código Relevante

```typescript
const { 
  coords: userLocation,      // Coordenadas resolvidas
  isGps,                     // true se veio do GPS
  status: locationStatus,    // 'gps' | 'territory' | 'fallback'
  sourceMessage,             // Mensagem explicativa
  resolve: resolveLocation   // Função para re-resolver
} = useResolvedUserLocation({ 
  autoResolve: true,  // Resolve automaticamente
  tryGps: true        // Tenta GPS primeiro
});
```

## Benefícios

1. **Experiência Consistente**: Mapa sempre tem uma localização válida
2. **Fallback Inteligente**: Usa território selecionado quando GPS não está disponível
3. **Transparência**: Usuário sabe de onde vem a localização
4. **SSOT**: Usa o mesmo resolver de localização em todo o sistema

## Arquivos Modificados
- `src/core/maps/pages/MapaPageV4.tsx`

## Arquivos Relacionados
- `src/core/location/hooks/useResolvedUserLocation.ts` - Hook principal
- `src/core/location/services/UserLocationResolver.ts` - Serviço de resolução
- `docs/MIGRATION_ADDRESS_PRECISION.sql` - Migração de banco aplicada
