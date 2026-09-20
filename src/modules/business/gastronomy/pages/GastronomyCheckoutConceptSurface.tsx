import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Bike,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  House,
  Info,
  MapPin,
  MessageCircle,
  PackageCheck,
  Search,
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
import { DeliveryAreaService } from "@/core/business/services/GastronomyDeliveryAreaService";
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
type DeliveryEligibilityState = "unknown" | "eligible" | "ineligible";

const CHECKOUT_SCREEN_TITLE_CLASS =
  "m-0 font-heading text-2xl font-bold leading-tight tracking-[-0.04em] text-territory-ink";
const CHECKOUT_DESKTOP_TITLE_CLASS =
  "m-0 font-heading text-3xl font-bold leading-tight tracking-[-0.04em] text-territory-ink";
const CHECKOUT_SECTION_TITLE_CLASS =
  "m-0 font-heading text-base font-bold leading-5 text-territory-ink";

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

function deliveryLabel(mode: FulfillmentMode, option: DeliveryOption): string {
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
        "flex min-h-11 w-full items-start gap-2 rounded-lg border px-3 py-3 text-left text-type-caption transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:text-type-label",
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
  activeClassName,
  onClick,
}: {
  active: boolean;
  icon: typeof Truck;
  label: string;
  activeClassName?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border px-2 text-type-caption font-semibold text-territory-ink transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand",
        active
          ? (activeClassName ??
              "border-territory-brand bg-territory-brand text-white")
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
    <div className="grid grid-cols-3 items-start gap-2 text-center text-type-micro text-territory-muted sm:max-w-sm sm:text-type-caption">
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
              "relative z-10 mx-auto flex h-6 w-6 items-center justify-center rounded-full text-type-caption font-bold",
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
  profileName,
  onBack,
  onAccount,
  stage,
}: {
  profileName: string;
  onBack: () => void;
  onAccount: () => void;
  stage: CheckoutStage;
}) {
  return (
    <>
      <header className="hidden border-b border-territory-brand/40 bg-territory-brand lg:block">
        <div className="mx-auto flex h-14 max-w-[84rem] items-center gap-6 px-6">
          <button
            type="button"
            onClick={onBack}
            className="font-heading text-2xl font-extrabold tracking-[-0.05em] text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Achegue-se<span className="text-territory-sun">.</span>
          </button>
          <nav
            className="ml-auto flex items-center gap-6 text-type-caption font-semibold text-white"
            aria-label="Navegação"
          >
            <span>Descobrir</span>
            <span>Meus pedidos</span>
            <span>Apoio à comunidade</span>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onAccount}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={`Conta de ${profileName}`}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              {profileName}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </nav>
        </div>
      </header>
      <div className="border-b border-territory-border bg-territory-surface px-4 py-2 lg:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-8 items-center gap-2 text-type-caption font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {stage === "address" ? "Cardápio" : "Voltar"}
        </button>
      </div>
    </>
  );
}

function BusinessSummary({ business }: { business: GastronomyBusiness }) {
  const cityState = [business.business_city, business.business_state]
    .filter(Boolean)
    .join(", ");
  const locationLabel = [
    business.location?.name,
    cityState || business.location?.full_name,
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
        <p className="truncate text-sm font-bold text-territory-ink lg:text-base">
          {business.name}
        </p>
        <p className="text-type-caption text-territory-muted">
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
  emptyLabel = "Endereço do perfil",
  recipientName,
  recipientPhone,
  referencePoint,
}: {
  destination: ReturnType<typeof buildCheckoutDeliveryAddress>;
  compact?: boolean;
  onEdit?: () => void;
  emptyLabel?: string;
  recipientName?: string;
  recipientPhone?: string;
  referencePoint?: string;
}) {
  const address = destination;
  const hasAddress = Boolean(address);

  return (
    <div className="rounded-lg border border-territory-border bg-territory-surface p-3 text-type-caption text-territory-ink">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-type-label font-bold">
            {address?.label ? (
              <House
                className="h-4 w-4 shrink-0 text-territory-brand"
                aria-hidden="true"
              />
            ) : (
              <MapPin
                className="h-4 w-4 shrink-0 text-territory-brand"
                aria-hidden="true"
              />
            )}
            {address?.label || emptyLabel}
          </p>
          {hasAddress ? (
            <div className="mt-1 pl-6 text-territory-muted">
              <p>
                {[address?.street, address?.number, address?.complement]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p>
                {[address?.neighborhood, address?.city, address?.state]
                  .filter(Boolean)
                  .join(" · ")}
                {!compact && address?.postal_code
                  ? ` · CEP ${address.postal_code}`
                  : ""}
              </p>
            </div>
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
            className="shrink-0 text-type-caption font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
          >
            {hasAddress ? "Editar" : "Adicionar"}
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
          <span className="block text-type-caption font-bold text-territory-ink">
            Itens do pedido · {currency(subtotal)}
          </span>
          <span className="block text-type-caption text-territory-muted">
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
              <span className="min-w-0 flex-1 text-type-caption text-territory-ink">
                <span className="block text-type-label font-semibold">
                  {item.quantity} × {item.name}
                </span>
                {item.detail ? (
                  <span className="block text-type-caption text-territory-muted">
                    {item.detail}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-type-caption font-bold text-territory-ink">
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
  const mobileAvailableModes =
    mode === "dine_in"
      ? availableModes
      : availableModes.filter((availableMode) => availableMode !== "dine_in");

  return (
    <div className="space-y-3">
      <h1 className={CHECKOUT_SCREEN_TITLE_CLASS}>
        {mode === "delivery"
          ? "Onde vamos entregar?"
          : "Como você quer receber?"}
      </h1>
      <div
        className={cn(
          "grid gap-2",
          mobileAvailableModes.length === 1
            ? "grid-cols-1"
            : mobileAvailableModes.length === 2
              ? "grid-cols-2"
              : "grid-cols-3",
        )}
      >
        {mobileAvailableModes.map((availableMode) => {
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
              label={
                availableMode === "takeout"
                  ? "Retirada no local"
                  : fulfillmentLabel(availableMode)
              }
              onClick={() => onModeChange(availableMode)}
            />
          );
        })}
      </div>
      <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-territory-border bg-territory-surface px-3 text-type-caption">
        <span className="flex min-w-0 items-center gap-2 text-type-caption text-territory-ink">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-territory-raised">
            <UserRound
              className="h-4 w-4 text-territory-brand"
              aria-hidden="true"
            />
          </span>
          <span className="text-type-label font-semibold">{profileName}</span>{" "}
          <span className="font-normal text-territory-muted">
            · {profileType}
          </span>
        </span>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-territory-muted"
          aria-hidden="true"
        />
      </div>
      {mode === "delivery" ? (
        <div>
          <p className="mb-2 text-type-label font-bold text-territory-ink">
            Endereço de entrega
          </p>
          <div className="mb-2 grid grid-cols-2 gap-2 text-type-caption">
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
            emptyLabel={
              addressMode === "other" ? "Outro endereço" : "Endereço do perfil"
            }
            onEdit={onEditAddress}
            recipientName={profileName}
            recipientPhone={profilePhone}
            referencePoint={referencePoint}
          />
          {addressEditor}
        </div>
      ) : null}
      {mode === "delivery" ? (
        <p className="flex items-center gap-1.5 rounded-lg bg-territory-info/10 px-3 py-2 text-type-caption text-territory-ink">
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
  platformCourierAvailable,
  businessName,
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
  platformCourierAvailable: boolean;
  businessName: string;
  onModeChange: (mode: FulfillmentMode) => void;
  onDeliveryOptionChange: (option: DeliveryOption) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-3">
      <h1 className={CHECKOUT_SCREEN_TITLE_CLASS}>Escolha a entrega</h1>
      <AddressCard destination={destination} compact />
      <div className="space-y-2">
        <ChoiceButton
          active={deliveryOption === "store"}
          activeClassName="border-territory-sun bg-territory-sun/10 text-territory-ink"
          onClick={() => onDeliveryOptionChange("store")}
        >
          <span className="flex items-center gap-2 text-type-label font-bold">
            <Truck
              className="h-5 w-5 text-territory-brand"
              aria-hidden="true"
            />
            Entrega da loja{" "}
            <span className="ml-auto">{currency(deliveryFee)}</span>
          </span>
          <span className="mt-1 block pl-7 text-type-caption text-territory-muted">
            Equipe do estabelecimento
          </span>
          <span className="mt-1 block pl-7 text-type-caption text-territory-muted">
            Seu pedido será entregue pela equipe do {businessName}.
          </span>
        </ChoiceButton>
        <ChoiceButton
          active={false}
          disabled={!platformCourierAvailable}
          onClick={() => onDeliveryOptionChange("platform")}
        >
          <span className="flex items-center gap-2 text-type-label font-bold">
            <Bike className="h-5 w-5 text-territory-brand" aria-hidden="true" />
            Motoboy Achegue-se
            <span className="ml-auto text-type-caption font-normal text-territory-muted">
              {platformCourierAvailable ? "Disponível" : "Indisponível"}
            </span>
          </span>
          <span className="mt-1 block pl-7 text-type-caption text-territory-muted">
            {platformCourierAvailable
              ? "Entregador buscado pela plataforma."
              : "A plataforma ainda não está disponível neste checkout."}
          </span>
        </ChoiceButton>
        {availableModes.includes("takeout") ? (
          <button
            type="button"
            onClick={() => {
              onModeChange("takeout");
              onContinue();
            }}
            className="flex min-h-12 w-full items-center justify-between rounded-lg border border-territory-border bg-territory-surface px-3 text-left text-type-label font-semibold text-territory-ink hover:border-territory-brand/50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
          >
            <span className="flex items-center gap-2">
              <Store
                className="h-5 w-5 text-territory-brand"
                aria-hidden="true"
              />
              Retirar na loja
            </span>
            <span className="flex items-center gap-1 text-type-caption font-normal text-territory-muted">
              Sem taxa <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        ) : null}
      </div>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3 text-type-caption">
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">Produtos</span>
          <strong>{currency(subtotal)}</strong>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-territory-muted">
            {deliveryLabel(mode, deliveryOption)}
          </span>
          <strong>
            {currency(deliveryOption === "platform" ? 0 : deliveryFee)}
          </strong>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-territory-border pt-3 text-type-body font-bold leading-tight">
          <span>Total</span>
          <span>
            {currency(
              subtotal + (deliveryOption === "platform" ? 0 : deliveryFee),
            )}
          </span>
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
  const FulfillmentIcon =
    mode === "delivery" ? Truck : mode === "takeout" ? ShoppingBag : Store;
  return (
    <div className="space-y-3">
      <h1 className={CHECKOUT_SCREEN_TITLE_CLASS}>Revisar pedido</h1>
      <Stepper stage="review" />
      <div className="space-y-2">
        <button
          type="button"
          onClick={onGoToDelivery}
          className="flex w-full items-start gap-3 rounded-lg border border-territory-border bg-territory-surface p-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
        >
          <FulfillmentIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 text-type-caption">
            <strong className="block text-type-label">
              {deliveryLabel(mode, deliveryOption)}
            </strong>
            <span className="mt-0.5 block text-type-caption text-territory-muted">
              {recipientName || "Cliente"}
              {destination ? (
                <>
                  {" · "}
                  {[
                    destination.street,
                    destination.number,
                    destination.complement,
                  ]
                    .filter(Boolean)
                    .join(", ") || destination.label}
                  <br />
                  {[
                    destination.neighborhood,
                    destination.city,
                    destination.state,
                  ]
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
          <span className="shrink-0 text-type-caption font-semibold text-territory-brand">
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
          <span className="min-w-0 flex-1 text-type-caption">
            <strong className="block text-type-label">{paymentLabel}</strong>
            <span className="mt-0.5 block text-type-caption text-territory-muted">
              Produtos pagos diretamente à loja
            </span>
          </span>
          <span className="shrink-0 text-type-caption font-semibold text-territory-brand">
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
          <h2 className="font-heading text-type-label font-bold text-territory-ink">
            Itens do pedido
          </h2>
          <button
            type="button"
            onClick={onEditItems}
            className="text-type-caption font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
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
              <span className="min-w-0 flex-1 text-type-caption">
                <strong className="block truncate text-type-label">
                  {item.quantity} × {item.name}
                </strong>
                <span className="block text-type-caption text-territory-muted">
                  {item.detail}
                </span>
              </span>
              <span className="shrink-0 text-type-caption font-bold">
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
        className="flex min-h-10 w-full items-center justify-between rounded-lg border border-territory-border bg-territory-surface px-3 text-left text-type-caption font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
      >
        Observações do pedido <span className="sr-only">(opcional)</span>
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
      <div className="rounded-lg border border-territory-border bg-territory-surface p-2.5 text-type-caption">
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">Produtos</span>
          <span>{currency(subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-territory-muted">
            {deliveryLabel(mode, deliveryOption)}
          </span>
          <span>{currency(deliveryFee)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-territory-border pt-2 text-type-body font-bold leading-tight">
          <span>Total</span>
          <span>{currency(total)}</span>
        </div>
      </div>
      {deliveryOption === "platform" ? (
        <button
          type="button"
          onClick={onOpenFallback}
          className="flex w-full items-center justify-between border-t border-territory-border pt-2.5 text-left text-type-caption font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
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
  fallbackReason,
  items,
  availableModes,
  selectedMode,
  onBackToReview,
  onSelectMode,
  onContinue,
  onEditAddress,
  onContactStore,
}: {
  destination: ReturnType<typeof buildCheckoutDeliveryAddress>;
  subtotal: number;
  deliveryFee: number;
  fallbackReason: "store" | "platform";
  items: CheckoutDisplayItem[];
  availableModes: FulfillmentMode[];
  selectedMode: FulfillmentMode;
  onBackToReview: () => void;
  onSelectMode: (mode: FulfillmentMode) => void;
  onContinue: () => void;
  onEditAddress?: () => void;
  onContactStore: () => void;
}) {
  const selectableModes = availableModes;
  const hasSelectableMode = selectableModes.length > 0;
  const selectedDeliveryFee = selectedMode === "delivery" ? deliveryFee : 0;
  const selectedModeLabel =
    selectedMode === "delivery"
      ? "Entrega da loja"
      : selectedMode === "takeout"
        ? "Retirada na loja"
        : "Consumo no local";
  const warning = (
    <div className="rounded-lg bg-territory-warning/20 p-3 text-type-caption text-territory-ink">
      <p className="flex items-center gap-2 text-type-label font-bold">
        <CircleAlert
          className="h-5 w-5 shrink-0 text-territory-warning"
          aria-hidden="true"
        />
        {fallbackReason === "store"
          ? "A loja não atende este endereço"
          : "A plataforma não atende este endereço"}
      </p>
      <p className="mt-1 pl-7 text-territory-muted">
        {hasSelectableMode
          ? fallbackReason === "store"
            ? "Escolha retirada ou outra modalidade disponível para continuar."
            : "Você pode escolher outra opção para continuar."
          : "Nenhuma modalidade está disponível para este pedido."}
      </p>
    </div>
  );

  if (!hasSelectableMode) {
    return (
      <div className="space-y-3">
        <h1 className={CHECKOUT_SCREEN_TITLE_CLASS}>Ajuste a entrega</h1>
        {warning}
        {onEditAddress ? (
          <button
            type="button"
            onClick={onEditAddress}
            className="min-h-11 w-full rounded-lg bg-territory-sun px-4 py-3 text-sm font-bold text-territory-ink hover:bg-territory-sun/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
          >
            Alterar endereço
          </button>
        ) : null}
        <button
          type="button"
          onClick={onContactStore}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-territory-brand px-4 py-2.5 text-type-label font-bold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Falar com a loja
        </button>
        <button
          type="button"
          onClick={onBackToReview}
          className="hidden w-full rounded-lg border border-territory-border px-4 py-3 text-sm font-bold text-territory-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand sm:block"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className={CHECKOUT_SCREEN_TITLE_CLASS}>Ajuste a entrega</h1>
      {warning}
      <AddressCard destination={destination} compact onEdit={onEditAddress} />
      <div className="space-y-2">
        <p className="text-type-label font-bold text-territory-ink">
          Escolha uma opção disponível
        </p>
        {selectableModes.map((availableMode) => {
          const isDelivery = availableMode === "delivery";
          return (
            <ChoiceButton
              key={availableMode}
              active={selectedMode === availableMode}
              onClick={() => onSelectMode(availableMode)}
            >
              <span className="flex items-center gap-2 text-type-label font-bold">
                {isDelivery ? (
                  <Truck
                    className="h-5 w-5 text-territory-brand"
                    aria-hidden="true"
                  />
                ) : (
                  <Store
                    className="h-5 w-5 text-territory-brand"
                    aria-hidden="true"
                  />
                )}
                {isDelivery
                  ? "Entrega da loja"
                  : availableMode === "takeout"
                    ? "Retirada na loja"
                    : "Consumo no local"}
                {isDelivery ? (
                  <span className="ml-auto">{currency(deliveryFee)}</span>
                ) : null}
              </span>
              <span className="mt-1 block pl-7 text-type-caption text-territory-muted">
                {isDelivery
                  ? "Equipe do estabelecimento"
                  : "Sem taxa de entrega"}
              </span>
            </ChoiceButton>
          );
        })}
      </div>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3">
        <div className="flex items-center justify-between gap-3 text-type-caption font-bold">
          <span>
            Seu pedido ·{" "}
            {items.reduce((total, item) => total + item.quantity, 0)} itens
          </span>
          <span>{currency(subtotal)}</span>
        </div>
        <p className="mt-1 text-type-caption text-territory-muted">
          Seus itens foram mantidos.
        </p>
      </div>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3 text-type-caption">
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">Produtos</span>
          <span>{currency(subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-territory-muted">{selectedModeLabel}</span>
          <span>{currency(selectedDeliveryFee)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-territory-border pt-3 text-type-body font-bold leading-tight">
          <span>Total</span>
          <span>{currency(subtotal + selectedDeliveryFee)}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="hidden min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-territory-sun px-4 py-3 text-sm font-bold text-territory-ink hover:bg-territory-sun/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand lg:flex"
      >
        {selectedMode === "delivery"
          ? "Continuar com entrega da loja"
          : selectedMode === "takeout"
            ? "Continuar com retirada na loja"
            : "Continuar com consumo no local"}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onBackToReview}
        className="hidden w-full rounded-lg border border-territory-brand px-4 py-3 text-sm font-bold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand sm:block"
      >
        Voltar para revisão
      </button>
      <button
        type="button"
        onClick={onContactStore}
        className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-territory-brand px-4 py-2.5 text-type-label font-bold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Falar com a loja
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
      <div>
        <h2
          id="checkout-address-title"
          className={CHECKOUT_SECTION_TITLE_CLASS}
        >
          2. Endereço e destinatário
        </h2>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-type-caption">
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
          emptyLabel={
            addressMode === "other" ? "Outro endereço" : "Endereço do perfil"
          }
          onEdit={onEditAddress}
          recipientName={profileName}
          recipientPhone={profilePhone}
          referencePoint={referencePoint}
        />
      </div>
      {addressEditor}
      <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-territory-info/10 px-3 py-2 text-type-caption text-territory-ink">
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
  platformCourierAvailable,
  businessName,
  onModeChange,
  onDeliveryOptionChange,
}: {
  mode: FulfillmentMode;
  deliveryOption: DeliveryOption;
  availableModes: FulfillmentMode[];
  deliveryFee: number;
  platformCourierAvailable: boolean;
  businessName: string;
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
          className={CHECKOUT_SECTION_TITLE_CLASS}
        >
          1. Recebimento
        </h2>
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
              activeClassName="border-territory-brand bg-territory-success/10 text-territory-ink"
              onClick={() => onModeChange(availableMode)}
            />
          );
        })}
      </div>
      {mode === "delivery" ? (
        <>
          <h3 className="mt-5 text-type-label font-semibold text-territory-ink">
            Quem entrega
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <ChoiceButton
              active={deliveryOption === "store"}
              activeClassName="border-territory-sun bg-territory-sun/10 text-territory-ink"
              onClick={() => onDeliveryOptionChange("store")}
            >
              <span className="block text-type-label font-semibold">
                Entrega da loja{" "}
                <span className="float-right">{currency(deliveryFee)}</span>
              </span>
              <span className="mt-0.5 block text-type-caption text-territory-muted">
                Equipe do estabelecimento
              </span>
              <span className="mt-1 block text-type-caption text-territory-muted">
                Seu pedido será entregue pela equipe do {businessName}.
              </span>
            </ChoiceButton>
            <ChoiceButton
              active={false}
              disabled={!platformCourierAvailable}
              onClick={() => onDeliveryOptionChange("platform")}
            >
              <span className="block text-type-label font-semibold">
                <Bike
                  className="mr-1 inline h-4 w-4 text-territory-brand"
                  aria-hidden="true"
                />
                Motoboy Achegue-se
              </span>
              <span className="mt-0.5 block text-type-caption text-territory-muted">
                {platformCourierAvailable
                  ? "Entregador buscado pela plataforma"
                  : "Indisponível neste checkout"}
              </span>
              <span className="mt-1 block text-type-caption text-territory-muted">
                {platformCourierAvailable
                  ? "A taxa será calculada conforme o endereço."
                  : "A operação atual usa a entrega da loja."}
              </span>
            </ChoiceButton>
          </div>
          <p className="mt-3 flex items-center gap-2 text-type-caption text-territory-muted">
            <Info
              className="h-3.5 w-3.5 shrink-0 text-territory-brand"
              aria-hidden="true"
            />
            A disponibilidade depende do endereço e da operação na região.
          </p>
        </>
      ) : (
        <p className="mt-3 text-type-caption text-territory-muted">
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
  stepNumber = 3,
}: {
  method: string;
  options: CheckoutPaymentOption[];
  cashChangeFor: string;
  onCashChangeForChange: (value: string) => void;
  onChange: (method: string) => void;
  compact?: boolean;
  stepNumber?: number;
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
            className={CHECKOUT_SECTION_TITLE_CLASS}
          >
            {stepNumber}. Pagamento
          </h2>
          <p className="mt-2 flex items-center gap-2 rounded-lg bg-territory-sun/20 px-3 py-2 text-type-caption text-territory-ink">
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
            <span className="block text-type-label font-semibold">
              {option.label}
            </span>
            <span className="mt-0.5 block text-type-caption text-territory-muted">
              Pagamento combinado diretamente com a loja
            </span>
          </ChoiceButton>
        ))}
      </div>
      {method === "cash" ? (
        <label className="mt-3 block text-type-caption font-semibold text-territory-ink">
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
        className="mt-3 flex min-h-9 w-full items-center justify-between border-t border-territory-border pt-3 text-left text-type-caption font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
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
        <h2 id="checkout-items-title" className={CHECKOUT_SECTION_TITLE_CLASS}>
          Itens do pedido
        </h2>
        <button
          type="button"
          onClick={onAddMoreItems}
          className="text-type-caption font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
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
                <p className="mt-0.5 text-type-caption text-territory-muted">
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
                  className="text-type-caption font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
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
          className="text-type-caption font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
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
                <p className="mt-1 text-type-caption text-territory-muted">
                  {item.detail}
                </p>
              ) : null}
              <div className="mt-2 flex gap-3 text-type-caption text-territory-brand">
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
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-territory-warning/15 px-3 py-2 text-type-caption text-territory-ink">
          <CircleAlert
            className="h-4 w-4 shrink-0 text-territory-warning"
            aria-hidden="true"
          />
          Faltam {currency(minimumOrderRemaining)} para o pedido mínimo.
        </p>
      ) : (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-territory-success/10 px-3 py-2 text-type-caption text-territory-ink">
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
        {isSubmitting
          ? "Criando pedido..."
          : `Confirmar pedido · ${currency(total)}`}
      </Button>
      <p className="mt-3 text-center text-type-caption text-territory-muted">
        Após confirmar, a loja recebe o pedido e combina os detalhes do
        pagamento.
      </p>
      {mode === "delivery" && deliveryOption === "platform" ? (
        <button
          type="button"
          onClick={onFallback}
          className="mt-4 flex w-full items-center justify-between border-t border-territory-border pt-4 text-left text-type-caption font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          Se não houver entregador disponível{" "}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onContactStore}
        className="mt-4 flex min-h-10 items-center gap-2 text-type-caption font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Falar com a loja
      </button>
    </aside>
  );
}

function MobileCheckoutFooter({
  stage,
  mode,
  total,
  disabled,
  fallbackLabel,
  onAddressContinue,
  onDeliveryContinue,
  onReviewConfirm,
  onFallbackContinue,
}: {
  stage: CheckoutStage;
  mode: FulfillmentMode;
  total: number;
  disabled?: boolean;
  fallbackLabel?: string;
  onAddressContinue: () => void;
  onDeliveryContinue: () => void;
  onReviewConfirm: () => void;
  onFallbackContinue: () => void;
}) {
  const label =
    stage === "address"
      ? mode === "delivery"
        ? "Ver opções de entrega"
        : "Continuar para pagamento"
      : stage === "delivery"
        ? "Continuar para pagamento"
        : stage === "fallback"
          ? (fallbackLabel ?? "Continuar com a opção escolhida")
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
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
  const {
    cart,
    hasCart,
    minimumOrderReached,
    minimumOrderRemaining,
    removeItem,
  } = useGastronomyCart(business);
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
  const [fallbackReason, setFallbackReason] = useState<"store" | "platform">(
    "platform",
  );
  const [fallbackMode, setFallbackMode] = useState<FulfillmentMode>(() =>
    availableModes.includes("delivery")
      ? "delivery"
      : (availableModes[0] ?? "takeout"),
  );
  const [deliveryEligibility, setDeliveryEligibility] =
    useState<DeliveryEligibilityState>("unknown");
  const [deliveryFeeOverride, setDeliveryFeeOverride] = useState<number | null>(
    null,
  );
  const [isCheckingDeliveryCoverage, setIsCheckingDeliveryCoverage] =
    useState(false);
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
    openEditorWhenEmpty: false,
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
  const baseCheckoutCart = useMemo(
    () => applyFulfillmentToCart(cart, business, fulfillmentMode),
    [business, cart, fulfillmentMode],
  );
  const checkoutCart = useMemo(() => {
    if (fulfillmentMode !== "delivery" || deliveryFeeOverride === null) {
      return baseCheckoutCart;
    }

    return {
      ...baseCheckoutCart,
      delivery_fee: deliveryFeeOverride,
      total: baseCheckoutCart.subtotal + deliveryFeeOverride,
    };
  }, [baseCheckoutCart, deliveryFeeOverride, fulfillmentMode]);
  const fallbackCart = useMemo(
    () => applyFulfillmentToCart(cart, business, fallbackMode),
    [business, cart, fallbackMode],
  );
  const items = useMemo(() => toDisplayItems(checkoutCart), [checkoutCart]);
  const subtotal = checkoutCart.subtotal;
  const deliveryFee =
    deliveryOption === "platform" ? 0 : checkoutCart.delivery_fee;
  const total = subtotal + deliveryFee;
  const paymentOptions = useMemo(
    () => resolveCheckoutPaymentOptions(business, fulfillmentMode),
    [business, fulfillmentMode],
  );
  const platformCourierUnavailable = isPlatformCourierUnavailableForCheckout(
    business,
    fulfillmentMode,
  );
  const fallbackModes = useMemo(
    () =>
      deliveryEligibility === "ineligible" || fallbackReason === "platform"
        ? availableModes.filter((mode) => mode !== "delivery")
        : availableModes,
    [availableModes, deliveryEligibility, fallbackReason],
  );
  const fallbackLabel =
    fallbackMode === "delivery"
      ? "Continuar com entrega da loja"
      : fallbackMode === "takeout"
        ? "Continuar com retirada na loja"
        : "Continuar com consumo no local";

  useEffect(() => {
    setFulfillmentMode((current) =>
      normalizeFulfillmentMode(business, current),
    );
  }, [business]);

  useEffect(() => {
    setDeliveryEligibility("unknown");
    setDeliveryFeeOverride(null);
  }, [checkoutAddress, fulfillmentMode]);

  useEffect(() => {
    setFallbackMode((current) =>
      availableModes.includes(current)
        ? current
        : (availableModes[0] ?? "takeout"),
    );
  }, [availableModes]);

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
    setRecipientName(
      (current) =>
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
  const addressEditor =
    requiresAddress && showDestinationEditor ? (
      <div className="space-y-3">
        <GastronomyDeliveryDestinationPanel
          destinationLabel={destinationLabel}
          destinationSourceLabel={
            effectiveDestination ? destinationSourceLabel : null
          }
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
        {effectiveDestination &&
        (showDestinationEditor || !structuredAddressReady) ? (
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
    setDeliveryEligibility("unknown");
    setDeliveryFeeOverride(null);
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
  const continueFromAddress = async () => {
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

    if (fulfillmentMode !== "delivery") {
      setStage("review");
      return;
    }

    if (platformCourierUnavailable) {
      setFallbackReason("platform");
      setFallbackMode((current) => {
        const nextMode = availableModes.find((mode) => mode !== "delivery");
        return nextMode && current === "delivery" ? nextMode : current;
      });
      setStage("fallback");
      return;
    }

    if (
      deliveryEligibility === "unknown" &&
      checkoutAddress?.neighborhood &&
      checkoutAddress.city &&
      checkoutAddress.state
    ) {
      setIsCheckingDeliveryCoverage(true);
      try {
        const eligibilityResult = await DeliveryAreaService.checkEligibility(
          business.business_data_id,
          checkoutAddress.neighborhood,
          checkoutAddress.city,
          checkoutAddress.state,
          checkoutCart.total,
        );

        if (eligibilityResult.error || !eligibilityResult.data) {
          toast.error(
            eligibilityResult.error ||
              "Não foi possível validar a área de entrega agora.",
            { position: "top-center" },
          );
          return;
        }

        if (!eligibilityResult.data.is_eligible) {
          setDeliveryEligibility("ineligible");
          setFallbackReason("store");
          setFallbackMode((current) => {
            const nextMode = availableModes.find((mode) => mode !== "delivery");
            return nextMode && current === "delivery" ? nextMode : current;
          });
          setStage("fallback");
          return;
        }

        setDeliveryEligibility("eligible");
        setDeliveryFeeOverride(eligibilityResult.data.delivery_fee);
      } finally {
        setIsCheckingDeliveryCoverage(false);
      }
    }

    setStage("delivery");
  };
  const continueFromFallback = () => {
    if (!fallbackModes.includes(fallbackMode)) return;
    setFulfillmentMode(fallbackMode);
    setDeliveryOption("store");
    setStage("review");
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
      const message =
        error instanceof Error ? error.message : "Falha ao concluir o pedido.";
      const normalizedMessage = message
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      if (
        requiresAddress &&
        (normalizedMessage.includes("area de entrega") ||
          normalizedMessage.includes("fora da area"))
      ) {
        setDeliveryEligibility("ineligible");
        setFallbackReason("store");
        setFallbackMode((current) => {
          const nextMode = availableModes.find((mode) => mode !== "delivery");
          return nextMode && current === "delivery" ? nextMode : current;
        });
        setStage("fallback");
        return;
      }

      toast.error(message, { position: "top-center" });
    }
  };
  const returnToPrevious = () => {
    if (stage === "delivery") setStage("address");
    else if (stage === "review")
      setStage(fulfillmentMode === "delivery" ? "delivery" : "address");
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
        profileName={profileName}
        onBack={returnToPrevious}
        onAccount={() => navigate(appUrls.profile.home)}
        stage={stage}
      />
      <main className="mx-auto max-w-[84rem] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
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
                platformCourierAvailable={isPlatformCourierCheckoutAvailable()}
                businessName={business.name}
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
                  paymentOptions.find(
                    (option) => option.value === paymentMethod,
                  )?.label ?? "Forma de pagamento"
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
                  setStage(
                    fulfillmentMode === "delivery" ? "delivery" : "address",
                  )
                }
                onGoToPayment={() => setPaymentExpanded((current) => !current)}
                onEditItems={() => navigate("..")}
                onOpenFallback={() => {
                  setFallbackReason("platform");
                  setStage("fallback");
                }}
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
                deliveryFee={fallbackCart.delivery_fee}
                fallbackReason={fallbackReason}
                items={items}
                availableModes={fallbackModes}
                selectedMode={fallbackMode}
                onBackToReview={() => setStage("review")}
                onSelectMode={setFallbackMode}
                onContinue={continueFromFallback}
                onEditAddress={() => setShowDestinationEditor(true)}
                onContactStore={() => navigate(appUrls.messages)}
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
                className="mb-3 inline-flex items-center gap-1 text-type-caption font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar ao cardápio
              </button>
              <h1 className={CHECKOUT_DESKTOP_TITLE_CLASS}>
                {stage === "fallback" ? "Ajuste a entrega" : "Finalizar pedido"}
              </h1>
              <div className="mt-4">
                <BusinessSummary business={business} />
              </div>
            </div>
            <div className="mt-20 flex items-center gap-3 rounded-lg border border-territory-border bg-territory-surface px-4 py-3 text-type-caption">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-territory-raised">
                <UserRound
                  className="h-4 w-4 text-territory-brand"
                  aria-hidden="true"
                />
              </span>
              <span>
                Pedido como <strong>{profileName}</strong> · {profileType}
              </span>
              <button
                type="button"
                className="font-semibold text-territory-brand"
              >
                Alterar
              </button>
            </div>
          </div>
          {stage === "fallback" ? (
            <div className="mt-5 max-w-2xl">
              <MobileFallbackStage
                destination={checkoutAddress}
                subtotal={subtotal}
                deliveryFee={fallbackCart.delivery_fee}
                fallbackReason={fallbackReason}
                items={items}
                availableModes={fallbackModes}
                selectedMode={fallbackMode}
                onBackToReview={() => setStage("review")}
                onSelectMode={setFallbackMode}
                onContinue={continueFromFallback}
                onEditAddress={() => setShowDestinationEditor(true)}
                onContactStore={() => navigate(appUrls.messages)}
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
              <div className="space-y-4 sm:space-y-5">
                <FulfillmentSection
                  mode={fulfillmentMode}
                  deliveryOption={deliveryOption}
                  availableModes={availableModes}
                  deliveryFee={deliveryFee}
                  platformCourierAvailable={isPlatformCourierCheckoutAvailable()}
                  businessName={business.name}
                  onModeChange={handleModeChange}
                  onDeliveryOptionChange={setDeliveryOption}
                />
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
                <PaymentSection
                  method={paymentMethod}
                  options={paymentOptions}
                  cashChangeFor={cashChangeFor}
                  stepNumber={fulfillmentMode === "delivery" ? 3 : 2}
                  onCashChangeForChange={setCashChangeFor}
                  onChange={setPaymentMethod}
                />
                <section
                  className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5"
                  aria-labelledby="checkout-notes-title"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2
                      id="checkout-notes-title"
                      className={CHECKOUT_SECTION_TITLE_CLASS}
                    >
                      Observações do pedido{" "}
                      <span className="font-normal text-territory-muted">
                        (opcional)
                      </span>
                    </h2>
                    <span className="text-type-caption text-territory-muted">
                      {notes.length}/280
                    </span>
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={280}
                    rows={3}
                    placeholder="Algo que a loja precisa saber?"
                    className="mt-3 min-h-20 resize-none rounded-lg border-territory-border bg-territory-surface text-sm placeholder:text-territory-muted"
                  />
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
                onFallback={() => {
                  setFallbackReason("platform");
                  setStage("fallback");
                }}
                onContactStore={() => navigate(appUrls.messages)}
              />
            </div>
          )}
          <p className="mt-6 text-center text-type-caption text-territory-muted">
            Pedido e pagamento serão registrados no fluxo oficial de
            Gastronomia.
          </p>
        </div>
      </main>
      <MobileCheckoutFooter
        stage={stage}
        mode={fulfillmentMode}
        total={total}
        fallbackLabel={fallbackLabel}
        disabled={
          stage === "review"
            ? isSubmitDisabled
            : stage === "fallback"
              ? !hasCart || fallbackModes.length === 0
              : !hasCart || isCheckingDeliveryCoverage
        }
        onAddressContinue={continueFromAddress}
        onDeliveryContinue={() => setStage("review")}
        onReviewConfirm={handleSubmit}
        onFallbackContinue={continueFromFallback}
      />
    </div>
  );
}
