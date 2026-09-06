/**
 * GastronomySetupPage - Configuracao do perfil gastronomico
 *
 * Rota: /central/empresas/:businessId/gastronomia/setup
 *
 * Permite criar ou editar o gastronomy_profile de uma empresa elegivel.
 * Integrada ao fluxo pos-criacao de empresa e ao dashboard.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useOptionalBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, UtensilsCrossed } from "lucide-react";
import { z } from "zod";
import { getCuisineSuggestionFromCategory } from "@/core/verticals";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import { CUISINE_TYPES, getCuisineLabel } from "../constants/cuisine";
import { useGastronomySetup } from "../hooks/useGastronomySetup";
import type { PriceRange } from "../types/gastronomy";

const setupSchema = z
  .object({
    cuisine_type: z.string().min(1, "Selecione o tipo de culinaria"),
    price_range: z.enum(["$", "$$", "$$$", "$$$$"]),
    delivery_enabled: z.boolean(),
    takeout_enabled: z.boolean(),
    dine_in_enabled: z.boolean(),
    accepts_reservations: z.boolean(),
    has_parking: z.boolean(),
    has_wifi: z.boolean(),
    has_accessibility: z.boolean(),
    has_kids_area: z.boolean(),
    has_live_music: z.boolean(),
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
      path: ["accepts_payment_pix"],
      message: "Selecione ao menos uma forma de pagamento.",
    },
  );

type SetupFormValues = z.infer<typeof setupSchema>;

const PRICE_RANGE_LABELS: Record<PriceRange, string> = {
  $: "$ - Economico (ate R$30)",
  $$: "$$ - Moderado (R$30-60)",
  $$$: "$$$ - Sofisticado (R$60-120)",
  $$$$: "$$$$ - Premium (acima de R$120)",
};

export default function GastronomySetupPage({
  businessId: propBusinessId,
  businessDataId: propBusinessDataId,
}: { businessId?: string; businessDataId?: string } = {}) {
  const params = useParams<{ businessId: string }>();
  const dashboardContext = useOptionalBusinessDashboardContext();
  const businessId =
    propBusinessId ?? dashboardContext?.businessId ?? params.businessId;
  const businessDataId =
    propBusinessDataId ?? dashboardContext?.businessDataId;
  const navigate = useNavigate();
  const { profile, businessCategory, isLoading, isNew, isSubmitting, save } =
    useGastronomySetup(businessDataId || "");

  const suggestedCuisine = businessCategory
    ? getCuisineSuggestionFromCategory(businessCategory)
    : null;

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      cuisine_type: suggestedCuisine || "",
      price_range: "$",
      delivery_enabled: false,
      takeout_enabled: false,
      dine_in_enabled: true,
      accepts_reservations: false,
      has_parking: false,
      has_wifi: false,
      has_accessibility: false,
      has_kids_area: false,
      has_live_music: false,
      accepts_payment_pix: true,
      accepts_payment_cash: true,
      accepts_payment_card_on_delivery: true,
      accepts_payment_link: false,
    },
  });

  useEffect(() => {
    if (!profile) return;

    const metadata =
      profile.metadata &&
      typeof profile.metadata === "object" &&
      !Array.isArray(profile.metadata)
        ? (profile.metadata as Record<string, unknown>)
        : {};
    const acceptedPaymentMethods = Array.isArray(
      metadata.accepted_payment_methods,
    )
      ? metadata.accepted_payment_methods.filter(
          (value): value is string => typeof value === "string",
        )
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
      accepts_payment_pix:
        acceptedPaymentMethods.length === 0 ||
        acceptedPaymentMethods.includes("pix"),
      accepts_payment_cash:
        acceptedPaymentMethods.length === 0 ||
        acceptedPaymentMethods.includes("cash"),
      accepts_payment_card_on_delivery:
        acceptedPaymentMethods.length === 0 ||
        acceptedPaymentMethods.includes("card_on_delivery"),
      accepts_payment_link: acceptedPaymentMethods.includes("payment_link"),
    });
  }, [form, profile]);

  const onSubmit = async (values: SetupFormValues) => {
    const accepted_payment_methods = [
      values.accepts_payment_pix ? "pix" : null,
      values.accepts_payment_cash ? "cash" : null,
      values.accepts_payment_card_on_delivery ? "card_on_delivery" : null,
      values.accepts_payment_link ? "payment_link" : null,
    ].filter((method): method is string => Boolean(method));

    const baseMetadata =
      profile?.metadata &&
      typeof profile.metadata === "object" &&
      !Array.isArray(profile.metadata)
        ? (profile.metadata as Record<string, unknown>)
        : {};

    const saved = await save({
      business_id: businessDataId!,
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
        delivery_fulfillment_mode: "own_fleet",
        accepted_payment_methods,
      },
    });

    if (saved) {
      navigate(businessManagementRoutes.gastronomia(businessId!));
    }
  };

  if (!businessId || !businessDataId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          Os dados canônicos da empresa não foram carregados. A configuração de Gastronomia foi bloqueada para evitar gravar no negócio incorreto.
        </div>
      </div>
    );
  }

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
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() =>
            navigate(businessManagementRoutes.overview(businessId!))
          }
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">
            {isNew ? "Ativar Modulo Gastronomia" : "Configurar Gastronomia"}
          </h1>
        </div>
        {!isNew && (
          <Badge
            variant="outline"
            className="ml-auto gap-1 text-emerald-600 border-emerald-500/30"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ativo
          </Badge>
        )}
      </div>

      {isNew && (
        <p className="text-sm text-muted-foreground mb-6">
          Configure o perfil gastronomico da sua empresa para aparecer na
          listagem de gastronomia, habilitar cardapio digital e receber pedidos.
        </p>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipo de Culinaria</CardTitle>
            <CardDescription>
              Define como sua empresa aparece nas buscas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Culinaria principal *</Label>
              <Select
                value={form.watch("cuisine_type")}
                onValueChange={(value) => form.setValue("cuisine_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de culinaria" />
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
                <p className="text-xs text-destructive">
                  {form.formState.errors.cuisine_type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Faixa de preco *</Label>
              <Select
                value={form.watch("price_range")}
                onValueChange={(value) =>
                  form.setValue("price_range", value as PriceRange)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(PRICE_RANGE_LABELS) as [PriceRange, string][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modos de Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                {
                  field: "delivery_enabled",
                  label: "Delivery",
                  desc: "Entrega em domicilio",
                },
                {
                  field: "takeout_enabled",
                  label: "Retirada",
                  desc: "Cliente retira no local",
                },
                {
                  field: "dine_in_enabled",
                  label: "No local",
                  desc: "Atendimento presencial",
                },
              ] as const
            ).map(({ field, label, desc }) => (
              <div key={field} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={form.watch(field)}
                  onCheckedChange={(checked) => form.setValue(field, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recursos e Facilidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                { field: "accepts_reservations", label: "Aceita reservas" },
                { field: "has_parking", label: "Estacionamento" },
                { field: "has_wifi", label: "Wi-Fi" },
                { field: "has_accessibility", label: "Acessibilidade" },
                { field: "has_kids_area", label: "Espaco kids" },
                { field: "has_live_music", label: "Musica ao vivo" },
              ] as const
            ).map(({ field, label }) => (
              <div key={field} className="flex items-center justify-between">
                <p className="text-sm font-medium">{label}</p>
                <Switch
                  checked={form.watch(field)}
                  onCheckedChange={(checked) => form.setValue(field, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entrega e Pagamento</CardTitle>
            <CardDescription>
              Define o que o cliente pode selecionar no checkout. Link de
              pagamento e opcional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Modelo de entrega</Label>
              <div className="rounded-lg border bg-muted/30 px-3 py-3">
                <p className="text-sm font-medium">Frota propria da loja</p>
                <p className="text-xs text-muted-foreground">
                  O checkout oficial de Gastronomia aceita apenas entrega
                  propria neste lancamento. Rede de motoboy da plataforma
                  permanece fora do fluxo v1.
                </p>
              </div>
            </div>

            {(
              [
                { field: "accepts_payment_pix", label: "Aceitar PIX" },
                { field: "accepts_payment_cash", label: "Aceitar dinheiro" },
                {
                  field: "accepts_payment_card_on_delivery",
                  label: "Aceitar cartao na entrega/retirada",
                },
                {
                  field: "accepts_payment_link",
                  label: "Aceitar link de pagamento",
                },
              ] as const
            ).map(({ field, label }) => (
              <div key={field} className="flex items-center justify-between">
                <p className="text-sm font-medium">{label}</p>
                <Switch
                  checked={form.watch(field)}
                  onCheckedChange={(checked) => form.setValue(field, checked)}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Se sua empresa nao usa gateway/link, deixe essa opcao desmarcada.
            </p>
            {form.formState.errors.accepts_payment_pix?.message && (
              <p className="text-xs text-destructive">
                {form.formState.errors.accepts_payment_pix.message}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(businessManagementRoutes.overview(businessId!))
            }
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting
              ? "Salvando..."
              : isNew
                ? "Ativar Gastronomia"
                : "Salvar Alteracoes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
