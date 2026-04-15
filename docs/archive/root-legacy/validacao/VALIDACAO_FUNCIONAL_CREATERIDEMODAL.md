# VALIDAÇÃO FUNCIONAL - CreateRideModal

## PROBLEMAS IDENTIFICADOS

### ❌ 1. Preço Sugerido Fica Stale
**Problema**: `useEffect` só atualiza preço se `suggestedPrice` estiver vazio
```typescript
useEffect(() => {
  if (priceEstimate && !suggestedPrice) {
    setSuggestedPrice(priceEstimate.estimatedPrice.toFixed(2));
  }
}, [priceEstimate]);
```

**Impacto**: 
- Usuário muda origem/destino → estimativa recalcula
- Preço sugerido NÃO atualiza (porque já tem valor)
- Usuário vê preço desatualizado

**Solução**: Atualizar sempre que estimativa mudar, a menos que usuário tenha editado manualmente

### ❌ 2. Sem Controle de Edição Manual
**Problema**: Não há flag para detectar se usuário editou preço manualmente

**Impacto**:
- Sistema não sabe se deve sobrescrever preço editado pelo usuário
- Pode sobrescrever edição manual ou ficar stale

**Solução**: Adicionar flag `userEditedPrice` para preservar edição manual

### ❌ 3. Modo de Corrida Não Afeta Estimativa
**Problema**: `priceEstimateRequest` usa `type` do estado, mas não está nas dependências do objeto

**Impacto**:
- Usuário muda de "viagem" para "entrega"
- Request não recalcula (objeto não muda)
- Estimativa usa modo errado

**Solução**: Incluir `type` nas dependências ou usar useMemo

### ✅ 4. Recálculo Automático OK
**Validação**: `priceEstimateRequest` recalcula quando `originCoords` ou `destinationCoords` mudam
- React Query detecta mudança no queryKey
- Faz novo request automaticamente

### ✅ 5. Excesso de Requests Controlado
**Validação**: React Query tem `staleTime: 60000` (1 minuto)
- Mesma rota não refaz request por 1 minuto
- Cache funciona corretamente

---

## CORREÇÕES NECESSÁRIAS

### 1. Adicionar Flag de Edição Manual
```typescript
const [userEditedPrice, setUserEditedPrice] = useState(false);
```

### 2. Atualizar Lógica de Preço Sugerido
```typescript
useEffect(() => {
  // Só atualiza se usuário não editou manualmente
  if (priceEstimate && !userEditedPrice) {
    setSuggestedPrice(priceEstimate.estimatedPrice.toFixed(2));
  }
}, [priceEstimate, userEditedPrice]);
```

### 3. Detectar Edição Manual
```typescript
<Input
  type="number"
  value={suggestedPrice}
  onChange={(e) => {
    setSuggestedPrice(e.target.value);
    setUserEditedPrice(true); // Marca como editado manualmente
  }}
  // ...
/>
```

### 4. Resetar Flag ao Mudar Coordenadas
```typescript
useEffect(() => {
  // Quando rota muda, permite atualização automática novamente
  setUserEditedPrice(false);
}, [originCoords, destinationCoords]);
```

### 5. Incluir Tipo no Request (useMemo)
```typescript
const priceEstimateRequest: PriceEstimateRequest | null = useMemo(() => {
  if (!originCoords || !destinationCoords) return null;
  
  return {
    mode: type === "entrega" ? "delivery" : "ride",
    origin: {
      latitude: originCoords.latitude,
      longitude: originCoords.longitude,
    },
    destination: {
      latitude: destinationCoords.latitude,
      longitude: destinationCoords.longitude,
    },
    options: {
      includeBreakdown: true,
      applyPeakHours: true,
    },
  };
}, [originCoords, destinationCoords, type]);
```

---

## VALIDAÇÃO PÓS-CORREÇÃO

### ✅ Cenário 1: Usuário Captura GPS Origem
- Captura GPS origem → `originCoords` atualiza
- `priceEstimateRequest` ainda null (falta destino)
- Sem request desnecessário

### ✅ Cenário 2: Usuário Captura GPS Destino
- Captura GPS destino → `destinationCoords` atualiza
- `priceEstimateRequest` vira objeto válido
- React Query faz request
- Preço sugerido atualiza automaticamente

### ✅ Cenário 3: Usuário Muda Origem
- Muda origem → `originCoords` atualiza
- `priceEstimateRequest` muda (novo objeto)
- React Query detecta mudança no queryKey
- Faz novo request
- `userEditedPrice` resetado → preço atualiza

### ✅ Cenário 4: Usuário Edita Preço Manualmente
- Edita campo de preço → `userEditedPrice = true`
- Estimativa recalcula (rota mudou)
- Preço NÃO sobrescreve edição manual

### ✅ Cenário 5: Usuário Muda Tipo de Corrida
- Muda de "viagem" para "entrega"
- `type` muda → `priceEstimateRequest` recalcula (useMemo)
- React Query faz novo request com mode correto
- Preço atualiza com tarifa de delivery

### ✅ Cenário 6: Horário de Pico
- Estimativa retorna com `peakHourMultiplier > 1`
- Componente renderiza aviso de pico
- Breakdown mostra multiplicador aplicado

---

## RISCOS RESIDUAIS

### BAIXO: Renderização de Breakdown
- RouteEstimateCard recebe formato adaptado
- Pode não renderizar todos os campos corretamente
- Validação visual necessária

### BAIXO: Loading State
- `estimateLoading` não é usado no componente
- Usuário não vê feedback visual durante cálculo
- UX pode ser melhorada

### MÉDIO: Reset de Form
- `onOpenChange(false)` reseta estados
- `userEditedPrice` deve ser resetado também
- Verificar se reset está completo
