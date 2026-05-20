/**
 * EXEMPLO: Admin Dashboard com Versionamento de Nicho
 *
 * Este e um exemplo completo de como usar o sistema de versionamento
 * em uma pagina de admin.
 */

import { useNicheVersioning, useAdminSections } from '../hooks';
import { NicheUpgradeBanner, AdminSectionGuard } from '../components';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface AdminDashboardExampleProps {
  businessId: string;
}

export function AdminDashboardExample({ businessId }: AdminDashboardExampleProps) {
  // Hook de versionamento
  const {
    config,
    loading,
    hasCapability,
    needsUpgrade,
    missingCount,
    enabledCount,
  } = useNicheVersioning({ businessId });

  // Hook de secoes do admin
  const {
    groupedSections,
    configurableSections,
    isSectionVisible,
  } = useAdminSections({
    enabledCapabilities: config?.enabled_capabilities ?? [],
    missingCapabilities: config?.missing_capabilities ?? [],
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center text-gray-500 py-8">
        Perfil gastronomico nao encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com informacoes do nicho */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Painel de Administracao</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">
                {config.primary_niche_key}
              </Badge>
              <Badge variant="secondary">
                v{config.niche_config_version}
              </Badge>
              <Badge variant={config.support_level === 'full_enabled' ? 'default' : 'secondary'}>
                {config.support_level}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Modo Operacional:</span>
              <div className="font-medium">{config.operational_mode}</div>
            </div>
            <div>
              <span className="text-gray-500">Funcionalidades Ativas:</span>
              <div className="font-medium">{enabledCount}</div>
            </div>
            <div>
              <span className="text-gray-500">Disponiveis para Configurar:</span>
              <div className="font-medium">{missingCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner de upgrade */}
      {needsUpgrade && (
        <NicheUpgradeBanner
          profile={config}
          onUpgrade={() => {
            // Navegar para pagina de upgrade
            console.log('Iniciar upgrade');
          }}
        />
      )}

      {/* Tabs de secoes */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          {Object.keys(groupedSections).map((category) => (
            <TabsTrigger key={category} value={category}>
              {getCategoryLabel(category)}
            </TabsTrigger>
          ))}
          {configurableSections.length > 0 && (
            <TabsTrigger value="configure">
              Configurar ({configurableSections.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Secoes basicas */}
        {groupedSections.basic && (
          <TabsContent value="basic" className="space-y-4">
            {/* Cardapio - sempre visivel */}
            <Card>
              <CardHeader>
                <CardTitle>Cardapio</CardTitle>
              </CardHeader>
              <CardContent>
                <MenuManagementSection businessId={businessId} />
              </CardContent>
            </Card>

            {/* Variacoes - se tiver capability */}
            {isSectionVisible('variants') && (
              <Card>
                <CardHeader>
                  <CardTitle>Variacoes</CardTitle>
                </CardHeader>
                <CardContent>
                  <VariantsManagementSection businessId={businessId} />
                </CardContent>
              </Card>
            )}

            {/* Adicionais - se tiver capability */}
            {isSectionVisible('addons') && (
              <Card>
                <CardHeader>
                  <CardTitle>Adicionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddonsManagementSection businessId={businessId} />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Secoes de Pizza */}
        {groupedSections.pizza && (
          <TabsContent value="pizza" className="space-y-4">
            {/* Tamanhos de Pizza */}
            <AdminSectionGuard
              section="pizza_sizes"
              enabledCapabilities={config.enabled_capabilities}
              missingCapabilities={config.missing_capabilities}
              onConfigure={() => console.log('Configurar tamanhos')}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Tamanhos de Pizza</CardTitle>
                </CardHeader>
                <CardContent>
                  <PizzaSizesManagementSection businessId={businessId} />
                </CardContent>
              </Card>
            </AdminSectionGuard>

            {/* Sabores de Pizza */}
            <AdminSectionGuard
              section="pizza_flavors"
              enabledCapabilities={config.enabled_capabilities}
              missingCapabilities={config.missing_capabilities}
              onConfigure={() => console.log('Configurar sabores')}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Sabores de Pizza</CardTitle>
                </CardHeader>
                <CardContent>
                  <PizzaFlavorsManagementSection businessId={businessId} />
                </CardContent>
              </Card>
            </AdminSectionGuard>

            {/* Massas e Bordas */}
            <AdminSectionGuard
              section="pizza_crusts"
              enabledCapabilities={config.enabled_capabilities}
              missingCapabilities={config.missing_capabilities}
              onConfigure={() => console.log('Configurar massas e bordas')}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Massas e Bordas</CardTitle>
                </CardHeader>
                <CardContent>
                  <PizzaCrustsManagementSection businessId={businessId} />
                </CardContent>
              </Card>
            </AdminSectionGuard>
          </TabsContent>
        )}

        {/* Secoes configuraveis */}
        {configurableSections.length > 0 && (
          <TabsContent value="configure" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades Disponiveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {configurableSections.map((section) => (
                    <ConfigurableSectionCard
                      key={section}
                      section={section}
                      missingCapabilities={config.missing_capabilities}
                      onConfigure={() => console.log(`Configurar ${section}`)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Helper para labels de categorias
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    basic: 'Basico',
    pizza: 'Pizza',
    sushi: 'Sushi',
    acai: 'Acai',
    meat: 'Carnes',
    pastel: 'Pastel',
    other: 'Outros',
  };
  return labels[category] || category;
}

// Componentes de exemplo (substituir por componentes reais)
function MenuManagementSection({ businessId }: { businessId: string }) {
  return <div>Gerenciamento de Cardapio - {businessId}</div>;
}

function VariantsManagementSection({ businessId }: { businessId: string }) {
  return <div>Gerenciamento de Variacoes - {businessId}</div>;
}

function AddonsManagementSection({ businessId }: { businessId: string }) {
  return <div>Gerenciamento de Adicionais - {businessId}</div>;
}

function PizzaSizesManagementSection({ businessId }: { businessId: string }) {
  return <div>Gerenciamento de Tamanhos de Pizza - {businessId}</div>;
}

function PizzaFlavorsManagementSection({ businessId }: { businessId: string }) {
  return <div>Gerenciamento de Sabores de Pizza - {businessId}</div>;
}

function PizzaCrustsManagementSection({ businessId }: { businessId: string }) {
  return <div>Gerenciamento de Massas e Bordas - {businessId}</div>;
}

function ConfigurableSectionCard({
  section,
  missingCapabilities,
  onConfigure,
}: {
  section: string;
  missingCapabilities: string[];
  onConfigure: () => void;
}) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium mb-2">{section}</h4>
      <p className="text-sm text-gray-500 mb-3">
        Configure esta funcionalidade para habilitar novos recursos
      </p>
      <button
        onClick={onConfigure}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        Configurar -&gt;
      </button>
    </div>
  );
}
