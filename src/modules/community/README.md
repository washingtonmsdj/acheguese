# Community Module

Módulo de comunidade integrado com a fundação geográfica.

## 🌍 Integração com Fundação Geográfica

### ETAPA 6 - PRIMEIRA INTEGRAÇÃO CONCLUÍDA

O módulo community foi integrado com a fundação geográfica, implementando:

#### ✅ Contexto Geográfico Ativo
- Community lê a localização ativa do usuário via `LocationContextStore`
- Comportamento padrão definido quando não há localização ativa
- Não hardcoda Salvador no módulo

#### ✅ Filtro de Conteúdo por Location
- Posts/community items filtrados pela localização ativa
- Suporte a escopo por district/city conforme contrato
- Integração com `PostService.getFeed()` usando parâmetros geográficos

#### ✅ Validação de Criação de Conteúdo
- Criação de post/community item exige location_id válido
- Location deve estar ativa
- Validação via `LocationService.validateLocation()`

#### ✅ Rollout do Módulo Community
- Consulta `RolloutService` antes de exibir funcionalidades
- Respeita rollout local, herdado e default false
- Location inativa bloqueia acesso

#### ✅ Remoção de Lógica Geográfica Local
- Módulo não mantém helpers próprios de bairro/cidade/path
- Toda lógica geográfica vem da fundação

#### ✅ Testes de Integração Mock-First
- Cobertura completa dos cenários especificados
- Testes unitários e de integração
- Mock repositories para desenvolvimento

## 📁 Estrutura

```
community/
├── services/
│   ├── CommunityLocationService.ts    # Integração com fundação geográfica
│   ├── CommunityRolloutService.ts     # Integração com sistema de rollout
│   └── index.ts
├── hooks/
│   ├── useCommunityLocation.ts        # Hook para contexto geográfico
│   ├── useCommunityRollout.ts         # Hook para rollout
│   └── ...outros hooks
├── components/
│   ├── GeographicStatusIndicator.tsx  # Indicador de status geográfico
│   └── ...outros componentes
├── pages/
│   └── ComunidadePage.tsx            # Página principal integrada
└── __tests__/
    ├── integration/                   # Testes de integração
    └── ...outros testes
```

## 🔧 Serviços

### CommunityLocationService

Integra o módulo community com a fundação geográfica:

```typescript
import { communityLocationService } from '@/modules/community/services';

// Obter localização ativa
const location = communityLocationService.getActiveLocation();

// Verificar se há localização ativa
const hasLocation = communityLocationService.hasActiveLocation();

// Obter parâmetros de filtro
const filterParams = communityLocationService.getFilterParams();

// Validar location_id
const isValid = await communityLocationService.validateLocationId('loc-id');
```

### CommunityRolloutService

Integra com o sistema de rollout:

```typescript
import { communityRolloutService } from '@/modules/community/services';

// Verificar se community está ativo
const isActive = await communityRolloutService.isCommunityActive();

// Obter rollout efetivo
const rollout = await communityRolloutService.getCommunityRollout();

// Verificar acesso
const access = await communityRolloutService.checkAccess();
```

## 🎣 Hooks

### useCommunityLocation

Hook para integração com fundação geográfica:

```typescript
import { useCommunityLocation } from '@/modules/community/hooks';

function MyComponent() {
  const {
    activeLocation,
    hasActiveLocation,
    canCreateContent,
    filterScope,
    getFilterParams,
    validateLocationId
  } = useCommunityLocation();

  // Usar localização ativa
  if (hasActiveLocation) {
    const params = getFilterParams();
    // Filtrar conteúdo por localização
  }
}
```

### useCommunityRollout

Hook para integração com sistema de rollout:

```typescript
import { useCommunityRollout } from '@/modules/community/hooks';

function MyComponent() {
  const {
    isActive,
    isBlocked,
    canUseFeatures,
    rolloutSource,
    isInherited,
    blockReason
  } = useCommunityRollout();

  if (isBlocked) {
    return <div>Community não disponível: {blockReason}</div>;
  }

  // Renderizar funcionalidades do community
}
```

## 🧪 Cenários de Teste

### ✅ Community com Location Ativa Válida
- Localização ativa no contexto
- Rollout ativo (local, herdado ou default)
- Acesso completo às funcionalidades

### ✅ Community com Location Inativa
- Sem localização no contexto
- Bloqueio de funcionalidades
- Mensagem clara ao usuário

### ✅ Community com Rollout Local Ativo
- Rollout explícito na localização
- Source: LOCAL
- Funcionalidades ativas

### ✅ Community com Rollout Herdado
- Rollout herdado do parent
- Source: INHERITED
- inherited_from preenchido

### ✅ Community com Rollout Default False
- Sem rollout explícito ou herdado
- Source: DEFAULT, status: INACTIVE
- Funcionalidades bloqueadas

### ✅ Criação de Conteúdo com Location_ID Inválido
- Validação de location_id
- Rejeição de IDs inválidos
- Feedback ao usuário

### ✅ Filtro de Conteúdo por Localização
- Filtros por city/district
- Parâmetros corretos para queries
- Escopo baseado no tipo de localização

## 🎨 Componentes

### GeographicStatusIndicator

Indicador visual do status da integração geográfica:

```typescript
import { GeographicStatusIndicator } from '@/modules/community/components';

// Modo compacto
<GeographicStatusIndicator />

// Modo detalhado (debug)
<GeographicStatusIndicator showDetails />
```

## 🔄 Fluxo de Integração

1. **Inicialização**: Hooks carregam estado da fundação geográfica
2. **Verificação de Localização**: `useCommunityLocation` verifica contexto ativo
3. **Verificação de Rollout**: `useCommunityRollout` consulta disponibilidade
4. **Renderização Condicional**: Componentes mostram/bloqueiam baseado no status
5. **Filtros de Conteúdo**: Feed usa parâmetros geográficos da fundação
6. **Validação de Criação**: Formulários validam location_id antes de submeter

## 📊 Comportamentos Definidos

### Sem Localização Ativa
- **Filtro**: Nenhum conteúdo mostrado
- **Criação**: Bloqueada com mensagem clara
- **Mensagem**: "Selecione uma localização para ver o conteúdo da comunidade"

### Rollout Inativo
- **Acesso**: Bloqueado completamente
- **Mensagem**: "Community não está disponível nesta localização"
- **Fallback**: Página de bloqueio com explicação

### Rollout Herdado
- **Funcionamento**: Normal, como se fosse local
- **Indicação**: Badge mostra "herdado"
- **Source**: INHERITED com inherited_from

## 🚀 Próximas Etapas

### Pendências para Integração Futura
- [ ] Integração com módulo business
- [ ] Integração com módulo services  
- [ ] Integração com módulo mobility
- [ ] Integração com módulo classifieds
- [ ] Integração com módulo ads
- [ ] Conexão com Supabase (substituir mocks)
- [ ] Implementação de listeners para mudanças de contexto
- [ ] Cache inteligente baseado em localização
- [ ] Analytics de uso por localização

### Melhorias Técnicas
- [ ] Otimização de queries por localização
- [ ] Implementação de prefetch baseado em localização
- [ ] Sistema de notificações geográficas
- [ ] Métricas de performance por região

## 🔍 Debug

Para debug da integração geográfica:

```typescript
// Adicionar indicador de status
<GeographicStatusIndicator showDetails />

// Logs no console (dev mode)
console.log('Location:', communityLocationService.getActiveLocation());
console.log('Rollout:', await communityRolloutService.getCommunityRollout());
```

## 📚 Documentação Relacionada

- [Geographic Foundation](../../docs/GEOGRAPHIC_FOUNDATION.md)
- [Geographic Foundation Stage 2](../../docs/GEOGRAPHIC_FOUNDATION_STAGE2_CONTRACTS.md)
- [Rollout System](../../core/rollout/README.md)
- [Location System](../../core/location/README.md)