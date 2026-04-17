/**
 * BillingPlanForm - Formulário para criar/editar planos de billing
 * 
 * ADMIN ONLY
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { BillingPlan, PlanEntitlements } from '@/core/billing/services/BillingPlanService';

interface BillingPlanFormProps {
  plan?: BillingPlan;
  onSubmit: (data: Omit<BillingPlan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const defaultEntitlements: PlanEntitlements = {
  // Página Pública
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,
  canUseCustomQRCode: false,
  
  // Cardápio / Catálogo
  canUseAdvancedMenu: false,
  canUseMenuCategories: false,
  canUseMenuImages: false,
  canUseMenuVariations: false,
  canUseMenuAddons: false,
  canUseMenuCombos: false,
  canManageAvailability: false,
  canScheduleItems: false,
  
  // Pedidos
  canReceiveInternalOrders: false,
  canUseOrdersPanel: false,
  canManageOrderStatus: false,
  canCancelOrders: false,
  canViewOrderHistory: false,
  
  // Delivery / Operação
  canUseMotoboyNetwork: false,
  canRequestDelivery: false,
  canTrackDelivery: false,
  canConfigureDeliveryArea: false,
  canSetDeliveryFees: false,
  canManageBusinessHours: false,
  canSetMinimumOrder: false,
  canUseOwnDelivery: false,
  
  // Marketing
  canUsePromotions: false,
  canUseFeaturedPlacement: false,
  canUseBanners: false,
  canUseCoupons: false,
  canSchedulePromotions: false,
  
  // Analytics
  canUseBasicAnalytics: false,
  canUseAdvancedAnalytics: false,
  canExportReports: false,
  canViewRealtimeMetrics: false,
  canViewCustomerInsights: false,
  
  // Limites
  maxMenuItems: null,
  maxPromotions: null,
  maxImages: null,
  maxCategories: null,
  maxCombos: null,
  maxOrdersPerDay: null,
};

export function BillingPlanForm({ plan, onSubmit, onCancel, isLoading }: BillingPlanFormProps) {
  const [code, setCode] = useState(plan?.code || '');
  const [name, setName] = useState(plan?.name || '');
  const [description, setDescription] = useState(plan?.description || '');
  const [priceCents, setPriceCents] = useState(plan?.priceCents || 0);
  const [currency, setCurrency] = useState(plan?.currency || 'BRL');
  const [billingPeriod, setBillingPeriod] = useState(plan?.billingPeriod || 'monthly');
  const [features, setFeatures] = useState<string[]>(plan?.features || []);
  const [entitlements, setEntitlements] = useState<PlanEntitlements>(
    plan?.entitlements || defaultEntitlements
  );
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(plan?.isFeatured ?? false);
  const [displayOrder, setDisplayOrder] = useState(plan?.displayOrder || 0);
  const [newFeature, setNewFeature] = useState('');

  const priceDisplay = `R$ ${(priceCents / 100).toFixed(2)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      code,
      name,
      description,
      priceCents,
      priceDisplay,
      currency,
      billingPeriod,
      features,
      entitlements,
      isActive,
      isFeatured,
      displayOrder,
    });
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateEntitlement = (key: keyof PlanEntitlements, value: boolean | number | null) => {
    setEntitlements({ ...entitlements, [key]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="entitlements">Permissões</TabsTrigger>
          <TabsTrigger value="limits">Limites</TabsTrigger>
        </TabsList>

        {/* TAB: Básico */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="free, basic, premium"
                    required
                    disabled={!!plan}
                  />
                  <p className="text-xs text-muted-foreground">
                    Identificador único (não pode ser alterado)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Plano Free"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do plano..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceCents">Preço (centavos) *</Label>
                  <Input
                    id="priceCents"
                    type="number"
                    value={priceCents}
                    onChange={(e) => setPriceCents(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Display: {priceDisplay}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">BRL (R$)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingPeriod">Período</Label>
                  <Select value={billingPeriod} onValueChange={setBillingPeriod}>
                    <SelectTrigger id="billingPeriod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                      <SelectItem value="lifetime">Vitalício</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Ordem de Exibição</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Ativo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={isFeatured}
                    onCheckedChange={setIsFeatured}
                  />
                  <Label htmlFor="isFeatured">Destaque</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Features */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Features do Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Digite uma feature..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {features.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma feature adicionada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Permissões */}
        <TabsContent value="entitlements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissões e Recursos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Página Pública */}
              <div>
                <h4 className="font-semibold mb-2">Página Pública</h4>
                <div className="space-y-2">
                  {[
                    { key: 'canUsePremiumPublicPage', label: 'Página Premium' },
                    { key: 'canUseShortPremiumLink', label: 'Link Curto Premium' },
                    { key: 'canUseCustomQRCode', label: 'QR Code Personalizado' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={entitlements[key as keyof PlanEntitlements] as boolean}
                        onCheckedChange={(checked) =>
                          updateEntitlement(key as keyof PlanEntitlements, checked)
                        }
                      />
                      <Label>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cardápio */}
              <div>
                <h4 className="font-semibold mb-2">Cardápio / Catálogo</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'canUseAdvancedMenu', label: 'Cardápio Avançado' },
                    { key: 'canUseMenuCategories', label: 'Categorias' },
                    { key: 'canUseMenuImages', label: 'Imagens' },
                    { key: 'canUseMenuVariations', label: 'Variações' },
                    { key: 'canUseMenuAddons', label: 'Adicionais' },
                    { key: 'canUseMenuCombos', label: 'Combos' },
                    { key: 'canManageAvailability', label: 'Gerenciar Disponibilidade' },
                    { key: 'canScheduleItems', label: 'Agendar Itens' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={entitlements[key as keyof PlanEntitlements] as boolean}
                        onCheckedChange={(checked) =>
                          updateEntitlement(key as keyof PlanEntitlements, checked)
                        }
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pedidos */}
              <div>
                <h4 className="font-semibold mb-2">Pedidos</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'canReceiveInternalOrders', label: 'Receber Pedidos' },
                    { key: 'canUseOrdersPanel', label: 'Painel de Pedidos' },
                    { key: 'canManageOrderStatus', label: 'Gerenciar Status' },
                    { key: 'canCancelOrders', label: 'Cancelar Pedidos' },
                    { key: 'canViewOrderHistory', label: 'Histórico' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={entitlements[key as keyof PlanEntitlements] as boolean}
                        onCheckedChange={(checked) =>
                          updateEntitlement(key as keyof PlanEntitlements, checked)
                        }
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery */}
              <div>
                <h4 className="font-semibold mb-2">Delivery / Operação</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'canUseMotoboyNetwork', label: 'Rede de Motoboys' },
                    { key: 'canRequestDelivery', label: 'Solicitar Entrega' },
                    { key: 'canTrackDelivery', label: 'Rastrear Entrega' },
                    { key: 'canConfigureDeliveryArea', label: 'Configurar Área' },
                    { key: 'canSetDeliveryFees', label: 'Definir Taxas' },
                    { key: 'canManageBusinessHours', label: 'Horário de Funcionamento' },
                    { key: 'canSetMinimumOrder', label: 'Pedido Mínimo' },
                    { key: 'canUseOwnDelivery', label: 'Entrega Própria' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={entitlements[key as keyof PlanEntitlements] as boolean}
                        onCheckedChange={(checked) =>
                          updateEntitlement(key as keyof PlanEntitlements, checked)
                        }
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketing */}
              <div>
                <h4 className="font-semibold mb-2">Marketing</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'canUsePromotions', label: 'Promoções' },
                    { key: 'canUseFeaturedPlacement', label: 'Destaque' },
                    { key: 'canUseBanners', label: 'Banners' },
                    { key: 'canUseCoupons', label: 'Cupons' },
                    { key: 'canSchedulePromotions', label: 'Agendar Promoções' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={entitlements[key as keyof PlanEntitlements] as boolean}
                        onCheckedChange={(checked) =>
                          updateEntitlement(key as keyof PlanEntitlements, checked)
                        }
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analytics */}
              <div>
                <h4 className="font-semibold mb-2">Analytics</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'canUseBasicAnalytics', label: 'Analytics Básico' },
                    { key: 'canUseAdvancedAnalytics', label: 'Analytics Avançado' },
                    { key: 'canExportReports', label: 'Exportar Relatórios' },
                    { key: 'canViewRealtimeMetrics', label: 'Métricas em Tempo Real' },
                    { key: 'canViewCustomerInsights', label: 'Insights de Clientes' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={entitlements[key as keyof PlanEntitlements] as boolean}
                        onCheckedChange={(checked) =>
                          updateEntitlement(key as keyof PlanEntitlements, checked)
                        }
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Limites */}
        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Limites de Uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Deixe em branco ou 0 para ilimitado
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'maxMenuItems', label: 'Máx. Itens no Cardápio' },
                  { key: 'maxPromotions', label: 'Máx. Promoções' },
                  { key: 'maxImages', label: 'Máx. Imagens' },
                  { key: 'maxCategories', label: 'Máx. Categorias' },
                  { key: 'maxCombos', label: 'Máx. Combos' },
                  { key: 'maxOrdersPerDay', label: 'Máx. Pedidos/Dia' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="number"
                      value={entitlements[key as keyof PlanEntitlements] as number || ''}
                      onChange={(e) =>
                        updateEntitlement(
                          key as keyof PlanEntitlements,
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      placeholder="Ilimitado"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : plan ? 'Atualizar Plano' : 'Criar Plano'}
        </Button>
      </div>
    </form>
  );
}
