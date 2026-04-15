# Guia Rápido: Validação Manual Maps V4

**Tempo estimado**: 10-15 minutos  
**Objetivo**: Fechar subgate de validação em ambiente real

---

## Pré-requisitos

- [ ] Aplicação rodando localmente
- [ ] Navegador com GPU (Chrome, Edge, Firefox)
- [ ] DevTools aberto (F12)

---

## Passo 1: Iniciar Aplicação

```bash
# Terminal 1: Iniciar aplicação
npm run dev

# Aguardar mensagem:
# ➜  Local:   http://localhost:5173/
```

---

## Passo 2: Acessar Página do Mapa

1. Abrir navegador
2. Acessar: `http://localhost:5173/mapa`
3. Abrir DevTools (F12)
4. Ir para aba Console

---

## Passo 3: Validações Rápidas (5 minutos)

### ✅ Checklist Visual

- [ ] **Tiles OSM visíveis** (mapa base renderizado)
- [ ] **Controles de zoom** visíveis (+/-)
- [ ] **Painel de busca** visível (canto superior esquerdo)
- [ ] **Toggle de camadas** visível (canto inferior esquerdo)
- [ ] **Botão de geolocalização** visível (📍 canto inferior direito)
- [ ] **Console sem erros críticos** (WebGL, fetch, etc.)

### ✅ Checklist de Interação

- [ ] **Pan com mouse**: Arrastar mapa move a visualização
- [ ] **Zoom com scroll**: Roda do mouse aumenta/diminui zoom
- [ ] **Zoom com botões**: +/- funcionam
- [ ] **Clicar em marcador**: Marcador fica selecionado + mapa voa para ele
- [ ] **Buscar endereço**: Digitar "Salvador" → selecionar resultado → mapa voa
- [ ] **Toggle de camada**: Clicar em toggle → marcadores aparecem/desaparecem
- [ ] **Geolocalização**: Clicar em 📍 → navegador solicita permissão → mapa voa

---

## Passo 4: Validação Técnica (5 minutos)

### Console do Navegador

```javascript
// 1. Verificar estado do mapa
window.__mapState

// Resultado esperado:
// { loaded: true, tilesLoaded: true, idle: true }

// 2. Verificar marcadores
document.querySelectorAll('[data-marker-id]').length

// Resultado esperado: > 0 (se houver dados)

// 3. Verificar seleção de marcador
// Clicar em um marcador, depois executar:
document.querySelector('[data-selected="true"]')

// Resultado esperado: elemento do marcador selecionado
```

### Network Tab

- [ ] **Tiles OSM**: Status 200 (https://tiles.openfreemap.org/...)
- [ ] **Fetchers**: Requests para `/rest/v1/businesses`, `/rest/v1/events`, etc.
- [ ] **Sem requests duplicados**: Debounce funcionando

---

## Passo 5: Capturar Evidências (5 minutos)

### Screenshots

1. **Página carregada**: Mapa com tiles visíveis
2. **Marcadores visíveis**: Zoom in para ver marcadores
3. **Cluster visível**: Zoom out para ver clusters
4. **Marcador selecionado**: Clicar em marcador + screenshot
5. **Console limpo**: Aba Console sem erros

### DevTools

1. **Console**: Screenshot da aba Console
2. **Network**: Screenshot da aba Network com tiles carregados
3. **Elements**: Screenshot do marcador selecionado com `data-selected="true"`

---

## Passo 6: Validação Mobile (Opcional)

### Chrome DevTools Mobile Emulation

1. Abrir DevTools (F12)
2. Clicar em ícone de dispositivo móvel (Ctrl+Shift+M)
3. Selecionar dispositivo: Pixel 5 ou iPhone 12
4. Repetir validações do Passo 3

### Checklist Mobile

- [ ] **Layout responsivo**: Sem overflow horizontal
- [ ] **Controles não se sobrepõem**: Botões visíveis e clicáveis
- [ ] **Pan com touch**: Arrastar com mouse (simula touch)
- [ ] **Zoom com pinch**: Ctrl+scroll (simula pinch)

---

## Passo 7: Documentar Resultados

### Criar Pasta de Evidências

```bash
mkdir -p docs/validacao-ambiente-real
```

### Salvar Screenshots

1. Salvar screenshots em `docs/validacao-ambiente-real/`
2. Nomear arquivos:
   - `01-pagina-carregada.png`
   - `02-marcadores-visiveis.png`
   - `03-cluster-visivel.png`
   - `04-marcador-selecionado.png`
   - `05-console-limpo.png`
   - `06-network-tiles.png`
   - `07-devtools-selected.png`

### Atualizar Checklist

Abrir `CHECKLIST_VALIDACAO_AMBIENTE_REAL.md` e marcar itens validados.

---

## Passo 8: Fechar Subgate

### Atualizar Relatório

Abrir `RELATORIO_ETAPA_RENDERIZACAO_REAL.md` e atualizar seção "Subgate de Validação em Ambiente Real":

```markdown
## Subgate de Validação em Ambiente Real

**Status**: ✅ FECHADO

| Item | Critério | Status |
|------|----------|--------|
| Tiles visíveis com GPU | Screenshot com tiles OSM renderizados | ✅ Validado |
| Seleção real por tap | `data-selected=true` após tap com WebGL | ✅ Validado |
| Gestos reais Safari/iOS | Pan e zoom em dispositivo iOS | ⏳ Pendente |
| Expansão de cluster por zoom | Marcadores individuais após zoom >= maxZoom | ✅ Validado |

**Data de fechamento**: 2026-04-03  
**Validador**: [Seu nome]  
**Evidências**: `docs/validacao-ambiente-real/`
```

---

## Problemas Comuns

### Tiles não aparecem

**Sintoma**: Mapa cinza, sem tiles  
**Causa**: WebGL não disponível ou tiles não carregam  
**Solução**:
1. Verificar console: erros de WebGL?
2. Verificar Network: tiles retornam 200?
3. Tentar outro navegador

### Marcadores não aparecem

**Sintoma**: Mapa vazio, sem marcadores  
**Causa**: Sem dados no banco ou fetchers falhando  
**Solução**:
1. Verificar console: erros de fetch?
2. Verificar Network: requests retornam dados?
3. Executar: `document.querySelectorAll('[data-marker-id]').length`

### Seleção não funciona

**Sintoma**: Clicar em marcador não seleciona  
**Causa**: WebGL não disponível (flyTo não funciona)  
**Solução**:
1. Verificar console: erros de WebGL?
2. Verificar: `window.__mapState.loaded === true`?
3. Tentar outro navegador com GPU

---

## Critério de Sucesso

**Subgate fechado quando**:

- ✅ Todos os itens de "Checklist Visual" marcados
- ✅ Todos os itens de "Checklist de Interação" marcados
- ✅ Console sem erros críticos
- ✅ Screenshots capturados
- ✅ Relatório atualizado

---

## Próximos Passos

Após fechar o subgate:

1. Commit das evidências
2. Deploy em staging (se disponível)
3. Monitorar métricas de uso
4. Coletar feedback de usuários

---

## Comandos Úteis

```bash
# Iniciar aplicação
npm run dev

# Executar testes E2E (validação automatizada)
npx playwright test --config=playwright.mapa.config.ts

# Verificar flag ativa
grep VITE_FEATURE_MAPS_V4 .env

# Criar pasta de evidências
mkdir -p docs/validacao-ambiente-real
```

---

**Tempo total**: 10-15 minutos  
**Resultado esperado**: Subgate fechado com evidências documentadas
