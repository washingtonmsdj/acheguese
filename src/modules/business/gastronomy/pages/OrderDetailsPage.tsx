/**
 * OrderDetailsPage — Página de detalhes do pedido com rastreamento GPS
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useOrderDetails } from '../hooks';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { OrderTrackingCard } from '../components/orders/OrderTrackingCard';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { ArrowLeft, Package, MapPin, Phone, User, Clock, CreditCard, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ORDER_TYPE_LABELS = {
  pickup: 'Retirada',
  delivery: 'Entrega',
  dine_in: 'Consumo Local',
};

export default function OrderDetailsPage() {
  const { businessId, orderId } = useParams<{ businessId: string; orderId: string }>();
  const navigate = useNavigate();
  const { order, isLoading } = useOrderDetails(orderId!);

  if (!businessId || !orderId) {
    return (
      <div className="container max-w-6xl py-8">
        <p className="text-center text-destructive">Parâmetros inválidos</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <p className="text-center text-muted-foreground">Carregando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-6xl py-8">
        <p className="text-center text-destructive">Pedido não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/gastronomy/${businessId}/orders`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Pedido #{order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-muted-foreground mt-1">
            {format(parseISO(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">R$ {order.total.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">{ORDER_TYPE_LABELS[order.order_type]}</p>
        </div>
      </div>

      {/* Rastreamento GPS (apenas para delivery) */}
      {order.order_type === 'delivery' && (
        <OrderTrackingCard order={order} />
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <a
                href={`tel:${order.customer_phone}`}
                className="font-medium text-primary hover:underline flex items-center gap-1"
              >
                <Phone className="h-4 w-4" />
                {order.customer_phone}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Endereço de Entrega */}
        {order.order_type === 'delivery' && order.delivery_address && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{order.delivery_address}</p>
              {order.delivery_complement && (
                <p className="text-sm text-muted-foreground">{order.delivery_complement}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {order.delivery_neighborhood} - {order.delivery_city}/{order.delivery_state}
              </p>
              {order.delivery_zipcode && (
                <p className="text-sm text-muted-foreground">CEP: {order.delivery_zipcode}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Informações de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Método</p>
              <p className="font-medium">{order.payment_method || 'Não informado'}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">R$ {order.subtotal.toFixed(2)}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de Entrega</span>
                  <span className="font-medium">R$ {order.delivery_fee.toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="font-medium text-green-600">-R$ {order.discount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Pedido Criado</p>
              <p className="font-medium">
                {format(parseISO(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            {order.confirmed_at && (
              <div>
                <p className="text-sm text-muted-foreground">Confirmado</p>
                <p className="font-medium">
                  {format(parseISO(order.confirmed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
            {order.ready_at && (
              <div>
                <p className="text-sm text-muted-foreground">Pronto</p>
                <p className="font-medium">
                  {format(parseISO(order.ready_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
            {order.delivered_at && (
              <div>
                <p className="text-sm text-muted-foreground">Entregue</p>
                <p className="font-medium">
                  {format(parseISO(order.delivered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Itens do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Itens do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0">
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-muted-foreground">{item.quantity}x</span>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="font-medium">R$ {item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
