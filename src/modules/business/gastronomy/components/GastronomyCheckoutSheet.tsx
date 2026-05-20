import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Link2, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { useAppUrls } from "@/core/routing/hooks";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Separator } from "@/shared/components/ui/separator";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { useSessionContext } from "@/core/session";
import {
  useDeliveryDestination,
  useGastronomyCart,
  useGastronomyCheckout,
} from "../hooks";
import type { OrderRecord } from "@/core/mobility/delivery/order/types";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { CartItem } from "../types/menu";
import { GastronomyDeliveryDestinationPanel } from "./GastronomyDeliveryDestinationPanel";

interface Props {
  business: GastronomyBusiness;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: (order: OrderRecord) => void;
}

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

  if (typeof rawMode !== "string") {
    return "unspecified";
  }

  const normalizedMode = rawMode.toLowerCase().trim();
  if (
    normalizedMode === "own_fleet" ||
    normalizedMode === "merchant_own_fleet" ||
    normalizedMode === "proprio" ||
    normalizedMode === "frota_propria"
  ) {
    return "own_fleet";
  }

  if (
    normalizedMode === "platform_courier" ||
    normalizedMode === "platform_courier_network" ||
    normalizedMode === "rede_motoboy" ||
    normalizedMode === "motoboy_rede"
  ) {
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
  if (!Array.isArray(methods)) {
    return new Set(["pix", "cash", "card_on_delivery"]);
  }

  const normalized = methods
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase().trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    return new Set(["pix", "cash", "card_on_delivery"]);
  }

  return new Set(normalized);
}

function buildItemSummary(item: CartItem): string[] {
  const summary: string[] = [];

  if (item.structured_item?.kind === "pizza") {
    const snapshot = item.structured_item.snapshot as {
      size?: { name?: string };
      flavors?: Array<{ name?: string; fraction?: number }>;
      edge?: { name?: string } | null;
      dough?: { name?: string } | null;
      price_rule?: string;
    };

    if (snapshot.flavors?.length) {
      summary.push(
        ...snapshot.flavors.map((flavor) => {
          const fraction = flavor.fraction ? `${Math.round(flavor.fraction * 100)}%` : "";
          return `${fraction} ${flavor.name ?? "Sabor"}`.trim();
        }),
      );
    }

    if (snapshot.edge?.name) {
      summary.push(`Borda: ${snapshot.edge.name}`);
    }

    if (snapshot.dough?.name) {
      summary.push(`Massa: ${snapshot.dough.name}`);
    }

    return summary;
  }

  if (item.variant?.name) {
    summary.push(item.variant.name);
  }

  if (item.addons.length) {
    summary.push(
      item.addons
        .map((addon) => `${addon.quantity}x ${addon.name}`)
        .join(", "),
    );
  }

  if (item.special_instructions) {
    summary.push(item.special_instructions);
  }

  return summary;
}

export function GastronomyCheckoutSheet({
  business,
  open,
  onOpenChange,
  onOrderCreated,
}: Props) {
  const {
    cart,
    hasCart,
    minimumOrderReached,
    minimumOrderRemaining,
    removeItem,
  } = useGastronomyCart(business);
  const { checkout, isSubmitting, hasActiveProfile } = useGastronomyCheckout();
  const { user, activeProfile } = useSessionContext();
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [cashChangeFor, setCashChangeFor] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
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
    handleActivateLocation,
    handleSubmitAddressDestination,
    handleUseSavedResidence,
  } = deliveryDestinationManager;
  const effectiveDeliveryDestination =
    deliveryDestination?.source === "gps" ? null : deliveryDestination;
  const effectiveDestinationSourceLabel =
    effectiveDeliveryDestination ? destinationSourceLabel : null;

  const deliveryAddress = useMemo(() => {
    if (!effectiveDeliveryDestination) {
      return undefined;
    }

    return {
      id: `destination:${effectiveDeliveryDestination.source}`,
      lat: effectiveDeliveryDestination.latitude,
      lng: effectiveDeliveryDestination.longitude,
      recipient_name: undefined,
      phone: undefined,
      label: effectiveDeliveryDestination.label,
    };
  }, [effectiveDeliveryDestination]);

  const requiresDeliveryDestination = business.gastronomy_profile.delivery_enabled;
  const deliveryFulfillmentMode = useMemo(
    () => resolveDeliveryFulfillmentMode(business),
    [business],
  );
  const acceptedPaymentMethods = useMemo(
    () => resolveAcceptedPaymentMethods(business),
    [business],
  );
  const canUseCardOnDelivery =
    (!requiresDeliveryDestination || deliveryFulfillmentMode === "own_fleet") &&
    acceptedPaymentMethods.has("card_on_delivery");
  const paymentOptions = useMemo(() => {
    const locationLabel = requiresDeliveryDestination ? "entrega" : "retirada/local";
    const options: Array<{ value: string; label: string; icon: typeof Wallet }> = [
      acceptedPaymentMethods.has("pix")
        ? {
            value: "pix",
            label: `PIX na ${locationLabel}`,
            icon: Wallet,
          }
        : null,
      acceptedPaymentMethods.has("payment_link")
        ? {
            value: "payment_link",
            label: "Link de pagamento (enviado pela loja)",
            icon: Link2,
          }
        : null,
      acceptedPaymentMethods.has("cash")
        ? {
            value: "cash",
            label: `Dinheiro na ${locationLabel}`,
            icon: Wallet,
          }
        : null,
    ];

    if (canUseCardOnDelivery) {
      options.splice(1, 0, {
        value: "card_on_delivery",
        label: `Cartao na ${locationLabel}`,
        icon: CreditCard,
      });
    }

    const filtered = options.filter(
      (option): option is { value: string; label: string; icon: typeof Wallet } => Boolean(option),
    );
    if (filtered.length === 0) {
      return [
        {
          value: "pix",
          label: `PIX na ${locationLabel}`,
          icon: Wallet,
        },
      ];
    }
    return filtered;
  }, [acceptedPaymentMethods, canUseCardOnDelivery, requiresDeliveryDestination]);
  const hasDeliveryDestination = Boolean(deliveryAddress);
  const isCheckoutDisabled =
    !hasCart ||
    !minimumOrderReached ||
    isSubmitting ||
    !hasActiveProfile ||
    (requiresDeliveryDestination && !hasDeliveryDestination);

  const minimumOrderLabel = useMemo(() => {
    if (minimumOrderRemaining <= 0) return null;
    return `Faltam R$ ${minimumOrderRemaining.toFixed(2)} para atingir o pedido minimo.`;
  }, [minimumOrderRemaining]);

  useEffect(() => {
    if (!paymentOptions.some((option) => option.value === paymentMethod)) {
      setPaymentMethod(paymentOptions[0]?.value ?? "pix");
    }
  }, [paymentMethod, paymentOptions]);

  useEffect(() => {
    if (!open || !requiresDeliveryDestination) return;
    if (!hasSavedResidence) return;
    if (deliveryDestination && deliveryDestination.source !== "gps") return;
    void handleUseSavedResidence();
  }, [
    deliveryDestination,
    handleUseSavedResidence,
    hasSavedResidence,
    open,
    requiresDeliveryDestination,
  ]);

  const handleSubmit = async () => {
    try {
      const normalizedChange = cashChangeFor.trim();
      const changeNote =
        paymentMethod === "cash" && normalizedChange.length > 0
          ? `Troco para: R$ ${normalizedChange}`
          : null;
      const normalizedNotes = [changeNote, customerNotes.trim() || null]
        .filter(Boolean)
        .join(" | ");

      const order = await checkout({
        business,
        cart,
        payment_method: paymentMethod,
        notes: normalizedNotes || undefined,
        deliveryAddress,
      });

      onOrderCreated?.(order);
      onOpenChange(false);
      setCustomerNotes("");
      setCashChangeFor("");
      toast.success(`Pedido ${order.id.slice(0, 8)} criado com sucesso.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha ao concluir o pedido.";
      toast.error(message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Revisar pedido</SheetTitle>
          <SheetDescription>
            O pagamento acontece direto com o estabelecimento. O app registra o
            pedido e acompanha a operacao da entrega.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Itens</h3>
              <Badge variant="outline">{cart.items.length} linhas</Badge>
            </div>

            <div className="space-y-3">
              {cart.items.map((item) => {
                const summary = buildItemSummary(item);

                return (
                  <div
                    key={item.line_id}
                    className="rounded-xl border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.quantity}x</span>
                          <p className="font-semibold">{item.name}</p>
                        </div>
                        {summary.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {summary.map((entry) => (
                              <p
                                key={`${item.line_id}-${entry}`}
                                className="text-sm text-muted-foreground"
                              >
                                {entry}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            R$ {item.subtotal.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Base R$ {item.base_price.toFixed(2)}
                          </p>
                        </div>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item.line_id!)}
                          aria-label={`Remover ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!cart.items.length && (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Nenhum item no carrinho.
                </div>
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="font-semibold">Forma de pagamento</h3>
            <p className="text-sm text-muted-foreground">
              Pagamento realizado diretamente com o estabelecimento, no momento da entrega ou retirada.
            </p>
            <div className="grid gap-2">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = paymentMethod === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPaymentMethod(option.value)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    {isSelected && <Badge>Selecionado</Badge>}
                  </button>
                );
              })}
            </div>
            {requiresDeliveryDestination && deliveryFulfillmentMode === "platform_courier" && (
              <p className="text-sm text-amber-700">
                Entrega por rede de motoboy: cartao na entrega pode nao estar disponivel. Prefira PIX, link de pagamento ou dinheiro.
              </p>
            )}
            {paymentMethod === "cash" && (
              <div className="space-y-2 rounded-xl border bg-background p-3">
                <label className="text-sm font-medium" htmlFor="cash-change-for">
                  Troco para (opcional)
                </label>
                <Input
                  id="cash-change-for"
                  inputMode="decimal"
                  placeholder="Ex.: 100,00"
                  value={cashChangeFor}
                  onChange={(event) => setCashChangeFor(event.target.value)}
                />
              </div>
            )}
          </section>

          <section className="space-y-3">
            {requiresDeliveryDestination && (
              <GastronomyDeliveryDestinationPanel
                destinationLabel={effectiveDeliveryDestination?.label ?? null}
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
                onUseCurrentLocation={handleActivateLocation}
                onUseSavedAddress={handleUseSavedResidence}
                onOpenEditor={() => setShowDestinationEditor(true)}
                onCloseEditor={() => setShowDestinationEditor(false)}
                onGoToLogin={() => {
                  navigate(appUrls.auth.login);
                }}
                showCurrentLocationAction={false}
              />
            )}

            <h3 className="font-semibold">Observacoes do pedido</h3>
            <Textarea
              placeholder="Ex.: interfone 12, troco para 100, entregar na portaria."
              value={customerNotes}
              onChange={(event) => setCustomerNotes(event.target.value)}
              maxLength={280}
            />
          </section>

          <section className="rounded-xl border bg-muted/30 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entrega</span>
                <span>R$ {cart.delivery_fee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">R$ {cart.total.toFixed(2)}</span>
              </div>
            </div>

            {minimumOrderLabel && (
              <p className="mt-3 text-sm text-amber-700">{minimumOrderLabel}</p>
            )}

            {!hasActiveProfile && (
              <p className="mt-3 text-sm text-amber-700">
                Selecione um perfil ativo para concluir o pedido.
              </p>
            )}
            {requiresDeliveryDestination && !hasDeliveryDestination && (
              <p className="mt-3 text-sm text-amber-700">
                Informe o endereco completo de entrega (CEP, rua, numero e bairro) para continuar.
              </p>
            )}
          </section>
        </div>

        <SheetFooter className="mt-6">
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={isCheckoutDisabled}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Criando pedido..." : "Confirmar pedido"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
