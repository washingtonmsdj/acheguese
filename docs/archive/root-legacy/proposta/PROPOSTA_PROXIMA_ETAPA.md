# PROPOSTA: PRÓXIMA ETAPA

**Data**: 04/04/2026  
**Status**: 📋 PROPOSTA

---

## 🎯 CONTEXTO

As ETAPAS 1.1A-1.1F implementaram e robusteceram o modo raio do mapa central com sucesso:

- ✅ Base geográfica completa (migrations, services, hooks)
- ✅ Clustering funcional
- ✅ Modo raio para empresas, eventos e alertas
- ✅ Estados de loading/erro/zero resultados
- ✅ Indicadores visuais claros
- ✅ Documentação completa

**Próximo Passo**: Adicionar valor ao usuário com features avançadas.

---

## 🎯 OPÇÕES DE PRÓXIMA ETAPA

### OPÇÃO 1: Ordenação e Filtros Avançados

**Objetivo**: Permitir usuário ordenar e filtrar resultados do modo raio.

**Features**:

1. **Ordenação Customizada**
   - Por distância (atual)
   - Por rating (melhores primeiro)
   - Por data (mais recentes primeiro)
   - Por relevância (score combinado)

2. **Filtro de Categoria**
   - Apenas restaurantes
   - Apenas farmácias
   - Apenas eventos culturais
   - Etc.

3. **Filtro de Rating**
   - Apenas 4+ estrelas
   - Apenas 3+ estrelas

4. **Filtro de Data (Eventos)**
   - Apenas hoje
   - Apenas esta semana
   - Apenas este mês

**Valor para Usuário**:
- 🎯 Encontra exatamente o que procura
- ⚡ Economiza tempo (não precisa filtrar manualmente)
- 🌟 Descobre melhores opções (ordenação por rating)

**Estimativa**: 6-8 horas

**Complexidade**: 🟡 Média

**Impacto**: 🟢 Alto (melhora experiência significativamente)

---

### OPÇÃO 2: Expansão para Pontos Turísticos e Classificados

**Objetivo**: Adicionar mais tipos de entidade ao mapa.

**Features**:

1. **Pontos Turísticos**
   - Adicionar ao modo normal (viewport)
   - Adicionar ao modo raio
   - Emoji: 🏛️
   - Categoria: turismo

2. **Classificados**
   - Adicionar ao modo normal (viewport)
   - Adicionar ao modo raio
   - Emoji: 🏷️
   - Categoria: anúncios

3. **Atualizar Indicadores**
   - Aviso: "Mostrando empresas, eventos, alertas, pontos turísticos e classificados em X km"
   - Layer control: adicionar opções

**Valor para Usuário**:
- 🗺️ Vê mais informações no mapa
- 🏛️ Descobre pontos turísticos próximos
- 🏷️ Encontra classificados na região

**Estimativa**: 4-6 horas

**Complexidade**: 🟢 Baixa (infraestrutura já existe)

**Impacto**: 🟡 Médio (adiciona conteúdo, mas não muda experiência)

---

### OPÇÃO 3: Rotas e ETA (Estimated Time of Arrival)

**Objetivo**: Mostrar rota e tempo estimado até entidade selecionada.

**Features**:

1. **Calcular Rota**
   - Do usuário até entidade
   - Usar serviço de roteamento (OSRM ou similar)
   - Mostrar linha no mapa

2. **Mostrar ETA**
   - Tempo estimado de chegada
   - Distância em km
   - Modo de transporte (carro, bicicleta, a pé)

3. **Instruções de Navegação**
   - Passo a passo
   - "Vire à esquerda em..."
   - "Continue reto por 500m..."

4. **Integração com Apps de Navegação**
   - Botão "Abrir no Google Maps"
   - Botão "Abrir no Waze"

**Valor para Usuário**:
- 🚗 Sabe como chegar
- ⏱️ Sabe quanto tempo vai levar
- 🗺️ Não precisa sair do app para navegar

**Estimativa**: 10-12 horas

**Complexidade**: 🔴 Alta (integração com serviço externo)

**Impacto**: 🟢 Alto (feature muito valiosa)

---

## 📊 COMPARAÇÃO DAS OPÇÕES

| Critério | Opção 1: Filtros | Opção 2: Expansão | Opção 3: Rotas |
|----------|-----------------|-------------------|----------------|
| **Estimativa** | 6-8h | 4-6h | 10-12h |
| **Complexidade** | 🟡 Média | 🟢 Baixa | 🔴 Alta |
| **Impacto** | 🟢 Alto | 🟡 Médio | 🟢 Alto |
| **Valor Imediato** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Risco** | 🟢 Baixo | 🟢 Baixo | 🟡 Médio |
| **Dependências** | Nenhuma | Nenhuma | Serviço externo |

---

## 🎯 RECOMENDAÇÃO

### OPÇÃO 1: Ordenação e Filtros Avançados

**Justificativa**:

1. **Valor Imediato**: Usuário sente diferença na primeira vez que usa
2. **Baixo Risco**: Não depende de serviços externos
3. **Complexidade Média**: Desafiador mas viável
4. **Aproveita Base Existente**: Usa infraestrutura já implementada
5. **Feedback Rápido**: Pode ser testado e iterado rapidamente

**Sequência Sugerida**:

1. **Sprint 1**: Ordenação customizada (2-3h)
2. **Sprint 2**: Filtro de categoria (3-4h)
3. **Sprint 3**: Filtros de rating e data (1-2h)

**Entregáveis por Sprint**:

- Sprint 1: Usuário pode ordenar por distância, rating, data
- Sprint 2: Usuário pode filtrar por categoria (restaurantes, farmácias, etc.)
- Sprint 3: Usuário pode filtrar por rating e data

---

## 📋 DETALHAMENTO DA OPÇÃO 1

### Sprint 1: Ordenação Customizada (2-3h)

**Objetivo**: Permitir usuário ordenar resultados do modo raio.

**Implementação**:

1. **Adicionar Dropdown de Ordenação**
   ```tsx
   <Select value={sortBy} onValueChange={setSortBy}>
     <SelectItem value="distance">Mais próximo</SelectItem>
     <SelectItem value="rating">Melhor avaliado</SelectItem>
     <SelectItem value="date">Mais recente</SelectItem>
   </Select>
   ```

2. **Ordenar Resultados no Frontend**
   ```typescript
   const sortedResults = useMemo(() => {
     const combined = [...businessMarkers, ...eventMarkers, ...alertMarkers];
     
     switch (sortBy) {
       case 'distance':
         return combined.sort((a, b) => a.distance - b.distance);
       case 'rating':
         return combined.sort((a, b) => (b.rating || 0) - (a.rating || 0));
       case 'date':
         return combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
       default:
         return combined;
     }
   }, [businessMarkers, eventMarkers, alertMarkers, sortBy]);
   ```

3. **Atualizar Indicador Visual**
   ```
   📍 Mostrando empresas, eventos e alertas em 5 km
   🔽 Ordenado por: Mais próximo
   ```

**Validação**:
- [ ] Dropdown aparece no controle de raio
- [ ] Ordenação por distância funciona
- [ ] Ordenação por rating funciona
- [ ] Ordenação por data funciona
- [ ] Indicador visual atualiza

---

### Sprint 2: Filtro de Categoria (3-4h)

**Objetivo**: Permitir usuário filtrar por categoria.

**Implementação**:

1. **Adicionar Multiselect de Categorias**
   ```tsx
   <MultiSelect
     value={categories}
     onValueChange={setCategories}
     options={[
       { value: 'restaurant', label: 'Restaurantes' },
       { value: 'pharmacy', label: 'Farmácias' },
       { value: 'hotel', label: 'Hotéis' },
       // ...
     ]}
   />
   ```

2. **Filtrar Resultados no Frontend**
   ```typescript
   const filteredResults = useMemo(() => {
     if (categories.length === 0) return sortedResults;
     
     return sortedResults.filter((marker) => {
       if (marker.type === 'business') {
         return categories.includes(marker.category);
       }
       return true; // Eventos e alertas sempre aparecem
     });
   }, [sortedResults, categories]);
   ```

3. **Atualizar Indicador Visual**
   ```
   📍 Mostrando restaurantes e farmácias em 5 km
   🔽 Ordenado por: Mais próximo
   ```

**Validação**:
- [ ] Multiselect aparece no controle de raio
- [ ] Filtro por categoria funciona
- [ ] Múltiplas categorias podem ser selecionadas
- [ ] Indicador visual atualiza
- [ ] Zero resultados mostra mensagem apropriada

---

### Sprint 3: Filtros de Rating e Data (1-2h)

**Objetivo**: Permitir usuário filtrar por rating e data.

**Implementação**:

1. **Adicionar Slider de Rating Mínimo**
   ```tsx
   <Slider
     value={[minRating]}
     onValueChange={([value]) => setMinRating(value)}
     min={0}
     max={5}
     step={0.5}
   />
   ```

2. **Adicionar Select de Período (Eventos)**
   ```tsx
   <Select value={period} onValueChange={setPeriod}>
     <SelectItem value="today">Hoje</SelectItem>
     <SelectItem value="week">Esta semana</SelectItem>
     <SelectItem value="month">Este mês</SelectItem>
   </Select>
   ```

3. **Filtrar Resultados**
   ```typescript
   const finalResults = useMemo(() => {
     return filteredResults.filter((marker) => {
       // Filtro de rating
       if (marker.type === 'business' && marker.rating < minRating) {
         return false;
       }
       
       // Filtro de data (eventos)
       if (marker.type === 'event') {
         const eventDate = new Date(marker.event_date);
         const now = new Date();
         
         switch (period) {
           case 'today':
             return isSameDay(eventDate, now);
           case 'week':
             return isThisWeek(eventDate);
           case 'month':
             return isThisMonth(eventDate);
           default:
             return true;
         }
       }
       
       return true;
     });
   }, [filteredResults, minRating, period]);
   ```

**Validação**:
- [ ] Slider de rating aparece
- [ ] Filtro de rating funciona
- [ ] Select de período aparece
- [ ] Filtro de período funciona
- [ ] Indicador visual atualiza

---

## 📊 MÉTRICAS DE SUCESSO

### Sprint 1: Ordenação

- [ ] 80%+ dos usuários experimentam ordenação
- [ ] 50%+ dos usuários mudam ordenação padrão
- [ ] Tempo médio de busca reduz 20%

### Sprint 2: Categoria

- [ ] 60%+ dos usuários experimentam filtro de categoria
- [ ] 40%+ dos usuários filtram por categoria específica
- [ ] Taxa de conversão aumenta 15%

### Sprint 3: Rating e Data

- [ ] 40%+ dos usuários experimentam filtro de rating
- [ ] 30%+ dos usuários filtram eventos por período
- [ ] Satisfação do usuário aumenta 10%

---

## 🚀 PRÓXIMOS PASSOS

1. **Validar Proposta**: Revisar com stakeholders
2. **Priorizar Sprints**: Confirmar sequência
3. **Iniciar Sprint 1**: Ordenação customizada
4. **Iterar**: Coletar feedback e ajustar

---

**Elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Status**: 📋 PROPOSTA
