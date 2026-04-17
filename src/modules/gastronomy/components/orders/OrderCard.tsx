/**
 * OrderCard â€” Card de pedido com resumo
 *
 * Mostra informaÃ§Ãµes principais e aÃ§Ãµes rÃ¡pidas.
 */

import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { OrderStatusBadge } from './OrderStatusBadge';
import { Eye, Phone, MapPin } from 'lucide-react';
import type { Order } from '@/modules/gastronomy/services/OrderService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

const ORDER_TYPE_LABELS = {
  pickup: 'Retirada',
  delivery: 'Entrega',
  dine_in: 'Consumo Local',
};

export function OrderCard({ order, onViewDetails }: OrderCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">
                Pedido #{order.order_number}
              </h3>
              <OrderStatusBadge status={order.status} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(parseISO(order.created_at), "dd/MM/yyyy 'Ã s' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              R$ {order.total.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {ORDER_TYPE_LABELS[order.order_type]}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* InformaÃ§Ãµes do cliente */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{order.customer_name}</span>
            <span className="text-muted-foreground">â€¢</span>
            <span className="text-muted-foreground">{order.customer_phone}</span>
          </div>

          {order.order_type === 'delivery' && order.delivery_address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground">
                  {order.delivery_address}
                  {order.delivery_complement && `, ${order.delivery_complement}`}
                </p>
                <p className="text-muted-foreground">
                  {order.delivery_neighborhood} - {order.delivery_city}/{order.delivery_state}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Valores */}
        <div className="grid grid-cols-3 gap-4 text-sm pt-2 border-t">
          <div>
            <p className="text-muted-foreground">Subtotal</p>
            <p className="font-medium">R$ {order.subtotal.toFixed(2)}</p>
          </div>
          {order.delivery_fee > 0 && (
            <div>
              <p className="text-muted-foreground">Entrega</p>
              <p className="font-medium">R$ {order.delivery_fee.toFixed(2)}</p>
            </div>
          )}
          {order.discount > 0 && (
            <div>
              <p className="text-muted-foreground">Desconto</p>
              <p className="font-medium text-green-600">
                -R$ {order.discount.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* ObservaÃ§Ãµes */}
        {order.notes && (
          <div className="text-sm p-2 bg-muted rounded">
            <p className="font-medium mb-1">ObservaÃ§Ãµes:</p>
            <p className="text-muted-foreground">{order.notes}</p>
          </div>
        )}

        {/* AÃ§Ãµes */}
        <Button
          onClick={() => onViewDetails(order)}
          variant="outline"
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
}

