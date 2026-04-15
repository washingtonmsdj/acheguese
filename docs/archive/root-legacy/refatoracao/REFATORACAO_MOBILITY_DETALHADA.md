# 🚗 REFATORAÇÃO MÓDULO MOBILITY - PLANO DETALHADO

## 📊 ANÁLISE DE VIOLAÇÕES

### Violações Críticas Identificadas

#### 1. TrackRidePage.tsx
**Linha 128-132**: Acesso direto ao banco
```typescript
// ❌ VIOLAÇÃO
const [driverComplete, profileContext] = await Promise.all([
  (supabase as any)
    .from("driver_complete_profile")
    .select("display_name, vehicle_model, vehicle_color, vehicle_plate, avg_rating")
    .eq("profile_id", driverProfile.id)
    .single(),
  profileService.getProfileContext(driverProfile.userId),
]);
```

**Solução**: Criar método `MobilityService.getDriverCompleteProfile(profileId)`

---

#### 2. PassageiroPage.tsx
**Linha 91-95**: Acesso direto ao banco
```typescript
// ❌ VIOLAÇÃO
const { data: ratings } = await (supabase as any)
  .from("ride_ratings")
  .select("rating")
  .eq("to_profile_id", myRides[0].passenger_profile_id);
```

**Solução**: Criar método `MobilityService.getPassengerRating(profileId)`

---

#### 3. EmergencyButton.tsx
**Linha 82-83**: Insert direto no banco
```typescript
// ❌ VIOLAÇÃO
const { error: emergencyError } = await (supabase as any)
  .from("emergency_alerts")
  .insert(alertData);
```

**Solução**: Criar método `MobilityService.createEmergencyAlert(data)`

---

#### 4. ServiceAreaSettings.tsx
**Linha 149-152**: Delete direto no banco
```typescript
// ❌ VIOLAÇÃO
const { error } = await (supabase as any)
  .from('driver_accepted_neighborhoods')
  .delete()
  .eq('id', id);
```

**Solução**: Criar método `MobilityService.deleteDriverNeighborhood(id)`

---

#### 5. MobilityChatList.tsx
**Linha 99-168**: Múltiplas queries diretas
```typescript
// ❌ VIOLAÇÃO - Múltiplas queries
.from("mobility_conversations")
.from("mobility_messages")
```

**Solução**: Criar métodos no `MobilityService` para chat

---

## 🎯 PLANO DE IMPLEMENTAÇÃO

### ETAPA 1: Expandir MobilityService ✅

Adicionar os seguintes métodos ao `MobilityService.impl.ts`:

```typescript
// Driver Complete Profile
static async getDriverCompleteProfile(profileId: string)

// Passenger Ratings
static async getPassengerRating(profileId: string)

// Emergency Alerts
static async createEmergencyAlert(data: EmergencyAlertInput)

// Driver Service Areas
static async deleteDriverNeighborhood(id: string)
static async deleteDriverServiceArea(table: string, id: string)

// Chat
static async getMobilityConversations(profileId: string)
static async getLastMessage(conversationId: string)
static async getUnreadCount(conversationId: string, profileId: string)
```

---

### ETAPA 2: Criar/Atualizar Hooks

#### 2.1 useDriverProfile
```typescript
// src/modules/mobility/hooks/useDriverProfile.ts
export function useDriverProfile(profileId: string) {
  return useQuery({
    queryKey: ['driver-profile', profileId],
    queryFn: () => MobilityService.getDriverCompleteProfile(profileId),
    enabled: !!profileId,
  });
}
```

#### 2.2 usePassengerRating
```typescript
// src/modules/mobility/hooks/usePassengerRating.ts
export function usePassengerRating(profileId: string) {
  return useQuery({
    queryKey: ['passenger-rating', profileId],
    queryFn: () => MobilityService.getPassengerRating(profileId),
    enabled: !!profileId,
  });
}
```

#### 2.3 useEmergencyAlert
```typescript
// src/modules/mobility/hooks/useEmergencyAlert.ts
export function useEmergencyAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: MobilityService.createEmergencyAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-alerts'] });
    },
  });
}
```

---

### ETAPA 3: Refatorar Components

#### 3.1 TrackRidePage.tsx
**Antes**:
```typescript
const [driverComplete, profileContext] = await Promise.all([
  (supabase as any).from("driver_complete_profile")...
]);
```

**Depois**:
```typescript
const driverComplete = await MobilityService.getDriverCompleteProfile(driverProfile.id);
const profileContext = await profileService.getProfileContext(driverProfile.userId);
```

---

#### 3.2 PassageiroPage.tsx
**Antes**:
```typescript
const { data: ratings } = await (supabase as any)
  .from("ride_ratings")
  .select("rating")...
```

**Depois**:
```typescript
const { data: rating } = usePassengerRating(myRides[0].passenger_profile_id);
```

---

#### 3.3 EmergencyButton.tsx
**Antes**:
```typescript
const { error } = await (supabase as any)
  .from("emergency_alerts")
  .insert(alertData);
```

**Depois**:
```typescript
const { mutate: createAlert } = useEmergencyAlert();
createAlert(alertData);
```

---

## 📋 CHECKLIST DE EXECUÇÃO

### Fase 1: Service Layer
- [ ] Adicionar `getDriverCompleteProfile` ao MobilityService
- [ ] Adicionar `getPassengerRating` ao MobilityService
- [ ] Adicionar `createEmergencyAlert` ao MobilityService
- [ ] Adicionar `deleteDriverNeighborhood` ao MobilityService
- [ ] Adicionar `deleteDriverServiceArea` ao MobilityService
- [ ] Adicionar métodos de chat ao MobilityService
- [ ] Testar todos os métodos novos

### Fase 2: Hook Layer
- [ ] Criar `useDriverProfile` hook
- [ ] Criar `usePassengerRating` hook
- [ ] Criar `useEmergencyAlert` hook
- [ ] Criar `useDriverServiceArea` hook
- [ ] Criar `useMobilityChat` hook
- [ ] Exportar hooks no barrel export

### Fase 3: Component Layer
- [ ] Refatorar TrackRidePage.tsx
- [ ] Refatorar PassageiroPage.tsx
- [ ] Refatorar EmergencyButton.tsx
- [ ] Refatorar ServiceAreaSettings.tsx
- [ ] Refatorar MobilityChatList.tsx
- [ ] Validar funcionamento de cada component

### Fase 4: Validação Final
- [ ] Testar fluxo completo de passageiro
- [ ] Testar fluxo completo de motorista
- [ ] Testar emergência
- [ ] Testar chat
- [ ] Verificar que não há mais imports diretos do supabase
- [ ] Documentar mudanças

---

## 🎯 RESULTADO ESPERADO

### Antes
- ❌ 15+ arquivos com acesso direto ao banco
- ❌ Lógica duplicada
- ❌ Difícil manutenção

### Depois
- ✅ 0 arquivos com acesso direto ao banco
- ✅ Lógica centralizada no MobilityService
- ✅ Hooks reutilizáveis
- ✅ Components limpos e testáveis
- ✅ Padrão SSOT rigoroso: Database → Service → Hook → Component

---

**Status**: 🔄 PRONTO PARA INICIAR
**Próxima Ação**: Expandir MobilityService.impl.ts
