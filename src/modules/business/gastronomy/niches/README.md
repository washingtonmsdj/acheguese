# 🍽️ Gastronomy Niches Module

Módulo de nichos gastronômicos - especializações internas do módulo Gastronomia.

## Visão Geral

Este módulo permite que o sistema suporte diferentes tipos de estabelecimentos gastronômicos com necessidades específicas, mantendo a arquitetura SSOT (Single Source of Truth) e evitando duplicação de código.

### Arquitetura

```
modules/business/gastronomy/niches/
├── types.ts                    # Tipos canônicos
├── registry.ts                 # Registro de nichos (SSOT)
├── index.ts                    # Exportações públicas
├── README.md                   # Esta documentação
├── presets/                    # Configurações por nicho
│   ├── base.ts                 # Preset base
│   ├── pizza.ts                # 🍕 Pizza (preparado)
│   ├── sushi.ts                # 🍣 Sushi (preparado)
│   ├── acai.ts                 # 🫐 Açaí (preparado)
│   ├── pastel.ts               # 🥟 Pastel (preparado)
│   ├── churrascaria.ts         # 🥩 Churrascaria (preparado)
│   ├── lanches.ts              # 🥪 Lanches (ativo)
│   ├── hamburguer.ts           # 🍔 Hamburguer (ativo)
│   ├── brasileira.ts           # 🍛 Brasileira (ativo)
│   ├── arabe.ts                # 🥙 Árabe (ativo)
│   ├── saudavel.ts             # 🥗 Saudável (ativo)
│   ├── salgados.ts             # 🥐 Salgados (ativo)
│   ├── padaria.ts              # 🥖 Padaria (ativo)
│   ├── doces.ts                # 🧁 Doces (ativo)
│   └── cafes.ts                # ☕ Cafés (ativo)
├── services/
│   └── NicheConfigService.ts   # Serviço de configuração
├── hooks/
│   └── useGastronomyNiche.ts   # Hook React
└── components/
    ├── NicheSelector.tsx       # Seletor de nicho
    └── NicheCapabilitiesList.tsx # Lista de capacidades
```

## Status dos Nichos

### ✅ Nichos Completos (full_enabled)

| Nicho | Status | Capacidades |
|-------|--------|-------------|
| 🍕 Pizzaria | ✅ Full | Múltiplos sabores (1-4), meio a meio, bordas, massas, regras de preço |

### ✅ Liberados (basic_enabled)

| Nicho | Status | Capacidades |
|-------|--------|-------------|
| Lanches | ✅ Public | Cardápio padrão + variações + adicionais |
| Brasileira | ✅ Public | Cardápio padrão + reservas |
| Árabe | ✅ Public | Cardápio padrão + reservas |
| Saudável | ✅ Public | Cardápio padrão + info nutricional |
| Salgados | ✅ Public | Cardápio padrão |
| Padaria | ✅ Public | Cardápio padrão + reservas |
| Doces | ✅ Public | Cardápio padrão |
| Cafés | ✅ Public | Cardápio padrão + reservas |
| Hamburguer | ✅ Public | Cardápio padrão + reservas + customização |

### 🔧 Em Desenvolvimento (beta_enabled)

| Nicho | Status | Funcionalidades Futuras |
|-------|--------|-------------------------|
| 🍣 Sushi | 🔒 Beta | Contador de peças, monte seu combinado |
| 🫐 Açaí | 🔒 Beta | Monte seu açaí, caldas, complementos |
| 🥟 Pastel | 🔒 Beta | Meio a meio de sabores |
| 🥩 Churrascaria | 🔒 Beta | Preço por peso (kg) |
| 🍺 Bares | 🔒 Beta | Gestão de chopps, torneiras |

## Uso

### Selecionar Nicho (Admin)

```tsx
import { NicheSelector, NicheConfigService } from '@/modules/business/gastronomy/niches';

function GastronomySetupPage() {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);

  return (
    <NicheSelector
      selectedNiche={selectedNiche}
      onSelect={setSelectedNiche}
      showBeta={true} // Mostrar nichos em beta para admin
    />
  );
}
```

### Hook useGastronomyNiche

```tsx
import { useGastronomyNiche } from '@/modules/business/gastronomy/niches';

function MenuEditor({ nicheKey }: { nicheKey: string }) {
  const {
    config,
    hasCapability,
    shouldShowSection,
    validateItem,
  } = useGastronomyNiche({ nicheKey });

  // Verificar se o nicho suporta meio a meio
  const supportsHalfHalf = hasCapability('pizza_half_half');

  // Verificar se deve mostrar seção específica
  const showPizzaBuilder = shouldShowSection('pizza_flavors');

  // Validar item
  const validation = validateItem({ name: 'Pizza', price: 50 });

  return (
    <div>
      <h1>{config.publicLabel}</h1>
      {supportsHalfHalf && <HalfHalfSelector />}
    </div>
  );
}
```

### Serviço NicheConfigService

```typescript
import { NicheConfigService } from '@/modules/business/gastronomy/niches';

// Listar nichos disponíveis
const publicNiches = NicheConfigService.getPublic();
const selectableNiches = NicheConfigService.getSelectable();

// Obter config
const config = NicheConfigService.getConfig('pizza');

// Verificar capacidades
if (NicheConfigService.hasCapability('pizza', 'pizza_half_half')) {
  // Mostrar opção de meio a meio
}

// Validar item
const result = NicheConfigService.validateForNiche('pizza', {
  name: 'Pizza Calabresa',
  base_price: 45,
});

if (!result.isValid) {
  console.error(result.errors);
}
```

## Criar Novo Nicho

Para adicionar um novo nicho ao sistema:

1. Criar arquivo em `presets/{niche}.ts`

```typescript
import { createNichePreset } from './base';
import type { GastronomyNicheConfig } from '../types';

export const myNicheConfig: GastronomyNicheConfig = createNichePreset({
  nicheKey: 'my_niche',
  publicLabel: 'Meu Nicho',
  description: 'Descrição do nicho',
  operationalType: 'fast_food', // ou 'complex', 'restaurant', etc
  supportLevel: 'basic_enabled', // ou 'full_enabled', 'beta_enabled'
  isSelectable: true,
  isPublic: true,
  enabledCapabilities: ['basic_menu', 'menu_variants', 'delivery'],
  missingCapabilities: [], // Capacidades futuras
  adminSections: ['basic_menu', 'variants', 'delivery_areas'],
  // ... resto da config
});
```

2. Registrar em `registry.ts`:

```typescript
import { myNicheConfig } from './presets/my_niche';

export const GASTRONOMY_NICHE_REGISTRY: NicheRegistry = {
  // ... outros nichos
  [myNicheConfig.nicheKey]: myNicheConfig,
};
```

## Conceitos

### Nicho vs Categoria

- **Categoria**: Classificação ampla ("Comida Brasileira")
- **Nicho**: Especialização operacional com regras específicas

Um restaurante brasileiro pode usar o nicho `brasileira` (básico), enquanto uma pizzaria usará `pizza` (complexo) com regras específicas de meio a meio.

### Status de Nicho

| Status | Significado | Visível? |
|--------|-------------|----------|
| `full_enabled` | Nicho completo, todas as funcionalidades | ✅ Sim |
| `basic_enabled` | Funciona com cardápio básico | ✅ Sim |
| `beta_enabled` | Em desenvolvimento, apenas admin | 🔒 Apenas admin |
| `hidden` | Oculto temporariamente | ❌ Não |
| `coming_soon` | Será lançado em breve | ⚠️ Em breve |

### Capacidades

Cada nicho define quais capacidades possui:

- **Cardápio básico**: categorias, itens, variações, adicionais
- **Operacionais**: delivery, pickup, dine_in, reservas
- **Específicas de nicho**: pizza_half_half, sushi_piece_count, etc

## Compatibilidade

Este módulo é **100% compatível** com:

- Cardápios existentes
- Pedidos existentes
- Checkout
- Delivery
- Carrinho
- Perfil gastronômico atual

A integração com `cuisine_type` legado é feita via `mapCuisineToNiche()`.

## Roadmap

### Fase 1 (Atual) ✅
- [x] Estrutura base de nichos
- [x] Nichos básicos liberados
- [x] Nichos complexos preparados
- [x] UI de seleção

### Fase 2 (Concluída) ✅
- [x] Implementar nicho Pizza completo
- [x] Tabelas específicas (pizza_sizes, pizza_flavors, etc)
- [x] Componentes de UI específicos
- [x] Regras de preço complexas

### Fase 3 (Futuro)
- [ ] Implementar Sushi
- [ ] Implementar Açaí
- [ ] Implementar Pastel
- [ ] Implementar Churrascaria

## SSOT (Single Source of Truth)

O registro central em `registry.ts` é a **única fonte de verdade** para:

- Lista de nichos disponíveis
- Status de cada nicho
- Capacidades habilitadas
- Configurações padrão
- Regras de validação

**Nunca** hardcode nomes de nichos ou verificações de status em componentes. Use sempre:

```typescript
// ❌ Errado
if (niche === 'pizza') { ... }

// ✅ Correto
if (NicheConfigService.isComplex('pizza')) { ... }
```
