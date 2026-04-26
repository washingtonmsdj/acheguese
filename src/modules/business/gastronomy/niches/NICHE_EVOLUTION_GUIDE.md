# 🔄 Guia de Evolução de Nichos Gastronômicos

## Visão Geral

Este sistema garante que nichos gastronômicos possam evoluir sem quebrar empresas, cardápios, pedidos ou checkout existentes.

## Princípios Fundamentais

### 1. Versionamento de Nichos

Cada empresa gastronômica possui:

- **primary_niche_key**: Chave do nicho (pizza, sushi, hamburguer, etc)
- **niche_config_version**: Versão da configuração (semver: 1.0.0, 1.1.0, 2.0.0)
- **support_level**: Nível de suporte (full_enabled, basic_enabled, beta_enabled)
- **operational_mode**: Modo operacional (basic_menu, pizzaria_full, etc)
- **enabled_capabilities**: Array de funcionalidades habilitadas
- **missing_capabilities**: Array de funcionalidades disponíveis mas não configuradas
- **needs_niche_upgrade**: Flag indicando se há upgrade disponível
- **last_niche_upgrade_at**: Data do último upgrade

### 2. Nenhuma Ferramenta Nova é Obrigatória

Quando uma nova funcionalidade é adicionada a um nicho:

- Empresas antigas **não quebram**
- A nova capability é marcada como **disponível**
- Empresa pode **optar por configurar** quando quiser
- Sistema marca `needs_niche_upgrade = true`

### 3. Admin Baseado em Capabilities

O admin **não** decide telas pelo nome do nicho.  
O admin decide pelas **capabilities habilitadas**.

```typescript
// ❌ ERRADO
if (niche === "pizza") {
  mostrarTudo();
}

// ✅ CORRETO
if (hasCapability("multi_flavor_pizza")) {
  mostrarSaboresMultiplos();
}

if (hasCapability("slice_sales")) {
  mostrarVendaPorFatia();
}
```

### 4. Pedidos Usam Snapshot

Pedidos antigos **nunca** dependem da configuração atual do nicho.

Cada pedido salva:
- Nome do item no momento da compra
- Preço no momento da compra
- Variações selecionadas
- Adicionais selecionados
- Composição (sabores, peças, etc)
- Regra de preço usada

## Como Usar

### Verificar Capabilities

```typescript
import { NicheVersioningService } from '@/modules/business/gastronomy/niches/versioning';

// Verificar uma capability
const result = await NicheVersioningService.hasCapability(
  businessId,
  'pizza_multi_flavor'
);

if (result.has_capability) {
  // Mostrar opção de múltiplos sabores
}

// Verificar múltiplas capabilities
const multiResult = await NicheVersioningService.hasCapabilities(
  businessId,
  ['pizza_sizes', 'pizza_flavors', 'pizza_crusts']
);

if (multiResult.all_enabled) {
  // Todas habilitadas
}
```

### Adicionar Capability

```typescript
// Adicionar uma capability
const result = await NicheVersioningService.addCapability({
  business_id: businessId,
  capability: 'slice_sales',
  upgraded_by: userId, // Opcional
});

if (result.success) {
  console.log('Capability adicionada!');
}

// Adicionar múltiplas
const results = await NicheVersioningService.addCapabilities(
  businessId,
  ['slice_sales', 'seasonal_flavors', 'loyalty_program'],
  userId
);
```

### Verificar Visibilidade de Seções do Admin

```typescript
import { AdminSectionVisibilityService } from '@/modules/business/gastronomy/niches/versioning';

// Obter configuração do perfil
const profile = await NicheVersioningService.getProfileNicheConfig(businessId);

// Verificar se seção é visível
const isVisible = AdminSectionVisibilityService.isSectionVisible(
  'pizza_flavors',
  profile.enabled_capabilities
);

// Obter todas as seções visíveis
const visibleSections = AdminSectionVisibilityService.getVisibleSections(
  profile.enabled_capabilities
);

// Obter seções que podem ser configuradas
const configurableSections = AdminSectionVisibilityService.getConfigurableSections(
  profile.enabled_capabilities,
  profile.missing_capabilities
);
```

### Realizar Upgrade de Nicho

```typescript
const result = await NicheVersioningService.upgradeNiche({
  business_id: businessId,
  to_version: '2.0.0',
  to_operational_mode: 'pizzaria_full',
  add_capabilities: ['slice_sales', 'seasonal_flavors'],
  upgrade_type: 'manual',
  upgraded_by: userId,
  notes: 'Upgrade para suportar venda por fatia',
});

if (result.success) {
  console.log(`Upgrade de ${result.from_version} para ${result.to_version}`);
  console.log(`Capabilities adicionadas:`, result.added_capabilities);
}
```

### Marcar Nichos para Upgrade

Quando uma nova funcionalidade é lançada para um nicho:

```typescript
// Marcar todas as pizzarias que não têm a nova capability
const result = await NicheVersioningService.markNeedsUpgrade({
  niche_key: 'pizza',
  missing_capabilities: ['slice_sales', 'seasonal_flavors'],
});

console.log(`${result.updated_count} pizzarias marcadas para upgrade`);
```

### Listar Perfis que Precisam de Upgrade

```typescript
// Todos os nichos
const profiles = await NicheVersioningService.listProfilesNeedingUpgrade();

// Apenas pizzarias
const pizzarias = await NicheVersioningService.listProfilesNeedingUpgrade('pizza');

for (const profile of pizzarias) {
  console.log(`${profile.business_id} precisa de upgrade`);
  console.log(`Capabilities faltando:`, profile.missing_capabilities);
}
```

## Exemplos de Evolução

### Exemplo 1: Adicionar Venda por Fatia em Pizzarias

```typescript
// 1. Adicionar capability ao preset (código)
// Em src/modules/business/gastronomy/niches/presets/pizza.ts
const pizzaCapabilities = [
  // ... capabilities existentes
  'slice_sales', // NOVA
];

// 2. Marcar pizzarias antigas como precisando upgrade
await NicheVersioningService.markNeedsUpgrade({
  niche_key: 'pizza',
  missing_capabilities: ['slice_sales'],
});

// 3. Pizzaria decide configurar
await NicheVersioningService.addCapability({
  business_id: pizzariaId,
  capability: 'slice_sales',
  upgraded_by: ownerId,
});

// 4. Admin agora mostra seção de venda por fatia
const canShowSliceSales = await NicheVersioningService.hasCapability(
  pizzariaId,
  'slice_sales'
);
```

### Exemplo 2: Evoluir Sushi de Básico para Completo

```typescript
// 1. Sushi cadastrado em modo básico
const sushiProfile = {
  primary_niche_key: 'sushi',
  support_level: 'basic_enabled',
  operational_mode: 'basic_menu',
  enabled_capabilities: ['basic_menu', 'menu_variants', 'menu_addons'],
  missing_capabilities: ['sushi_piece_count', 'sushi_combinado_builder'],
};

// 2. Implementar funcionalidades de sushi
// ... criar tabelas, componentes, etc

// 3. Oferecer upgrade
await NicheVersioningService.upgradeNiche({
  business_id: sushiBusinessId,
  to_version: '2.0.0',
  to_operational_mode: 'sushi_full',
  add_capabilities: ['sushi_piece_count', 'sushi_combinado_builder'],
  upgrade_type: 'manual',
  upgraded_by: ownerId,
  notes: 'Upgrade para sushi completo com contador de peças',
});

// 4. Admin agora mostra seções específicas de sushi
const visibleSections = AdminSectionVisibilityService.getVisibleSections(
  ['basic_menu', 'sushi_piece_count', 'sushi_combinado_builder']
);
// Retorna: ['basic_menu', 'sushi_pieces', 'sushi_builder']
```

### Exemplo 3: Cadastrar Novo Nicho em Modo Básico

```typescript
// 1. Criar preset do nicho
// Em src/modules/business/gastronomy/niches/presets/acai.ts
export const acaiNicheConfig: GastronomyNicheConfig = {
  nicheKey: 'acai',
  supportLevel: 'basic_enabled', // Começa básico
  enabledCapabilities: [
    'basic_menu',
    'menu_variants',
    'menu_addons',
    'delivery',
    'pickup',
  ],
  missingCapabilities: [
    'acai_base_sizes',
    'acai_toppings',
    'acai_syrups',
    'acai_fruit_selection',
  ],
  // ...
};

// 2. Empresa cadastra açaí
// Funciona com cardápio básico imediatamente

// 3. Futuramente, implementar funcionalidades específicas
// 4. Oferecer upgrade para empresas existentes
```

## Fluxo de Upgrade no Admin

### 1. Detectar Necessidade de Upgrade

```typescript
const profile = await NicheVersioningService.getProfileWithNicheInfo(businessId);

if (profile.needs_niche_upgrade || profile.missing_capabilities.length > 0) {
  // Mostrar banner de upgrade
  showUpgradeBanner({
    currentVersion: profile.niche_config_version,
    missingCapabilities: profile.missing_capabilities,
  });
}
```

### 2. Mostrar Seções Configuráveis

```typescript
const configurableSections = AdminSectionVisibilityService.getConfigurableSections(
  profile.enabled_capabilities,
  profile.missing_capabilities
);

for (const section of configurableSections) {
  const message = AdminSectionVisibilityService.getUpgradeMessageForSection(
    section,
    profile.missing_capabilities
  );
  
  showConfigurableSection({
    section,
    message,
    onConfigure: () => startSectionConfiguration(section),
  });
}
```

### 3. Configurar Nova Funcionalidade

```typescript
async function configurePizzaSliceSales(businessId: string) {
  // 1. Mostrar wizard de configuração
  const config = await showSliceSalesWizard();
  
  // 2. Salvar configuração
  await saveSliceSalesConfig(businessId, config);
  
  // 3. Adicionar capability
  await NicheVersioningService.addCapability({
    business_id: businessId,
    capability: 'slice_sales',
  });
  
  // 4. Atualizar UI
  refreshAdminSections();
}
```

## Compatibilidade com Pedidos Antigos

### Snapshot de Pedido

Cada pedido salva um snapshot completo:

```typescript
interface PizzaOrderItemSnapshot {
  item_id: string;
  item_name: string;
  niche_key: "pizza";
  size: {
    size_id: string;
    name: string;
    base_price: number;
    // ...
  };
  flavors: Array<{
    flavor_id: string;
    name: string;
    fraction: number;
    unit_price_at_purchase: number;
  }>;
  price_rule: PizzaPriceRuleType;
  edge: { /* ... */ } | null;
  dough: { /* ... */ } | null;
  addons: CartItemAddon[];
  quantity: number;
  unit_price: number;
  line_total: number;
}
```

### Renderizar Pedido Antigo

```typescript
function renderOrderItem(snapshot: PizzaOrderItemSnapshot) {
  // Usa APENAS dados do snapshot
  // Não busca configuração atual do nicho
  
  return (
    <div>
      <h3>{snapshot.item_name}</h3>
      <p>Tamanho: {snapshot.size.name}</p>
      <p>Sabores:</p>
      <ul>
        {snapshot.flavors.map(flavor => (
          <li key={flavor.flavor_id}>
            {flavor.name} ({flavor.fraction * 100}%)
          </li>
        ))}
      </ul>
      {snapshot.edge && <p>Borda: {snapshot.edge.name}</p>}
      <p>Total: R$ {snapshot.line_total.toFixed(2)}</p>
    </div>
  );
}
```

## Checklist de Implementação de Novo Nicho

### Fase 1: Modo Básico (Imediato)

- [ ] Criar preset em `presets/[nicho].ts`
- [ ] Definir `supportLevel: 'basic_enabled'`
- [ ] Definir `enabledCapabilities` básicas
- [ ] Listar `missingCapabilities` futuras
- [ ] Registrar em `registry.ts`
- [ ] Testar cadastro com cardápio básico

### Fase 2: Funcionalidades Específicas (Futuro)

- [ ] Criar tabelas específicas no banco
- [ ] Criar tipos TypeScript
- [ ] Criar serviços de pricing/validation
- [ ] Criar componentes de UI
- [ ] Adicionar capabilities ao preset
- [ ] Atualizar `supportLevel` para `full_enabled`

### Fase 3: Upgrade de Empresas Existentes

- [ ] Marcar empresas antigas com `markNeedsUpgrade`
- [ ] Criar wizard de configuração
- [ ] Implementar fluxo de upgrade no admin
- [ ] Testar compatibilidade com pedidos antigos
- [ ] Documentar processo de upgrade

## Boas Práticas

### ✅ Fazer

- Sempre verificar capabilities antes de mostrar funcionalidades
- Usar snapshot em pedidos
- Marcar empresas antigas quando adicionar nova capability
- Documentar cada nova capability
- Testar compatibilidade retroativa

### ❌ Não Fazer

- Tornar novas capabilities obrigatórias automaticamente
- Decidir UI apenas pelo nome do nicho
- Buscar configuração atual ao renderizar pedidos antigos
- Quebrar empresas existentes ao adicionar funcionalidades
- Usar metadata solto para regras essenciais

## Suporte

Para dúvidas ou problemas:

1. Verificar este guia
2. Consultar `types.ts` para tipos disponíveis
3. Ver exemplos em `__tests__/`
4. Abrir issue no repositório
