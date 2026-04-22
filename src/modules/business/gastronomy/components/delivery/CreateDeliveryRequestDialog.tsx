/**
 * CreateDeliveryRequestDialog — Dialog para criar solicitação de entrega
 *
 * Formulário para criar nova solicitação.
 * Consome hooks (SSOT).
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { useCreateDeliveryRequest } from '@/modules/business/gastronomy/hooks';
import { Order } from '@/modules/business/gastronomy/services/OrderService';

interface CreateDeliveryRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  businessId: string;
  pickupAddress: string;
}

export function CreateDeliveryRequestDialog({
  open,
  onOpenChange,
  order,
  businessId,
  pickupAddress,
}: CreateDeliveryRequestDialogProps) {
  const createMutation = useCreateDeliveryRequest();

  const [formData, setFormData] = useState({
    driver_payment: '',
    estimated_distance_km: '',
    estimated_duration_minutes: '',
    pickup_instructions: '',
    delivery_instructions: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createMutation.mutateAsync({
      order_id: order.id,
      business_id: businessId,
      pickup_address: pickupAddress,
      delivery_address: order.delivery_address || '',
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      delivery_fee: order.delivery_fee,
      driver_payment: formData.driver_payment
        ? parseFloat(formData.driver_payment)
        : undefined,
      estimated_distance_km: formData.estimated_distance_km
        ? parseFloat(formData.estimated_distance_km)
        : undefined,
      estimated_duration_minutes: formData.estimated_duration_minutes
        ? parseInt(formData.estimated_duration_minutes)
        : undefined,
      pickup_instructions: formData.pickup_instructions || undefined,
      delivery_instructions: formData.delivery_instructions || undefined,
    });

    onOpenChange(false);
    setFormData({
      driver_payment: '',
      estimated_distance_km: '',
      estimated_duration_minutes: '',
      pickup_instructions: '',
      delivery_instructions: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Entrega</DialogTitle>
          <DialogDescription>
            Criar solicitação de entrega para o pedido #{order.order_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações do Pedido */}
          <div className="space-y-2">
            <h3 className="font-medium">Informações do Pedido</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-medium">{order.customer_phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Endereço de Entrega</p>
                <p className="font-medium">{order.delivery_address}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Taxa de Entrega</p>
                <p className="font-medium">R$ {order.delivery_fee.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Pagamento do Motoboy */}
          <div className="space-y-2">
            <Label htmlFor="driver_payment">Pagamento do Motoboy (opcional)</Label>
            <Input
              id="driver_payment"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.driver_payment}
              onChange={(e) =>
                setFormData({ ...formData, driver_payment: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Valor que será pago ao motoboy pela entrega
            </p>
          </div>

          {/* Estimativas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_distance_km">Distância (km)</Label>
              <Input
                id="estimated_distance_km"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={formData.estimated_distance_km}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_distance_km: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_duration_minutes">Tempo (min)</Label>
              <Input
                id="estimated_duration_minutes"
                type="number"
                min="0"
                placeholder="0"
                value={formData.estimated_duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_duration_minutes: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Instruções */}
          <div className="space-y-2">
            <Label htmlFor="pickup_instructions">Instruções de Retirada</Label>
            <Textarea
              id="pickup_instructions"
              placeholder="Ex: Retirar no balcão, tocar a campainha..."
              value={formData.pickup_instructions}
              onChange={(e) =>
                setFormData({ ...formData, pickup_instructions: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_instructions">Instruções de Entrega</Label>
            <Textarea
              id="delivery_instructions"
              placeholder="Ex: Deixar com o porteiro, não tocar a campainha..."
              value={formData.delivery_instructions}
              onChange={(e) =>
                setFormData({ ...formData, delivery_instructions: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar Solicitação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

