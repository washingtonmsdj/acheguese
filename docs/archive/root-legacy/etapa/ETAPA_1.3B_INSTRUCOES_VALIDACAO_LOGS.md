# ETAPA 1.3B - INSTRUÇÕES: Validação com Logs Detalhados

**Data:** 2026-04-04  
**Objetivo:** Coletar logs detalhados para identificar causa raiz do problema do círculo

## O Que Foi Feito

Adicionamos logs críticos em pontos estratégicos do código para rastrear o fluxo completo de geolocalização:

1. **MapaPageV4.tsx**: Logs de estado (userLocation, geoLoading, radiusSearchEnabled)
2. **useRobustGeolocation.ts**: Logs de mudança de estado, setState, requestLocation

## Instruções para Validação

### Passo 1: Abrir o Mapa

1. Abra o navegador
2. Navegue até a página do mapa
3. Abra o Console do DevTools (F12 → aba Console)

### Passo 2: Limpar Console

1. Clique com botão direito no console
2. Selecione "Clear console" ou pressione Ctrl+L

### Passo 3: Mover o Slider

1. Localize o slider de raio no mapa
2. Mova o slider para qualquer valor (ex: 10km, 20km, 30km)
3. Aguarde 2-3 segundos

### Passo 4: Copiar TODOS os Logs

1. Clique com botão direito no console
2. Selecione "Save as..." ou "Copy all"
3. Cole os logs em um arquivo de texto

### Passo 5: Colar Logs no Relatório

Cole os logs coletados no arquivo `ETAPA_1.3B_TEMPLATE_HOMOLOGACAO_RUNTIME.md` na seção "Logs do Console".

## Logs Esperados

Você deve ver uma sequência similar a esta:

```
[MapaPageV4] Montando componente, solicitando localização...
[useRobustGeolocation] requestLocation CHAMADO
[useRobustGeolocation] requestInFlight.current: false
[useRobustGeolocation] Iniciando requisição...
[useRobustGeolocation] setState inicial - prev: {coords: null, loading: false, ...}
[useRobustGeolocation] ESTADO MUDOU: {coords: null, loading: true, ...}
🎯 [useRobustGeolocation] Iniciando busca de localização...
📡 [GeolocationService] GPS tentativa 1/3: Desktop preciso
✅ [GeolocationService] GPS sucesso: 2000m precisão
✅ [useRobustGeolocation] Localização obtida
[useRobustGeolocation] ANTES setState - result.coords: {latitude: -12.9, longitude: -38.5, ...}
[useRobustGeolocation] CHAMANDO setState com: {coords: {...}, loading: false, ...}
[useRobustGeolocation] DEPOIS setState - aguardando próximo render...
[useRobustGeolocation] Chamando onSuccess callback...
[MapaPageV4] ✅ Geolocalização obtida via callback: {latitude: -12.9, ...}
[useRobustGeolocation] ESTADO MUDOU: {coords: {...}, loading: false, ...}
[MapaPageV4] userLocation atualizado: {latitude: -12.9, longitude: -38.5, ...}
[MapaPageV4] geoLoading: false
[MapaPageV4] radiusSearchEnabled: true
[MapaPageV4] Renderizando círculo: {center: [-12.9, -38.5], radiusMeters: 10000}
```

## O Que Procurar

### ✅ Cenário Ideal (Funcionando)

```
[useRobustGeolocation] CHAMANDO setState com: {coords: {...}, loading: false, ...}
[MapaPageV4] ✅ Geolocalização obtida via callback: {latitude: -12.9, ...}
[MapaPageV4] userLocation atualizado: {latitude: -12.9, longitude: -38.5, ...}
[MapaPageV4] Renderizando círculo: {center: [-12.9, -38.5], radiusMeters: 10000}
```

**Resultado:** Círculo aparece no mapa ✅

### ❌ Cenário Problemático (Bug)

```
[useRobustGeolocation] CHAMANDO setState com: {coords: {...}, loading: false, ...}
[MapaPageV4] ✅ Geolocalização obtida via callback: {latitude: -12.9, ...}
[MapaPageV4] userLocation atualizado: null
[MapaPageV4] Círculo NÃO renderizado: {radiusSearchEnabled: true, userLocation: false}
```

**Resultado:** Círculo NÃO aparece no mapa ❌

## Análise dos Logs

Com os logs, poderemos identificar:

1. **setState está sendo chamado?**
   - Procure por: `[useRobustGeolocation] CHAMANDO setState com:`

2. **Callback onSuccess está sendo executado?**
   - Procure por: `[MapaPageV4] ✅ Geolocalização obtida via callback:`

3. **userLocation está sendo atualizado?**
   - Procure por: `[MapaPageV4] userLocation atualizado:`
   - Valor deve ser `{latitude: ..., longitude: ...}`, NÃO `null`

4. **Círculo está sendo renderizado?**
   - Procure por: `[MapaPageV4] Renderizando círculo:`
   - OU: `[MapaPageV4] Círculo NÃO renderizado:`

## Próximos Passos

Após coletar os logs:

1. Cole os logs no relatório de homologação
2. Informe se o círculo apareceu ou não no mapa
3. Aguarde análise dos logs para identificar causa raiz
4. Aplicaremos correção definitiva baseada na análise

## Observações

- **NÃO filtre os logs** - precisamos de TODOS os logs para análise completa
- **NÃO edite os logs** - cole exatamente como aparecem no console
- **Inclua timestamps** se disponíveis no console
- **Tire screenshot** do mapa mostrando se o círculo apareceu ou não

## Dúvidas?

Se tiver dúvidas sobre como coletar os logs, pergunte antes de executar.

