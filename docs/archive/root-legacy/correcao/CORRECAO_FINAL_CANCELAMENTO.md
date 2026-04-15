# Correção Final: Cancelamento de Corrida

## Problema Identificado

O erro estava claro nos logs:

```
userId: "a3ea040f-6f7a-44dd-b778-10eff4295303"  (auth.users.id)
passengerId: "0a843169-861a-4f60-bbd2-0b44b45981cf"  (profiles.id)

⚠️ useMobilidade.cancelRide - usuário não autorizado
```

## Causa Raiz

O código estava comparando IDs de tabelas diferentes:
- `user.id` → ID da tabela `auth.users`
- `ride.passenger_profile_id` → ID da tabela `profiles`

### Fluxo Incorreto (ANTES):

```typescript
// ❌ ERRADO: Comparando auth.users.id com profiles.id
const isPassenger = ride.passenger_profile_id === user?.id;
```

### Fluxo Correto (DEPOIS):

```typescript
// ✅ CORRETO: Buscar o profile.id do usuário primeiro
const userProfile = 
  (await profileService.getProfileByType(user.id, "personal")) ||
  (await profileService.getActiveProfile(user.id));

// ✅ CORRETO: Comparar profiles.id com profiles.id
const isPassenger = ride.passenger_profile_id === userProfile.id;
```

## Estrutura das Tabelas

### auth.users
```
id: a3ea040f-6f7a-44dd-b778-10eff4295303
email: usuario@exemplo.com
```

### profiles
```
id: 0a843169-861a-4f60-bbd2-0b44b45981cf  ← Este é o profile_id
user_id: a3ea040f-6f7a-44dd-b778-10eff4295303  ← Referência para auth.users
role: personal
```

### ride_requests
```
id: bcabbb76-f4f3-441b-9765-7875865b6617
passenger_profile_id: 0a843169-861a-4f60-bbd2-0b44b45981cf  ← Referência para profiles.id
status: searching_driver
```

## Correção Aplicada

### Arquivo: `src/modules/mobility/hooks/useMobilidade.ts`

**Mudanças:**

1. Buscar o perfil do usuário logado ANTES de verificar permissões
2. Usar `userProfile.id` ao invés de `user.id` nas comparações
3. Passar `userProfile.id` para o RideOperationalService

**Código corrigido:**

```typescript
const cancelRide = useCallback(
  async (rideId: string, reason?: string) => {
    try {
      if (!user) {
        toast.error("Usuário não autenticado");
        return false;
      }

      // ✅ 1. Buscar o perfil do usuário logado
      const userProfile = 
        (await profileService.getProfileByType(user.id, "personal")) ||
        (await profileService.getActiveProfile(user.id));

      if (!userProfile?.id) {
        toast.error("Perfil não encontrado");
        return false;
      }

      // 2. Buscar a corrida
      const ride = await mobilityService.getRideById(rideId);
      if (!ride) {
        toast.error("Corrida não encontrada");
        return false;
      }

      // ✅ 3. Comparar profile.id com profile.id
      const isPassenger = ride.passenger_profile_id === userProfile.id;
      const isDriver = ride.driver_profile_id === userProfile.id;

      if (!isPassenger && !isDriver) {
        toast.error("Você não pode cancelar esta corrida");
        return false;
      }

      // ✅ 4. Passar userProfile.id para o serviço
      const result = await RideOperationalService.cancelRide({
        rideId,
        cancelledBy: isPassenger ? 'passenger' : 'driver',
        profileId: userProfile.id,  // ← Agora usa o profile.id correto
        reason,
      });

      // ... resto do código
    }
  },
  [user, queryClient],
);
```

## Teste Agora

### 1. Recarregue a aplicação

```bash
# Se estiver rodando o dev server, ele deve recarregar automaticamente
# Caso contrário, recarregue a página no navegador (Ctrl+R ou F5)
```

### 2. Tente cancelar novamente

1. Faça login
2. Solicite uma corrida
3. Clique em "Cancelar solicitação"
4. Confirme no diálogo

### 3. Verifique os logs

Agora você deve ver:

```
✅ useMobilidade.cancelRide - perfil do usuário | {
  "userId": "a3ea040f-6f7a-44dd-b778-10eff4295303",
  "profileId": "0a843169-861a-4f60-bbd2-0b44b45981cf"
}

✅ useMobilidade.cancelRide - corrida encontrada | {
  "passengerId": "0a843169-861a-4f60-bbd2-0b44b45981cf",
  "userProfileId": "0a843169-861a-4f60-bbd2-0b44b45981cf"
}

✅ useMobilidade.cancelRide - chamando RideOperationalService | {
  "profileId": "0a843169-861a-4f60-bbd2-0b44b45981cf"
}

✅ useMobilidade.cancelRide - sucesso
```

## Resultado Esperado

✅ **Cancelamento deve funcionar perfeitamente agora!**

- Toast verde: "Corrida cancelada"
- Redirecionamento para a página do passageiro
- Logs mostrando sucesso em todas as etapas

## Por que isso aconteceu?

Este é um erro comum em sistemas com múltiplas tabelas de usuários:

1. **auth.users**: Tabela de autenticação (Supabase Auth)
2. **profiles**: Tabela de perfis da aplicação (pode ter múltiplos perfis por usuário)

O código estava misturando os IDs dessas duas tabelas, causando a falha na validação de permissão.

## Lição Aprendida

Sempre use o `profile.id` quando trabalhar com entidades do domínio (corridas, entregas, etc), não o `auth.users.id`.

**Padrão correto:**
```typescript
// 1. Buscar o perfil do usuário
const userProfile = await profileService.getProfileByType(user.id, "personal");

// 2. Usar userProfile.id nas operações
await service.doSomething({
  profileId: userProfile.id  // ✅ Correto
});
```

**Padrão incorreto:**
```typescript
// ❌ ERRADO: Usar user.id diretamente
await service.doSomething({
  profileId: user.id  // ❌ Vai falhar se comparar com profiles.id
});
```
