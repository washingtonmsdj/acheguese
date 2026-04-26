# 🔄 Niche Versioning System

Sistema de versionamento e evolução de nichos gastronômicos que garante compatibilidade retroativa e permite adicionar funcionalidades sem quebrar registros existentes.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Uso Rápido](#uso-rápido)
- [API Reference](#api-reference)
- [Exemplos](#exemplos)
- [Testes](#testes)

## Visão Geral

### Problema

Quando um nicho gastronômico evolui e ganha novas funcionalidades:
- Empresas antigas podem quebrar
- Pedidos antigos podem ficar ilegíveis
- Novas funcionalidades se tornam obrigatórias
- Admin mostra telas que não funcionam

### Solução

Sistema de versionamento que:
- ✅ Permite cadastrar nichos em modo básico
- ✅ Evolui nichos sem quebrar registros antigos
- ✅ Torna novas funcionalidades opcionais
- ✅ Admin decide por capabilities, não por nome
- ✅ Pedidos usam snapshot para compatibilidade

## Arquitetura

### Banco de Dados

```sql
-- Campos em gastronomy_profiles
primary_niche_key          TEXT      -- Chave do nicho
niche_config_version       TEXT      -- Versão (semver)
support_level              TEXT      -- Nível de suporte
operational_mode           TEXT      -- Modo operacional
enabled_capabilities       JSONB     -- Capabilities ativas
missing_capabilities       JSONB     -- Capabilities disponíveis
needs_niche_upgrade        BOOLEAN   -- Flag de upgrade
last_niche_upgrade_at      TIMESTAMP -- Data do último upgrade

-- Tabela de histórico
gastronomy_niche_upgrade_history
  - from_version / to_version
  - added_capabilities
  - from_operational_mode / to_operational_mode
  - upgrade_type (automatic, manual, admin)
  - notes, upgraded_by, upgraded_at
```

### TypeScript

```
versioning/
├── types.ts                          # Tipos
├── NicheVersioningService.ts         # Serviço principal
├── AdminSectionVisibilityService.ts  # Controle de visibilidade
├── components/                       # Componentes React
│   ├── NicheUpgradeBanner.tsx
│   └── AdminSectionGuard.tsx
├── hooks/                            # Hooks React
│   ├── useNicheVersioning.ts
│   └── useAdminSections.ts
└── __tests__/                        # Testes
```

## Instalação

### 1. Aplicar Migration

```bash
# A migration será aplicada automaticamente no próximo deploy
# Ou manualmente:
npx supabase db push
```

### 2. Importar Módulo

```typescript
import {
  NicheVersioningService,
  AdminSectionVisibilityService,
  useNicheVersioning,
  useAdminSections,
  NicheUpgradeBanner,
  AdminSectionGuard,
} from '@/modules/business/gastronomy/niches/versioning';
```

## Uso Rápido

### Verificar Capability

```typescript
const result = await NicheVersioningService.hasCapability(
  businessId,
  'pizza_multi_flavor'
);

if (result.has_capability) {
  // Mostrar funcionalidade
}
```

### Usar Hook

```typescript
function AdminDashboard({ businessId }) {
  const { hasCapability, needsUpgrade } = useNicheVersioning({ businessId });

  return (
    <div>
      {needsUpgrade && <UpgradeBanner />}
      {hasCapability('pizza_multi_flavor') && <MultiFlavorSection />}
    </div>
  );
}
```

### Controlar Visibilidade de Seção

```typescript
<AdminSectionGuard
  section="pizza_flavors"
  enabledCapabilities={profile.enabled_capabilities}
  missingCapabilities={profile.missing_capabilities}
  onConfigure={() => router.push('/configure-flavors')}
>
  <PizzaFlavorsManager />
</AdminSectionGuard>
```

## API Reference

### NicheVersioningService

#### `hasCapability(business_id, capability)`
Verifica se um perfil tem uma capability específica.

```typescript
const result = await NicheVersioningService.hasCapability(
  'business-123',
  'pizza_multi_flavor'
);
// { has_capability: true, capability: 'pizza_multi_flavor', business_id: 'business-123' }
```

#### `hasCapabilities(business_id, capabilities[])`
Verifica múltiplas capabilities de uma vez.

```typescript
const result = await NicheVersioningService.hasCapabilities(
  'business-123',
  ['pizza_sizes', 'pizza_flavors', 'pizza_crusts']
);
// { all_enabled: true, any_enabled: true, enabled_count: 3, ... }
```

#### `addCapability({ business_id, capability, upgraded_by? })`
Adiciona uma capability a um perfil.

```typescript
const result = await NicheVersioningService.addCapability({
  business_id: 'business-123',
  capability: 'slice_sales',
  upgraded_by: 'user-456',
});
// { success: true, already_exists: false }
```

#### `upgradeNiche({ business_id, to_version, to_operational_mode, add_capabilities, ... })`
Realiza upgrade completo de um nicho.

```typescript
const result = await NicheVersioningService.upgradeNiche({
  business_id: 'business-123',
  to_version: '2.0.0',
  to_operational_mode: 'pizzaria_full',
  add_capabilities: ['slice_sales', 'seasonal_flavors'],
  upgrade_type: 'manual',
  upgraded_by: 'user-456',
});
// { success: true, from_version: '1.0.0', to_version: '2.0.0', ... }
```

### AdminSectionVisibilityService

#### `isSectionVisible(section, enabledCapabilities)`
Verifica se uma seção deve ser visível.

```typescript
const isVisible = AdminSectionVisibilityService.isSectionVisible(
  'pizza_flavors',
  ['basic_menu', 'pizza_sizes', 'pizza_flavors']
);
// true
```

#### `getVisibleSections(enabledCapabilities)`
Obtém todas as seções visíveis.

```typescript
const sections = AdminSectionVisibilityService.getVisibleSections(
  ['basic_menu', 'menu_variants', 'pizza_sizes']
);
// ['basic_menu', 'variants', 'pizza_sizes']
```

#### `groupSectionsByCategory(sections)`
Agrupa seções por categoria.

```typescript
const grouped = AdminSectionVisibilityService.groupSectionsByCategory(sections);
// { basic: ['basic_menu', 'variants'], pizza: ['pizza_sizes', 'pizza_flavors'] }
```

### Hooks

#### `useNicheVersioning({ businessId })`
Hook para gerenciar versionamento.

```typescript
const {
  config,                    // Configuração do nicho
  loading,                   // Estado de carregamento
  hasCapability,             // Função para verificar capability
  needsUpgrade,              // Se precisa de upgrade
  addCapability,             // Função para adicionar capability
  upgradeNiche,              // Função para fazer upgrade
} = useNicheVersioning({ businessId });
```

#### `useAdminSections({ enabledCapabilities, missingCapabilities? })`
Hook para gerenciar seções do admin.

```typescript
const {
  visibleSections,           // Seções visíveis
  configurableSections,      // Seções configuráveis
  groupedSections,           // Seções agrupadas
  isSectionVisible,          // Função para verificar visibilidade
} = useAdminSections({
  enabledCapabilities: profile.enabled_capabilities,
  missingCapabilities: profile.missing_capabilities,
});
```

## Exemplos

Ver arquivos:
- `USAGE_EXAMPLES.md` - Exemplos práticos de uso
- `examples/AdminDashboardExample.tsx` - Exemplo completo de dashboard
- `NICHE_EVOLUTION_GUIDE.md` - Guia completo de evolução

## Testes

### Executar Testes Unitários

```bash
npm test src/modules/business/gastronomy/niches/versioning
```

### Testar Migration

```bash
npx tsx scripts/test-niche-versioning-migration.ts
```

### Cobertura

```bash
npm run test:coverage
```

## Fluxo de Trabalho

### 1. Adicionar Nova Funcionalidade

```typescript
// 1. Adicionar capability ao preset
const pizzaCapabilities = [
  // ... existentes
  'slice_sales', // NOVA
];

// 2. Marcar empresas antigas
await NicheVersioningService.markNeedsUpgrade({
  niche_key: 'pizza',
  missing_capabilities: ['slice_sales'],
});

// 3. Implementar funcionalidade (tabelas, componentes, etc)

// 4. Criar fluxo de configuração no admin

// 5. Quando empresa configurar
await NicheVersioningService.addCapability({
  business_id: pizzariaId,
  capability: 'slice_sales',
});
```

### 2. Cadastrar Novo Nicho

```typescript
// 1. Criar preset em modo básico
export const acaiNicheConfig: GastronomyNicheConfig = {
  nicheKey: 'acai',
  supportLevel: 'basic_enabled',
  enabledCapabilities: ['basic_menu', 'menu_variants'],
  missingCapabilities: ['acai_base_sizes', 'acai_toppings'],
  // ...
};

// 2. Registrar no registry

// 3. Empresa pode cadastrar imediatamente

// 4. Futuramente, implementar funcionalidades específicas
```

## Boas Práticas

### ✅ Fazer

- Sempre verificar capabilities antes de mostrar funcionalidades
- Usar `AdminSectionGuard` para controlar visibilidade
- Mostrar banner de upgrade quando disponível
- Usar snapshot em pedidos antigos
- Registrar upgrades no histórico

### ❌ Não Fazer

- Decidir UI apenas pelo nome do nicho
- Buscar configuração atual ao renderizar pedidos antigos
- Tornar novas capabilities obrigatórias automaticamente
- Quebrar empresas existentes ao adicionar funcionalidades
- Usar metadata solto para regras essenciais

## Suporte

- 📖 [Guia de Evolução](./NICHE_EVOLUTION_GUIDE.md)
- 📚 [Exemplos de Uso](./USAGE_EXAMPLES.md)
- 🧪 [Testes](./__tests__/)
- 📋 [Tipos](./types.ts)

## Licença

Parte do projeto Acheguese - Todos os direitos reservados
