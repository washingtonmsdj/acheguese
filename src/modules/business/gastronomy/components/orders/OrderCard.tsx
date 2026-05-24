/**
 * OrderCard - resumo operacional de pedido.
 */

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderTrackingBadge } from './OrderTrackingBadge';
import { buildTelUrl } from '@/shared/utils/contactLinks';
import type { Order } from '@/modules/business/gastronomy/services/OrderService';

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

const ORDER_TYPE_LABELS = {
  pickup: 'Retirada',
  delivery: 'Entrega',
  dine_in: 'Consumo local',
};

export function OrderCard({ order, onViewDetails }: OrderCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">
                Pedido #{order.order_number}
              </h3>
              <OrderStatusBadge status={order.status} size="sm" />
              {order.order_type === 'delivery' && <OrderTrackingBadge orderId={order.id} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(parseISO(order.created_at), "dd/MM/yyyy 'as' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl font-bold">R$ {order.total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{ORDER_TYPE_LABELS[order.order_type]}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{order.customer_name || 'Cliente não informado'}</span>
            {order.customer_phone && (
              <>
                <span className="text-muted-foreground">/</span>
                <a href={buildTelUrl(order.customer_phone) ?? undefined} className="text-muted-foreground hover:text-primary">
                  {order.customer_phone}
                </a>
              </>
            )}
          </div>

          {order.order_type === 'delivery' && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                {order.delivery_address ? (
                  <>
                    <p className="text-muted-foreground">
                      {order.delivery_address}
                      {order.delivery_complement && `, ${order.delivery_complement}`}
                    </p>
                    {(order.delivery_neighborhood || order.delivery_city || order.delivery_state) && (
                      <p className="text-muted-foreground">
                        {[order.delivery_neighborhood, order.delivery_city].filter(Boolean).join(' - ')}
                        {order.delivery_state ? `/${order.delivery_state}` : ''}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Endereço pendente no snapshot do pedido.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm pt-2 border-t">
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
              <p className="font-medium text-green-600">-R$ {order.discount.toFixed(2)}</p>
            </div>
          )}
        </div>

        {(order.delivery_courier_cost !== null || order.delivery_margin !== null) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs rounded-lg border bg-muted/30 p-3">
            {order.delivery_courier_cost !== null && (
              <div>
                <p className="text-muted-foreground">Custo logistica (motoboy)</p>
                <p className="font-medium">R$ {order.delivery_courier_cost.toFixed(2)}</p>
              </div>
            )}
            {order.delivery_margin !== null && (
              <div>
                <p className="text-muted-foreground">Margem da taxa de entrega</p>
                <p className={`font-medium ${order.delivery_margin >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  R$ {order.delivery_margin.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {order.notes && (
          <div className="text-sm p-2 bg-muted rounded">
            <p className="font-medium mb-1">Observações:</p>
            <p className="text-muted-foreground">{order.notes}</p>
          </div>
        )}

        <Button onClick={() => onViewDetails(order)} variant="outline" className="w-full">
          <Eye className="w-4 h-4 mr-2" />
          Ver detalhes
        </Button>
      </CardContent>
    </Card>
  );
}
