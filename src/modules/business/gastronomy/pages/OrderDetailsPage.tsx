/**
 * OrderDetailsPage - detalhes do pedido com rastreamento e timeline operacional.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Package,
  Phone,
  User,
} from 'lucide-react';
import { useOrderDetails } from '../hooks';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { OrderTrackingCard } from '../components/orders/OrderTrackingCard';
import { OrderOperationsPanel } from '../components/orders/OrderOperationsPanel';
import { OrderTrustFeedbackPanel } from '../components/orders/OrderTrustFeedbackPanel';
import { OrderPublicReviewPanel } from '../components/orders/OrderPublicReviewPanel';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

const ORDER_TYPE_LABELS = {
  pickup: 'Retirada',
  delivery: 'Entrega',
  dine_in: 'Consumo local',
};

function formatDateTime(value: string) {
  return format(parseISO(value), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
}

export default function OrderDetailsPage() {
  const { businessId, orderId } = useParams<{ businessId: string; orderId: string }>();
  const navigate = useNavigate();
  const { order, isLoading } = useOrderDetails(orderId!);
  const proof = order?.proof_of_delivery;

  if (!orderId) {
    return (
      <div className="container max-w-6xl py-8">
        <p className="text-center text-destructive">Parametros invalidos</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8 space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-6xl py-8">
        <p className="text-center text-destructive">Pedido nao encontrado</p>
      </div>
    );
  }

  const isBusinessRoute = Boolean(businessId);
  const effectiveBusinessId = businessId ?? order.business_id;
  const backTarget = isBusinessRoute
    ? businessManagementRoutes.gastronomyPedidos(effectiveBusinessId)
    : '/gastronomia';

  return (
    <div className="container max-w-6xl py-6 sm:py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(backTarget)}
          aria-label="Voltar para pedidos"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <h1 className="text-2xl sm:text-3xl font-bold">Pedido #{order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-muted-foreground mt-1">
            {format(parseISO(order.created_at), "dd 'de' MMMM 'de' yyyy 'as' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="text-2xl sm:text-3xl font-bold">R$ {order.total.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">{ORDER_TYPE_LABELS[order.order_type]}</p>
        </div>
      </div>

      {order.order_type === 'delivery' && <OrderTrackingCard order={order} />}

      {isBusinessRoute && (
        <>
          <OrderOperationsPanel order={order} businessId={effectiveBusinessId} />

          <OrderTrustFeedbackPanel order={order} />
        </>
      )}

      <OrderPublicReviewPanel order={order} />

      <div className="grid md:grid-cols-2 gap-6">
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
              <p className="font-medium">{order.customer_name || 'Cliente nao informado'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              {order.customer_phone ? (
                <a
                  href={`tel:${order.customer_phone}`}
                  className="font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <Phone className="h-4 w-4" />
                  {order.customer_phone}
                </a>
              ) : (
                <p className="font-medium text-muted-foreground">Nao informado</p>
              )}
            </div>
          </CardContent>
        </Card>

        {order.order_type === 'delivery' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.delivery_address ? (
                <>
                  <p className="font-medium">{order.delivery_address}</p>
                  {order.delivery_complement && (
                    <p className="text-sm text-muted-foreground">{order.delivery_complement}</p>
                  )}
                  {(order.delivery_neighborhood || order.delivery_city || order.delivery_state) && (
                    <p className="text-sm text-muted-foreground">
                      {[order.delivery_neighborhood, order.delivery_city].filter(Boolean).join(' - ')}
                      {order.delivery_state ? `/${order.delivery_state}` : ''}
                    </p>
                  )}
                  {order.delivery_zipcode && (
                    <p className="text-sm text-muted-foreground">CEP: {order.delivery_zipcode}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Endereco completo ainda nao esta disponivel no pedido. O SSOT deve receber o snapshot do endereco formatado no checkout.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Metodo</p>
              <p className="font-medium">{order.payment_method || 'Nao informado'}</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">R$ {order.subtotal.toFixed(2)}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de entrega</span>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Pedido criado</p>
              <p className="font-medium">{formatDateTime(order.created_at)}</p>
            </div>
            {order.confirmed_at && (
              <div>
                <p className="text-sm text-muted-foreground">Confirmado</p>
                <p className="font-medium">{formatDateTime(order.confirmed_at)}</p>
              </div>
            )}
            {order.ready_at && (
              <div>
                <p className="text-sm text-muted-foreground">Pronto</p>
                <p className="font-medium">{formatDateTime(order.ready_at)}</p>
              </div>
            )}
            {order.delivered_at && (
              <div>
                <p className="text-sm text-muted-foreground">Entregue</p>
                <p className="font-medium">{formatDateTime(order.delivered_at)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {order.status_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Linha do tempo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.status_history.map((event) => (
              <div key={event.id} className="flex gap-3 rounded-lg border p-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="font-medium">
                    {event.from_status ? `${event.from_status} -> ` : ''}
                    {event.to_status}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(event.created_at)}</p>
                  {event.notes && <p className="text-sm mt-1">{event.notes}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {proof && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Comprovante de entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            {proof.code && (
              <div>
                <p className="text-muted-foreground">Codigo</p>
                <p className="font-medium">{proof.code}</p>
              </div>
            )}
            {proof.signed_at && (
              <div>
                <p className="text-muted-foreground">Confirmado em</p>
                <p className="font-medium">{formatDateTime(proof.signed_at)}</p>
              </div>
            )}
            {proof.observation && (
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Observacao</p>
                <p className="font-medium">{proof.observation}</p>
              </div>
            )}
            {proof.photo_url && (
              <div className="md:col-span-2">
                <p className="text-muted-foreground mb-2">Foto</p>
                <img
                  src={proof.photo_url}
                  alt="Comprovante de entrega"
                  className="max-h-72 rounded-lg border object-cover"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Itens do pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item, index) => (
              <div key={item.id ?? index} className="flex justify-between items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex-1 min-w-0">
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
                <p className="font-medium whitespace-nowrap">R$ {item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Observacoes
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
