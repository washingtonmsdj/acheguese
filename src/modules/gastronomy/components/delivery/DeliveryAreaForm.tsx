/**
 * DeliveryAreaForm â€” FormulÃ¡rio de Ã¡rea de entrega
 *
 * Permite criar/editar Ã¡rea de entrega.
 * SSOT: Usa useDeliveryAreas hook
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { MapPin, Save, X } from 'lucide-react';
import type { DeliveryArea } from '@/modules/gastronomy/services/DeliveryAreaService';

interface DeliveryAreaFormProps {
  area?: DeliveryArea | null;
  onSave: (data: {
    name: string;
    description?: string;
    delivery_fee: number;
    minimum_order_value?: number;
    estimated_time_min?: number;
    is_active?: boolean;
  }) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function DeliveryAreaForm({
  area,
  onSave,
  onCancel,
  isSaving = false,
}: DeliveryAreaFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    delivery_fee: 0,
    minimum_order_value: '',
    estimated_time_min: 30,
    is_active: true,
  });

  // Preenche form se estiver editando
  useEffect(() => {
    if (area) {
      setFormData({
        name: area.name,
        description: area.description || '',
        delivery_fee: area.delivery_fee,
        minimum_order_value: area.minimum_order_value?.toString() || '',
        estimated_time_min: area.estimated_time_min,
        is_active: area.is_active,
      });
    }
  }, [area]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      name: formData.name,
      description: formData.description || undefined,
      delivery_fee: formData.delivery_fee,
      minimum_order_value: formData.minimum_order_value
        ? parseFloat(formData.minimum_order_value)
        : undefined,
      estimated_time_min: formData.estimated_time_min,
      is_active: formData.is_active,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {area ? 'Editar Ãrea de Entrega' : 'Nova Ãrea de Entrega'}
        </CardTitle>
        <CardDescription>
          Configure os detalhes da Ã¡rea de entrega
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome da Ãrea <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: Centro, Zona Sul, Bairro X"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* DescriÃ§Ã£o */}
          <div className="space-y-2">
            <Label htmlFor="description">DescriÃ§Ã£o (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva a Ã¡rea de entrega..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={2}
            />
          </div>

          {/* Taxa de Entrega */}
          <div className="space-y-2">
            <Label htmlFor="delivery-fee">
              Taxa de Entrega (R$) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="delivery-fee"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.delivery_fee}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  delivery_fee: parseFloat(e.target.value) || 0,
                }))
              }
              required
            />
            <p className="text-sm text-muted-foreground">
              Taxa padrÃ£o para todos os bairros desta Ã¡rea
            </p>
          </div>

          {/* Pedido MÃ­nimo */}
          <div className="space-y-2">
            <Label htmlFor="minimum-order">Pedido MÃ­nimo (R$, opcional)</Label>
            <Input
              id="minimum-order"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 20.00"
              value={formData.minimum_order_value}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  minimum_order_value: e.target.value,
                }))
              }
            />
            <p className="text-sm text-muted-foreground">
              Valor mÃ­nimo do pedido para esta Ã¡rea
            </p>
          </div>

          {/* Tempo Estimado */}
          <div className="space-y-2">
            <Label htmlFor="estimated-time">
              Tempo Estimado (minutos) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="estimated-time"
              type="number"
              min="1"
              step="5"
              placeholder="30"
              value={formData.estimated_time_min}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estimated_time_min: parseInt(e.target.value) || 30,
                }))
              }
              required
            />
            <p className="text-sm text-muted-foreground">
              Tempo mÃ©dio de entrega para esta Ã¡rea
            </p>
          </div>

          {/* Ativa */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="is-active">Ãrea Ativa</Label>
              <p className="text-sm text-muted-foreground">
                Desative para pausar entregas nesta Ã¡rea
              </p>
            </div>
            <Switch
              id="is-active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_active: checked }))
              }
            />
          </div>

          {/* AÃ§Ãµes */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSaving || !formData.name}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : area ? 'Atualizar' : 'Criar Ãrea'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

