/**
 * OperationConfigForm — Configuração operacional
 *
 * Permite configurar modos de operação e configurações gerais.
 * SSOT: Usa useOperationConfig hook
 */

import { useState, useEffect } from 'react';
import { useOperationConfig } from '../../hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { Settings, Save } from 'lucide-react';

interface OperationConfigFormProps {
  businessId: string;
}

export function OperationConfigForm({ businessId }: OperationConfigFormProps) {
  const { config, isLoading, setConfig, isSettingConfig } = useOperationConfig(businessId);

  const [formData, setFormData] = useState({
    accepts_pickup: true,
    accepts_delivery: false,
    accepts_dine_in: true,
    uses_own_delivery: false,
    uses_platform_delivery: false,
    preparation_time_min: 30,
    advance_order_hours: null as number | null,
    is_temporarily_closed: false,
    temporarily_closed_reason: '',
    temporarily_closed_until: '',
  });

  // Atualiza form quando config carrega
  useEffect(() => {
    if (config) {
      setFormData({
        accepts_pickup: config.accepts_pickup,
        accepts_delivery: config.accepts_delivery,
        accepts_dine_in: config.accepts_dine_in,
        uses_own_delivery: config.uses_own_delivery,
        uses_platform_delivery: config.uses_platform_delivery,
        preparation_time_min: config.preparation_time_min,
        advance_order_hours: config.advance_order_hours,
        is_temporarily_closed: config.is_temporarily_closed,
        temporarily_closed_reason: config.temporarily_closed_reason || '',
        temporarily_closed_until: config.temporarily_closed_until || '',
      });
    }
  }, [config]);

  const handleSave = () => {
    setConfig({
      business_id: businessId,
      ...formData,
      temporarily_closed_reason: formData.temporarily_closed_reason || null,
      temporarily_closed_until: formData.temporarily_closed_until || null,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configuração Operacional
        </CardTitle>
        <CardDescription>
          Configure modos de operação e preferências
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Modos de Operação */}
        <div className="space-y-4">
          <h4 className="font-medium">Modos de Operação</h4>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="accepts-pickup">Aceita Retirada (Pickup)</Label>
              <p className="text-sm text-muted-foreground">
                Cliente retira no local
              </p>
            </div>
            <Switch
              id="accepts-pickup"
              checked={formData.accepts_pickup}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, accepts_pickup: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="accepts-delivery">Aceita Entrega</Label>
              <p className="text-sm text-muted-foreground">
                Entrega no endereço do cliente
              </p>
            </div>
            <Switch
              id="accepts-delivery"
              checked={formData.accepts_delivery}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, accepts_delivery: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="accepts-dine-in">Aceita Consumo Local</Label>
              <p className="text-sm text-muted-foreground">
                Cliente consome no estabelecimento
              </p>
            </div>
            <Switch
              id="accepts-dine-in"
              checked={formData.accepts_dine_in}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, accepts_dine_in: checked }))
              }
            />
          </div>
        </div>

        {/* Configurações de Entrega */}
        {formData.accepts_delivery && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium">Configurações de Entrega</h4>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="uses-own-delivery">Entrega Própria</Label>
                <p className="text-sm text-muted-foreground">
                  Usa entregadores próprios
                </p>
              </div>
              <Switch
                id="uses-own-delivery"
                checked={formData.uses_own_delivery}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, uses_own_delivery: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="uses-platform-delivery">Rede de Motoboys</Label>
                <p className="text-sm text-muted-foreground">
                  Usa rede da plataforma
                </p>
              </div>
              <Switch
                id="uses-platform-delivery"
                checked={formData.uses_platform_delivery}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, uses_platform_delivery: checked }))
                }
              />
            </div>
          </div>
        )}

        {/* Tempo de Preparo */}
        <div className="space-y-2">
          <Label htmlFor="preparation-time">Tempo de Preparo (minutos)</Label>
          <Input
            id="preparation-time"
            type="number"
            min="0"
            step="5"
            value={formData.preparation_time_min}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                preparation_time_min: parseInt(e.target.value) || 0,
              }))
            }
          />
          <p className="text-sm text-muted-foreground">
            Tempo médio para preparar um pedido
          </p>
        </div>

        {/* Pedidos com Antecedência */}
        <div className="space-y-2">
          <Label htmlFor="advance-order">Pedidos com Antecedência (horas, opcional)</Label>
          <Input
            id="advance-order"
            type="number"
            min="0"
            step="1"
            placeholder="Ex: 2"
            value={formData.advance_order_hours || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                advance_order_hours: e.target.value ? parseInt(e.target.value) : null,
              }))
            }
          />
          <p className="text-sm text-muted-foreground">
            Quantas horas de antecedência são necessárias
          </p>
        </div>

        {/* Fechamento Temporário */}
        <div className="space-y-4 p-4 border rounded-lg border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="temporarily-closed" className="text-orange-900">
                Fechamento Temporário
              </Label>
              <p className="text-sm text-orange-700">
                Desativa temporariamente o estabelecimento
              </p>
            </div>
            <Switch
              id="temporarily-closed"
              checked={formData.is_temporarily_closed}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_temporarily_closed: checked }))
              }
            />
          </div>

          {formData.is_temporarily_closed && (
            <>
              <div className="space-y-2">
                <Label htmlFor="closed-reason">Motivo</Label>
                <Textarea
                  id="closed-reason"
                  placeholder="Ex: Férias, reforma, evento especial..."
                  value={formData.temporarily_closed_reason}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      temporarily_closed_reason: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closed-until">Fechado até (opcional)</Label>
                <Input
                  id="closed-until"
                  type="datetime-local"
                  value={formData.temporarily_closed_until}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      temporarily_closed_until: e.target.value,
                    }))
                  }
                />
              </div>
            </>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={isSettingConfig}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSettingConfig ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
}
