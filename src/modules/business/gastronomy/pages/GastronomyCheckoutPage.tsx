import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Link2, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useAppUrls } from "@/core/routing/hooks";
import { useSessionContext } from "@/core/session";
import { GastronomyUrlService } from "@/core/verticals/gastronomy/services/GastronomyUrlService";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import { GastronomyDeliveryDestinationPanel } from "../components/GastronomyDeliveryDestinationPanel";
import {
  useDeliveryDestination,
  useGastronomyCart,
  useGastronomyCheckout,
} from "../hooks";
import type { OrderRecord } from "@/core/mobility/delivery/order/types";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { CartItem } from "../types/menu";
import { formatBrl } from "../utils/currency";

type DeliveryFulfillmentMode = "own_fleet" | "platform_courier" | "unspecified";

function resolveDeliveryFulfillmentMode(business: GastronomyBusiness): DeliveryFulfillmentMode {
  const metadata = business.gastronomy_profile.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "unspecified";
  }
  const rawMode =
    (metadata as Record<string, unknown>).delivery_fulfillment_mode ??
    (metadata as Record<string, unknown>).delivery_mode ??
    (metadata as Record<string, unknown>).courier_mode;
  if (typeof rawMode !== "string") return "unspecified";
  const normalizedMode = rawMode.toLowerCase().trim();
  if (["own_fleet", "merchant_own_fleet", "proprio", "frota_propria"].includes(normalizedMode)) {
    return "own_fleet";
  }
  if (["platform_courier", "platform_courier_network", "rede_motoboy", "motoboy_rede"].includes(normalizedMode)) {
    return "platform_courier";
  }
  return "unspecified";
}

function resolveAcceptedPaymentMethods(business: GastronomyBusiness): Set<string> {
  const metadata = business.gastronomy_profile.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return new Set(["pix", "cash", "card_on_delivery"]);
  }
  const methods = (metadata as Record<string, unknown>).accepted_payment_methods;
  if (!Array.isArray(methods)) return new Set(["pix", "cash", "card_on_delivery"]);
  const normalized = methods
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase().trim())
    .filter(Boolean);
  return normalized.length ? new Set(normalized) : new Set(["pix", "cash", "card_on_delivery"]);
}

function buildItemSummary(item: CartItem): string[] {
  const summary: string[] = [];
  if (item.variant?.name) summary.push(item.variant.name);
  if (item.addons.length) summary.push(item.addons.map((addon) => `${addon.quantity}x ${addon.name}`).join(", "));
  if (item.special_instructions) summary.push(item.special_instructions);
  return summary;
}

export default function GastronomyCheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const business = (state as { business?: GastronomyBusiness } | null)?.business;

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground">Checkout inválido. Volte para a loja e reabra o pedido.</p>
        <Button className="mt-4" onClick={() => navigate(GastronomyUrlService.getHomeUrl())}>Voltar</Button>
      </div>
    );
  }

  return <GastronomyCheckoutContent business={business} />;
}

type GastronomyCheckoutContentProps = {
  business: GastronomyBusiness;
};

function GastronomyCheckoutContent({ business }: GastronomyCheckoutContentProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { user, activeProfile } = useSessionContext();

  const { cart, hasCart, minimumOrderReached, minimumOrderRemaining, removeItem } = useGastronomyCart(business);
  const { checkout, isSubmitting, hasActiveProfile } = useGastronomyCheckout();
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [cashChangeFor, setCashChangeFor] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const deliveryDestinationManager = useDeliveryDestination({
    userId: user?.id ?? activeProfile?.userId,
    resolved: null,
    autoRequestLocation: false,
    navigateOnSavedResidenceApply: false,
    allowGpsDestination: false,
  });
  const {
    deliveryDestination,
    showDestinationEditor,
    destinationAddressQuery,
    destinationErrorMessage,
    isResolvingDestinationAddress,
    isLocatingUser,
    destinationSourceLabel,
    savedResidenceLabel,
    hasSavedResidence,
    setShowDestinationEditor,
    setDestinationAddressQuery,
    handleSubmitAddressDestination,
    handleUseSavedResidence,
    handleClearDestination,
  } = deliveryDestinationManager;
  const effectiveDeliveryDestination =
    deliveryDestination?.source === "gps" ? null : deliveryDestination;
  const effectiveDestinationSourceLabel =
    effectiveDeliveryDestination ? destinationSourceLabel : null;

  const requiresDeliveryDestination = business.gastronomy_profile.delivery_enabled;
  const hasDeliveryDestination = Boolean(deliveryDestination && deliveryDestination.source !== "gps");
  const [deliveryAddressMode, setDeliveryAddressMode] = useState<"saved" | "other">("saved");
  useEffect(() => {
    if (!effectiveDeliveryDestination) return;
    setStreetNumber(effectiveDeliveryDestination.number ?? "");
    setComplement(effectiveDeliveryDestination.complement ?? "");
    setReferencePoint(effectiveDeliveryDestination.reference ?? "");
  }, [effectiveDeliveryDestination]);

  useEffect(() => {
    if (!activeProfile) return;
    setRecipientName((current) => current || activeProfile.displayName || activeProfile.name || "");
    setRecipientPhone((current) => current || activeProfile.phone || "");
  }, [activeProfile]);

  useEffect(() => {
    if (!requiresDeliveryDestination) return;
    if (deliveryDestination?.source === "gps") {
      handleClearDestination();
    }
    if (deliveryAddressMode === "saved" && hasSavedResidence) {
      void handleUseSavedResidence();
      return;
    }
    if (deliveryAddressMode === "other") {
      if (deliveryDestination?.source === "gps") {
        handleClearDestination();
      }
      setShowDestinationEditor(true);
    }
  }, [
    deliveryDestination?.source,
    deliveryAddressMode,
    handleClearDestination,
    handleUseSavedResidence,
    hasSavedResidence,
    requiresDeliveryDestination,
    setShowDestinationEditor,
  ]);

  const deliveryDestinationDisplayLabel = useMemo(() => {
    if (!effectiveDeliveryDestination) return null;
    const structured = [
      effectiveDeliveryDestination.street,
      effectiveDeliveryDestination.number,
      effectiveDeliveryDestination.neighborhood,
      effectiveDeliveryDestination.city,
      effectiveDeliveryDestination.state,
      effectiveDeliveryDestination.postalCode,
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" - ");

    return structured || effectiveDeliveryDestination.label || null;
  }, [effectiveDeliveryDestination]);

  const structuredDeliveryReady = useMemo(() => {
    if (!hasDeliveryDestination || !effectiveDeliveryDestination) return false;
    const required = [
      effectiveDeliveryDestination.postalCode,
      effectiveDeliveryDestination.street,
      streetNumber,
      effectiveDeliveryDestination.neighborhood,
      effectiveDeliveryDestination.city,
      effectiveDeliveryDestination.state,
    ];
    return required.every((value) => typeof value === "string" && value.trim().length > 0);
  }, [effectiveDeliveryDestination, hasDeliveryDestination, streetNumber]);
  const deliveryAddress = hasDeliveryDestination
    ? {
        id: `destination:${effectiveDeliveryDestination!.source}`,
        lat: effectiveDeliveryDestination!.latitude,
        lng: effectiveDeliveryDestination!.longitude,
        label: effectiveDeliveryDestination!.label,
      }
    : undefined;

  const deliveryFulfillmentMode = useMemo(() => resolveDeliveryFulfillmentMode(business), [business]);
  const acceptedPaymentMethods = useMemo(() => resolveAcceptedPaymentMethods(business), [business]);
  const canUseCardOnDelivery =
    (!requiresDeliveryDestination || deliveryFulfillmentMode === "own_fleet") &&
    acceptedPaymentMethods.has("card_on_delivery");

  const paymentOptions = useMemo(() => {
    const locationLabel = requiresDeliveryDestination ? "entrega" : "retirada/local";
    const options: Array<{ value: string; label: string; icon: typeof Wallet } | null> = [
      acceptedPaymentMethods.has("pix") ? { value: "pix", label: `PIX na ${locationLabel}`, icon: Wallet } : null,
      acceptedPaymentMethods.has("payment_link") ? { value: "payment_link", label: "Link de pagamento", icon: Link2 } : null,
      acceptedPaymentMethods.has("cash") ? { value: "cash", label: `Dinheiro na ${locationLabel}`, icon: Wallet } : null,
    ];
    if (canUseCardOnDelivery) options.splice(1, 0, { value: "card_on_delivery", label: `Cartão na ${locationLabel}`, icon: CreditCard });
    return options.filter((o): o is { value: string; label: string; icon: typeof Wallet } => Boolean(o));
  }, [acceptedPaymentMethods, canUseCardOnDelivery, requiresDeliveryDestination]);

  useEffect(() => {
    if (!paymentOptions.some((option) => option.value === paymentMethod)) {
      setPaymentMethod(paymentOptions[0]?.value ?? "pix");
    }
  }, [paymentMethod, paymentOptions]);

  const isCheckoutDisabled =
    !hasCart ||
    !minimumOrderReached ||
    isSubmitting ||
    !hasActiveProfile ||
    (requiresDeliveryDestination && (!hasDeliveryDestination || !structuredDeliveryReady));

  const handleSubmit = async () => {
    try {
      const normalizedChange = cashChangeFor.trim();
      const changeNote = paymentMethod === "cash" && normalizedChange.length > 0 ? `Troco para: R$ ${normalizedChange}` : null;
      const normalizedNotes = [changeNote, customerNotes.trim() || null].filter(Boolean).join(" | ");
      const addressNotes = requiresDeliveryDestination
        ? [
            effectiveDeliveryDestination?.postalCode ? `CEP: ${effectiveDeliveryDestination.postalCode}` : null,
            effectiveDeliveryDestination?.street ? `Rua: ${effectiveDeliveryDestination.street}` : null,
            streetNumber.trim() ? `Número: ${streetNumber.trim()}` : null,
            complement.trim() ? `Complemento: ${complement.trim()}` : null,
            referencePoint.trim() ? `Referência: ${referencePoint.trim()}` : null,
          ]
            .filter(Boolean)
            .join(" | ")
        : null;
      const order: OrderRecord = await checkout({
        business,
        cart,
        payment_method: paymentMethod,
        notes: [normalizedNotes || null, addressNotes]
          .filter((value): value is string => typeof value === "string" && value.length > 0)
          .join(" | ") || undefined,
        deliveryAddress: deliveryAddress
          ? {
              ...deliveryAddress,
              recipient_name: recipientName.trim() || undefined,
              phone: recipientPhone.trim() || undefined,
              postal_code: effectiveDeliveryDestination?.postalCode ?? undefined,
              street: effectiveDeliveryDestination?.street ?? undefined,
              number: streetNumber.trim() || undefined,
              complement: complement.trim() || undefined,
              reference: referencePoint.trim() || undefined,
              neighborhood: effectiveDeliveryDestination?.neighborhood ?? undefined,
              city: effectiveDeliveryDestination?.city ?? undefined,
              state: effectiveDeliveryDestination?.state ?? undefined,
            }
          : undefined,
      });
      toast.success(`Pedido ${order.id.slice(0, 8)} criado com sucesso.`);
      navigate(businessManagementRoutes.gastronomyPedidoPublico(order.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao concluir o pedido.");
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
        <Link to={appUrls.auth.login} className="text-xs text-muted-foreground">Trocar conta</Link>
      </div>
      <h1 className="text-2xl font-bold">Confirmar pedido</h1>
      <p className="mt-1 text-sm text-muted-foreground">Endereço de entrega e pagamento direto com a loja.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          {requiresDeliveryDestination && (
            <div className="space-y-3">
              <div className="rounded-xl border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Endereço de entrega</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryAddressMode("saved")}
                    disabled={!hasSavedResidence}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${
                      deliveryAddressMode === "saved"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    } ${!hasSavedResidence ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    Usar endereço do perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryAddressMode("other")}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${
                      deliveryAddressMode === "other"
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    Usar outro endereço
                  </button>
                </div>
                {!hasSavedResidence && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Nenhum endereço salvo no perfil. Informe outro endereço para esta entrega.
                  </p>
                )}
              </div>
              <GastronomyDeliveryDestinationPanel
                destinationLabel={deliveryDestinationDisplayLabel}
                destinationSourceLabel={effectiveDestinationSourceLabel}
                isEditing={showDestinationEditor}
                addressQuery={destinationAddressQuery}
                isResolvingAddress={isResolvingDestinationAddress}
                isLocatingUser={isLocatingUser}
                hasSavedAddressOption={hasSavedResidence}
                savedAddressLabel={savedResidenceLabel}
                isAuthenticated={Boolean(user)}
                errorMessage={destinationErrorMessage}
                onAddressQueryChange={setDestinationAddressQuery}
                onSubmitAddress={handleSubmitAddressDestination}
                onUseCurrentLocation={() => {}}
                onUseSavedAddress={handleUseSavedResidence}
                onOpenEditor={() => setShowDestinationEditor(true)}
                onCloseEditor={() => setShowDestinationEditor(false)}
                onGoToLogin={() => navigate(appUrls.auth.login)}
                showCurrentLocationAction={false}
              />
              <div className="rounded-xl border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Dados do endereço de entrega</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={effectiveDeliveryDestination?.postalCode ?? ""} readOnly placeholder="CEP" />
                  <Input value={effectiveDeliveryDestination?.street ?? ""} readOnly placeholder="Rua" />
                  <Input value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} placeholder="Número *" />
                  <Input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Complemento" />
                  <Input value={effectiveDeliveryDestination?.neighborhood ?? ""} readOnly placeholder="Bairro" />
                  <Input value={effectiveDeliveryDestination?.city ?? ""} readOnly placeholder="Cidade" />
                  <Input value={effectiveDeliveryDestination?.state ?? ""} readOnly placeholder="UF" />
                  <Input value={referencePoint} onChange={(e) => setReferencePoint(e.target.value)} placeholder="Ponto de referencia" />
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Nome de quem recebe" />
                  <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="Telefone de contato" />
                </div>
              </div>
            </div>
          )}

          <section className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold">Itens do pedido</h2>
            <div className="mt-3 space-y-3">
              {cart.items.map((item) => {
                const summary = buildItemSummary(item);
                return (
                  <div key={item.line_id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">{item.quantity}x {item.name}</p>
                        {summary.map((entry) => <p key={`${item.line_id}-${entry}`} className="text-xs text-muted-foreground">{entry}</p>)}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{formatBrl(item.subtotal)}</p>
                        <Button size="icon" variant="ghost" onClick={() => removeItem(item.line_id!)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border bg-card p-4">
            <h2 className="font-semibold">Pagamento</h2>
            <div className="mt-3 grid gap-2">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = paymentMethod === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPaymentMethod(option.value)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span className="text-sm">{option.label}</span></div>
                    {isSelected && <Badge>OK</Badge>}
                  </button>
                );
              })}
            </div>
            {paymentMethod === "cash" && (
              <div className="mt-3">
                <Input inputMode="decimal" placeholder="Troco para (opcional)" value={cashChangeFor} onChange={(e) => setCashChangeFor(e.target.value)} />
              </div>
            )}
            <div className="mt-3">
              <Textarea placeholder="Observações do pedido" value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} maxLength={280} />
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatBrl(cart.subtotal)}</span></div>
              <div className="flex justify-between"><span>Entrega</span><span>{formatBrl(cart.delivery_fee)}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatBrl(cart.total)}</span></div>
            </div>
            {minimumOrderRemaining > 0 && <p className="mt-3 text-xs text-amber-700">Faltam {formatBrl(minimumOrderRemaining)} para o mínimo.</p>}
            {requiresDeliveryDestination && !hasDeliveryDestination && (
              <p className="mt-3 text-xs text-amber-700">Informe o endereço completo de entrega para continuar.</p>
            )}
            {requiresDeliveryDestination && hasDeliveryDestination && !structuredDeliveryReady && (
              <p className="mt-3 text-xs text-amber-700">Preencha CEP, rua, número, bairro, cidade e UF para confirmar.</p>
            )}
            <Button className="mt-4 w-full" size="lg" disabled={isCheckoutDisabled} onClick={handleSubmit}>
              {isSubmitting ? "Criando pedido..." : "Confirmar pedido"}
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
