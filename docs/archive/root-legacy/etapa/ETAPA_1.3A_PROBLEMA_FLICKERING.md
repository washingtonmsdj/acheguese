# ETAPA 1.3A - PROBLEMA DE FLICKERING RESOLVIDO

**Data**: 04/04/2026  
**Hora**: 10:35

---

## 🐛 PROBLEMA REPORTADO

**Sintoma**: Marcadores não ficam fixos no mapa
- Marcadores piscam/aparecem e somem
- Durante zoom, marcadores desaparecem temporariamente
- Comportamento inconsistente

**Console**: Sem erros críticos
- ✅ Pontos turísticos carregados: 3 resultados
- ✅ RPC funcional
- ⚠️ Warnings de MapLibre sobre tiles (não relacionado)

---

## 🔍 DIAGNÓSTICO

### Causa Raiz: Clustering Assíncrono

O MapaPageV4 tinha `enableClustering={true}`, o que causava:

1. **Fase 1 (inicial)**: Marcadores aparecem diretamente
   - `clusteringReady = false`
   - `markersToRender = allMarkers` (sem clustering)
   - Marcadores adicionados ao mapa

2. **Fase 2 (clustering pronto)**: Marcadores removidos
   - `clusteringReady = true`
   - `markersToRender = clusters` (processado)
   - Diffing remove marcadores antigos
   - Adiciona clusters/marcadores processados

3. **Fase 3 (zoom/pan)**: Recalcula clusters
   - Bounds/zoom mudam
   - Clustering recalcula
   - Marcadores removidos e recriados
   - **Resultado**: Flickering visível

### Evidência no Código

```typescript
// MapLibreAdapter.tsx (linha ~570)
const markersToRender = React.useMemo(() => {
  if (!enableClustering || !clusteringReady) {
    return allMarkers; // ← Fase 1: marcadores diretos
  }

  // Fase 2/3: clusters processados
  return clusters.map((cluster) => {
    // ... conversão de clusters
  });
}, [enableClustering, clusteringReady, clusters, allMarkers]);
```

### Por Que Acontece

O hook `useMapClustering` é assíncrono:
- Processa marcadores em background
- `isReady` muda de `false` → `true`
- Causa re-render e troca de `markersToRender`
- Diffing remove todos os marcadores antigos
- Adiciona marcadores novos
- **Efeito visual**: Piscar/flickering

---

## ✅ SOLUÇÃO APLICADA

### Correção Imediata: Desabilitar Clustering

```typescript
// ANTES (causava flickering)
enableClustering={true}

// DEPOIS (marcadores estáveis)
enableClustering={false}
```

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx` (linha ~660)

### Resultado Esperado

- ✅ Marcadores aparecem imediatamente
- ✅ Marcadores permanecem fixos durante zoom/pan
- ✅ Sem flickering
- ✅ Sem recalcular clusters a cada movimento

### Trade-off

**Vantagem**: Marcadores estáveis, sem flickering  
**Desvantagem**: Sem agrupamento visual quando há muitos marcadores próximos

**Justificativa**: Com apenas 3 pontos turísticos em Salvador, clustering não é necessário. Quando houver centenas de pontos, podemos reativar com otimizações.

---

## 🎯 VALIDAÇÃO OBRIGATÓRIA

Após a correção, verificar:

1. ✅ Abrir `/mapa` no navegador
2. ✅ Verificar se 3 pontos turísticos aparecem (ícone 📍 teal)
3. ✅ Fazer zoom in/out - marcadores devem permanecer fixos
4. ✅ Fazer pan (arrastar mapa) - marcadores devem permanecer fixos
5. ✅ Verificar se layer control mostra "Pontos Turísticos"
6. ✅ Testar ocultar/exibir pontos turísticos
7. ✅ Verificar se marcador de localização aparece (círculo verde)
8. ✅ Verificar console sem erros críticos

---

## 📊 ANÁLISE TÉCNICA

### Clustering vs. Marcadores Diretos

| Aspecto | Com Clustering | Sem Clustering |
|---------|---------------|----------------|
| Performance | Melhor com 100+ marcadores | Melhor com <50 marcadores |
| Estabilidade | Flickering durante recalculo | Estável |
| UX | Agrupamento visual | Marcadores individuais |
| Complexidade | Alta (assíncrono) | Baixa (síncrono) |

### Quando Reativar Clustering

Reativar quando:
- Houver 50+ pontos turísticos no banco
- Implementar clustering otimizado (sem flickering)
- Adicionar transições suaves entre estados

### Otimizações Futuras (Opcional)

1. **Clustering Incremental**: Não remover todos os marcadores, apenas atualizar
2. **Transições CSS**: Fade in/out suave
3. **Debounce**: Não recalcular a cada frame de zoom
4. **Cache**: Manter clusters calculados entre pequenas mudanças

---

## 📁 ARQUIVOS ALTERADOS

1. `src/core/maps/pages/MapaPageV4.tsx`
   - Linha ~660: `enableClustering={true}` → `enableClustering={false}`

---

## 🎯 STATUS ATUAL

### Status: ⚠️ AGUARDANDO VALIDAÇÃO VISUAL

**Correção Aplicada**: ✅ COMPLETO
- Clustering desabilitado
- Marcadores devem ficar estáveis

**Validação Visual**: ⏳ PENDENTE
- Usuário precisa testar no navegador
- Confirmar que marcadores não piscam mais
- Confirmar que zoom/pan não remove marcadores

**Próximo Passo**: Usuário deve abrir `/mapa` e reportar resultado observado.

---

**Elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Tipo**: Diagnóstico e Correção de Bug
