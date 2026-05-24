/**
 * GastronomySetupPage — Configuração do perfil gastronômico
 *
 * Rota: /central/empresas/:businessId/gastronomia/setup
 *
 * Permite criar ou editar o gastronomy_profile de uma empresa elegível.
 * Integrada ao fluxo pós-criação de empresa e ao dashboard.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';

import { CUISINE_TYPES, getCuisineLabel } from '../constants/cuisine';
import { useGastronomySetup } from '../hooks/useGastronomySetup';
import type { PriceRange } from '../types/gastronomy';
import { getCuisineSuggestionFromCategory } from '@/core/verticals';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';

// ── Schema de validação ───────────────────────────────────────────────────────

const setupSchema = z
  .object({
    cuisine_type: z.string().min(1, 'Selecione o tipo de culinária'),
    price_range: z.enum(['$', '$$', '$$$', '$$$$']),
    delivery_enabled: z.boolean(),
    takeout_enabled: z.boolean(),
    dine_in_enabled: z.boolean(),
    accepts_reservations: z.boolean(),
    has_parking: z.boolean(),
    has_wifi: z.boolean(),
    has_accessibility: z.boolean(),
    has_kids_area: z.boolean(),
    has_live_music: z.boolean(),
    delivery_fulfillment_mode: z.enum(['own_fleet', 'platform_courier']),
    accepts_payment_pix: z.boolean(),
    accepts_payment_cash: z.boolean(),
    accepts_payment_card_on_delivery: z.boolean(),
    accepts_payment_link: z.boolean(),
  })
  .refine(
    (values) =>
      values.accepts_payment_pix ||
      values.accepts_payment_cash ||
      values.accepts_payment_card_on_delivery ||
      values.accepts_payment_link,
    {
      path: ['accepts_payment_pix'],
      message: 'Selecione ao menos uma forma de pagamento.',
    },
  );

type SetupFormValues = z.infer<typeof setupSchema>;

const PRICE_RANGE_LABELS: Record<PriceRange, string> = {
  '$': '$ — Econômico (até R$30)',
  '$$': '$$ — Moderado (R$30–60)',
  '$$$': '$$$ — Sofisticado (R$60–120)',
  '$$$$': '$$$$ — Premium (acima de R$120)',
};

// ── Componente ────────────────────────────────────────────────────────────────

export default function GastronomySetupPage({ businessId: propBusinessId }: { businessId?: string } = {}) {
  const params = useParams<{ businessId: string }>();
  const businessId = propBusinessId ?? params.businessId;
  const navigate = useNavigate();
  const { profile, businessCategory, isLoading, isNew, isSubmitting, save } = useGastronomySetup(businessId!);

  // Sugestão inteligente de cuisine_type baseado na category
  const suggestedCuisine = businessCategory ? getCuisineSuggestionFromCategory(businessCategory) : null;

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      cuisine_type: suggestedCuisine || '',
      price_range: '$',
      delivery_enabled: false,
      takeout_enabled: false,
      dine_in_enabled: true,
      accepts_reservations: false,
      has_parking: false,
      has_wifi: false,
      has_accessibility: false,
      has_kids_area: false,
      has_live_music: false,
      delivery_fulfillment_mode: 'own_fleet',
      accepts_payment_pix: true,
      accepts_payment_cash: true,
      accepts_payment_card_on_delivery: true,
      accepts_payment_link: false,
    },
  });

  // Preencher form com dados existentes
  useEffect(() => {
    if (profile) {
      const metadata =
        profile.metadata && typeof profile.metadata === 'object' && !Array.isArray(profile.metadata)
          ? (profile.metadata as Record<string, unknown>)
          : {};
      const acceptedPaymentMethods = Array.isArray(metadata.accepted_payment_methods)
        ? metadata.accepted_payment_methods.filter((value): value is string => typeof value === 'string')
        : [];

      form.reset({
        cuisine_type: profile.cuisine_type,
        price_range: profile.price_range,
        delivery_enabled: profile.delivery_enabled,
        takeout_enabled: profile.takeout_enabled,
        dine_in_enabled: profile.dine_in_enabled,
        accepts_reservations: profile.accepts_reservations,
        has_parking: profile.has_parking,
        has_wifi: profile.has_wifi,
        has_accessibility: profile.has_accessibility,
        has_kids_area: profile.has_kids_area,
        has_live_music: profile.has_live_music,
        delivery_fulfillment_mode:
          metadata.delivery_fulfillment_mode === 'platform_courier' ? 'platform_courier' : 'own_fleet',
        accepts_payment_pix:
          acceptedPaymentMethods.length === 0 || acceptedPaymentMethods.includes('pix'),
        accepts_payment_cash:
          acceptedPaymentMethods.length === 0 || acceptedPaymentMethods.includes('cash'),
        accepts_payment_card_on_delivery:
          acceptedPaymentMethods.length === 0 || acceptedPaymentMethods.includes('card_on_delivery'),
        accepts_payment_link: acceptedPaymentMethods.includes('payment_link'),
      });
    }
  }, [profile, form]);

  const onSubmit = async (values: SetupFormValues) => {
    const accepted_payment_methods = [
      values.accepts_payment_pix ? 'pix' : null,
      values.accepts_payment_cash ? 'cash' : null,
      values.accepts_payment_card_on_delivery ? 'card_on_delivery' : null,
      values.accepts_payment_link ? 'payment_link' : null,
    ].filter((method): method is string => Boolean(method));

    const baseMetadata =
      profile?.metadata && typeof profile.metadata === 'object' && !Array.isArray(profile.metadata)
        ? (profile.metadata as Record<string, unknown>)
        : {};

    await save({
      business_id: businessId!,
      cuisine_type: values.cuisine_type,
      price_range: values.price_range,
      delivery_enabled: values.delivery_enabled,
      takeout_enabled: values.takeout_enabled,
      dine_in_enabled: values.dine_in_enabled,
      accepts_reservations: values.accepts_reservations,
      has_parking: values.has_parking,
      has_wifi: values.has_wifi,
      has_accessibility: values.has_accessibility,
      has_kids_area: values.has_kids_area,
      has_live_music: values.has_live_music,
      metadata: {
        ...baseMetadata,
        delivery_fulfillment_mode: values.delivery_fulfillment_mode,
        accepted_payment_methods,
      },
    });
    // Após salvar, volta para o dashboard
    navigate(businessManagementRoutes.overview(businessId!));
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(businessManagementRoutes.overview(businessId!))}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">
            {isNew ? 'Ativar Módulo Gastronomia' : 'Configurar Gastronomia'}
          </h1>
        </div>
        {!isNew && (
          <Badge variant="outline" className="ml-auto gap-1 text-emerald-600 border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ativo
          </Badge>
        )}
      </div>

      {isNew && (
        <p className="text-sm text-muted-foreground mb-6">
          Configure o perfil gastronômico da sua empresa para aparecer na listagem de gastronomia,
          habilitar cardápio digital e receber pedidos.
        </p>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Tipo de culinária */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipo de Culinária</CardTitle>
            <CardDescription>Define como sua empresa aparece nas buscas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Culinária principal *</Label>
              <Select
                value={form.watch('cuisine_type')}
                onValueChange={(v) => form.setValue('cuisine_type', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de culinária" />
                </SelectTrigger>
                <SelectContent>
                  {CUISINE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getCuisineLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.cuisine_type && (
                <p className="text-xs text-destructive">{form.formState.errors.cuisine_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Faixa de preço *</Label>
              <Select
                value={form.watch('price_range')}
                onValueChange={(v) => form.setValue('price_range', v as PriceRange)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PRICE_RANGE_LABELS) as [PriceRange, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Modos de atendimento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modos de Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {([
              { field: 'delivery_enabled', label: 'Delivery', desc: 'Entrega em domicílio' },
              { field: 'takeout_enabled', label: 'Retirada', desc: 'Cliente retira no local' },
              { field: 'dine_in_enabled', label: 'No local', desc: 'Atendimento presencial' },
            ] as const).map(({ field, label, desc }) => (
              <div key={field} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={form.watch(field)}
                  onCheckedChange={(v) => form.setValue(field, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recursos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recursos e Facilidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {([
              { field: 'accepts_reservations', label: 'Aceita reservas' },
              { field: 'has_parking', label: 'Estacionamento' },
              { field: 'has_wifi', label: 'Wi-Fi' },
              { field: 'has_accessibility', label: 'Acessibilidade' },
              { field: 'has_kids_area', label: 'Espaço kids' },
              { field: 'has_live_music', label: 'Música ao vivo' },
            ] as const).map(({ field, label }) => (
              <div key={field} className="flex items-center justify-between">
                <p className="text-sm font-medium">{label}</p>
                <Switch
                  checked={form.watch(field)}
                  onCheckedChange={(v) => form.setValue(field, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entrega e Pagamento</CardTitle>
            <CardDescription>
              Define o que o cliente pode selecionar no checkout. Link de pagamento e opcional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modelo de entrega</Label>
              <Select
                value={form.watch('delivery_fulfillment_mode')}
                onValueChange={(v) => form.setValue('delivery_fulfillment_mode', v as 'own_fleet' | 'platform_courier')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="own_fleet">Frota propria</SelectItem>
                  <SelectItem value="platform_courier">Rede de motoboy da plataforma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {([
              { field: 'accepts_payment_pix', label: 'Aceitar PIX' },
              { field: 'accepts_payment_cash', label: 'Aceitar dinheiro' },
              { field: 'accepts_payment_card_on_delivery', label: 'Aceitar cartão na entrega/retirada' },
              { field: 'accepts_payment_link', label: 'Aceitar link de pagamento' },
            ] as const).map(({ field, label }) => (
              <div key={field} className="flex items-center justify-between">
                <p className="text-sm font-medium">{label}</p>
                <Switch
                  checked={form.watch(field)}
                  onCheckedChange={(v) => form.setValue(field, v)}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Se sua empresa não usa gateway/link, deixe essa opção desmarcada.
            </p>
            {form.formState.errors.accepts_payment_pix?.message && (
              <p className="text-xs text-destructive">
                {form.formState.errors.accepts_payment_pix.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(businessManagementRoutes.overview(businessId!))}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Salvando...' : isNew ? 'Ativar Gastronomia' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
