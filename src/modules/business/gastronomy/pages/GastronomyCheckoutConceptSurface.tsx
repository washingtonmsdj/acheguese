import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  CircleAlert,
  Info,
  MapPin,
  MessageCircle,
  PackageCheck,
  Pencil,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks";
import foodImage from "@/assets/gastronomy/cat-restaurantes.jpg";
import juiceImage from "@/assets/gastronomy/cat-cafes.jpg";
import {
  useDeliveryDestination,
  useGastronomyCart,
  useGastronomyCheckout,
} from "../hooks";
import { GastronomyDeliveryDestinationPanel } from "../components/GastronomyDeliveryDestinationPanel";
import {
  applyFulfillmentToCart,
  buildCartItemSummary,
  buildCheckoutDeliveryAddress,
  buildCheckoutOrderNotes,
  formatDeliveryDestinationDisplayLabel,
  getEnabledFulfillmentModes,
  isCheckoutSubmitDisabled,
  isPlatformCourierCheckoutAvailable,
  isPlatformCourierUnavailableForCheckout,
  isStructuredDeliveryDestinationReady,
  normalizeFulfillmentMode,
  requiresDeliveryDestination,
  resolveCheckoutPaymentOptions,
  type CheckoutPaymentOption,
  type GastronomyFulfillmentMode,
} from "../checkout/checkoutRules";
import { CheckoutDeliveryAddressFields } from "../checkout/CheckoutSections";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { Cart, CartItem } from "../types/menu";

type FulfillmentMode = GastronomyFulfillmentMode;
type DeliveryOption = "store" | "platform";
type CheckoutStage = "address" | "delivery" | "review" | "fallback";

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

type CheckoutDisplayItem = {
  id: string;
  name: string;
  detail: string;
  price: number;
  quantity: number;
  image: string;
  lineId: string;
};

function cartItemDetail(item: CartItem): string {
  return buildCartItemSummary(item).join(" · ");
}

function toDisplayItems(cart: Cart): CheckoutDisplayItem[] {
  return cart.items.map((item, index) => ({
    id: item.line_id ?? `${item.item_id}-${index}`,
    lineId: item.line_id ?? "",
    name: item.name,
    detail: cartItemDetail(item),
    price: item.subtotal,
    quantity: item.quantity,
    image:
      item.image_url ||
      (/suco|bebida|café|cafe/i.test(item.name) ? juiceImage : foodImage),
  }));
}

function fulfillmentLabel(mode: FulfillmentMode): string {
  switch (mode) {
    case "delivery":
      return "Entrega";
    case "takeout":
      return "Retirada";
    case "dine_in":
      return "No local";
  }
}

function deliveryLabel(
  mode: FulfillmentMode,
  option: DeliveryOption,
): string {
  if (mode === "takeout") return "Retirada na loja";
  if (mode === "dine_in") return "Consumo no local";
  return option === "platform" ? "Motoboy Achegue-se" : "Entrega da loja";
}

function profileTypeLabel(profileType?: string | null): string {
  switch (profileType) {
    case "business":
      return "Negócio";
    case "professional":
      return "Profissional";
    case "driver":
      return "Motorista";
    default:
      return "Pessoal";
  }
}

function ChoiceButton({
  active,
  children,
  disabled = false,
  activeClassName,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  disabled?: boolean;
  activeClassName?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-start gap-2 rounded-lg border px-3 py-3 text-left text-xs transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:text-sm",
        active
          ? (activeClassName ??
              "border-territory-brand bg-territory-raised text-territory-ink")
          : "border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/50",
        disabled &&
          "cursor-not-allowed opacity-55 hover:border-territory-border",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          active
            ? "border-territory-brand bg-territory-brand"
            : "border-territory-muted bg-territory-surface",
        )}
        aria-hidden="true"
      >
        {active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Truck;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border px-2 text-[0.6875rem] font-semibold text-territory-ink transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:text-xs",
        active
          ? "border-territory-brand bg-territory-brand text-white"
          : "border-territory-border bg-territory-surface hover:border-territory-brand/50",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

function Stepper({ stage }: { stage: CheckoutStage }) {
  const activeStep = stage === "address" ? 0 : stage === "delivery" ? 1 : 2;
  const steps = ["Endereço", "Pagamento", "Revisão"];

  return (
    <div className="grid grid-cols-3 items-start gap-2 text-center text-[0.625rem] text-territory-muted sm:max-w-sm sm:text-xs">
      {steps.map((label, index) => (
        <div key={label} className="relative">
          {index < steps.length - 1 ? (
            <span
              className={cn(
                "absolute left-1/2 top-3 h-px w-full",
                index < activeStep
                  ? "bg-territory-brand/70"
                  : "bg-territory-border",
              )}
              aria-hidden="true"
            />
          ) : null}
          <span
            className={cn(
              "relative z-10 mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[0.6875rem] font-bold",
              index < activeStep && "bg-territory-brand text-white",
              index === activeStep && "bg-territory-sun text-territory-ink",
              index > activeStep &&
                "border border-territory-border bg-territory-surface text-territory-muted",
            )}
          >
            {index < activeStep ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              index + 1
            )}
          </span>
          <span
            className={cn(
              "mt-1 block",
              index === activeStep && "font-bold text-territory-ink",
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CheckoutHeader({
  business,
  profileName,
  profileType,
  onBack,
  onAccount,
  stage,
}: {
  business: GastronomyBusiness;
  profileName: string;
  profileType: string;
  onBack: () => void;
  onAccount: () => void;
  stage: CheckoutStage;
}) {
  const territoryLabel = business.location?.full_name || business.location?.name;
  const cityLabel = [business.business_city, business.business_state]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <header className="hidden border-b border-territory-border bg-territory-surface lg:block">
        <div className="mx-auto flex h-[4.25rem] max-w-[84rem] items-center gap-8 px-6">
          <button
            type="button"
            onClick={onBack}
            className="font-heading text-[1.45rem] font-bold tracking-[-0.05em] text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-territory-brand"
          >
            Achegue-se<span className="text-territory-sun">.</span>
          </button>
          <span className="h-7 w-px bg-territory-border" aria-hidden="true" />
          <div className="flex items-center gap-2 text-xs text-territory-ink">
            <MapPin
              className="h-4 w-4 text-territory-brand"
              aria-hidden="true"
            />
            <span>{territoryLabel || business.name}</span>
            <span className="text-territory-muted">
              {cityLabel || "Território não informado"}
            </span>
          </div>
          <nav
            className="ml-auto flex items-center gap-7 text-xs font-semibold text-territory-ink"
            aria-label="Navegação"
          >
            <span>Descobrir</span>
            <span>Meus pedidos</span>
            <span>Apoio à comunidade</span>
            <button
              type="button"
              onClick={onAccount}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-territory-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
              aria-label={`Conta de ${profileName}`}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </button>
            <span>{profileName} · {profileType}</span>
          </nav>
        </div>
      </header>
      <div className="border-b border-territory-border bg-territory-surface px-3 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {stage === "address" ? "Cardápio" : "Voltar"}
        </button>
      </div>
    </>
  );
}

function BusinessSummary({ business }: { business: GastronomyBusiness }) {
  const locationLabel = [
    business.location?.name,
    business.business_city ?? business.location?.full_name,
    business.business_state,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-3 py-1">
      <img
        src={business.logo_url || foodImage}
        alt=""
        className="h-12 w-12 rounded-full object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-territory-ink">
          {business.name}
        </p>
        <p className="text-xs text-territory-muted">
          {locationLabel || "Território não informado"}
        </p>
      </div>
    </div>
  );
}

function AddressCard({
  destination,
  compact = false,
  onEdit,
  recipientName,
  recipientPhone,
  referencePoint,
}: {
  destination: ReturnType<typeof buildCheckoutDeliveryAddress>;
  compact?: boolean;
  onEdit?: () => void;
  recipientName?: string;
  recipientPhone?: string;
  referencePoint?: string;
}) {
  const address = destination;
  const hasAddress = Boolean(address);

  return (
    <div className="rounded-lg border border-territory-border bg-territory-surface p-3 text-xs text-territory-ink">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-bold">
            <MapPin
              className="h-4 w-4 shrink-0 text-territory-brand"
              aria-hidden="true"
            />
            {address?.label ? "Endereço de entrega" : "Endereço do perfil"}
          </p>
          {hasAddress ? (
            <p className="mt-1 pl-6 text-territory-muted">
              {[address?.street, address?.number, address?.complement]
                .filter(Boolean)
                .join(" · ") || address?.label}
              <br />
              {[address?.neighborhood, address?.city, address?.state]
                .filter(Boolean)
                .join(" · ")}
              {!compact && address?.postal_code
                ? ` · CEP ${address.postal_code}`
                : ""}
            </p>
          ) : (
            <p className="mt-1 pl-6 text-territory-muted">
              Informe um endereço completo para continuar.
            </p>
          )}
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
          >
            {hasAddress ? "Alterar" : "Adicionar"}
          </button>
        ) : null}
      </div>
      {!compact ? (
        <>
          <p className="mt-3 flex items-center gap-2 border-t border-territory-border pt-2">
            <UserRound
              className="h-4 w-4 shrink-0 text-territory-brand"
              aria-hidden="true"
            />
            {recipientName || "Quem recebe"}
            {recipientPhone ? ` · ${recipientPhone}` : ""}
          </p>
          <p className="mt-2 flex items-center gap-2 border-t border-territory-border pt-2 text-territory-muted">
            <PackageCheck
              className="h-4 w-4 shrink-0 text-territory-brand"
              aria-hidden="true"
            />
            Ponto de referência: {referencePoint || "não informado"}
          </p>
        </>
      ) : null}
    </div>
  );
}

function ItemsSummary({
  expanded,
  onToggle,
  items,
  subtotal,
}: {
  expanded: boolean;
  onToggle: () => void;
  items: CheckoutDisplayItem[];
  subtotal: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-territory-border bg-territory-surface">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex min-h-14 w-full items-center gap-3 px-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
      >
        <img
          src={items[0]?.image || foodImage}
          alt=""
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-territory-ink">
            Itens do pedido · {currency(subtotal)}
          </span>
          <span className="block text-[0.6875rem] text-territory-muted">
            {items.reduce((total, item) => total + item.quantity, 0)} itens
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-territory-ink transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {expanded ? (
        <div className="divide-y divide-territory-border border-t border-territory-border px-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2.5">
              <img
                src={item.image}
                alt=""
                className="h-10 w-10 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1 text-xs text-territory-ink">
                <span className="block font-semibold">
                  {item.quantity} × {item.name}
                </span>
                {item.detail ? (
                  <span className="block text-[0.6875rem] text-territory-muted">
                    {item.detail}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs font-bold text-territory-ink">
                {currency(item.price)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MobileAddressStage({
  mode,
  availableModes,
  destination,
  addressEditor,
  addressMode,
  hasSavedAddress,
  profileName,
  profileType,
  profilePhone,
  referencePoint,
  items,
  subtotal,
  expandedItems,
  onModeChange,
  onAddressModeChange,
  onEditAddress,
  onContinue,
  onToggleItems,
}: {
  mode: FulfillmentMode;
  availableModes: FulfillmentMode[];
  destination: ReturnType<typeof buildCheckoutDeliveryAddress>;
  addressEditor?: ReactNode;
  addressMode: "saved" | "other";
  hasSavedAddress: boolean;
  profileName: string;
  profileType: string;
  profilePhone: string;
  referencePoint: string;
  items: CheckoutDisplayItem[];
  subtotal: number;
  expandedItems: boolean;
  onModeChange: (mode: FulfillmentMode) => void;
  onAddressModeChange: (mode: "saved" | "other") => void;
  onEditAddress: () => void;
  onContinue: () => void;
  onToggleItems: () => void;
}) {
  return (
    <div className="space-y-3">
      <h1 className="font-heading text-[1.45rem] font-bold tracking-[-0.04em] text-territory-ink">
        Onde vamos entregar?
      </h1>
      <div
        className={cn(
          "grid gap-2",
          availableModes.length === 1
            ? "grid-cols-1"
            : availableModes.length === 2
              ? "grid-cols-2"
              : "grid-cols-3",
        )}
      >
        {availableModes.map((availableMode) => {
          const Icon =
            availableMode === "delivery"
              ? Truck
              : availableMode === "takeout"
                ? ShoppingBag
                : Store;
          return (
            <ModeButton
              key={availableMode}
              active={mode === availableMode}
              icon={Icon}
              label={fulfillmentLabel(availableMode)}
              onClick={() => onModeChange(availableMode)}
            />
          );
        })}
      </div>
      <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-territory-border bg-territory-surface px-3 text-xs">
        <span className="flex min-w-0 items-center gap-2 font-semibold text-territory-ink">
          <UserRound
            className="h-4 w-4 shrink-0 text-territory-brand"
            aria-hidden="true"
          />
           {profileName}{" "}
           <span className="font-normal text-territory-muted">· {profileType}</span>
        </span>
          <ChevronRight
          className="h-4 w-4 shrink-0 text-territory-muted"
          aria-hidden="true"
        />
      </div>
      {mode === "delivery" ? <div>
        <p className="mb-2 text-xs font-bold text-territory-ink">
          Endereço de entrega
        </p>
        <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            aria-pressed={addressMode === "saved"}
            disabled={!hasSavedAddress}
            onClick={() => onAddressModeChange("saved")}
            className={cn(
              "min-h-9 rounded-lg border px-2 font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand",
              addressMode === "saved"
                ? "border-territory-brand bg-territory-raised"
                : "border-territory-border bg-territory-surface",
              !hasSavedAddress && "cursor-not-allowed opacity-55",
            )}
          >
            Endereço do perfil
          </button>
          <button
            type="button"
            aria-pressed={addressMode === "other"}
            onClick={() => onAddressModeChange("other")}
            className={cn(
              "min-h-9 rounded-lg border px-2 text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand",
              addressMode === "other"
                ? "border-territory-brand bg-territory-raised font-semibold"
                : "border-territory-border bg-territory-surface",
            )}
          >
            Outro endereço
          </button>
        </div>
        <AddressCard
          destination={destination}
          onEdit={onEditAddress}
          recipientName={profileName}
          recipientPhone={profilePhone}
          referencePoint={referencePoint}
        />
        {addressEditor}
      </div> : null}
      {mode === "delivery" ? (
        <p className="flex items-center gap-1.5 rounded-lg bg-territory-info/10 px-3 py-2 text-[0.6875rem] leading-4 text-territory-ink">
          <Info
            className="h-3.5 w-3.5 shrink-0 text-territory-brand"
            aria-hidden="true"
          />
          Confira o endereço antes de continuar.
        </p>
      ) : null}
      <ItemsSummary
        expanded={expandedItems}
        onToggle={onToggleItems}
        items={items}
        subtotal={subtotal}
      />
      <button
        type="button"
        onClick={onContinue}
        className="hidden w-full items-center justify-center gap-2 rounded-lg bg-territory-sun px-4 py-3 text-sm font-bold text-territory-ink hover:bg-territory-sun/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
      >
        Ver opções de entrega{" "}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function MobileDeliveryStage({
  mode,
  availableModes,
  deliveryOption,
  destination,
  subtotal,
  deliveryFee,
  businessName,
  platformUnavailable,
  onModeChange,
  onDeliveryOptionChange,
  onContinue,
}: {
  mode: FulfillmentMode;
  availableModes: FulfillmentMode[];
  deliveryOption: DeliveryOption;
  destination: ReturnType<typeof buildCheckoutDeliveryAddress>;
  subtotal: number;
  deliveryFee: number;
  businessName: string;
  platformUnavailable: boolean;
  onModeChange: (mode: FulfillmentMode) => void;
  onDeliveryOptionChange: (option: DeliveryOption) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-3">
      <h1 className="font-heading text-[1.45rem] font-bold tracking-[-0.04em] text-territory-ink">
        Escolha a entrega
      </h1>
      <AddressCard destination={destination} compact />
      <div className="space-y-2">
        <ChoiceButton
          active={deliveryOption === "store"}
          activeClassName="border-territory-sun bg-territory-sun/10 text-territory-ink"
          onClick={() => onDeliveryOptionChange("store")}
        >
          <span className="flex items-center gap-2 font-bold">
            <Truck
              className="h-5 w-5 text-territory-brand"
              aria-hidden="true"
            />
            Entrega da loja <span className="ml-auto">{currency(deliveryFee)}</span>
          </span>
          <span className="mt-1 block pl-7 text-[0.6875rem] text-territory-muted">
            Equipe do estabelecimento
          </span>
          <span className="mt-1 block pl-7 text-[0.6875rem] text-territory-muted">
            Seu pedido será entregue pela equipe do {businessName}.
          </span>
        </ChoiceButton>
        <ChoiceButton
          active={deliveryOption === "platform"}
          activeClassName="border-territory-sun bg-territory-sun/10 text-territory-ink"
          disabled={platformUnavailable}
          onClick={() => onDeliveryOptionChange("platform")}
        >
          <span className="flex items-center gap-2 font-bold">
            <Truck
              className="h-5 w-5 text-territory-brand"
              aria-hidden="true"
            />
            Motoboy Achegue-se <span className="ml-auto">{currency(7)}</span>
          </span>
          <span className="mt-1 block pl-7 text-[0.6875rem] text-territory-muted">
            Endereço atendido pela plataforma
          </span>
          <span className="mt-1 block pl-7 text-[0.6875rem] text-territory-muted">
            O entregador seria buscado após a confirmação da loja.
          </span>
          <span className="mt-2 ml-7 inline-flex rounded-full bg-territory-sun/35 px-1.5 py-0.5 text-[0.5625rem] font-bold text-territory-ink">
            {platformUnavailable ? "Indisponível neste lançamento" : "Opção prevista"}
          </span>
        </ChoiceButton>
        {availableModes.includes("takeout") ? (
          <button
            type="button"
            onClick={() => {
              onModeChange("takeout");
              onContinue();
            }}
            className="flex min-h-12 w-full items-center justify-between rounded-lg border border-territory-border bg-territory-surface px-3 text-left text-xs font-semibold text-territory-ink hover:border-territory-brand/50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
          >
            <span className="flex items-center gap-2">
              <Store
                className="h-5 w-5 text-territory-brand"
                aria-hidden="true"
              />
              Retirar na loja
            </span>
            <span className="flex items-center gap-1 text-[0.6875rem] font-normal text-territory-muted">
              Sem taxa <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        ) : null}
      </div>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">Produtos</span>
          <strong>{currency(subtotal)}</strong>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-territory-muted">
            {deliveryLabel(mode, deliveryOption)}
          </span>
          <strong>{currency(deliveryOption === "platform" ? 0 : deliveryFee)}</strong>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-territory-border pt-3 text-base font-bold">
          <span>Total</span>
          <span>{currency(subtotal + (deliveryOption === "platform" ? 0 : deliveryFee))}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="hidden w-full items-center justify-center gap-2 rounded-lg bg-territory-sun px-4 py-3 text-sm font-bold text-territory-ink hover:bg-territory-sun/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
      >
        Continuar para pagamento{" "}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function MobileReviewStage({
  mode,
  deliveryOption,
  paymentLabel,
  destination,
  recipientName,
  businessName,
  items,
  subtotal,
  deliveryFee,
  notes,
  notesExpanded,
  paymentExpanded,
  paymentMethod,
  paymentOptions,
  cashChangeFor,
  onGoToDelivery,
  onGoToPayment,
  onEditItems,
  onOpenFallback,
  onToggleNotes,
  onCashChangeForChange,
  onPaymentMethodChange,
  onNotesChange,
  onConfirm,
}: {
  mode: FulfillmentMode;
  deliveryOption: DeliveryOption;
  paymentLabel: string;
  destination: ReturnType<typeof buildCheckoutDeliveryAddress>;
  recipientName: string;
  businessName: string;
  items: CheckoutDisplayItem[];
  subtotal: number;
  deliveryFee: number;
  notes: string;
  notesExpanded: boolean;
  paymentExpanded: boolean;
  paymentMethod: string;
  paymentOptions: CheckoutPaymentOption[];
  cashChangeFor: string;
  onGoToDelivery: () => void;
  onGoToPayment: () => void;
  onEditItems: () => void;
  onOpenFallback: () => void;
  onToggleNotes: () => void;
  onCashChangeForChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onConfirm: () => void;
}) {
  const total = subtotal + deliveryFee;
  return (
    <div className="space-y-3">
      <h1 className="font-heading text-[1.45rem] font-bold tracking-[-0.04em] text-territory-ink">
        Revisar pedido
      </h1>
      <Stepper stage="review" />
      <div className="space-y-2">
        <button
          type="button"
          onClick={onGoToDelivery}
          className="flex w-full items-start gap-3 rounded-lg border border-territory-border bg-territory-surface p-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
        >
          <Truck
            className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 text-xs">
            <strong className="block">
              {deliveryOption === "platform"
                ? "Motoboy Achegue-se"
                : mode === "delivery"
                  ? "Entrega da loja"
                  : mode === "takeout"
                    ? "Retirada na loja"
                    : "Consumo no local"}
            </strong>
            <span className="mt-0.5 block text-territory-muted">
              {recipientName || "Cliente"}
              {destination ? (
                <>
                  {" · "}
                  {[destination.street, destination.number, destination.complement]
                    .filter(Boolean)
                    .join(", ") || destination.label}
                  <br />
                  {[destination.neighborhood, destination.city, destination.state]
                    .filter(Boolean)
                    .join(" · ")}
                </>
              ) : (
                <>
                  {" · "}
                  {businessName}
                </>
              )}
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-territory-brand">
            Editar
          </span>
        </button>
        <button
          type="button"
          aria-expanded={paymentExpanded}
          onClick={onGoToPayment}
          className="flex w-full items-start gap-3 rounded-lg border border-territory-border bg-territory-surface p-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
        >
          <WalletCards
            className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 text-xs">
            <strong className="block">
              {paymentLabel}
            </strong>
            <span className="mt-0.5 block text-territory-muted">
              Produtos pagos diretamente à loja
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-territory-brand">
            Editar
          </span>
        </button>
        {paymentExpanded ? (
          <div className="rounded-lg border border-territory-border bg-territory-surface p-2.5">
            <PaymentSection
              method={paymentMethod}
              options={paymentOptions}
              cashChangeFor={cashChangeFor}
              onCashChangeForChange={onCashChangeForChange}
              onChange={onPaymentMethodChange}
              compact
            />
          </div>
        ) : null}
      </div>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-2.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-territory-ink">
            Itens do pedido
          </h2>
          <button
            type="button"
            onClick={onEditItems}
            className="text-xs font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
          >
            Editar
          </button>
        </div>
        <div className="mt-1.5 divide-y divide-territory-border border-y border-territory-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-1.5">
              <img
                src={item.image}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1 text-xs">
                <strong className="block truncate">
                  {item.quantity} × {item.name}
                </strong>
                <span className="block text-[0.6875rem] text-territory-muted">
                  {item.detail}
                </span>
              </span>
              <span className="shrink-0 text-xs font-bold">
                {currency(item.price)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-expanded={notesExpanded}
        onClick={onToggleNotes}
        className="flex min-h-10 w-full items-center justify-between rounded-lg border border-territory-border bg-territory-surface px-3 text-left text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
      >
        Observações do pedido{" "}
        <span className="sr-only">(opcional)</span>
        <span className="flex items-center gap-1 text-territory-brand">
          {notes ? `${notes.length}/280` : "Adicionar"}{" "}
          <ChevronDown
            className={cn("h-4 w-4", notesExpanded && "rotate-180")}
            aria-hidden="true"
          />
        </span>
      </button>
      {notesExpanded ? (
        <Textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Algo que a loja precisa saber?"
          className="min-h-20 resize-none rounded-lg border-territory-border bg-territory-surface text-sm placeholder:text-territory-muted"
        />
      ) : null}
      <div className="rounded-lg border border-territory-border bg-territory-surface p-2.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">Produtos</span>
          <span>{currency(subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-territory-muted">
            {deliveryOption === "platform"
              ? "Motoboy Achegue-se"
              : "Entrega da loja"}
          </span>
          <span>{currency(deliveryFee)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-territory-border pt-2 text-base font-bold">
          <span>Total</span>
          <span>{currency(total)}</span>
        </div>
      </div>
      {deliveryOption === "platform" ? (
        <button
          type="button"
          onClick={onOpenFallback}
          className="flex w-full items-center justify-between border-t border-territory-border pt-2.5 text-left text-xs font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          Se não houver entregador disponível{" "}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onConfirm}
        className="hidden w-full items-center justify-center gap-2 rounded-lg bg-territory-sun px-4 py-3 text-sm font-bold text-territory-ink hover:bg-territory-sun/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
      >
        Confirmar pedido · {currency(total)}{" "}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function MobileFallbackStage({
  destination,
  subtotal,
  deliveryFee,
  items,
  onBackToReview,
  onContinue,
}: {
  destination: ReturnType<typeof buildCheckoutDeliveryAddress>;
  subtotal: number;
  deliveryFee: number;
  items: CheckoutDisplayItem[];
  onBackToReview: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-3">
      <h1 className="font-heading text-[1.45rem] font-bold tracking-[-0.04em] text-territory-ink">
        Ajuste a entrega
      </h1>
      <div className="rounded-lg bg-territory-warning/20 p-3 text-xs text-territory-ink">
        <p className="flex items-center gap-2 font-bold">
          <CircleAlert
            className="h-5 w-5 shrink-0 text-territory-warning"
            aria-hidden="true"
          />
          A plataforma não atende este endereço
        </p>
        <p className="mt-1 pl-7 text-territory-muted">
          Você pode escolher outra opção para continuar.
        </p>
      </div>
      <AddressCard destination={destination} compact />
      <p className="text-xs font-bold text-territory-ink">
        Escolha uma opção disponível
      </p>
      <ChoiceButton active onClick={onContinue}>
        <span className="flex items-center gap-2 font-bold">
          <Truck className="h-5 w-5 text-territory-brand" aria-hidden="true" />
          Entrega da loja <span className="ml-auto">{currency(deliveryFee)}</span>
        </span>
        <span className="mt-1 block pl-7 text-[0.6875rem] text-territory-muted">
          Equipe do estabelecimento
        </span>
      </ChoiceButton>
      <button
        type="button"
        onClick={onContinue}
        className="flex min-h-12 w-full items-center justify-between rounded-lg border border-territory-border bg-territory-surface px-3 text-left text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
      >
        <span className="flex items-center gap-2">
          <Store className="h-5 w-5 text-territory-brand" aria-hidden="true" />
          Retirada na loja
        </span>
        <span className="text-[0.6875rem] font-normal text-territory-muted">
          Sem taxa de entrega
        </span>
      </button>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3">
        <div className="flex items-center justify-between gap-3 text-xs font-bold">
          <span>Seu pedido · {items.reduce((total, item) => total + item.quantity, 0)} itens</span>
          <span>{currency(subtotal)}</span>
        </div>
        <p className="mt-1 text-[0.6875rem] text-territory-muted">
          Seus itens foram mantidos.
        </p>
      </div>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">Produtos</span>
          <span>{currency(subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-territory-muted">Entrega da loja</span>
          <span>{currency(deliveryFee)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-territory-border pt-3 text-base font-bold">
          <span>Total</span>
          <span>{currency(subtotal + deliveryFee)}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onBackToReview}
        className="hidden w-full rounded-lg border border-territory-brand px-4 py-3 text-sm font-bold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand sm:block"
      >
        Voltar para revisão
      </button>
    </div>
  );
}

function AddressSection({
  mode,
  destination,
  addressMode,
  hasSavedAddress,
  addressEditor,
  profileName,
  profilePhone,
  referencePoint,
  onAddressModeChange,
  onEditAddress,
}: {
  mode: FulfillmentMode;
  destination: ReturnType<typeof buildCheckoutDeliveryAddress>;
  addressMode: "saved" | "other";
  hasSavedAddress: boolean;
  addressEditor?: ReactNode;
  profileName: string;
  profilePhone: string;
  referencePoint: string;
  onAddressModeChange: (mode: "saved" | "other") => void;
  onEditAddress: () => void;
}) {
  if (mode !== "delivery") return null;
  return (
    <section
      className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5"
      aria-labelledby="checkout-address-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="checkout-address-title"
          className="font-heading text-base font-bold text-territory-ink"
        >
          1. Onde vamos entregar?
        </h2>
        <button
          type="button"
          onClick={onEditAddress}
          className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Editar
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          aria-pressed={addressMode === "saved"}
          disabled={!hasSavedAddress}
          onClick={() => onAddressModeChange("saved")}
          className={cn(
            "min-h-9 rounded-lg border px-2 font-semibold text-territory-ink",
            addressMode === "saved"
              ? "border-territory-brand bg-territory-raised"
              : "border-territory-border bg-territory-surface",
            !hasSavedAddress && "cursor-not-allowed opacity-55",
          )}
        >
          Endereço do perfil
        </button>
        <button
          type="button"
          aria-pressed={addressMode === "other"}
          onClick={() => onAddressModeChange("other")}
          className={cn(
            "min-h-9 rounded-lg border px-2 text-territory-ink",
            addressMode === "other"
              ? "border-territory-brand bg-territory-raised font-semibold"
              : "border-territory-border bg-territory-surface",
          )}
        >
          Outro endereço
        </button>
      </div>
      <div className="mt-3">
        <AddressCard
          destination={destination}
          onEdit={onEditAddress}
          recipientName={profileName}
          recipientPhone={profilePhone}
          referencePoint={referencePoint}
        />
      </div>
      {addressEditor}
      <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-territory-info/10 px-3 py-2 text-[0.6875rem] leading-4 text-territory-ink">
        <Info
          className="h-3.5 w-3.5 shrink-0 text-territory-brand"
          aria-hidden="true"
        />
        Confira o endereço antes de continuar.
      </p>
    </section>
  );
}

function FulfillmentSection({
  mode,
  deliveryOption,
  availableModes,
  deliveryFee,
  businessName,
  platformUnavailable,
  onModeChange,
  onDeliveryOptionChange,
}: {
  mode: FulfillmentMode;
  deliveryOption: DeliveryOption;
  availableModes: FulfillmentMode[];
  deliveryFee: number;
  businessName: string;
  platformUnavailable: boolean;
  onModeChange: (mode: FulfillmentMode) => void;
  onDeliveryOptionChange: (option: DeliveryOption) => void;
}) {
  return (
    <section
      className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5"
      aria-labelledby="checkout-fulfillment-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="checkout-fulfillment-title"
          className="font-heading text-base font-bold text-territory-ink"
        >
          2. Escolha a entrega
        </h2>
        <Clock3 className="h-5 w-5 text-territory-brand" aria-hidden="true" />
      </div>
      <div
        className={cn(
          "mt-3 grid gap-2",
          availableModes.length === 1
            ? "grid-cols-1"
            : availableModes.length === 2
              ? "grid-cols-2"
              : "grid-cols-3",
        )}
      >
        {availableModes.map((availableMode) => {
          const Icon =
            availableMode === "delivery"
              ? Truck
              : availableMode === "takeout"
                ? ShoppingBag
                : Store;
          return (
            <ModeButton
              key={availableMode}
              active={mode === availableMode}
              icon={Icon}
              label={fulfillmentLabel(availableMode)}
              onClick={() => onModeChange(availableMode)}
            />
          );
        })}
      </div>
      {mode === "delivery" ? (
        <>
          <h3 className="mt-5 text-xs font-bold text-territory-ink sm:text-sm">
            Quem entrega
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <ChoiceButton
              active={deliveryOption === "store"}
              onClick={() => onDeliveryOptionChange("store")}
            >
              <span className="block font-semibold">
                Entrega da loja{" "}
                <span className="float-right">{currency(deliveryFee)}</span>
              </span>
              <span className="mt-0.5 block text-[0.6875rem] text-territory-muted">
                Equipe do estabelecimento
              </span>
              <span className="mt-1 block text-[0.6875rem] text-territory-muted">
                Seu pedido será entregue pela equipe do {businessName}.
              </span>
            </ChoiceButton>
            <ChoiceButton
              active={deliveryOption === "platform"}
              disabled={platformUnavailable}
              onClick={() => onDeliveryOptionChange("platform")}
            >
              <span className="flex items-center justify-between gap-2 font-semibold">
                Motoboy Achegue-se{" "}
                <span className="rounded-full bg-territory-sun/45 px-1.5 py-0.5 text-[0.5625rem]">
                  {platformUnavailable
                    ? "Indisponível neste lançamento"
                    : "Opção prevista"}
                </span>
              </span>
              <span className="mt-0.5 block text-[0.6875rem] text-territory-muted">
                Endereço atendido pela plataforma · {currency(7)}
              </span>
              <span className="mt-1 block text-[0.6875rem] text-territory-muted">
                A cobrança e a disponibilidade ainda dependem da operação.
              </span>
            </ChoiceButton>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[0.6875rem] leading-4 text-territory-muted">
            <Info
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-territory-brand"
              aria-hidden="true"
            />
            A opção Achegue-se é uma previsão de operação futura; a entrega
            própria da loja continua sendo a modalidade operacional deste
            checkout.
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs text-territory-muted">
          Sem taxa de entrega. Combine os detalhes diretamente com a loja.
        </p>
      )}
    </section>
  );
}

function PaymentSection({
  method,
  options,
  cashChangeFor,
  onCashChangeForChange,
  onChange,
  compact = false,
}: {
  method: string;
  options: CheckoutPaymentOption[];
  cashChangeFor: string;
  onCashChangeForChange: (value: string) => void;
  onChange: (method: string) => void;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        !compact &&
          "rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5",
      )}
      aria-label={compact ? "Forma de pagamento" : undefined}
      aria-labelledby={compact ? undefined : "checkout-payment-title"}
    >
      {!compact ? (
        <>
          <h2
            id="checkout-payment-title"
            className="font-heading text-base font-bold text-territory-ink"
          >
            3. Pagamento
          </h2>
          <p className="mt-2 flex items-center gap-2 rounded-lg bg-territory-sun/20 px-3 py-2 text-[0.6875rem] text-territory-ink sm:text-xs">
            <WalletCards
              className="h-4 w-4 shrink-0 text-territory-brand"
              aria-hidden="true"
            />
            Pagamento dos produtos direto com a loja.
          </p>
        </>
      ) : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <ChoiceButton
            key={option.value}
            active={method === option.value}
            onClick={() => onChange(option.value)}
          >
            <span className="block font-semibold">{option.label}</span>
            <span className="mt-0.5 block text-[0.6875rem] text-territory-muted">
              Pagamento combinado diretamente com a loja
            </span>
          </ChoiceButton>
        ))}
      </div>
      {method === "cash" ? (
        <label className="mt-3 block text-xs font-semibold text-territory-ink">
          Troco para (opcional)
          <input
            value={cashChangeFor}
            onChange={(event) => onCashChangeForChange(event.target.value)}
            inputMode="decimal"
            placeholder="Ex.: 100,00"
            className="mt-1 h-10 w-full rounded-lg border border-territory-border bg-territory-surface px-3 text-sm font-normal outline-none focus-visible:border-territory-brand focus-visible:ring-2 focus-visible:ring-territory-brand/20"
          />
        </label>
      ) : null}
      <button
        type="button"
        className="mt-3 flex min-h-9 w-full items-center justify-between border-t border-territory-border pt-3 text-left text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
      >
        Como funciona o pagamento{" "}
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>
    </section>
  );
}

function ItemsSection({
  items,
  onRemoveItem,
  onAddMoreItems,
}: {
  items: CheckoutDisplayItem[];
  onRemoveItem: (lineId: string) => void;
  onAddMoreItems: () => void;
}) {
  return (
    <section
      className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5"
      aria-labelledby="checkout-items-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="checkout-items-title"
          className="font-heading text-base font-bold text-territory-ink"
        >
          Itens do pedido
        </h2>
        <button
          type="button"
          onClick={onAddMoreItems}
          className="text-xs font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          Editar
        </button>
      </div>
      <div className="mt-3 divide-y divide-territory-border border-y border-territory-border">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-3">
            <img
              src={item.image}
              alt=""
              className="h-14 w-16 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-territory-ink">
                {item.quantity} × {item.name}
              </p>
              {item.detail ? (
                <p className="mt-0.5 text-xs text-territory-muted">
                  {item.detail}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-bold text-territory-ink">
                {currency(item.price)}
              </span>
              {item.lineId ? (
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.lineId)}
                  className="text-[0.6875rem] font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
                >
                  Remover
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrderSummary({
  mode,
  deliveryOption,
  items,
  subtotal,
  deliveryFee,
  minimumOrderRemaining,
  isSubmitDisabled,
  isSubmitting,
  onAddMoreItems,
  onRemoveItem,
  onConfirm,
  onFallback,
  onContactStore,
}: {
  mode: FulfillmentMode;
  deliveryOption: DeliveryOption;
  items: CheckoutDisplayItem[];
  subtotal: number;
  deliveryFee: number;
  minimumOrderRemaining: number;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  onAddMoreItems: () => void;
  onRemoveItem: (lineId: string) => void;
  onConfirm: () => void;
  onFallback: () => void;
  onContactStore: () => void;
}) {
  const total = subtotal + deliveryFee;
  const summaryDeliveryLabel = deliveryLabel(mode, deliveryOption);
  return (
    <aside
      className="rounded-xl border border-territory-border bg-territory-surface p-4 shadow-territory-subtle sm:p-5 lg:sticky lg:top-5"
      aria-labelledby="checkout-summary-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="checkout-summary-title"
          className="font-heading text-lg font-bold text-territory-ink"
        >
          Seu pedido
        </h2>
        <button
          type="button"
          onClick={onAddMoreItems}
          className="text-xs font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          Adicionar mais itens
        </button>
      </div>
      <div className="mt-4 divide-y divide-territory-border border-y border-territory-border">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 py-3">
            <img
              src={item.image}
              alt=""
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-territory-ink">
                  {item.quantity} × {item.name}
                </p>
                <span className="shrink-0 text-sm font-bold text-territory-ink">
                  {currency(item.price)}
                </span>
              </div>
              {item.detail ? (
                <p className="mt-1 text-xs text-territory-muted">
                  {item.detail}
                </p>
              ) : null}
              <div className="mt-2 flex gap-3 text-[0.6875rem] text-territory-brand">
                <button
                  type="button"
                  onClick={onAddMoreItems}
                  className="underline-offset-2 hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => item.lineId && onRemoveItem(item.lineId)}
                  disabled={!item.lineId}
                  className="underline-offset-2 hover:underline"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 text-sm text-territory-ink">
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">Subtotal</span>
          <span>{currency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">{summaryDeliveryLabel}</span>
          <span>{currency(deliveryFee)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-territory-border pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{currency(total)}</span>
        </div>
      </div>
      {minimumOrderRemaining > 0 ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-territory-warning/15 px-3 py-2 text-[0.6875rem] text-territory-ink">
          <CircleAlert
            className="h-4 w-4 shrink-0 text-territory-warning"
            aria-hidden="true"
          />
          Faltam {currency(minimumOrderRemaining)} para o pedido mínimo.
        </p>
      ) : (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-territory-success/10 px-3 py-2 text-[0.6875rem] text-territory-ink">
          <Check
            className="h-4 w-4 shrink-0 text-territory-success"
            aria-hidden="true"
          />
          Pedido mínimo atingido.
        </p>
      )}
      <Button
        type="button"
        onClick={onConfirm}
        disabled={isSubmitDisabled}
        className="mt-4 h-12 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/90"
      >
        {isSubmitting ? "Criando pedido..." : `Confirmar pedido · ${currency(total)}`}
      </Button>
      <p className="mt-3 text-center text-[0.6875rem] leading-4 text-territory-muted">
        Após confirmar, a loja recebe o pedido e combina os detalhes do
        pagamento.
      </p>
      {mode === "delivery" && deliveryOption === "platform" ? (
        <button
          type="button"
          onClick={onFallback}
          className="mt-4 flex w-full items-center justify-between border-t border-territory-border pt-4 text-left text-xs font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          Se não houver entregador disponível{" "}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onContactStore}
        className="mt-4 flex min-h-10 items-center gap-2 text-xs font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Falar com a loja
      </button>
    </aside>
  );
}

function MobileCheckoutFooter({
  stage,
  total,
  disabled,
  onAddressContinue,
  onDeliveryContinue,
  onReviewConfirm,
  onFallbackContinue,
}: {
  stage: CheckoutStage;
  total: number;
  disabled?: boolean;
  onAddressContinue: () => void;
  onDeliveryContinue: () => void;
  onReviewConfirm: () => void;
  onFallbackContinue: () => void;
}) {
  const label =
    stage === "address"
      ? "Ver opções de entrega"
      : stage === "delivery"
        ? "Continuar para pagamento"
        : stage === "fallback"
          ? "Continuar com entrega da loja"
          : `Confirmar pedido · ${currency(total)}`;
  const onClick =
    stage === "address"
      ? onAddressContinue
      : stage === "delivery"
        ? onDeliveryContinue
        : stage === "fallback"
          ? onFallbackContinue
          : onReviewConfirm;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
      <div className="mx-auto max-w-[42rem]">
        <Button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="pointer-events-auto h-11 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink shadow-[0_4px_12px_rgba(18,62,61,0.12)] hover:bg-territory-sun/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          {label}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export default function GastronomyCheckoutConceptSurface({
  business,
}: {
  business: GastronomyBusiness;
}) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { user, activeProfile } = useSessionContext();
  const { cart, hasCart, minimumOrderReached, minimumOrderRemaining, removeItem } =
    useGastronomyCart(business);
  const { checkout, isSubmitting, hasActiveProfile } = useGastronomyCheckout();
  const availableModes = useMemo(
    () => getEnabledFulfillmentModes(business),
    [business],
  );
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>(() =>
    normalizeFulfillmentMode(business, cart.fulfillment_mode),
  );
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("store");
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [cashChangeFor, setCashChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState(false);
  const [addressMode, setAddressMode] = useState<"saved" | "other">("saved");
  const [stage, setStage] = useState<CheckoutStage>("address");
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
    handleActivateLocation,
    handleSubmitAddressDestination,
    handleUseSavedResidence,
    handleClearDestination,
  } = deliveryDestinationManager;
  const effectiveDestination =
    deliveryDestination?.source === "gps" ? null : deliveryDestination;
  const destinationLabel = useMemo(
    () => formatDeliveryDestinationDisplayLabel(effectiveDestination),
    [effectiveDestination],
  );
  const checkoutAddress = useMemo(
    () =>
      buildCheckoutDeliveryAddress(effectiveDestination, {
        streetNumber,
        complement,
        referencePoint,
        recipientName,
        recipientPhone,
      }),
    [
      complement,
      effectiveDestination,
      recipientName,
      recipientPhone,
      referencePoint,
      streetNumber,
    ],
  );
  const requiresAddress = requiresDeliveryDestination(fulfillmentMode);
  const structuredAddressReady = isStructuredDeliveryDestinationReady(
    effectiveDestination,
    streetNumber,
  );
  const checkoutCart = useMemo(
    () => applyFulfillmentToCart(cart, business, fulfillmentMode),
    [business, cart, fulfillmentMode],
  );
  const items = useMemo(() => toDisplayItems(checkoutCart), [checkoutCart]);
  const subtotal = checkoutCart.subtotal;
  const deliveryFee = deliveryOption === "platform" ? 0 : checkoutCart.delivery_fee;
  const total = subtotal + deliveryFee;
  const paymentOptions = useMemo(
    () => resolveCheckoutPaymentOptions(business, fulfillmentMode),
    [business, fulfillmentMode],
  );
  const platformUnavailable = !isPlatformCourierCheckoutAvailable();
  const platformCourierUnavailable = isPlatformCourierUnavailableForCheckout(
    business,
    fulfillmentMode,
  );

  useEffect(() => {
    setFulfillmentMode((current) => normalizeFulfillmentMode(business, current));
  }, [business]);

  useEffect(() => {
    if (!paymentOptions.some((option) => option.value === paymentMethod)) {
      setPaymentMethod(paymentOptions[0]?.value ?? "pix");
    }
  }, [paymentMethod, paymentOptions]);

  useEffect(() => {
    if (!effectiveDestination) return;
    setStreetNumber(effectiveDestination.number ?? "");
    setComplement(effectiveDestination.complement ?? "");
    setReferencePoint(effectiveDestination.reference ?? "");
  }, [effectiveDestination]);

  useEffect(() => {
    if (!activeProfile) return;
    setRecipientName((current) =>
      current || activeProfile.displayName || activeProfile.name || "",
    );
    setRecipientPhone((current) => current || activeProfile.phone || "");
  }, [activeProfile]);

  useEffect(() => {
    if (!requiresAddress) return;
    if (addressMode === "saved" && hasSavedResidence && !effectiveDestination) {
      void handleUseSavedResidence();
    }
    if (addressMode === "other") setShowDestinationEditor(true);
  }, [
    addressMode,
    effectiveDestination,
    handleUseSavedResidence,
    hasSavedResidence,
    requiresAddress,
    setShowDestinationEditor,
  ]);

  const isSubmitDisabled = isCheckoutSubmitDisabled({
    hasCart,
    minimumOrderReached,
    isSubmitting,
    hasActiveProfile,
    availableFulfillmentModes: availableModes,
    platformCourierUnavailable,
    requiresDeliveryDestination: requiresAddress,
    hasDeliveryDestination: Boolean(effectiveDestination),
    structuredDeliveryReady: structuredAddressReady,
  });
  const profileName =
    activeProfile?.displayName || activeProfile?.name || "Perfil ativo";
  const profileType = profileTypeLabel(activeProfile?.profileType);
  const addressEditor = requiresAddress && (showDestinationEditor || !destinationLabel) ? (
    <div className="space-y-3">
      <GastronomyDeliveryDestinationPanel
        destinationLabel={destinationLabel}
        destinationSourceLabel={effectiveDestination ? destinationSourceLabel : null}
        isEditing={showDestinationEditor}
        addressQuery={destinationAddressQuery}
        isResolvingAddress={isResolvingDestinationAddress}
        isLocatingUser={isLocatingUser}
        hasSavedAddressOption={hasSavedResidence}
        savedAddressLabel={savedResidenceLabel}
        isAuthenticated={Boolean(user)}
        errorMessage={destinationErrorMessage}
        onAddressQueryChange={setDestinationAddressQuery}
        onSubmitAddress={() => void handleSubmitAddressDestination()}
        onUseCurrentLocation={handleActivateLocation}
        onUseSavedAddress={() => void handleUseSavedResidence()}
        onOpenEditor={() => setShowDestinationEditor(true)}
        onCloseEditor={() => setShowDestinationEditor(false)}
        onGoToLogin={() => navigate(appUrls.auth.login)}
        showCurrentLocationAction={false}
      />
      {effectiveDestination && (showDestinationEditor || !structuredAddressReady) ? (
        <CheckoutDeliveryAddressFields
          idPrefix="concept-checkout"
          deliveryDestination={effectiveDestination}
          streetNumber={streetNumber}
          complement={complement}
          referencePoint={referencePoint}
          recipientName={recipientName}
          recipientPhone={recipientPhone}
          onStreetNumberChange={setStreetNumber}
          onComplementChange={setComplement}
          onReferencePointChange={setReferencePoint}
          onRecipientNameChange={setRecipientName}
          onRecipientPhoneChange={setRecipientPhone}
        />
      ) : null}
    </div>
  ) : null;

  const handleModeChange = (nextMode: FulfillmentMode) => {
    setFulfillmentMode(nextMode);
    setDeliveryOption("store");
    if (nextMode !== "delivery") setStage("review");
  };
  const handleAddressModeChange = (nextMode: "saved" | "other") => {
    setAddressMode(nextMode);
    if (nextMode === "saved") {
      void handleUseSavedResidence();
    } else {
      handleClearDestination();
      setShowDestinationEditor(true);
    }
  };
  const continueFromAddress = () => {
    if (!hasCart) {
      toast.error("Adicione pelo menos um item antes de continuar.", {
        position: "top-center",
      });
      return;
    }
    if (requiresAddress && !structuredAddressReady) {
      setShowDestinationEditor(true);
      toast.error("Informe o endereço completo para continuar.", {
        position: "top-center",
      });
      return;
    }
    setStage(fulfillmentMode === "delivery" ? "delivery" : "review");
  };
  const handleSubmit = async () => {
    if (isSubmitDisabled) return;
    try {
      const order = await checkout({
        business,
        cart: checkoutCart,
        fulfillment_mode: fulfillmentMode,
        payment_method: paymentMethod,
        notes: buildCheckoutOrderNotes({
          paymentMethod,
          cashChangeFor,
          customerNotes: notes,
          deliveryDestination: requiresAddress ? effectiveDestination : null,
          streetNumber,
          complement,
          referencePoint,
        }),
        deliveryAddress: checkoutAddress,
      });
      toast.success(`Pedido ${order.id.slice(0, 8)} criado com sucesso.`, {
        position: "top-center",
      });
      navigate(businessManagementRoutes.gastronomyPedidoPublico(order.id));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao concluir o pedido.",
        { position: "top-center" },
      );
    }
  };
  const returnToPrevious = () => {
    if (stage === "delivery") setStage("address");
    else if (stage === "review") setStage(fulfillmentMode === "delivery" ? "delivery" : "address");
    else if (stage === "fallback") setStage("review");
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-territory-canvas text-territory-ink">
      <Helmet>
        <title>Finalizar pedido | {business.name}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <CheckoutHeader
        business={business}
        profileName={profileName}
        profileType={profileType}
        onBack={returnToPrevious}
        onAccount={() => navigate(appUrls.profile.home)}
        stage={stage}
      />
      <main className="mx-auto max-w-[84rem] px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
        <div className="lg:hidden">
          <BusinessSummary business={business} />
          <div className="mt-3">
            {stage === "address" ? (
              <MobileAddressStage
                mode={fulfillmentMode}
                availableModes={availableModes}
                destination={checkoutAddress}
                addressEditor={addressEditor}
                addressMode={addressMode}
                hasSavedAddress={hasSavedResidence}
                profileName={profileName}
                profileType={profileType}
                profilePhone={recipientPhone}
                referencePoint={referencePoint}
                items={items}
                subtotal={subtotal}
                expandedItems={expandedItems}
                onModeChange={handleModeChange}
                onAddressModeChange={handleAddressModeChange}
                onEditAddress={() => setShowDestinationEditor(true)}
                onContinue={continueFromAddress}
                onToggleItems={() => setExpandedItems((current) => !current)}
              />
            ) : null}
            {stage === "delivery" ? (
              <MobileDeliveryStage
                mode={fulfillmentMode}
                availableModes={availableModes}
                deliveryOption={deliveryOption}
                destination={checkoutAddress}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                businessName={business.name}
                platformUnavailable={platformUnavailable}
                onModeChange={handleModeChange}
                onDeliveryOptionChange={setDeliveryOption}
                onContinue={() => setStage("review")}
              />
            ) : null}
            {stage === "review" ? (
              <MobileReviewStage
                mode={fulfillmentMode}
                deliveryOption={deliveryOption}
                paymentLabel={
                  paymentOptions.find((option) => option.value === paymentMethod)?.label ??
                    "Forma de pagamento"
                }
                destination={checkoutAddress}
                recipientName={profileName}
                businessName={business.name}
                items={items}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                notes={notes}
                notesExpanded={notesExpanded}
                paymentExpanded={paymentExpanded}
                paymentMethod={paymentMethod}
                paymentOptions={paymentOptions}
                cashChangeFor={cashChangeFor}
                onGoToDelivery={() =>
                  setStage(fulfillmentMode === "delivery" ? "delivery" : "address")
                }
                onGoToPayment={() => setPaymentExpanded((current) => !current)}
                onEditItems={() => navigate("..")}
                onOpenFallback={() => setStage("fallback")}
                onToggleNotes={() => setNotesExpanded((current) => !current)}
                onCashChangeForChange={setCashChangeFor}
                onPaymentMethodChange={setPaymentMethod}
                onNotesChange={setNotes}
                onConfirm={handleSubmit}
              />
            ) : null}
            {stage === "fallback" ? (
              <MobileFallbackStage
                destination={checkoutAddress}
                subtotal={subtotal}
                deliveryFee={checkoutCart.delivery_fee}
                items={items}
                onBackToReview={() => setStage("review")}
                onContinue={() => {
                  setDeliveryOption("store");
                  setStage("review");
                }}
              />
            ) : null}
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="flex items-start justify-between gap-6">
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar ao cardápio
              </button>
              <h1 className="font-heading text-3xl font-bold tracking-[-0.04em] text-territory-ink">
                {stage === "fallback" ? "Ajuste a entrega" : "Finalizar pedido"}
              </h1>
              <p className="mt-1 text-sm text-territory-muted">
                Confira endereço, entrega e pagamento antes de confirmar.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-territory-border bg-territory-surface px-4 py-3 text-xs">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-territory-raised">
                <UserRound className="h-4 w-4 text-territory-brand" aria-hidden="true" />
              </span>
              <span>
                 Pedido como <strong>{profileName}</strong> · {profileType}
              </span>
              <button type="button" className="font-semibold text-territory-brand">
                Alterar
              </button>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-6 rounded-xl border border-territory-border bg-territory-surface px-5 py-3">
            <Stepper stage={stage} />
            <p className="max-w-sm text-right text-xs text-territory-muted">
              Etapa {stage === "address" ? "1" : stage === "delivery" ? "2" : "3"} de 3 · Seus itens ficam preservados durante o ajuste.
            </p>
          </div>
          {stage === "fallback" ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-territory-warning/20 p-4 text-sm">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-territory-warning" aria-hidden="true" />
              <span>
                <strong className="block">A plataforma não atende este endereço</strong>
                <span className="text-territory-muted">Escolha a entrega da loja ou retirada para continuar com os mesmos itens.</span>
              </span>
            </div>
          ) : null}
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="space-y-4 sm:space-y-5">
              <AddressSection
                mode={fulfillmentMode}
                destination={checkoutAddress}
                addressMode={addressMode}
                hasSavedAddress={hasSavedResidence}
                addressEditor={addressEditor}
                profileName={profileName}
                profilePhone={recipientPhone}
                referencePoint={referencePoint}
                onAddressModeChange={handleAddressModeChange}
                onEditAddress={() => setShowDestinationEditor(true)}
              />
              <FulfillmentSection
                mode={fulfillmentMode}
                deliveryOption={deliveryOption}
                availableModes={availableModes}
                deliveryFee={deliveryFee}
                businessName={business.name}
                platformUnavailable={platformUnavailable}
                onModeChange={handleModeChange}
                onDeliveryOptionChange={setDeliveryOption}
              />
              <PaymentSection
                method={paymentMethod}
                options={paymentOptions}
                cashChangeFor={cashChangeFor}
                onCashChangeForChange={setCashChangeFor}
                onChange={setPaymentMethod}
              />
              <ItemsSection
                items={items}
                onRemoveItem={removeItem}
                onAddMoreItems={() => navigate("..")}
              />
              <section className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5" aria-labelledby="checkout-notes-title">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="checkout-notes-title" className="font-heading text-base font-bold text-territory-ink">
                    Observações do pedido <span className="font-normal text-territory-muted">(opcional)</span>
                  </h2>
                  <span className="text-[0.6875rem] text-territory-muted">{notes.length}/280</span>
                </div>
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={280} rows={3} placeholder="Algo que a loja precisa saber?" className="mt-3 min-h-20 resize-none rounded-lg border-territory-border bg-territory-surface text-sm placeholder:text-territory-muted" />
              </section>
            </div>
            <OrderSummary
              mode={fulfillmentMode}
              deliveryOption={deliveryOption}
              items={items}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              minimumOrderRemaining={minimumOrderRemaining}
              isSubmitDisabled={isSubmitDisabled}
              isSubmitting={isSubmitting}
              onAddMoreItems={() => navigate("..")}
              onRemoveItem={removeItem}
              onConfirm={handleSubmit}
              onFallback={() => setStage("fallback")}
              onContactStore={() => navigate(appUrls.messages)}
            />
          </div>
          <p className="mt-6 text-center text-xs text-territory-muted">
            Pedido e pagamento serão registrados no fluxo oficial de Gastronomia.
          </p>
        </div>
      </main>
      <MobileCheckoutFooter
        stage={stage}
        total={total}
        disabled={stage === "review" ? isSubmitDisabled : !hasCart}
        onAddressContinue={continueFromAddress}
        onDeliveryContinue={() => setStage("review")}
        onReviewConfirm={handleSubmit}
        onFallbackContinue={() => {
          setDeliveryOption("store");
          setStage("review");
        }}
      />
    </div>
  );
}
