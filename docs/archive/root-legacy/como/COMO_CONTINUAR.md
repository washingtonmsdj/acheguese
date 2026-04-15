# 🚀 COMO CONTINUAR A REFATORAÇÃO

## 📍 ONDE ESTAMOS

Você está no meio de uma refatoração completa do projeto para seguir o padrão SSOT rigoroso.

**Progresso Atual**:
- ✅ Análise completa: 100%
- ✅ Módulo Mobility - Service Layer: 100%
- ✅ Módulo Mobility - Hook Layer: 100%
- ⏳ Módulo Mobility - Component Layer: 0%

---

## 🎯 PRÓXIMO PASSO: Refatorar TrackRidePage.tsx

### Arquivo a Modificar
`src/modules/mobility/pages/TrackRidePage.tsx`

### Violação Atual (Linha 128-132)
```typescript
// ❌ VIOLAÇÃO SSOT
const [driverComplete, profileContext] = await Promise.all([
  (supabase as any)
    .from("driver_complete_profile")
    .select("display_name, vehicle_model, vehicle_color, vehicle_plate, avg_rating")
    .eq("profile_id", driverProfile.id)
    .single(),
  profileService.getProfileContext(driverProfile.userId),
]);
```

### Solução a Implementar

#### 1. Adicionar Import do Hook
```typescript
import { useDriverCompleteProfile } from '@/modules/mobility/hooks/useDriverCompleteProfile';
```

#### 2. Remover Import Direto do Supabase
```typescript
// ❌ REMOVER esta linha se existir
import { supabase } from '@/integrations/supabase';
```

#### 3. Substituir a Query Direta

**ANTES**:
```typescript
const [driverComplete, profileContext] = await Promise.all([
  (supabase as any)
    .from("driver_complete_profile")
    .select("display_name, vehicle_model, vehicle_color, vehicle_plate, avg_rating")
    .eq("profile_id", driverProfile.id)
    .single(),
  profileService.getProfileContext(driverProfile.userId),
]);
```

**DEPOIS**:
```typescript
// Buscar dados do motorista usando SSOT
const driverComplete = await MobilityService.getDriverCompleteProfile(driverProfile.id);
const profileContext = await profileService.getProfileContext(driverProfile.userId);
```

**OU** (se preferir usar o hook diretamente no component):
```typescript
// No topo do component
const { data: driverComplete, isLoading: loadingDriver } = useDriverCompleteProfile(
  driverProfile?.id
);
```

#### 4. Ajustar o Código Dependente

Verificar se o código que usa `driverComplete` precisa de ajustes:
```typescript
if (driverComplete) {
  driverData = {
    name: driverComplete.display_name,
    vehicle_model: driverComplete.vehicle_model,
    vehicle_color: driverComplete.vehicle_color,
    vehicle_plate: driverComplete.vehicle_plate,
    rating: driverComplete.avg_rating,
    profileContext,
  };
}
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após fazer a mudança:

- [ ] Código compila sem erros (`npm run typecheck`)
- [ ] Não há imports diretos de `@/integrations/supabase` no arquivo
- [ ] A página carrega corretamente
- [ ] Os dados do motorista são exibidos corretamente
- [ ] Não há erros no console do navegador
- [ ] O rastreamento funciona como antes

---

## 📋 PRÓXIMOS ARQUIVOS (EM ORDEM)

Após completar TrackRidePage.tsx:

### 2. PassageiroPage.tsx
**Violação**: Linha 91-95
**Hook**: `usePassengerRating`
**Arquivo**: `src/modules/mobility/pages/PassageiroPage.tsx`

### 3. EmergencyButton.tsx
**Violação**: Linha 82-83
**Hook**: `useEmergencyAlert`
**Arquivo**: `src/modules/mobility/components/EmergencyButton.tsx`

### 4. ServiceAreaSettings.tsx
**Violação**: Linha 149-152
**Hook**: `useDriverServiceArea`
**Arquivo**: `src/modules/mobility/components/driver/ServiceAreaSettings.tsx`

### 5. MobilityChatList.tsx
**Violação**: Linha 99-168
**Hooks**: `useMobilityConversations`, `useLastMessage`, `useUnreadCount`
**Arquivo**: `src/modules/mobility/components/chat/MobilityChatList.tsx`

---

## 🔍 COMO ENCONTRAR VIOLAÇÕES

### Buscar Imports Diretos do Supabase
```bash
# No terminal
grep -r "from '@/integrations/supabase'" src/modules/mobility/
```

### Buscar Queries Diretas
```bash
# No terminal
grep -r "\.from(" src/modules/mobility/ | grep -v "node_modules"
```

---

## 📚 DOCUMENTOS DE REFERÊNCIA

1. **PLANO_REFATORACAO_SSOT_COMPLETO.md** - Visão geral do projeto
2. **REFATORACAO_MOBILITY_DETALHADA.md** - Detalhes do módulo Mobility
3. **PROGRESSO_REFATORACAO_MOBILITY.md** - Acompanhamento do progresso
4. **RESUMO_TRABALHO_REALIZADO.md** - O que já foi feito

---

## 🎯 PADRÃO A SEGUIR

### Sempre Seguir Este Fluxo
```
Database → Service → Hook → Component
```

### Nunca Fazer
❌ Component acessa banco diretamente
❌ Hook acessa banco diretamente
❌ Component acessa Service diretamente (use Hook)

### Sempre Fazer
✅ Component usa Hook
✅ Hook usa Service
✅ Service acessa Database

---

## 🚨 REGRAS CRÍTICAS

1. **NUNCA** deletar arquivos sem confirmar
2. **SEMPRE** testar após cada mudança
3. **SEMPRE** manter compatibilidade
4. **SEMPRE** documentar mudanças significativas
5. **SEMPRE** seguir o padrão SSOT

---

## 💡 DICAS

### Se Encontrar Dificuldades
1. Leia o arquivo `REFATORACAO_MOBILITY_DETALHADA.md`
2. Veja exemplos nos hooks já criados
3. Teste em pequenos passos
4. Valide cada mudança antes de avançar

### Se Precisar Adicionar Novo Método
1. Adicione ao `MobilityService.impl.ts`
2. Crie um hook correspondente
3. Exporte no `hooks/index.ts`
4. Use no component

### Se Encontrar Bug
1. Reverta a mudança
2. Analise o erro
3. Corrija o Service ou Hook
4. Tente novamente

---

## 🎉 QUANDO TERMINAR O MÓDULO MOBILITY

1. Execute todos os testes
2. Valide manualmente todos os fluxos
3. Atualize `PROGRESSO_REFATORACAO_MOBILITY.md`
4. Marque como 100% concluído
5. Comece o próximo módulo (Admin)

---

## 📞 COMANDOS ÚTEIS

```bash
# Verificar tipos
npm run typecheck

# Lint
npm run lint

# Buscar violações
grep -r "from '@/integrations/supabase'" src/modules/mobility/

# Rodar dev server
npm run dev
```

---

**Boa sorte! Você está fazendo um excelente trabalho! 🚀**

**Lembre-se**: Cada arquivo refatorado é uma vitória. Vá com calma, teste bem, e mantenha o padrão SSOT rigoroso.
