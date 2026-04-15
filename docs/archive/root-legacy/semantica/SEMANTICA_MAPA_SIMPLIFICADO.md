# Semântica do Mapa Simplificado

**Data**: 2026-04-04  
**Versão**: 2.0 (Pós-Refatoração)

---

## Visão Geral

O mapa foi simplificado para focar em **exploração espacial visual**.  
Busca por proximidade foi movida para página dedicada `/perto-de-mim`.

---

## Comportamento do Mapa

### Modo de Operação: Busca por Bounds

O mapa opera em **modo único**: busca por bounds (área visível).

**Como funciona**:
1. Usuário navega pelo mapa (pan/zoom)
2. Sistema detecta mudança de viewport
3. Busca entidades dentro dos bounds visíveis
4. Renderiza marcadores na área

**Tipos de entidade**:
- 🏢 Empresas
- 📅 Eventos
- ⚠️ Alertas
- 🏛️ Pontos Turísticos

---

## Controles Disponíveis

### 1. Busca de Endereço (Top-Left)
- Busca por lugar ou endereço
- Geocoding via Nominatim
- Voa para resultado ao selecionar

### 2. Localização (Top-Right)
- Solicita GPS do usuário
- Adiciona marcador de localização
- Voa para posição do usuário
- Mostra precisão (círculo de acurácia)

### 3. Seletor de Território (Top-Right)
- Mostra território ativo (cidade/bairro)
- Permite trocar território
- Filtra entidades por território

### 4. Controle de Camadas (Bottom-Left)
- Ocultar/exibir empresas
- Ocultar/exibir eventos
- Ocultar/exibir alertas
- Ocultar/exibir pontos turísticos

### 5. Navegação (Bottom-Right)
- Zoom in/out
- Atribuição do mapa

---

## Marcadores

### Tipos de Marcador

| Tipo | Emoji | Cor | Formato |
|------|-------|-----|---------|
| Empresa | 🏢 | Azul | Pino |
| Evento | 📅 | Verde | Pino |
| Alerta | ⚠️ | Vermelho | Pino |
| Ponto Turístico | 🏛️ | Roxo | Pino |
| Localização do Usuário | 📍 | Verde | Círculo pulsante |

### Interação com Marcadores

**Ao clicar em marcador**:
1. Abre popup com informações
2. Voa para marcador (zoom 17)
3. Popup mostra:
   - Nome da entidade
   - Tipo
   - Status
   - Botão "Ver detalhes"

**Ao clicar em "Ver detalhes"**:
- Navega para página de detalhes da entidade

---

## Filtros

### Filtro Territorial

**Automático**: Baseado na rota atual
- `/mapa` → Sem filtro (todas as entidades)
- `/mapa/ba/salvador` → Apenas Salvador
- `/mapa/ba/salvador/barra` → Apenas Barra

**Manual**: Via seletor de território
- Usuário pode trocar cidade/bairro
- Mapa atualiza automaticamente

### Filtro de Camadas

**Manual**: Via controle de camadas
- Usuário marca/desmarca tipos
- Marcadores aparecem/desaparecem instantaneamente
- Estado persiste durante sessão

---

## Busca por Proximidade

**Removida do mapa**.

**Nova localização**: Página dedicada `/perto-de-mim`

**Motivo**: 
- Círculo no mapa tem valor de UX limitado
- Lista ordenada por distância é mais útil
- Separação clara de responsabilidades

---

## Fluxo de Uso

### Exploração Livre
1. Usuário abre mapa
2. Navega com pan/zoom
3. Vê marcadores na área visível
4. Clica em marcador para detalhes

### Busca de Endereço
1. Usuário digita endereço
2. Seleciona resultado
3. Mapa voa para local
4. Vê marcadores próximos

### Filtro por Território
1. Usuário clica em seletor de território
2. Escolhe cidade/bairro
3. Mapa centraliza no território
4. Mostra apenas entidades do território

### Filtro por Tipo
1. Usuário abre controle de camadas
2. Desmarca tipos não desejados
3. Marcadores desaparecem
4. Marca tipos desejados
5. Marcadores reaparecem

---

## Performance

### Otimizações

**Debounce**: 400ms após parar de mover
- Evita múltiplas requisições durante pan/zoom
- Aguarda usuário estabilizar viewport

**Diffing de Marcadores**: 
- Apenas adiciona/remove marcadores que mudaram
- Não recria todos os marcadores a cada render

**Placeholder Data**:
- React Query mantém dados anteriores durante transição
- Evita flickering de marcadores

**Min Zoom**: 10
- Não busca entidades em zoom muito baixo
- Evita sobrecarga com muitos marcadores

---

## Estados do Mapa

### Loading
- Ícone ⏳ no canto superior direito
- Aparece durante busca de entidades
- Não bloqueia interação com mapa

### Erro
- Silencioso (não mostra mensagem)
- Mantém marcadores anteriores
- Console log para debug

### Vazio
- Mapa sem marcadores
- Usuário pode navegar livremente
- Pode ser resultado de filtros ativos

### Sucesso
- Marcadores renderizados
- Usuário pode interagir
- Popup ao clicar

---

## Diferenças da Versão Anterior

### Removido
- ❌ Modo raio de busca
- ❌ Controle de raio (slider/botões)
- ❌ Círculo no mapa
- ❌ Preview de raio
- ❌ Botão "Aplicar busca"
- ❌ Mensagens de "Nada encontrado" no mapa
- ❌ Contadores de resultados por tipo

### Mantido
- ✅ Busca por bounds
- ✅ Controle de camadas
- ✅ Geolocalização
- ✅ Busca de endereço
- ✅ Seletor de território
- ✅ Marcadores interativos

### Adicionado
- ✅ Página dedicada `/perto-de-mim` para busca por proximidade

---

## Integração com Outras Páginas

### Página "Perto de Mim" (`/perto-de-mim`)
- Lista ordenada por distância
- Filtros de raio e tipo
- Tempo de caminhada
- Navegação para detalhes

### Páginas de Listagem (Empresas, Eventos, etc)
- Podem adicionar filtro de raio no futuro
- Complementa outros filtros (categoria, preço, etc)
- Mantém formato de lista/grid

### Páginas de Detalhes
- Mini mapa mostra localização da entidade
- Usa mesmo componente base (MapLibreAdapter)
- Sem controles de busca

---

## Arquitetura

### SSOT Rigoroso

```
Database (RPCs espaciais)
    ↓
Service (SpatialSearchService)
    ↓
Hooks (useTouristPointsByBounds, useMapViewportFetch)
    ↓
Components (MapaPageV4 → MapLibreAdapter)
```

### Separação de Responsabilidades

**MapaPageV4**:
- Gerencia estado de marcadores
- Conecta hooks de dados
- Passa props para MapLibreAdapter

**MapLibreAdapter**:
- Renderiza mapa MapLibre GL JS
- Gerencia controles
- Renderiza marcadores
- Dispara eventos

**Hooks**:
- `useMapViewportFetch`: Busca por bounds
- `useTouristPointsByBounds`: Pontos turísticos
- `useRobustGeolocation`: GPS do usuário

---

## Conclusão

Mapa simplificado, focado, profissional.  
Busca por proximidade em página dedicada.  
Arquitetura SSOT rigorosa.  
Código limpo e manutenível.

---

**Versão**: 2.0 (Pós-Refatoração do Modo Raio)  
**Status**: ✅ IMPLEMENTADO
