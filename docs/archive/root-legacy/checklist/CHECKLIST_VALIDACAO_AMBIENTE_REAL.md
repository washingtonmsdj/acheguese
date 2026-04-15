# Checklist de Validação em Ambiente Real - Maps V4

**Data**: 2026-04-03  
**Objetivo**: Fechar subgate de validação em ambiente real com GPU

---

## Pré-requisitos

- [ ] Feature flag ativa: `VITE_FEATURE_MAPS_V4="true"`
- [ ] Aplicação rodando em ambiente com GPU (não headless)
- [ ] Navegador: Chrome/Edge/Firefox com WebGL habilitado
- [ ] Dispositivo mobile disponível (opcional, mas recomendado)

---

## Validação Desktop

### 1. Carregamento Inicial

- [ ] Abrir `/mapa` no navegador
- [ ] Página carrega sem erros de console
- [ ] Tiles OSM visíveis (mapa base renderizado)
- [ ] Controles de zoom visíveis
- [ ] Painel de busca visível
- [ ] Toggle de camadas visível
- [ ] Botão de geolocalização visível

**Evidência**: Screenshot da página carregada

### 2. Interações com Mapa

- [ ] Pan com mouse: arrastar mapa move a visualização
- [ ] Zoom com scroll: roda do mouse aumenta/diminui zoom
- [ ] Zoom com botões: +/- funcionam
- [ ] Double-click: aumenta zoom
- [ ] Animações suaves (flyTo) funcionam

**Evidência**: Vídeo curto das interações

### 3. Marcadores e Clustering

- [ ] Marcadores de businesses visíveis
- [ ] Marcadores de events visíveis (se houver dados)
- [ ] Marcadores de alerts visíveis (se houver dados)
- [ ] Clustering ativo com zoom out (marcadores agrupam)
- [ ] Expansão de cluster com zoom in (marcadores individuais aparecem)
- [ ] Contador de marcadores no cluster correto

**Evidência**: Screenshot com clusters visíveis + screenshot com marcadores expandidos

### 4. Seleção de Marcadores

- [ ] Clicar em marcador: marcador fica selecionado
- [ ] Atributo `data-selected="true"` presente no DOM
- [ ] Mapa voa para o marcador selecionado (flyTo)
- [ ] Zoom aumenta para 16 ao selecionar
- [ ] Clicar em outro marcador: seleção muda

**Evidência**: Screenshot do DevTools mostrando `data-selected="true"`

### 5. Busca Geográfica

- [ ] Digitar endereço no painel de busca
- [ ] Sugestões aparecem (se Nominatim responder)
- [ ] Selecionar resultado: mapa voa para o local
- [ ] Zoom aumenta para 15 ao selecionar resultado

**Evidência**: Screenshot da busca funcionando

### 6. Geolocalização

- [ ] Clicar no botão de geolocalização (📍)
- [ ] Navegador solicita permissão
- [ ] Com permissão concedida: mapa voa para localização do usuário
- [ ] Com permissão negada: página continua funcional, sem erros

**Evidência**: Screenshot da permissão + screenshot do mapa centralizado

### 7. Toggle de Camadas

- [ ] Clicar em toggle de camada: camada ativa/desativa
- [ ] Marcadores da camada desativada desaparecem
- [ ] Marcadores da camada ativada reaparecem
- [ ] Estado visual do toggle reflete estado da camada

**Evidência**: Screenshot com camada ativa + screenshot com camada desativada

### 8. Performance

- [ ] Carregamento inicial < 5 segundos
- [ ] Pan e zoom responsivos (sem lag)
- [ ] Clustering não trava com > 50 marcadores
- [ ] Fetch de dados não bloqueia UI (loading indicator aparece)

**Evidência**: Métricas do DevTools (Performance tab)

---

## Validação Mobile (Chrome Android)

### 1. Carregamento Inicial

- [ ] Abrir `/mapa` no Chrome mobile
- [ ] Página carrega sem erros
- [ ] Tiles OSM visíveis
- [ ] Layout responsivo (sem overflow)
- [ ] Controles não se sobrepõem

**Evidência**: Screenshot mobile

### 2. Gestos Touch

- [ ] Pan com toque: arrastar mapa move a visualização
- [ ] Zoom com pinch: dois dedos aumentam/diminuem zoom
- [ ] Tap em marcador: marcador fica selecionado
- [ ] Tap em cluster: cluster expande (se zoom < maxZoom)
- [ ] Double-tap: aumenta zoom

**Evidência**: Vídeo curto dos gestos

### 3. Performance Mobile

- [ ] Carregamento inicial < 10 segundos (3G)
- [ ] Pan e zoom responsivos
- [ ] Sem travamentos ou lag perceptível

**Evidência**: Métricas do DevTools mobile

---

## Validação Mobile (Safari iOS)

### 1. Carregamento Inicial

- [ ] Abrir `/mapa` no Safari iOS
- [ ] Página carrega sem erros
- [ ] Tiles OSM visíveis
- [ ] Layout responsivo

**Evidência**: Screenshot iOS

### 2. Gestos Touch

- [ ] Pan com toque funciona
- [ ] Zoom com pinch funciona
- [ ] Tap em marcador funciona
- [ ] Animações suaves

**Evidência**: Vídeo curto dos gestos

---

## Validação de Erros

### 1. Console do Navegador

- [ ] Sem erros de WebGL
- [ ] Sem erros de fetch (ou tratados graciosamente)
- [ ] Sem erros de permissão de geolocalização (ou tratados)
- [ ] Sem warnings críticos

**Evidência**: Screenshot do console limpo

### 2. Network Tab

- [ ] Tiles OSM carregam com sucesso (status 200)
- [ ] Fetchers de dados retornam com sucesso ou falham graciosamente
- [ ] Sem requests duplicados (debounce funcionando)

**Evidência**: Screenshot do Network tab

---

## Critério de Aceite

**Subgate fechado quando**:

- ✅ Todos os itens de "Validação Desktop" marcados
- ✅ Pelo menos 80% dos itens de "Validação Mobile" marcados
- ✅ Evidências capturadas e documentadas
- ✅ Sem erros críticos no console

---

## Resultado

**Data da validação**: _____________________  
**Validador**: _____________________  
**Status**: [ ] APROVADO [ ] REPROVADO [ ] PARCIAL

**Observações**:
_____________________
_____________________
_____________________

**Evidências anexadas**:
- [ ] Screenshots desktop
- [ ] Screenshots mobile
- [ ] Vídeos de interação
- [ ] Logs do console
- [ ] Métricas de performance

---

**Próximos passos após aprovação**:
1. Atualizar `RELATORIO_ETAPA_RENDERIZACAO_REAL.md` com status do subgate
2. Documentar evidências em pasta `docs/validacao-ambiente-real/`
3. Iniciar rollout gradual em produção
