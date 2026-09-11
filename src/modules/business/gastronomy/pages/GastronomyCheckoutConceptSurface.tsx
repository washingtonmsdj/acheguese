import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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
import foodImage from "@/assets/gastronomy/cat-restaurantes.jpg";
import juiceImage from "@/assets/gastronomy/cat-cafes.jpg";

type FulfillmentMode = "delivery" | "pickup" | "dine-in";
type DeliveryOption = "store" | "platform";
type PaymentMethod = "pix" | "link";
type CheckoutStage = "address" | "delivery" | "review" | "fallback";

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const mockItems = [
  {
    id: "moqueca-de-peixe",
    name: "Moqueca de peixe",
    detail: "Individual · Farofa extra",
    price: 41,
    quantity: 1,
    image: foodImage,
  },
  {
    id: "suco-de-maracuja",
    name: "Suco de maracujá",
    detail: "Sabor à sua escolha",
    price: 8,
    quantity: 1,
    image: juiceImage,
  },
] as const;

const deliveryFeeFor = (mode: FulfillmentMode, option: DeliveryOption) =>
  mode !== "delivery" ? 0 : option === "platform" ? 7 : 5;

function ChoiceButton({
  active,
  children,
  disabled = false,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center justify-between rounded-lg border px-3 text-left text-xs transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand sm:text-sm",
        active
          ? "border-territory-brand bg-territory-raised text-territory-ink"
          : "border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/50",
        disabled &&
          "cursor-not-allowed opacity-55 hover:border-territory-border",
      )}
    >
      <span className="min-w-0">{children}</span>
      {active ? (
        <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-territory-brand text-white">
          <Check className="h-3 w-3" aria-hidden="true" />
        </span>
      ) : null}
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
      aria-pressed={active}
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
  onBack,
  stage,
}: {
  onBack: () => void;
  stage: CheckoutStage;
}) {
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
            <span>Complexo do Nordeste de Amaralina</span>
            <span className="text-territory-muted">Salvador · BA</span>
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-territory-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
              aria-label="Conta de Ana Oliveira"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </button>
            <span>Ana Oliveira</span>
          </nav>
        </div>
      </header>
      <div className="border-b border-territory-border bg-territory-surface px-4 py-3 lg:hidden">
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

function BusinessSummary() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-territory-border bg-territory-surface p-3">
      <img
        src={foodImage}
        alt=""
        className="h-12 w-12 rounded-lg object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-territory-ink">
          Sabores da Ana
        </p>
        <p className="text-xs text-territory-muted">
          Comida caseira · Santa Cruz, Salvador - BA
        </p>
      </div>
    </div>
  );
}

function AddressCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border border-territory-border bg-territory-surface p-3 text-xs text-territory-ink">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-bold">
            <MapPin
              className="h-4 w-4 shrink-0 text-territory-brand"
              aria-hidden="true"
            />
            Casa
          </p>
          <p className="mt-1 pl-6 text-territory-muted">
            Rua Exemplo, 120 · Casa 2
            <br />
            Santa Cruz · Salvador, BA {compact ? "" : "· CEP 41900-000"}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          Alterar
        </button>
      </div>
      {!compact ? (
        <>
          <p className="mt-3 flex items-center gap-2 border-t border-territory-border pt-2">
            <UserRound
              className="h-4 w-4 shrink-0 text-territory-brand"
              aria-hidden="true"
            />
            Ana Oliveira · (71) 9XXXX-1234
          </p>
          <p className="mt-2 flex items-center gap-2 border-t border-territory-border pt-2 text-territory-muted">
            <PackageCheck
              className="h-4 w-4 shrink-0 text-territory-brand"
              aria-hidden="true"
            />
            Ponto de referência: Portão azul
          </p>
        </>
      ) : null}
    </div>
  );
}

function ItemsSummary({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
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
          src={foodImage}
          alt=""
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-territory-ink">
            Itens do pedido · {currency(49)}
          </span>
          <span className="block text-[0.6875rem] text-territory-muted">
            2 itens
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
          {mockItems.map((item) => (
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
  expandedItems,
  onModeChange,
  onContinue,
  onToggleItems,
}: {
  mode: FulfillmentMode;
  expandedItems: boolean;
  onModeChange: (mode: FulfillmentMode) => void;
  onContinue: () => void;
  onToggleItems: () => void;
}) {
  return (
    <div className="space-y-3">
      <h1 className="font-heading text-[1.45rem] font-bold tracking-[-0.04em] text-territory-ink">
        Onde vamos entregar?
      </h1>
      <div className="grid grid-cols-3 gap-2">
        <ModeButton
          active={mode === "delivery"}
          icon={Truck}
          label="Entrega"
          onClick={() => onModeChange("delivery")}
        />
        <ModeButton
          active={mode === "pickup"}
          icon={ShoppingBag}
          label="Retirada"
          onClick={() => onModeChange("pickup")}
        />
        <ModeButton
          active={mode === "dine-in"}
          icon={Store}
          label="No local"
          onClick={() => onModeChange("dine-in")}
        />
      </div>
      <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-territory-border bg-territory-surface px-3 text-xs">
        <span className="flex min-w-0 items-center gap-2 font-semibold text-territory-ink">
          <UserRound
            className="h-4 w-4 shrink-0 text-territory-brand"
            aria-hidden="true"
          />
          Ana Oliveira{" "}
          <span className="font-normal text-territory-muted">· Pessoal</span>
        </span>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-territory-muted"
          aria-hidden="true"
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-bold text-territory-ink">
          Endereço de entrega
        </p>
        <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            className="min-h-9 rounded-lg border border-territory-brand bg-territory-raised px-2 font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
          >
            Endereço do perfil
          </button>
          <button
            type="button"
            className="min-h-9 rounded-lg border border-territory-border bg-territory-surface px-2 text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
          >
            Outro endereço
          </button>
        </div>
        <AddressCard />
      </div>
      <p className="flex items-center gap-1.5 rounded-lg bg-territory-info/10 px-3 py-2 text-[0.6875rem] leading-4 text-territory-ink">
        <Info
          className="h-3.5 w-3.5 shrink-0 text-territory-brand"
          aria-hidden="true"
        />
        Confira o endereço antes de continuar.
      </p>
      <ItemsSummary expanded={expandedItems} onToggle={onToggleItems} />
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
  deliveryOption,
  onModeChange,
  onDeliveryOptionChange,
  onContinue,
}: {
  mode: FulfillmentMode;
  deliveryOption: DeliveryOption;
  onModeChange: (mode: FulfillmentMode) => void;
  onDeliveryOptionChange: (option: DeliveryOption) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-3">
      <h1 className="font-heading text-[1.45rem] font-bold tracking-[-0.04em] text-territory-ink">
        Escolha a entrega
      </h1>
      <AddressCard compact />
      <div className="space-y-2">
        <ChoiceButton
          active={deliveryOption === "store"}
          onClick={() => onDeliveryOptionChange("store")}
        >
          <span className="flex items-center gap-2 font-bold">
            <Truck
              className="h-5 w-5 text-territory-brand"
              aria-hidden="true"
            />
            Entrega da loja <span className="ml-auto">{currency(5)}</span>
          </span>
          <span className="mt-1 block pl-7 text-[0.6875rem] text-territory-muted">
            Equipe do estabelecimento
          </span>
          <span className="mt-1 block pl-7 text-[0.6875rem] text-territory-muted">
            Seu pedido será entregue pela equipe do Sabores da Ana.
          </span>
        </ChoiceButton>
        <ChoiceButton
          active={deliveryOption === "platform"}
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
            O entregador será buscado após a confirmação da loja.
          </span>
          <span className="mt-2 ml-7 inline-flex rounded-full bg-territory-sun/35 px-1.5 py-0.5 text-[0.5625rem] font-bold text-territory-ink">
            Opção prevista
          </span>
        </ChoiceButton>
        <button
          type="button"
          onClick={() => {
            onModeChange("pickup");
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
      </div>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">Produtos</span>
          <strong>{currency(49)}</strong>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-territory-muted">
            {deliveryOption === "platform"
              ? "Motoboy Achegue-se"
              : "Entrega da loja"}
          </span>
          <strong>{currency(deliveryFeeFor(mode, deliveryOption))}</strong>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-territory-border pt-3 text-base font-bold">
          <span>Total</span>
          <span>{currency(49 + deliveryFeeFor(mode, deliveryOption))}</span>
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
  paymentMethod,
  onGoToDelivery,
  onGoToAddress,
  onOpenFallback,
  onConfirm,
}: {
  mode: FulfillmentMode;
  deliveryOption: DeliveryOption;
  paymentMethod: PaymentMethod;
  onGoToDelivery: () => void;
  onGoToAddress: () => void;
  onOpenFallback: () => void;
  onConfirm: () => void;
}) {
  const total = 49 + deliveryFeeFor(mode, deliveryOption);
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
          className="flex w-full items-start gap-3 rounded-lg border border-territory-border bg-territory-surface p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
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
                  : mode === "pickup"
                    ? "Retirada na loja"
                    : "Consumo no local"}
            </strong>
            <span className="mt-0.5 block text-territory-muted">
              Ana Oliveira · Rua Exemplo, 120 · Casa 2<br />
              Santa Cruz · Salvador, BA
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-territory-brand">
            Editar
          </span>
        </button>
        <button
          type="button"
          className="flex w-full items-start gap-3 rounded-lg border border-territory-border bg-territory-surface p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
        >
          <WalletCards
            className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 text-xs">
            <strong className="block">
              {paymentMethod === "pix"
                ? "PIX combinado com a loja"
                : "Link enviado pela loja"}
            </strong>
            <span className="mt-0.5 block text-territory-muted">
              Produtos pagos diretamente à loja
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-territory-brand">
            Editar
          </span>
        </button>
      </div>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-territory-ink">
            Itens do pedido
          </h2>
          <button
            type="button"
            onClick={onGoToAddress}
            className="text-xs font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
          >
            Editar
          </button>
        </div>
        <div className="mt-2 divide-y divide-territory-border border-y border-territory-border">
          {mockItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2.5">
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
        className="flex min-h-11 w-full items-center justify-between rounded-lg border border-territory-border bg-territory-surface px-3 text-left text-xs font-semibold text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-brand"
      >
        Observações do pedido{" "}
        <span className="flex items-center gap-1 text-territory-brand">
          Adicionar <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">Produtos</span>
          <span>{currency(49)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-territory-muted">
            {deliveryOption === "platform"
              ? "Motoboy Achegue-se"
              : "Entrega da loja"}
          </span>
          <span>{currency(deliveryFeeFor(mode, deliveryOption))}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-territory-border pt-3 text-base font-bold">
          <span>Total</span>
          <span>{currency(total)}</span>
        </div>
      </div>
      {deliveryOption === "platform" ? (
        <button
          type="button"
          onClick={onOpenFallback}
          className="flex w-full items-center justify-between border-t border-territory-border pt-3 text-left text-xs font-semibold text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
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
  onBackToReview,
  onContinue,
}: {
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
      <AddressCard compact />
      <p className="text-xs font-bold text-territory-ink">
        Escolha uma opção disponível
      </p>
      <ChoiceButton active onClick={onContinue}>
        <span className="flex items-center gap-2 font-bold">
          <Truck className="h-5 w-5 text-territory-brand" aria-hidden="true" />
          Entrega da loja <span className="ml-auto">{currency(5)}</span>
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
          <span>Seu pedido · 2 itens</span>
          <span>{currency(49)}</span>
        </div>
        <p className="mt-1 text-[0.6875rem] text-territory-muted">
          Seus itens foram mantidos.
        </p>
      </div>
      <div className="rounded-lg border border-territory-border bg-territory-surface p-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-territory-muted">Produtos</span>
          <span>{currency(49)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-territory-muted">Entrega da loja</span>
          <span>{currency(5)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-territory-border pt-3 text-base font-bold">
          <span>Total</span>
          <span>{currency(54)}</span>
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

function AddressSection({ mode }: { mode: FulfillmentMode }) {
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
          className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Editar
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          className="min-h-9 rounded-lg border border-territory-brand bg-territory-raised px-2 font-semibold text-territory-ink"
        >
          Endereço do perfil
        </button>
        <button
          type="button"
          className="min-h-9 rounded-lg border border-territory-border bg-territory-surface px-2 text-territory-ink"
        >
          Outro endereço
        </button>
      </div>
      <div className="mt-3">
        <AddressCard />
      </div>
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
  onModeChange,
  onDeliveryOptionChange,
}: {
  mode: FulfillmentMode;
  deliveryOption: DeliveryOption;
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
      <div className="mt-3 grid grid-cols-3 gap-2">
        <ModeButton
          active={mode === "delivery"}
          icon={Truck}
          label="Entrega"
          onClick={() => onModeChange("delivery")}
        />
        <ModeButton
          active={mode === "pickup"}
          icon={ShoppingBag}
          label="Retirada"
          onClick={() => onModeChange("pickup")}
        />
        <ModeButton
          active={mode === "dine-in"}
          icon={Store}
          label="No local"
          onClick={() => onModeChange("dine-in")}
        />
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
                <span className="float-right">{currency(5)}</span>
              </span>
              <span className="mt-0.5 block text-[0.6875rem] text-territory-muted">
                Equipe do estabelecimento
              </span>
              <span className="mt-1 block text-[0.6875rem] text-territory-muted">
                Seu pedido será entregue pela equipe do Sabores da Ana.
              </span>
            </ChoiceButton>
            <ChoiceButton
              active={deliveryOption === "platform"}
              onClick={() => onDeliveryOptionChange("platform")}
            >
              <span className="flex items-center justify-between gap-2 font-semibold">
                Motoboy Achegue-se{" "}
                <span className="rounded-full bg-territory-sun/45 px-1.5 py-0.5 text-[0.5625rem]">
                  Opção prevista
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
  onChange,
}: {
  method: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}) {
  return (
    <section
      className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5"
      aria-labelledby="checkout-payment-title"
    >
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
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ChoiceButton active={method === "pix"} onClick={() => onChange("pix")}>
          <span className="block font-semibold">PIX combinado com a loja</span>
          <span className="mt-0.5 block text-[0.6875rem] text-territory-muted">
            A loja envia as instruções
          </span>
        </ChoiceButton>
        <ChoiceButton
          active={method === "link"}
          onClick={() => onChange("link")}
        >
          <span className="block font-semibold">Link enviado pela loja</span>
          <span className="mt-0.5 block text-[0.6875rem] text-territory-muted">
            Pagamento seguro após o aceite
          </span>
        </ChoiceButton>
      </div>
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

function ItemsSection() {
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
          className="text-xs font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          Editar
        </button>
      </div>
      <div className="mt-3 divide-y divide-territory-border border-y border-territory-border">
        {mockItems.map((item) => (
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
            <span className="shrink-0 text-sm font-bold text-territory-ink">
              {currency(item.price)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrderSummary({
  mode,
  deliveryOption,
  onConfirm,
  onFallback,
}: {
  mode: FulfillmentMode;
  deliveryOption: DeliveryOption;
  onConfirm: () => void;
  onFallback: () => void;
}) {
  const deliveryFee = deliveryFeeFor(mode, deliveryOption);
  const subtotal = mockItems.reduce((total, item) => total + item.price, 0);
  const total = subtotal + deliveryFee;
  const deliveryLabel =
    mode !== "delivery"
      ? "Sem taxa"
      : deliveryOption === "platform"
        ? "Motoboy Achegue-se"
        : "Entrega da loja";
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
          className="text-xs font-semibold text-territory-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          Adicionar mais itens
        </button>
      </div>
      <div className="mt-4 divide-y divide-territory-border border-y border-territory-border">
        {mockItems.map((item) => (
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
                  className="underline-offset-2 hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
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
          <span className="text-territory-muted">{deliveryLabel}</span>
          <span>{currency(deliveryFee)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-territory-border pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{currency(total)}</span>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 rounded-lg bg-territory-success/10 px-3 py-2 text-[0.6875rem] text-territory-ink">
        <Check
          className="h-4 w-4 shrink-0 text-territory-success"
          aria-hidden="true"
        />
        Pedido mínimo de R$ 20,00 atingido.
      </p>
      <Button
        type="button"
        onClick={onConfirm}
        className="mt-4 h-12 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/90"
      >
        Confirmar pedido · {currency(total)}
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
  onAddressContinue,
  onDeliveryContinue,
  onReviewConfirm,
  onFallbackContinue,
}: {
  stage: CheckoutStage;
  total: number;
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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-territory-border bg-territory-surface/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(18,62,61,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto max-w-[42rem]">
        <Button
          type="button"
          onClick={onClick}
          className="h-12 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
        >
          {label}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export default function GastronomyCheckoutConceptSurface() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<CheckoutStage>("address");
  const [fulfillmentMode, setFulfillmentMode] =
    useState<FulfillmentMode>("delivery");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("store");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [notes, setNotes] = useState("");
  const [expandedItems, setExpandedItems] = useState(false);
  const subtotal = useMemo(
    () => mockItems.reduce((total, item) => total + item.price, 0),
    [],
  );
  const total = subtotal + deliveryFeeFor(fulfillmentMode, deliveryOption);
  const confirmPreview = () =>
    toast.success("Prévia do checkout pronta para conectar ao pedido real.", {
      position: "top-center",
    });

  const handleModeChange = (nextMode: FulfillmentMode) => {
    setFulfillmentMode(nextMode);
    if (nextMode !== "delivery") setDeliveryOption("store");
  };
  const continueFromAddress = () =>
    setStage(fulfillmentMode === "delivery" ? "delivery" : "review");
  const continueFromDelivery = () => setStage("review");
  const returnToPrevious = () => {
    if (stage === "delivery") setStage("address");
    else if (stage === "review") setStage("delivery");
    else if (stage === "fallback") setStage("review");
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-territory-canvas text-territory-ink">
      <CheckoutHeader onBack={returnToPrevious} stage={stage} />
      <main className="mx-auto max-w-[84rem] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
        <div className="lg:hidden">
          <BusinessSummary />
          <div className="mt-4">
            {stage === "address" ? (
              <MobileAddressStage
                mode={fulfillmentMode}
                expandedItems={expandedItems}
                onModeChange={handleModeChange}
                onContinue={continueFromAddress}
                onToggleItems={() => setExpandedItems((current) => !current)}
              />
            ) : null}
            {stage === "delivery" ? (
              <MobileDeliveryStage
                mode={fulfillmentMode}
                deliveryOption={deliveryOption}
                onModeChange={handleModeChange}
                onDeliveryOptionChange={setDeliveryOption}
                onContinue={continueFromDelivery}
              />
            ) : null}
            {stage === "review" ? (
              <MobileReviewStage
                mode={fulfillmentMode}
                deliveryOption={deliveryOption}
                paymentMethod={paymentMethod}
                onGoToDelivery={() => setStage("delivery")}
                onGoToAddress={() => setStage("address")}
                onOpenFallback={() => setStage("fallback")}
                onConfirm={confirmPreview}
              />
            ) : null}
            {stage === "fallback" ? (
              <MobileFallbackStage
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
                <UserRound
                  className="h-4 w-4 text-territory-brand"
                  aria-hidden="true"
                />
              </span>
              <span>
                Pedido como <strong>Ana Oliveira</strong> · Pessoal
              </span>
              <button
                type="button"
                className="font-semibold text-territory-brand"
              >
                Alterar
              </button>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-6 rounded-xl border border-territory-border bg-territory-surface px-5 py-3">
            <Stepper stage={stage} />
            <p className="max-w-sm text-right text-xs text-territory-muted">
              Etapa{" "}
              {stage === "address" ? "1" : stage === "delivery" ? "2" : "3"} de
              3 · Seus itens ficam preservados durante o ajuste.
            </p>
          </div>
          {stage === "fallback" ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-territory-warning/20 p-4 text-sm">
              <CircleAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-territory-warning"
                aria-hidden="true"
              />
              <span>
                <strong className="block">
                  A plataforma não atende este endereço
                </strong>
                <span className="text-territory-muted">
                  Escolha a entrega da loja ou retirada para continuar com os
                  mesmos itens.
                </span>
              </span>
            </div>
          ) : null}
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="space-y-4 sm:space-y-5">
              <AddressSection mode={fulfillmentMode} />
              <FulfillmentSection
                mode={fulfillmentMode}
                deliveryOption={deliveryOption}
                onModeChange={handleModeChange}
                onDeliveryOptionChange={setDeliveryOption}
              />
              <PaymentSection
                method={paymentMethod}
                onChange={setPaymentMethod}
              />
              <ItemsSection />
              <section
                className="rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5"
                aria-labelledby="checkout-notes-title"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2
                    id="checkout-notes-title"
                    className="font-heading text-base font-bold text-territory-ink"
                  >
                    Observações do pedido{" "}
                    <span className="font-normal text-territory-muted">
                      (opcional)
                    </span>
                  </h2>
                  <span className="text-[0.6875rem] text-territory-muted">
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
              onConfirm={confirmPreview}
              onFallback={() => setStage("fallback")}
            />
          </div>
          <p className="mt-6 text-center text-xs text-territory-muted">
            Conceito visual · Dados demonstrativos · Modalidade Achegue-se
            prevista, com cobrança e disponibilidade ainda pendentes de
            definição.
          </p>
        </div>
      </main>
      <MobileCheckoutFooter
        stage={stage}
        total={total}
        onAddressContinue={continueFromAddress}
        onDeliveryContinue={continueFromDelivery}
        onReviewConfirm={confirmPreview}
        onFallbackContinue={() => {
          setDeliveryOption("store");
          setStage("review");
        }}
      />
    </div>
  );
}
