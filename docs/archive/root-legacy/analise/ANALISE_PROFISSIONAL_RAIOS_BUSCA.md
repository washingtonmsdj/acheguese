# Análise Profissional: Raios de Busca "Perto de Mim"

**Data**: 2026-04-04  
**Questão**: "Você não acha 1km muito pouco para pesquisa de bairro?"

---

## Análise Crítica

### ❌ PROBLEMA IDENTIFICADO

**Raio de 1km é INADEQUADO para contexto de bairro**

---

## Contexto Geográfico: Salvador

### Tamanho Médio dos Bairros de Salvador

| Bairro | Área (km²) | Raio Equivalente | Observação |
|--------|-----------|------------------|------------|
| Pituba | 3.5 | ~1.05 km | Bairro médio |
| Barra | 2.8 | ~0.94 km | Bairro compacto |
| Itapuã | 12.0 | ~1.95 km | Bairro grande |
| Rio Vermelho | 4.2 | ~1.15 km | Bairro médio |
| Brotas | 8.5 | ~1.64 km | Bairro grande |
| Centro | 6.0 | ~1.38 km | Bairro histórico |

**Conclusão**: Raio de 1km cobre apenas ~30-50% de um bairro médio.

---

## Análise de Distâncias Reais

### Caminhada (5 km/h)

| Distância | Tempo | Viabilidade | Contexto |
|-----------|-------|-------------|----------|
| 500m | 6 min | ✅ Muito próximo | Mesma rua/quarteirão |
| 1 km | 12 min | ✅ Próximo | Dentro do bairro |
| 2 km | 24 min | ⚠️ Razoável | Bairro inteiro |
| 3 km | 36 min | ⚠️ Longe | Bairros vizinhos |
| 5 km | 60 min | ❌ Muito longe | Outra região |

### Bicicleta (15 km/h)

| Distância | Tempo | Viabilidade | Contexto |
|-----------|-------|-------------|----------|
| 1 km | 4 min | ✅ Muito próximo | Mesma rua |
| 2 km | 8 min | ✅ Próximo | Bairro inteiro |
| 3 km | 12 min | ✅ Razoável | Bairros vizinhos |
| 5 km | 20 min | ✅ OK | Região |
| 10 km | 40 min | ⚠️ Longe | Outra região |

### Carro/Moto (30 km/h urbano)

| Distância | Tempo | Viabilidade | Contexto |
|-----------|-------|-------------|----------|
| 1 km | 2 min | ✅ Muito próximo | Mesma rua |
| 2 km | 4 min | ✅ Próximo | Bairro |
| 5 km | 10 min | ✅ Razoável | Região |
| 10 km | 20 min | ✅ OK | Cidade |
| 20 km | 40 min | ⚠️ Longe | Outra região |

---

## Benchmarking: Aplicativos Similares

### iFood (Delivery)
- **Raio padrão**: 3-5 km
- **Raio máximo**: 10 km
- **Contexto**: Entrega de comida

### Uber (Transporte)
- **Raio padrão**: 5-10 km
- **Raio máximo**: 50 km
- **Contexto**: Transporte urbano

### Google Maps "Nearby"
- **Raio padrão**: 2-5 km
- **Raio máximo**: 50 km
- **Contexto**: Busca geral

### Foursquare/Swarm
- **Raio padrão**: 1-2 km
- **Raio máximo**: 10 km
- **Contexto**: Check-in e descoberta

### Waze
- **Raio padrão**: 5-10 km
- **Raio máximo**: 50 km
- **Contexto**: Alertas de trânsito

---

## Análise por Tipo de Entidade

### 🏢 Empresas (Comércio Local)

**Comportamento do usuário**:
- Busca por conveniência
- Prefere próximo (< 2 km)
- Aceita ir mais longe para serviços específicos

**Raio recomendado**:
- ✅ Mínimo: 500m (quarteirão)
- ✅ Padrão: 2 km (bairro)
- ✅ Máximo: 10 km (região)

---

### 📅 Eventos

**Comportamento do usuário**:
- Disposto a se deslocar mais
- Busca por interesse, não só proximidade
- Aceita 30-60 min de deslocamento

**Raio recomendado**:
- ✅ Mínimo: 2 km (bairro)
- ✅ Padrão: 5 km (região)
- ✅ Máximo: 20 km (cidade)

---

### ⚠️ Alertas (Trânsito, Segurança)

**Comportamento do usuário**:
- Quer saber o que está acontecendo agora
- Relevante se estiver no caminho
- Importante para planejamento de rota

**Raio recomendado**:
- ✅ Mínimo: 1 km (imediato)
- ✅ Padrão: 3 km (rota)
- ✅ Máximo: 10 km (região)

---

### 🏛️ Pontos Turísticos

**Comportamento do usuário**:
- Disposto a se deslocar muito
- Busca por interesse cultural
- Aceita 1-2h de deslocamento

**Raio recomendado**:
- ✅ Mínimo: 5 km (região)
- ✅ Padrão: 10 km (cidade)
- ✅ Máximo: 50 km (estado)

---

## Proposta de Raios Otimizados

### Opção 1: Raios Fixos Ajustados ⭐ RECOMENDADO

```typescript
const RADIUS_OPTIONS = [
  500,  // 500m - Quarteirão (6 min a pé)
  1000, // 1km - Bairro próximo (12 min a pé)
  2000, // 2km - Bairro inteiro (24 min a pé / 8 min bike)
  5000, // 5km - Região (1h a pé / 20 min bike / 10 min carro)
  10000, // 10km - Cidade (40 min bike / 20 min carro)
  20000, // 20km - Grande área (40 min carro)
];
```

**Benefícios**:
- ✅ Cobre desde "muito próximo" até "cidade inteira"
- ✅ Opções para diferentes modais (pé, bike, carro)
- ✅ Flexibilidade para diferentes necessidades

---

### Opção 2: Raios Adaptativos por Tipo

```typescript
const RADIUS_BY_TYPE = {
  business: {
    default: 2000,
    options: [500, 1000, 2000, 5000, 10000],
  },
  event: {
    default: 5000,
    options: [2000, 5000, 10000, 20000],
  },
  alert: {
    default: 3000,
    options: [1000, 3000, 5000, 10000],
  },
  tourist_point: {
    default: 10000,
    options: [5000, 10000, 20000, 50000],
  },
};
```

**Benefícios**:
- ✅ Raios otimizados por tipo de entidade
- ✅ Padrões mais inteligentes
- ✅ Menos opções = menos confusão

---

### Opção 3: Raios com Labels Descritivos

```typescript
const RADIUS_OPTIONS = [
  { value: 500, label: 'Muito perto', subtitle: '~6 min a pé', icon: '🚶' },
  { value: 1000, label: 'Perto', subtitle: '~12 min a pé', icon: '🚶' },
  { value: 2000, label: 'No bairro', subtitle: '~8 min de bike', icon: '🚴' },
  { value: 5000, label: 'Na região', subtitle: '~10 min de carro', icon: '🚗' },
  { value: 10000, label: 'Na cidade', subtitle: '~20 min de carro', icon: '🚗' },
  { value: 20000, label: 'Área ampla', subtitle: '~40 min de carro', icon: '🚗' },
];
```

**Benefícios**:
- ✅ Usuário entende o que significa cada raio
- ✅ Contexto de tempo e modal
- ✅ Mais intuitivo

---

## Análise de Densidade

### Salvador - Densidade por Região

| Região | Densidade | Raio Recomendado | Motivo |
|--------|-----------|------------------|--------|
| Centro | Alta | 1-2 km | Muitas opções próximas |
| Barra/Rio Vermelho | Alta | 1-3 km | Área comercial densa |
| Pituba/Itaigara | Média | 2-5 km | Bairros residenciais |
| Subúrbio | Baixa | 5-10 km | Menos opções |
| Orla | Média | 2-5 km | Turismo + comércio |

**Conclusão**: Raio ideal varia por densidade da região.

---

## Proposta Final: Sistema Inteligente

### 1. Raio Padrão Inteligente

```typescript
const getDefaultRadius = (entityTypes: EntityType[], userLocation: Coords) => {
  // Detectar densidade da região (via API ou heurística)
  const density = await getDensity(userLocation);
  
  // Ajustar raio baseado em densidade e tipos
  if (density === 'high') {
    return entityTypes.includes('business') ? 1000 : 2000;
  } else if (density === 'medium') {
    return entityTypes.includes('business') ? 2000 : 5000;
  } else {
    return entityTypes.includes('business') ? 5000 : 10000;
  }
};
```

---

### 2. Opções de Raio Contextuais

```typescript
const RADIUS_OPTIONS = [
  { 
    value: 500, 
    label: 'Muito perto', 
    subtitle: '6 min a pé',
    icon: '🚶',
    bestFor: ['business', 'alert'],
  },
  { 
    value: 1000, 
    label: 'Perto', 
    subtitle: '12 min a pé',
    icon: '🚶',
    bestFor: ['business', 'alert'],
  },
  { 
    value: 2000, 
    label: 'No bairro', 
    subtitle: '8 min de bike',
    icon: '🚴',
    bestFor: ['business', 'event', 'alert'],
  },
  { 
    value: 5000, 
    label: 'Na região', 
    subtitle: '10 min de carro',
    icon: '🚗',
    bestFor: ['business', 'event', 'tourist_point'],
  },
  { 
    value: 10000, 
    label: 'Na cidade', 
    subtitle: '20 min de carro',
    icon: '🚗',
    bestFor: ['event', 'tourist_point'],
  },
  { 
    value: 20000, 
    label: 'Área ampla', 
    subtitle: '40 min de carro',
    icon: '🚗',
    bestFor: ['event', 'tourist_point'],
  },
];
```

---

### 3. Sugestão Automática

```typescript
// Sugerir raio baseado em resultados
const suggestRadius = (currentRadius: number, resultCount: number) => {
  if (resultCount === 0) {
    return currentRadius * 2; // Aumentar raio
  } else if (resultCount > 50) {
    return currentRadius / 2; // Reduzir raio
  }
  return currentRadius; // Manter
};
```

---

## Comparação: Atual vs Proposto

### Atual
```typescript
const RADIUS_OPTIONS = [1, 2, 5, 10, 15, 20]; // km
```

**Problemas**:
- ❌ 1km muito pequeno para bairro
- ❌ Saltos muito grandes (1→2→5)
- ❌ Sem contexto de tempo/distância
- ❌ Não considera tipo de entidade

---

### Proposto
```typescript
const RADIUS_OPTIONS = [
  { value: 500, label: 'Muito perto', subtitle: '~6 min a pé' },
  { value: 1000, label: 'Perto', subtitle: '~12 min a pé' },
  { value: 2000, label: 'No bairro', subtitle: '~8 min de bike' },
  { value: 5000, label: 'Na região', subtitle: '~10 min de carro' },
  { value: 10000, label: 'Na cidade', subtitle: '~20 min de carro' },
  { value: 20000, label: 'Área ampla', subtitle: '~40 min de carro' },
];

const DEFAULT_RADIUS = 2000; // 2km (bairro inteiro)
```

**Benefícios**:
- ✅ Raio padrão adequado (2km = bairro)
- ✅ Opção de 500m para "muito próximo"
- ✅ Progressão lógica (500→1k→2k→5k→10k→20k)
- ✅ Contexto de tempo e modal
- ✅ Cobre todos os casos de uso

---

## Recomendação Final

### Mudanças Imediatas ⭐

1. **Mudar raio padrão**: 5km → 2km
2. **Adicionar opção 500m**: Para "muito próximo"
3. **Remover 15km**: Redundante entre 10km e 20km
4. **Adicionar labels**: Contexto de tempo

```typescript
const RADIUS_OPTIONS = [
  { value: 500, label: '500m', subtitle: '~6 min a pé' },
  { value: 1000, label: '1km', subtitle: '~12 min a pé' },
  { value: 2000, label: '2km', subtitle: '~8 min de bike' },
  { value: 5000, label: '5km', subtitle: '~10 min de carro' },
  { value: 10000, label: '10km', subtitle: '~20 min de carro' },
  { value: 20000, label: '20km', subtitle: '~40 min de carro' },
];

const DEFAULT_RADIUS = 2000; // 2km
```

---

### Melhorias Futuras 🔮

1. **Raio adaptativo por densidade**
2. **Raio sugerido por tipo de entidade**
3. **Sugestão automática baseada em resultados**
4. **Filtro por tempo de deslocamento** (ex: "até 15 min a pé")

---

## Conclusão

**Resposta direta**: Sim, 1km é muito pequeno para contexto de bairro.

**Raio ideal**:
- ✅ Padrão: 2km (cobre bairro inteiro)
- ✅ Mínimo: 500m (muito próximo)
- ✅ Máximo: 20km (área ampla)

**Quer que eu implemente essas mudanças?**

