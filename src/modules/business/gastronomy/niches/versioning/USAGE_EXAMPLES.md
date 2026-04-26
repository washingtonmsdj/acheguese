# 📚 Exemplos de Uso - Sistema de Versionamento de Nichos

## Exemplo 1: Verificar Capability no Admin

```typescript
import { useEffect, useState } from 'react';
import { NicheVersioningService } from '@/modules/business/gastronomy/niches/versioning';

function PizzaAdminDashboard({ businessId }: { businessId: string }) {
  const [canShowMultiFlavor, setCanShowMultiFlavor] = useState(false);
  const [canShowSliceSales, setCanShowSliceSales] = useState(false);

  useEffect(() => {
    async function checkCapabilities() {
      const result = await NicheVersioningService.hasCapabilities(
        businessId,
        ['pizza_multi_flavor', 'slice_sales']
      );

      setCanShowMultiFlavor(result.capabilities.pizza_multi_flavor);
      setCanShowSliceSales(result.capabilities.slice_sales);
    }

    checkCapabilities();
  }, [businessId]);

  return (
    <div>
      <h1>Admin - Pizzaria</h1>

      {/* Sempre mostrar seções básicas */}
      <MenuSection />
      <CategoriesSection />

      {/* Mostrar apenas se tem capability */}
      {canShowMultiFlavor && <MultiFlavorPizzaSection />}
      {canShowSliceSales && <SliceSalesSection />}
    </div>
  );
}
```

## Exemplo 2: Usar AdminSectionGuard

```typescript
import { AdminSectionGuard } from '@/modules/business/gastronomy/niches/versioning';
import { useGastronomyProfile } from '@/modules/business/gastronomy/hooks';

function PizzaAdminPage({ businessId }: { businessId: string }) {
  const { profile } = useGastronomyProfile(businessId);

  if (!profile) return <Loading />;

  return (
    <div>
      <h1>Gerenciar Pizzaria</h1>

      {/* Seção sempre visível */}
      <MenuManagement />

      {/* Seção com guard - só mostra se tem capability */}
      <AdminSectionGuard
        section="pizza_flavors"
        enabledCapabilities={profile.enabled_capabilities}
        missingCapabilities={profile.missing_capabilities}
        onConfigure={() => router.push('/admin/configure-flavors')}
      >
        <PizzaFlavorsManager businessId={businessId} />
      </AdminSectionGuard>

      {/* Outra seção com guard */}
      <AdminSectionGuard
        section="pizza_crusts"
        enabledCapabilities={profile.enabled_capabilities}
        missingCapabilities={profile.missing_capabilities}
        onConfigure={() => router.push('/admin/configure-crusts')}
      >
        <PizzaCrustsManager businessId={businessId} />
      </AdminSectionGuard>
    </div>
  );
}
```

## Exemplo 3: Mostrar Banner de Upgrade

```typescript
import { NicheUpgradeBanner } from '@/modules/business/gastronomy/niches/versioning';
import { useGastronomyProfile } from '@/modules/business/gastronomy/hooks';
import { useRouter } from 'next/router';

function AdminDashboard({ businessId }: { businessId: string }) {
  const { profile } = useGastronomyProfile(businessId);
  const router = useRouter();

  if (!profile) return <Loading />;

  return (
    <div>
      {/* Banner de upgrade */}
      <NicheUpgradeBanner
        profile={profile}
        onUpgrade={() => router.push('/admin/upgrade')}
        onDismiss={() => {
          // Salvar preferência de não mostrar por X dias
          localStorage.setItem('upgrade-dismissed', Date.now().toString());
        }}
      />

      {/* Resto do dashboard */}
      <DashboardContent />
    </div>
  );
}
```

## Exemplo 4: Configurar Nova Capability

```typescript
import { NicheVersioningService } from '@/modules/business/gastronomy/niches/versioning';
import { useAuth } from '@/core/auth';
import { toast } from 'sonner';

function SliceSalesConfigurationWizard({ businessId }: { businessId: string }) {
  const { user } = useAuth();

  async function handleComplete(config: SliceSalesConfig) {
    try {
      // 1. Salvar configuração
      await saveSliceSalesConfig(businessId, config);

      // 2. Adicionar capability
      const result = await NicheVersioningService.addCapability({
        business_id: businessId,
        capability: 'slice_sales',
        upgraded_by: user?.id,
      });

      if (result.success) {
        toast.success('Venda por fatia configurada com sucesso!');
        router.push('/admin/menu');
      } else {
        toast.error('Erro ao ativar funcionalidade');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao configurar venda por fatia');
    }
  }

  return (
    <Wizard onComplete={handleComplete}>
      <Step1 />
      <Step2 />
      <Step3 />
    </Wizard>
  );
}
```

## Exemplo 5: Listar Seções Visíveis

```typescript
import { AdminSectionVisibilityService } from '@/modules/business/gastronomy/niches/versioning';
import { useGastronomyProfile } from '@/modules/business/gastronomy/hooks';

function AdminSidebar({ businessId }: { businessId: string }) {
  const { profile } = useGastronomyProfile(businessId);

  if (!profile) return null;

  // Obter seções visíveis
  const visibleSections = AdminSectionVisibilityService.getVisibleSections(
    profile.enabled_capabilities
  );

  // Agrupar por categoria
  const grouped = AdminSectionVisibilityService.groupSectionsByCategory(
    visibleSections
  );

  return (
    <nav>
      {/* Seções básicas */}
      {grouped.basic && (
        <div>
          <h3>Básico</h3>
          <ul>
            {grouped.basic.map(section => (
              <li key={section}>
                <Link href={`/admin/${section}`}>
                  {getSectionLabel(section)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Seções de pizza */}
      {grouped.pizza && (
        <div>
          <h3>Pizza</h3>
          <ul>
            {grouped.pizza.map(section => (
              <li key={section}>
                <Link href={`/admin/${section}`}>
                  {getSectionLabel(section)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Seções configuráveis */}
      {profile.missing_capabilities.length > 0 && (
        <div>
          <h3>Configurar</h3>
          <ConfigurableSectionsList
            enabledCapabilities={profile.enabled_capabilities}
            missingCapabilities={profile.missing_capabilities}
          />
        </div>
      )}
    </nav>
  );
}
```

## Exemplo 6: Upgrade Completo de Nicho

```typescript
import { NicheVersioningService } from '@/modules/business/gastronomy/niches/versioning';
import { useAuth } from '@/core/auth';

async function upgradeSushiToFull(businessId: string) {
  const { user } = useAuth();

  const result = await NicheVersioningService.upgradeNiche({
    business_id: businessId,
    to_version: '2.0.0',
    to_operational_mode: 'sushi_full',
    add_capabilities: [
      'sushi_piece_count',
      'sushi_combinado_builder',
      'sushi_sashimi_weight',
    ],
    upgrade_type: 'manual',
    upgraded_by: user?.id,
    notes: 'Upgrade para sushi completo com todas as funcionalidades',
  });

  if (result.success) {
    console.log(`Upgrade realizado: ${result.from_version} → ${result.to_version}`);
    console.log('Capabilities adicionadas:', result.added_capabilities);
    
    // Recarregar perfil
    await refetchProfile();
    
    // Mostrar mensagem
    toast.success('Seu restaurante foi atualizado com sucesso!');
  } else {
    console.error('Erro no upgrade:', result.error);
    toast.error('Erro ao realizar upgrade');
  }
}
```

## Exemplo 7: Marcar Nichos para Upgrade (Admin)

```typescript
import { NicheVersioningService } from '@/modules/business/gastronomy/niches/versioning';

// Quando uma nova funcionalidade é lançada
async function releaseSliceSalesFeature() {
  // Marcar todas as pizzarias que não têm a capability
  const result = await NicheVersioningService.markNeedsUpgrade({
    niche_key: 'pizza',
    missing_capabilities: ['slice_sales'],
  });

  console.log(`${result.updated_count} pizzarias marcadas para upgrade`);

  // Enviar notificações (opcional)
  await sendUpgradeNotifications('pizza', ['slice_sales']);
}
```

## Exemplo 8: Histórico de Upgrades

```typescript
import { NicheVersioningService } from '@/modules/business/gastronomy/niches/versioning';

function UpgradeHistoryPage({ businessId }: { businessId: string }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function loadHistory() {
      const data = await NicheVersioningService.getUpgradeHistory(businessId);
      setHistory(data);
    }
    loadHistory();
  }, [businessId]);

  return (
    <div>
      <h1>Histórico de Upgrades</h1>
      <ul>
        {history.map(upgrade => (
          <li key={upgrade.id}>
            <div>
              <strong>
                {upgrade.from_version} → {upgrade.to_version}
              </strong>
            </div>
            <div>
              Capabilities adicionadas: {upgrade.added_capabilities.join(', ')}
            </div>
            <div>
              Modo: {upgrade.from_operational_mode} → {upgrade.to_operational_mode}
            </div>
            <div>
              Data: {new Date(upgrade.upgraded_at).toLocaleDateString()}
            </div>
            {upgrade.notes && <div>Notas: {upgrade.notes}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Exemplo 9: Hook Customizado

```typescript
import { useEffect, useState } from 'react';
import { NicheVersioningService } from '@/modules/business/gastronomy/niches/versioning';
import type { ProfileNicheConfig } from '@/modules/business/gastronomy/niches/versioning';

export function useNicheCapabilities(businessId: string) {
  const [config, setConfig] = useState<ProfileNicheConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await NicheVersioningService.getProfileNicheConfig(businessId);
      setConfig(data);
      setLoading(false);
    }
    load();
  }, [businessId]);

  const hasCapability = (capability: string) => {
    return config?.enabled_capabilities.includes(capability as any) ?? false;
  };

  const needsUpgrade = config?.needs_niche_upgrade ?? false;
  const missingCount = config?.missing_capabilities.length ?? 0;

  return {
    config,
    loading,
    hasCapability,
    needsUpgrade,
    missingCount,
  };
}

// Uso:
function MyComponent({ businessId }: { businessId: string }) {
  const { hasCapability, needsUpgrade, missingCount } = useNicheCapabilities(businessId);

  return (
    <div>
      {hasCapability('pizza_multi_flavor') && <MultiFlavorSection />}
      {needsUpgrade && <UpgradeBanner count={missingCount} />}
    </div>
  );
}
```

## Exemplo 10: Renderizar Pedido Antigo (Snapshot)

```typescript
import type { PizzaOrderItemSnapshot } from '@/modules/business/gastronomy/niches/pizzaria';

function OrderItemDisplay({ snapshot }: { snapshot: PizzaOrderItemSnapshot }) {
  // IMPORTANTE: Usa APENAS dados do snapshot
  // NÃO busca configuração atual do nicho
  
  return (
    <div className="order-item">
      <h3>{snapshot.item_name}</h3>
      
      <div className="size">
        <strong>Tamanho:</strong> {snapshot.size.name}
        {snapshot.size.slices && ` (${snapshot.size.slices} fatias)`}
      </div>

      <div className="flavors">
        <strong>Sabores:</strong>
        <ul>
          {snapshot.flavors.map((flavor, idx) => (
            <li key={idx}>
              {flavor.name} ({(flavor.fraction * 100).toFixed(0)}%)
              - R$ {flavor.unit_price_at_purchase.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>

      {snapshot.edge && (
        <div className="edge">
          <strong>Borda:</strong> {snapshot.edge.name}
          - R$ {snapshot.edge.price.toFixed(2)}
        </div>
      )}

      {snapshot.dough && (
        <div className="dough">
          <strong>Massa:</strong> {snapshot.dough.name}
          {snapshot.dough.price_adjustment > 0 && 
            ` (+R$ ${snapshot.dough.price_adjustment.toFixed(2)})`
          }
        </div>
      )}

      {snapshot.addons.length > 0 && (
        <div className="addons">
          <strong>Adicionais:</strong>
          <ul>
            {snapshot.addons.map((addon, idx) => (
              <li key={idx}>
                {addon.name} x{addon.quantity}
                - R$ {(addon.price * addon.quantity).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="total">
        <strong>Total:</strong> R$ {snapshot.line_total.toFixed(2)}
      </div>
    </div>
  );
}
```

## Boas Práticas

### ✅ Fazer

1. **Sempre verificar capabilities antes de mostrar funcionalidades**
2. **Usar `AdminSectionGuard` para controlar visibilidade**
3. **Mostrar banner de upgrade quando disponível**
4. **Usar snapshot em pedidos antigos**
5. **Registrar upgrades no histórico**

### ❌ Não Fazer

1. **Não decidir UI apenas pelo nome do nicho**
2. **Não buscar configuração atual ao renderizar pedidos antigos**
3. **Não tornar novas capabilities obrigatórias automaticamente**
4. **Não quebrar empresas existentes ao adicionar funcionalidades**
5. **Não usar metadata solto para regras essenciais**
