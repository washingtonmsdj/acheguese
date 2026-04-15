# Debug: Localização do Usuário no Mapa

## Problema Reportado
- Usuário clica no botão de localização mas o marcador não aparece no mapa
- No mobile, o emoji não apareceu (já corrigido com SVG)
- Localização mostrou um local distante (precisão de 2000m é normal para IP/GPS desktop)

## Mudanças Implementadas

### 1. Logging Detalhado
Adicionado console.log em pontos críticos para rastrear o fluxo:

**NeighborhoodMap.tsx:**
- ✅ Log quando `userLocation` é recebido via callback
- ✅ Log quando marcador de usuário é adicionado ao array
- ✅ Log quando `userLocation` é null
- ✅ Log do total de marcadores

**MapLibreMap.tsx:**
- ✅ Log de todos os marcadores sendo renderizados
- ✅ Log específico para marcador de usuário com SVG
- ✅ Log de confirmação quando marcador é adicionado ao mapa

**useRobustGeolocation.ts:**
- ✅ Log de início da busca
- ✅ Log quando localização é obtida (GPS ou IP)
- ✅ Log de erros

### 2. Correções Técnicas

**Marcador SVG (substituiu emoji):**
```typescript
// Antes: emoji 📍 (não funciona bem em mobile)
// Depois: SVG animado com círculo verde pulsante
el.innerHTML = `
  <svg width="44" height="44" viewBox="0 0 44 44">
    <!-- Círculo externo pulsante -->
    <circle cx="22" cy="22" r="20" fill="#10b981" opacity="0.2">
      <animate attributeName="r" from="15" to="20" dur="1.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <!-- Círculo principal verde -->
    <circle cx="22" cy="22" r="12" fill="#10b981" stroke="white" stroke-width="3"/>
    <!-- Ponto central branco -->
    <circle cx="22" cy="22" r="5" fill="white"/>
  </svg>
`;
```

**Anchor do marcador:**
```typescript
// Adicionado anchor: 'center' para centralizar o marcador nas coordenadas
const m = new maplibregl.Marker({ element: el, anchor: 'center' })
```

**Visibilidade:**
```typescript
// Adicionado pointer-events:auto para garantir visibilidade
'pointer-events:auto'
```

## Como Testar

### 1. Abrir Console do Navegador
Pressione F12 e vá para a aba "Console"

### 2. Navegar para Página de Empresas
```
http://localhost:5173/empresas-landing
```

### 3. Clicar no Botão de Localização
Botão com ícone de navegação (Navigation) no canto superior direito do mapa

### 4. Verificar Logs no Console

**Sequência esperada:**
```
🎯 [useRobustGeolocation] Iniciando busca de localização...
📡 Tentando GPS (tentativa 1/3)
✅ [useRobustGeolocation] Localização final obtida: {latitude, longitude, accuracy}
✅ Localização recebida via callback: {latitude, longitude, accuracy}
📍 [NeighborhoodMap] Adicionando marcador de usuário: {lat, lng, accuracy}
📊 [NeighborhoodMap] Total de marcadores: 7 (6 empresas + 1 usuário)
🗺️ [MapLibreMap] Adicionando marcadores: 7
📍 Marcador: Você está aqui (lat, lng) - User: true
✅ Marcador de usuário criado com SVG
✅ Marcador adicionado ao mapa: Você está aqui
✅ Total de marcadores no mapa: 7
```

### 5. Verificar Visualmente

**O que você deve ver:**
- ✅ Mapa deve animar (flyTo) para sua localização
- ✅ Marcador verde pulsante deve aparecer na sua posição
- ✅ Indicador de precisão deve aparecer abaixo do botão (ex: "Precisão: 2000m")
- ✅ Botão de localização deve ficar verde se precisão < 100m

**Marcador de usuário:**
- Círculo verde (#10b981) com borda branca
- Ponto branco no centro
- Animação pulsante no círculo externo
- Tamanho: 44x44px (maior que marcadores de empresas)

## Possíveis Problemas

### Problema 1: Marcador não aparece
**Sintomas:** Logs mostram marcador sendo adicionado mas não é visível
**Causa:** Coordenadas fora da área visível do mapa
**Solução:** Verificar se `flyTo` está funcionando corretamente

### Problema 2: Precisão muito baixa (>1000m)
**Sintomas:** "Precisão: 2000m" ou mais
**Causa:** GPS não disponível, usando IP geolocation
**Solução:** 
- Desktop: Normal usar IP (precisão ~5km)
- Mobile: Verificar se permissão de localização foi concedida

### Problema 3: Erro de permissão
**Sintomas:** Erro no console "User denied geolocation"
**Causa:** Usuário negou permissão de localização
**Solução:** Recarregar página e aceitar permissão quando solicitado

### Problema 4: Timeout
**Sintomas:** "Timeout após 10000ms"
**Causa:** GPS demorou muito para responder
**Solução:** Hook tenta 3 vezes com timeout progressivo (10s, 20s, 30s)

## Próximos Passos

Se o marcador ainda não aparecer após essas mudanças:

1. **Verificar logs do console** - copiar e analisar sequência completa
2. **Verificar coordenadas** - confirmar se lat/lng estão corretos
3. **Verificar zoom do mapa** - pode estar muito afastado
4. **Testar em mobile** - comportamento pode ser diferente
5. **Verificar permissões do navegador** - Settings > Site Settings > Location

## Informações Técnicas

**Precisão esperada:**
- GPS Mobile: 5-50m (alta precisão)
- GPS Desktop: 50-500m (média precisão)
- IP Geolocation: ~5000m (baixa precisão)

**Timeout progressivo:**
- Tentativa 1: 10 segundos
- Tentativa 2: 20 segundos
- Tentativa 3: 30 segundos

**Fallback:**
1. GPS com alta precisão (enableHighAccuracy: true)
2. IP geolocation (ipapi.co)
3. Cache (última localização conhecida, válido por 5 minutos)

---

**Data:** 2026-04-03
**Status:** Debugging em andamento
**Arquivos modificados:**
- `src/core/maps/components/MapLibreMap.tsx`
- `src/modules/business/components/NeighborhoodMap.tsx`
