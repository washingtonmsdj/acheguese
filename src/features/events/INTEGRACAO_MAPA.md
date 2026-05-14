# 🗺️ Integração com Mapa Existente

## ✅ STATUS: COMPLETO

O EventsMapPage agora usa o **MapaPageV4** existente do projeto, aproveitando toda a infraestrutura de mapas já implementada.

---

## 🎯 O Que Foi Feito

### Antes
```typescript
// EventsMapPage tinha seu próprio componente EventsMap
<EventsMap 
  events={MOCK_EVENTS} 
  onEventClick={handleEventClick}
  maxDistance={50}
/>
```

**Problemas:**
- ❌ Código duplicado
- ❌ Funcionalidades limitadas
- ❌ Sem integração territorial
- ❌ Sem controles avançados

### Depois
```typescript
// EventsMapPage usa o MapaPageV4 existente
<MapaPageV4 
  resolved={territorialContext?.resolved}
  activeMemberIds={territorialContext?.activeMemberIds}
/>
```

**Benefícios:**
- ✅ Reutiliza código existente
- ✅ Funcionalidades completas
- ✅ Integração territorial automática
- ✅ Controles avançados (busca, localização, camadas)

---

## 🗺️ Funcionalidades do MapaPageV4

### Camadas Disponíveis
O mapa mostra múltiplas camadas que podem ser ativadas/desativadas:

1. **Eventos** 🎉 (principal para esta página)
2. **Empresas** 🏢
3. **Gastronomia** 🍽️
4. **Pontos Turísticos** 🏛️
5. **Alertas** 🚨

### Controles Integrados

#### 1. **Busca Geocoding**
- Buscar por endereço ou lugar
- Posição: top-left
- Debounce: 300ms

#### 2. **Localização GPS**
- Botão de localização do usuário
- Mostra precisão
- Auto-centraliza no usuário
- Posição: top-right

#### 3. **Seletor de Camadas**
- Toggle de visibilidade das camadas
- Layout vertical
- Posição: bottom-left
- Usuário pode mostrar/ocultar cada camada

#### 4. **Indicador Territorial**
- Mostra território atual
- Desenha polígonos do território
- Posição: top-right
- Compacto

---

## 🎨 Layout da Página

### Estrutura
```
┌─────────────────────────────────────┐
│ Breadcrumbs                         │
├─────────────────────────────────────┤
│ Header (compacto)                   │
│ • Título: "Mapa de Eventos"         │
│ • Botões: Lista | Calendário | Mapa │
├─────────────────────────────────────┤
│                                     │
│                                     │
│         MAPA (flex-1)               │
│     (ocupa resto da tela)           │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Responsividade
- **Mobile**: Header compacto, botões com ícones
- **Desktop**: Header normal, botões com texto

---

## 🔄 Integração Territorial

### Contexto Automático
```typescript
const territorialContext = useTerritorialContextOptional();

<MapaPageV4 
  resolved={territorialContext?.resolved}
  activeMemberIds={territorialContext?.activeMemberIds}
/>
```

### Comportamento

#### Sem Contexto Territorial
```
URL: /eventos/mapa
Resultado: Mostra todos os eventos (Salvador, BA por padrão)
```

#### Com Contexto Territorial
```
URL: /comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/eventos/mapa
Resultado: 
- Mostra apenas eventos do território
- Desenha polígonos do território
- Centraliza no território
```

---

## 🎯 Filtros Aplicados

### SSOT (Single Source of Truth)
O MapaPageV4 usa o mesmo sistema de filtros territoriais:

```typescript
const territoryFilter = useTerritoryFilter(resolved, activeMemberIds);

// Aplicado automaticamente em:
- makeEventFetcher(territoryFilter)
- makeBusinessFetcher(territoryFilter)
- makeGastronomyFetcher(territoryFilter)
- makeAlertFetcher(territoryFilter)
```

### Filtro de Eventos
```typescript
function makeEventFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    const events = await communityEventsRuntimeService.getByBounds(bounds, {
      limit: 200,
      territoryFilter, // ← Filtro territorial aplicado
    });
    
    return mapEntityProjection.projectEntities(events, 'event', {
      includeMetadata: true,
      baseUrl: '/eventos', // ← Links para /eventos/:id
    });
  };
}
```

---

## 🗺️ Funcionalidades do Mapa

### 1. **Marcadores de Eventos**
- Ícone personalizado para eventos
- Popup com informações
- Click abre detalhes do evento
- Agrupamento automático (clustering)

### 2. **Busca por Bounds**
- Carrega eventos visíveis no mapa
- Atualiza ao mover/zoom
- Debounce de 400ms
- Limite de 200 eventos

### 3. **Localização do Usuário**
- GPS automático
- Fallback para território
- Indicador visual de fonte (GPS vs Território)
- Precisão mostrada

### 4. **Polígonos Territoriais**
- Desenha limites do território
- Centraliza automaticamente
- Zoom apropriado

---

## 📱 Experiência do Usuário

### Desktop
```
1. Usuário acessa /eventos/mapa
2. Mapa carrega centralizado em Salvador
3. Eventos aparecem como marcadores
4. Usuário pode:
   - Buscar endereço
   - Ativar GPS
   - Alternar camadas
   - Clicar em eventos
   - Mover/zoom livremente
```

### Mobile
```
1. Header compacto (menos espaço)
2. Mapa ocupa tela toda
3. Controles otimizados para touch
4. Botões maiores
5. Popup responsivo
```

---

## 🔗 Navegação

### Links de Eventos
```typescript
// Marcadores de eventos linkam para:
/eventos/:eventId

// Ao clicar em um evento no mapa:
navigate(`/eventos/${eventId}`)
```

### Botões de Visualização
```typescript
// Lista
onClick={() => navigate('/eventos')}

// Calendário
onClick={() => navigate('/eventos/calendario')}

// Mapa (atual)
variant="default" // Destacado
```

---

## 🧪 Como Testar

### Teste 1: Mapa Global
```bash
# Abrir no navegador
http://localhost:8080/eventos/mapa

# Verificar:
✓ Mapa carrega
✓ Eventos aparecem como marcadores
✓ Controles funcionam (busca, GPS, camadas)
✓ Click em evento abre popup
✓ Popup tem link para detalhes
```

### Teste 2: Mapa Territorial
```bash
# Abrir no navegador
http://localhost:8080/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/eventos/mapa

# Verificar:
✓ Mapa centraliza no território
✓ Polígonos do território aparecem
✓ Apenas eventos do território
✓ Indicador territorial ativo
```

### Teste 3: Controles
```bash
# Testar cada controle:
1. Busca: Digite um endereço → mapa move
2. GPS: Click no botão → centraliza no usuário
3. Camadas: Toggle eventos → marcadores somem/aparecem
4. Zoom: Scroll → eventos recarregam
```

### Teste 4: Responsividade
```bash
# Testar em diferentes tamanhos:
- Mobile (360px): Header compacto, mapa full
- Tablet (768px): Layout intermediário
- Desktop (1920px): Layout completo
```

---

## 📊 Comparação

### Antes (EventsMap customizado)
```
❌ Código duplicado
❌ Funcionalidades básicas
❌ Sem integração territorial
❌ Sem controles avançados
❌ Manutenção separada
```

### Depois (MapaPageV4 integrado)
```
✅ Código reutilizado
✅ Funcionalidades completas
✅ Integração territorial automática
✅ Controles avançados (busca, GPS, camadas)
✅ Manutenção centralizada
✅ Consistência com resto do projeto
```

---

## 🎯 Benefícios

### Para Usuários
- 🗺️ **Mapa profissional**: Mesma experiência do resto do site
- 🎯 **Mais funcionalidades**: Busca, GPS, múltiplas camadas
- 📱 **Mobile otimizado**: Touch-friendly
- 🚀 **Performance**: Carregamento otimizado por bounds

### Para Desenvolvedores
- 🧹 **Menos código**: Reutiliza MapaPageV4
- 🔧 **Manutenção**: Uma única implementação de mapa
- 🎨 **Consistência**: Mesmo estilo em todo o projeto
- 🐛 **Menos bugs**: Código já testado e validado

### Para o Projeto
- 💰 **Custo**: Menos código para manter
- 📈 **Escalabilidade**: Fácil adicionar novas camadas
- 🎯 **Consistência**: UX uniforme
- 🔄 **Reutilização**: Padrão para outros módulos

---

## 🚀 Próximos Passos

### Imediato
- [x] Integração com MapaPageV4
- [x] Contexto territorial
- [x] TypeScript validado
- [ ] Testar em staging

### Curto Prazo
- [ ] Adicionar filtros de categoria no mapa
- [ ] Adicionar filtros de data no mapa
- [ ] Melhorar popup de eventos
- [ ] Adicionar preview de imagem no popup

### Médio Prazo
- [ ] Heatmap de eventos
- [ ] Rotas para eventos
- [ ] Compartilhar localização de evento
- [ ] Eventos próximos a mim

---

## 📝 Arquivos Modificados

### Atualizado
- ✅ `src/features/events-v2/pages/EventsMapPage.tsx`
  - Removido EventsMap customizado
  - Adicionado MapaPageV4
  - Adicionado contexto territorial
  - Layout otimizado (flex-1 para mapa)

### Reutilizado
- ✅ `src/core/maps/pages/MapaPageV4.tsx` (sem modificações)
- ✅ `src/core/maps/components/v3/MapLibreAdapter.tsx`
- ✅ `src/core/maps/services/MapEntityProjectionService.ts`

---

## ✅ Conclusão

A integração com o MapaPageV4 foi **concluída com sucesso**!

**Status:**
- ✅ Código reutilizado
- ✅ Funcionalidades completas
- ✅ Territorial integrado
- ✅ TypeScript sem erros
- 🟢 PRONTO PARA TESTES

**Resultado:**
- Mapa profissional e completo
- Consistência com resto do projeto
- Menos código para manter
- Melhor experiência do usuário

---

**Criado por**: Kiro AI  
**Data**: 2026-05-14  
**Versão**: 1.0.0
