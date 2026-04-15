# Implementação: Restrição de Comunidade por Bairro

## Entendimento do Requisito

### Comunidade é DIFERENTE dos Outros Módulos

**Outros Módulos** (Empresas, Serviços, Gastronomia, etc.):
- ✅ Qualquer pessoa pode VER
- ✅ Não precisa morar no bairro
- ✅ Rollout controla apenas DISPONIBILIDADE

**Comunidade** (Restrito):
- 🔒 SÓ moradores CONFIRMADOS podem acessar
- 🔒 Precisa ter endereço verificado no bairro/grupo
- 🔒 Rollout + Verificação de Endereço

## Exemplo Prático

```
Complexo do Nordeste de Amaralina
├─ Empresas → João (de Pituba) pode ver ✅
├─ Serviços → João (de Pituba) pode ver ✅
├─ Gastronomia → João (de Pituba) pode ver ✅
└─ Comunidade → João (de Pituba) NÃO pode ver 🔒
                Maria (do Nordeste, confirmada) pode ver ✅
```

## Arquitetura da Solução

### 1. Rollout (Controla Disponibilidade do Módulo)

```sql
-- Ativa comunidade em Salvador (herança para bairros)
INSERT INTO module_rollouts (module_key, location_id, status)
VALUES ('community', 'salvador-id', 'active');

-- Desativa comunidade em um bairro específico (se necessário)
INSERT INTO module_rollouts (module_key, location_id, status)
VALUES ('community', 'pituba-id', 'inactive');
```

### 2. Verificação de Endereço (Controla Acesso do Usuário)

```typescript
// Verifica se usuário tem endereço confirmado no bairro
const userAddress = await getUserConfirmedAddress(userId);
const isResident = userAddress.location_id === currentLocationId;
```

### 3. Gate de Acesso (Combina Rollout + Endereço)

```typescript
<CommunityRolloutGate>
  <ComunidadePage />
</CommunityRolloutGate>
```

## O Que Foi Criado

### ✅ Componente: `CommunityRolloutGate`

**Arquivo**: `src/modules/community/components/CommunityRolloutGate.tsx`

**Funcionalidade**:
- Verifica se módulo está ativo (rollout)
- Verifica se usuário tem endereço confirmado
- Bloqueia acesso se não atender requisitos
- Mostra mensagem clara e botão para confirmar endereço

**Uso**:
```typescript
import { CommunityRolloutGate } from '../components/CommunityRolloutGate';

export function ComunidadePage() {
  return (
    <CommunityRolloutGate>
      {/* Conteúdo da página */}
    </CommunityRolloutGate>
  );
}
```

## Como Implementar Completamente

### Passo 1: Adicionar Gate em TODAS as Páginas de Comunidade

Páginas que precisam do gate:
- ✅ `ComunidadePage.tsx`
- ✅ `GruposPage.tsx`
- ✅ `EventosPage.tsx`
- ✅ `RecomendacoesPage.tsx`
- ✅ `AchadosPerdidosPage.tsx`
- ✅ `AlertasPage.tsx`
- ✅ Todas as páginas de detalhe

**Exemplo**:
```typescript
// src/modules/community/pages/ComunidadePage.tsx
import { CommunityRolloutGate } from '../components/CommunityRolloutGate';

export function ComunidadePage() {
  return (
    <CommunityRolloutGate>
      <div>
        {/* Conteúdo existente */}
      </div>
    </CommunityRolloutGate>
  );
}
```

### Passo 2: Implementar Verificação de Endereço

Atualmente, `useCommunityRollout` verifica apenas o rollout. Precisa adicionar verificação de endereço:

```typescript
// src/modules/community/services/CommunityRolloutService.ts

async checkAccess(resolved?: ResolvedTerritory): Promise<{ blocked: boolean; reason?: string }> {
  const locationId = this.resolveLocationId(resolved);

  if (!locationId) {
    return { blocked: true, reason: 'Localização não selecionada' };
  }

  // 1. Verifica rollout
  const isActive = await this.isCommunityActive(resolved);
  if (!isActive) {
    return { blocked: true, reason: 'Community não está disponível nesta localização' };
  }

  // 2. Verifica endereço do usuário (NOVO)
  const user = await getCurrentUser();
  if (!user) {
    return { blocked: true, reason: 'Você precisa estar logado' };
  }

  const userAddress = await getUserConfirmedAddress(user.id);
  if (!userAddress) {
    return { blocked: true, reason: 'Você precisa confirmar seu endereço para acessar a comunidade' };
  }

  // 3. Verifica se endereço é do bairro/grupo atual
  const isResident = await this.isUserResidentOfLocation(user.id, locationId, resolved);
  if (!isResident) {
    return { blocked: true, reason: 'A comunidade está disponível apenas para moradores confirmados deste bairro' };
  }

  return { blocked: false };
}

private async isUserResidentOfLocation(
  userId: string, 
  locationId: string, 
  resolved?: ResolvedTerritory
): Promise<boolean> {
  const userAddress = await getUserConfirmedAddress(userId);
  if (!userAddress) return false;

  // Para location: verifica se endereço é exatamente da location
  if (resolved?.kind === 'location') {
    return userAddress.location_id === locationId;
  }

  // Para grupo: verifica se endereço é de qualquer membro do grupo
  if (resolved?.kind === 'group') {
    const memberIds = resolved.group.members.map(m => m.id);
    return memberIds.includes(userAddress.location_id);
  }

  return false;
}
```

### Passo 3: Criar Serviço de Verificação de Endereço

```typescript
// src/modules/community/services/AddressVerificationService.ts

export class AddressVerificationService {
  /**
   * Busca endereço confirmado do usuário
   */
  async getUserConfirmedAddress(userId: string) {
    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_confirmed', true)
      .eq('is_primary', true)
      .single();

    return data;
  }

  /**
   * Verifica se usuário é morador de uma localização
   */
  async isResidentOf(userId: string, locationId: string): Promise<boolean> {
    const address = await this.getUserConfirmedAddress(userId);
    return address?.location_id === locationId;
  }

  /**
   * Verifica se usuário é morador de qualquer membro de um grupo
   */
  async isResidentOfGroup(userId: string, groupId: string): Promise<boolean> {
    const address = await this.getUserConfirmedAddress(userId);
    if (!address) return false;

    const group = await getTerritorialGroup(groupId);
    const memberIds = group.members.map(m => m.id);
    
    return memberIds.includes(address.location_id);
  }
}
```

### Passo 4: Configurar Rollouts por Bairro (Quando Decidir Abrir)

Quando você decidir abrir comunidade para um bairro específico:

```sql
-- Opção 1: Ativar para Salvador inteiro (herança automática)
INSERT INTO module_rollouts (module_key, location_id, status)
VALUES ('community', 'salvador-id', 'active');

-- Opção 2: Ativar só para Complexo do Nordeste
INSERT INTO module_rollouts (module_key, location_id, status)
VALUES ('community', 'complexo-nordeste-id', 'active');

-- Opção 3: Ativar Salvador, mas desativar bairros específicos
INSERT INTO module_rollouts (module_key, location_id, status)
VALUES 
  ('community', 'salvador-id', 'active'),
  ('community', 'pituba-id', 'inactive'),
  ('community', 'barra-id', 'inactive');
```

## Fluxo Completo

### Usuário Tenta Acessar Comunidade

```
1. Usuário acessa /comunidade/ba/salvador/nordeste-de-amaralina
   ↓
2. CommunityRolloutGate verifica:
   ├─ Rollout ativo? (module_rollouts)
   ├─ Usuário logado?
   ├─ Endereço confirmado? (user_addresses)
   └─ Endereço é do bairro/grupo?
   ↓
3a. TUDO OK → Mostra conteúdo ✅
3b. BLOQUEADO → Mostra mensagem + botão "Confirmar Endereço" 🔒
```

### Mensagens de Bloqueio

```typescript
// Sem localização
"Localização não selecionada"

// Módulo inativo
"Community não está disponível nesta localização"

// Não logado
"Você precisa estar logado"

// Sem endereço confirmado
"Você precisa confirmar seu endereço para acessar a comunidade"

// Endereço de outro bairro
"A comunidade está disponível apenas para moradores confirmados deste bairro"
```

## Comparação: Comunidade vs Outros Módulos

### Empresas (Aberto)
```typescript
// Sem gate - qualquer um acessa
export function EmpresasPage() {
  return <div>Lista de empresas</div>;
}
```

### Comunidade (Restrito)
```typescript
// Com gate - só moradores confirmados
export function ComunidadePage() {
  return (
    <CommunityRolloutGate>
      <div>Feed da comunidade</div>
    </CommunityRolloutGate>
  );
}
```

## Próximos Passos

### 1. Implementar Verificação de Endereço
- [ ] Criar `AddressVerificationService`
- [ ] Integrar com `CommunityRolloutService.checkAccess()`
- [ ] Testar com usuários com/sem endereço confirmado

### 2. Adicionar Gate em Todas as Páginas
- [ ] `ComunidadePage.tsx`
- [ ] `GruposPage.tsx`
- [ ] `EventosPage.tsx`
- [ ] `RecomendacoesPage.tsx`
- [ ] `AchadosPerdidosPage.tsx`
- [ ] Páginas de detalhe

### 3. Configurar Rollouts
- [ ] Decidir quais bairros terão comunidade ativa
- [ ] Inserir rollouts no banco
- [ ] Testar herança de Salvador para bairros

### 4. Criar Fluxo de Confirmação de Endereço
- [ ] Página de confirmação de endereço
- [ ] Validação de CEP/endereço
- [ ] Aprovação manual (se necessário)

## Status Atual

✅ `CommunityRolloutGate` criado  
⏳ Verificação de endereço precisa ser implementada  
⏳ Gate precisa ser adicionado nas páginas  
⏳ Rollouts precisam ser configurados quando decidir abrir  

---

**Resumo**: A infraestrutura está pronta. Quando você decidir abrir comunidade para um bairro, basta:
1. Inserir rollout no banco
2. Adicionar gate nas páginas
3. Implementar verificação de endereço
