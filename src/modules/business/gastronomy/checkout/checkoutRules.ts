import type { Cart, CartItem } from "../types/menu";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { DeliveryDestination } from "../utils/deliveryDestination";
import { money } from "../utils/currency";

export type GastronomyFulfillmentMode = "delivery" | "takeout" | "dine_in";
export type DeliveryFulfillmentMode =
  | "own_fleet"
  | "platform_courier"
  | "unspecified";
export type GastronomyCheckoutPaymentMethod =
  | "pix"
  | "payment_link"
  | "cash"
  | "card_on_delivery";

export interface CheckoutPaymentOption {
  value: GastronomyCheckoutPaymentMethod;
  label: string;
}

export interface CheckoutDeliveryAddress {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  postal_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  reference?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  recipient_name?: string;
  phone?: string;
}

interface CheckoutDeliveryFormFields {
  streetNumber: string;
  complement: string;
  referencePoint: string;
  recipientName: string;
  recipientPhone: string;
}

const DEFAULT_PAYMENT_METHODS = ["pix", "cash", "card_on_delivery"] as const;
const PAYMENT_METHOD_ALLOWLIST = new Set([
  "pix",
  "cash",
  "card_on_delivery",
  "payment_link",
]);

function profileMetadata(
  business: GastronomyBusiness,
): Record<string, unknown> {
  const metadata = business.gastronomy_profile.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as Record<string, unknown>;
}

export function getEnabledFulfillmentModes(
  business: GastronomyBusiness,
): GastronomyFulfillmentMode[] {
  const profile = business.gastronomy_profile;
  return [
    profile.delivery_enabled ? "delivery" : null,
    profile.takeout_enabled ? "takeout" : null,
    profile.dine_in_enabled ? "dine_in" : null,
  ].filter((mode): mode is GastronomyFulfillmentMode => Boolean(mode));
}

export function resolveDefaultFulfillmentMode(
  business: GastronomyBusiness,
): GastronomyFulfillmentMode {
  const [firstMode] = getEnabledFulfillmentModes(business);
  return firstMode ?? "dine_in";
}

export function normalizeFulfillmentMode(
  business: GastronomyBusiness,
  requestedMode?: GastronomyFulfillmentMode | null,
): GastronomyFulfillmentMode {
  const enabledModes = getEnabledFulfillmentModes(business);
  if (requestedMode && enabledModes.includes(requestedMode)) {
    return requestedMode;
  }
  return resolveDefaultFulfillmentMode(business);
}

export function requiresDeliveryDestination(
  mode: GastronomyFulfillmentMode,
): boolean {
  return mode === "delivery";
}

export function resolveDeliveryFeeForFulfillment(
  business: GastronomyBusiness,
  mode: GastronomyFulfillmentMode,
): number {
  return mode === "delivery"
    ? money(business.gastronomy_profile.delivery_fee ?? 0)
    : 0;
}

export function applyFulfillmentToCart(
  cart: Cart,
  business: GastronomyBusiness,
  mode: GastronomyFulfillmentMode,
): Cart {
  const normalizedMode = normalizeFulfillmentMode(business, mode);
  const deliveryFee = resolveDeliveryFeeForFulfillment(
    business,
    normalizedMode,
  );
  const subtotal = money(
    cart.items.reduce((total, item) => total + item.subtotal, 0),
  );

  return {
    ...cart,
    fulfillment_mode: normalizedMode,
    subtotal,
    delivery_fee: deliveryFee,
    total: money(subtotal + deliveryFee),
  };
}

export function fulfillmentModeLabel(mode: GastronomyFulfillmentMode): string {
  switch (mode) {
    case "delivery":
      return "Entrega";
    case "takeout":
      return "Retirada";
    case "dine_in":
      return "No local";
  }
}

export function fulfillmentPaymentLocationLabel(
  mode: GastronomyFulfillmentMode,
): string {
  switch (mode) {
    case "delivery":
      return "entrega";
    case "takeout":
      return "retirada";
    case "dine_in":
      return "local";
  }
}

export function resolveDeliveryFulfillmentMode(
  business: GastronomyBusiness,
): DeliveryFulfillmentMode {
  const metadata = profileMetadata(business);
  const rawMode =
    metadata.delivery_fulfillment_mode ??
    metadata.delivery_mode ??
    metadata.courier_mode;

  if (typeof rawMode !== "string") return "unspecified";

  const normalizedMode = rawMode.toLowerCase().trim();
  if (
    ["own_fleet", "merchant_own_fleet", "proprio", "frota_propria"].includes(
      normalizedMode,
    )
  ) {
    return "own_fleet";
  }

  if (
    [
      "platform_courier",
      "platform_courier_network",
      "rede_motoboy",
      "motoboy_rede",
    ].includes(normalizedMode)
  ) {
    return "platform_courier";
  }

  return "unspecified";
}

export function isPlatformCourierCheckoutAvailable(): boolean {
  // Gastronomia v1 opera apenas com a frota propria da loja.
  // Mesmo que mobility esteja habilitado em outra superficie, o checkout
  // oficial nao deve despachar motoboy/plataforma ate existir contrato E2E.
  return false;
}

export function resolveAcceptedPaymentMethods(
  business: GastronomyBusiness,
): Set<string> {
  const metadata = profileMetadata(business);
  const methods = metadata.accepted_payment_methods;

  if (!Array.isArray(methods)) {
    return new Set(DEFAULT_PAYMENT_METHODS);
  }

  const normalized = methods
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase().trim())
    .filter((value) => PAYMENT_METHOD_ALLOWLIST.has(value));

  return normalized.length
    ? new Set(normalized)
    : new Set(DEFAULT_PAYMENT_METHODS);
}

export function canUseCardOnDelivery(params: {
  mode: GastronomyFulfillmentMode;
  deliveryFulfillmentMode: DeliveryFulfillmentMode;
  acceptedPaymentMethods: Set<string>;
}): boolean {
  if (!params.acceptedPaymentMethods.has("card_on_delivery")) {
    return false;
  }

  return (
    params.mode !== "delivery" ||
    params.deliveryFulfillmentMode === "own_fleet" ||
    params.deliveryFulfillmentMode === "unspecified"
  );
}

export function isPlatformCourierUnavailableForCheckout(
  business: GastronomyBusiness,
  mode: GastronomyFulfillmentMode,
): boolean {
  return (
    requiresDeliveryDestination(mode) &&
    resolveDeliveryFulfillmentMode(business) === "platform_courier" &&
    !isPlatformCourierCheckoutAvailable()
  );
}

export function resolveCheckoutPaymentOptions(
  business: GastronomyBusiness,
  mode: GastronomyFulfillmentMode,
): CheckoutPaymentOption[] {
  const acceptedPaymentMethods = resolveAcceptedPaymentMethods(business);
  const deliveryFulfillmentMode = resolveDeliveryFulfillmentMode(business);
  const locationLabel = fulfillmentPaymentLocationLabel(mode);
  const options: Array<CheckoutPaymentOption | null> = [
    acceptedPaymentMethods.has("pix")
      ? { value: "pix", label: `PIX na ${locationLabel}` }
      : null,
    acceptedPaymentMethods.has("payment_link")
      ? { value: "payment_link", label: "Link de pagamento" }
      : null,
    acceptedPaymentMethods.has("cash")
      ? { value: "cash", label: `Dinheiro na ${locationLabel}` }
      : null,
  ];

  if (
    canUseCardOnDelivery({
      mode,
      deliveryFulfillmentMode,
      acceptedPaymentMethods,
    })
  ) {
    options.splice(1, 0, {
      value: "card_on_delivery",
      label: `Cartão na ${locationLabel}`,
    });
  }

  return options.filter((option): option is CheckoutPaymentOption =>
    Boolean(option),
  );
}

export function isStructuredDeliveryDestinationReady(
  destination: DeliveryDestination | null,
  streetNumber: string,
): boolean {
  if (!destination) return false;
  const required = [
    destination.postalCode,
    destination.street,
    streetNumber,
    destination.neighborhood,
    destination.city,
    destination.state,
  ];
  return required.every(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

export function formatDeliveryDestinationDisplayLabel(
  destination: DeliveryDestination | null,
): string | null {
  if (!destination) return null;
  const structured = [
    destination.street,
    destination.number,
    destination.neighborhood,
    destination.city,
    destination.state,
    destination.postalCode,
  ]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .join(" - ");

  return structured || destination.label || null;
}

export function buildCheckoutDeliveryAddress(
  destination: DeliveryDestination | null,
  fields: CheckoutDeliveryFormFields,
): CheckoutDeliveryAddress | undefined {
  if (!destination) return undefined;
  return {
    id: `destination:${destination.source}`,
    lat: destination.latitude,
    lng: destination.longitude,
    label: destination.label,
    recipient_name: fields.recipientName.trim() || undefined,
    phone: fields.recipientPhone.trim() || undefined,
    postal_code: destination.postalCode ?? undefined,
    street: destination.street ?? undefined,
    number: fields.streetNumber.trim() || undefined,
    complement: fields.complement.trim() || undefined,
    reference: fields.referencePoint.trim() || undefined,
    neighborhood: destination.neighborhood ?? undefined,
    city: destination.city ?? undefined,
    state: destination.state ?? undefined,
  };
}

export function buildCheckoutOrderNotes(params: {
  paymentMethod: string;
  cashChangeFor: string;
  customerNotes: string;
  deliveryDestination?: DeliveryDestination | null;
  streetNumber?: string;
  complement?: string;
  referencePoint?: string;
}): string | undefined {
  const normalizedChange = params.cashChangeFor.trim();
  const changeNote =
    params.paymentMethod === "cash" && normalizedChange.length > 0
      ? `Troco para: R$ ${normalizedChange}`
      : null;
  const normalizedNotes = [changeNote, params.customerNotes.trim() || null]
    .filter(Boolean)
    .join(" | ");
  const destination = params.deliveryDestination;
  const addressNotes = destination
    ? [
        destination.postalCode ? `CEP: ${destination.postalCode}` : null,
        destination.street ? `Rua: ${destination.street}` : null,
        params.streetNumber?.trim()
          ? `Número: ${params.streetNumber.trim()}`
          : null,
        params.complement?.trim()
          ? `Complemento: ${params.complement.trim()}`
          : null,
        params.referencePoint?.trim()
          ? `Referência: ${params.referencePoint.trim()}`
          : null,
      ]
        .filter(Boolean)
        .join(" | ")
    : null;

  const notes = [normalizedNotes || null, addressNotes]
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    )
    .join(" | ");

  return notes || undefined;
}

export function isCheckoutSubmitDisabled(params: {
  hasCart: boolean;
  minimumOrderReached: boolean;
  isSubmitting: boolean;
  hasActiveProfile: boolean;
  availableFulfillmentModes: GastronomyFulfillmentMode[];
  platformCourierUnavailable: boolean;
  requiresDeliveryDestination: boolean;
  hasDeliveryDestination: boolean;
  structuredDeliveryReady: boolean;
}): boolean {
  return (
    !params.hasCart ||
    !params.minimumOrderReached ||
    params.isSubmitting ||
    !params.hasActiveProfile ||
    params.availableFulfillmentModes.length === 0 ||
    params.platformCourierUnavailable ||
    (params.requiresDeliveryDestination &&
      (!params.hasDeliveryDestination || !params.structuredDeliveryReady))
  );
}

export function buildCartItemSummary(item: CartItem): string[] {
  const summary: string[] = [];

  if (item.structured_item?.kind === "pizza") {
    const snapshot = item.structured_item.snapshot as {
      size?: { name?: string };
      flavors?: Array<{ name?: string; fraction?: number }>;
      edge?: { name?: string } | null;
      dough?: { name?: string } | null;
    };

    if (snapshot.flavors?.length) {
      summary.push(
        ...snapshot.flavors.map((flavor) => {
          const fraction = flavor.fraction
            ? `${Math.round(flavor.fraction * 100)}%`
            : "";
          return `${fraction} ${flavor.name ?? "Sabor"}`.trim();
        }),
      );
    }

    if (snapshot.edge?.name) summary.push(`Borda: ${snapshot.edge.name}`);
    if (snapshot.dough?.name) summary.push(`Massa: ${snapshot.dough.name}`);
    return summary;
  }

  if (item.variant?.name) summary.push(item.variant.name);
  if (item.addons.length) {
    summary.push(
      item.addons.map((addon) => `${addon.quantity}x ${addon.name}`).join(", "),
    );
  }
  if (item.special_instructions) summary.push(item.special_instructions);

  return summary;
}
