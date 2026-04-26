# ⚡ Quick Reference - Niche Versioning

Referência rápida para uso diário do sistema de versionamento de nichos.

## 🔍 Verificar Capability

```typescript
// Serviço
const result = await NicheVersioningService.hasCapability(businessId, 'pizza_multi_flavor');
if (result.has_capability) { /* ... */ }

// Hook
const { hasCapability } = useNicheVersioning({ businessId });
if (hasCapability('pizza_multi_flavor')) { /* ... */ }
```

## ➕ Adicionar Capability

```typescript
// Serviço
await NicheVersioningService.addCapability({
  business_id: businessId,
  capability: 'slice_sales',
  upgraded_by: userId,
});

// Hook
const { addCapability } = useNicheVersioning({ businessId });
await addCapability('slice_sales', userId);
```

## 🎯 Controlar Visibilidade de Seção

```typescript
// Component Guard
<AdminSectionGuard
  section="pizza_flavors"
  enabledCapabilities={profile.enabled_capabilities}
  missingCapabilities={profile.missing_capabilities}
  onConfigure={() => router.push('/configure')}
>
  <PizzaFlavorsManager />
</AdminSectionGuard>

// Hook
const { isSectionVisible } = useAdminSections({
  enabledCapabilities: profile.enabled_capabilities
});
if (isSectionVisible('pizza_flavors')) { /* ... */ }
```

## 📢 Mostrar Banner de Upgrade

```typescript
<NicheUpgradeBanner
  profile={profile}
  onUpgrade={() => router.push('/upgrade')}
  onDismiss={() => dismissUpgrade()}
/>
```

## 🔄 Fazer Upgrade Completo

```typescript
// Serviço
await NicheVersioningService.upgradeNiche({
  business_id: businessId,
  to_version: '2.0.0',
  to_operational_mode: 'pizzaria_full',
  add_capabilities: ['slice_sales', 'seasonal_flavors'],
  upgrade_type: 'manual',
  upgraded_by: userId,
});

// Hook
const { upgradeNiche } = useNicheVersioning({ businessId });
await upgradeNiche({
  to_version: '2.0.0',
  to_operational_mode: 'pizzaria_full',
  add_capabilities: ['slice_sales'],
  upgrade_type: 'manual',
});
```

## 📋 Listar Seções Visíveis

```typescript
// Serviço
const sections = AdminSectionVisibilityService.getVisibleSections(
  profile.enabled_capabilities
);

// Hook
const { visibleSections, groupedSections } = useAdminSections({
  enabledCapabilities: profile.enabled_capabilities
});
```

## 🏷️ Marcar Nichos para Upgrade (Admin)

```typescript
await NicheVersioningService.markNeedsUpgrade({
  niche_key: 'pizza',
  missing_capabilities: ['slice_sales', 'seasonal_flavors'],
});
```

## 📊 Obter Histórico

```typescript
// Serviço
const history = await NicheVersioningService.getUpgradeHistory(businessId);

// Hook
const { history } = useNicheVersioning({ businessId });
```

## 🎨 Hook Completo

```typescript
const {
  config,                    // ProfileNicheConfig | null
  profileInfo,               // GastronomyProfileWithNiche | null
  history,                   // NicheUpgradeHistory[]
  loading,                   // boolean
  error,                     // Error | null
  hasCapability,             // (cap: string) => boolean
  hasAllCapabilities,        // (caps: string[]) => boolean
  hasAnyCapability,          // (caps: string[]) => boolean
  needsUpgrade,              // boolean
  missingCount,              // number
  enabledCount,              // number
  addCapability,             // (cap, userId?) => Promise<Result>
  upgradeNiche,              // (params) => Promise<Result>
  reload,                    // () => Promise<void>
} = useNicheVersioning({ businessId });
```

## 🛡️ Capabilities Comuns

### Básicas
- `basic_menu` - Cardápio básico
- `menu_variants` - Variações (tamanhos)
- `menu_addons` - Adicionais
- `menu_combos` - Combos
- `menu_promotions` - Promoções

### Pizza
- `pizza_sizes` - Tamanhos de pizza
- `pizza_flavors` - Sabores de pizza
- `pizza_half_half` - Meio a meio
- `pizza_multi_flavor` - 3 ou 4 sabores
- `pizza_crusts` - Tipos de massa
- `pizza_crust_stuffing` - Recheio de borda
- `pizza_edge_rules` - Regras de preço por borda

### Sushi
- `sushi_piece_count` - Contador de peças
- `sushi_combinado_builder` - Monte seu combinado
- `sushi_sashimi_weight` - Sashimi por peso

### Açaí
- `acai_base_sizes` - Tamanhos de base
- `acai_toppings` - Complementos
- `acai_syrups` - Caldas
- `acai_fruit_selection` - Escolha de frutas

### Delivery
- `delivery` - Delivery com taxas
- `pickup` - Retirada
- `dine_in` - Comer no local
- `scheduled_orders` - Pedidos agendados

## 📝 Seções do Admin

### Básicas
- `basic_menu` - Menu básico
- `variants` - Variações
- `addons` - Adicionais
- `combos` - Combos
- `promotions` - Promoções
- `delivery_areas` - Áreas de entrega
- `operational_hours` - Horários
- `order_management` - Gestão de pedidos
- `analytics` - Analytics

### Pizza
- `pizza_sizes` - Tamanhos de pizza
- `pizza_flavors` - Sabores de pizza
- `pizza_crusts` - Massas e bordas
- `pizza_pricing` - Regras de preço

### Sushi
- `sushi_builder` - Monte seu combinado
- `sushi_pieces` - Controle de peças

### Açaí
- `acai_builder` - Monte seu açaí

## 🔗 Links Úteis

- [Guia Completo](./NICHE_EVOLUTION_GUIDE.md)
- [Exemplos de Uso](./USAGE_EXAMPLES.md)
- [README](./README.md)
- [Tipos](./types.ts)
- [Testes](./__tests__/)

## 💡 Dicas

1. **Sempre verificar capabilities** antes de mostrar funcionalidades
2. **Usar hooks** para simplificar código React
3. **Usar guards** para controlar visibilidade automaticamente
4. **Mostrar banner** quando `needsUpgrade === true`
5. **Registrar upgrades** com `upgraded_by` para auditoria
6. **Usar snapshot** em pedidos para compatibilidade
7. **Agrupar seções** por categoria para melhor UX
8. **Testar** após adicionar novas capabilities

## ⚠️ Avisos

- ❌ **NÃO** decidir UI apenas pelo nome do nicho
- ❌ **NÃO** buscar config atual ao renderizar pedidos antigos
- ❌ **NÃO** tornar capabilities obrigatórias automaticamente
- ❌ **NÃO** quebrar empresas existentes ao adicionar funcionalidades
- ✅ **SEMPRE** usar capabilities para controlar visibilidade
- ✅ **SEMPRE** usar snapshot em pedidos
- ✅ **SEMPRE** marcar empresas antigas quando adicionar capability
