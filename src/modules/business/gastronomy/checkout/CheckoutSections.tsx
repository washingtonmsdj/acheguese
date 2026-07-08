import { CreditCard, Link2, Trash2, Wallet } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import type { DeliveryDestination } from "../utils/deliveryDestination";
import { formatBrl } from "../utils/currency";
import type { Cart, CartItem } from "../types/menu";
import {
  buildCartItemSummary,
  fulfillmentModeLabel,
  type CheckoutPaymentOption,
  type GastronomyFulfillmentMode,
} from "./checkoutRules";

type CheckoutSurface = "page" | "sheet";

const checkoutPaymentIcons = {
  pix: Wallet,
  payment_link: Link2,
  cash: Wallet,
  card_on_delivery: CreditCard,
} as const;

type CheckoutFulfillmentSelectorProps = {
  availableFulfillmentModes: GastronomyFulfillmentMode[];
  fulfillmentMode: GastronomyFulfillmentMode;
  onFulfillmentModeChange: (mode: GastronomyFulfillmentMode) => void;
  platformCourierUnavailable: boolean;
  surface: CheckoutSurface;
};

export function CheckoutFulfillmentSelector({
  availableFulfillmentModes,
  fulfillmentMode,
  onFulfillmentModeChange,
  platformCourierUnavailable,
  surface,
}: CheckoutFulfillmentSelectorProps) {
  const Heading = surface === "page" ? "h2" : "h3";
  const sectionClassName =
    surface === "page" ? "rounded-xl border bg-card p-4" : "space-y-3";
  const buttonClassName =
    surface === "page"
      ? "rounded-lg border px-3 py-2 text-left text-sm"
      : "rounded-xl border px-4 py-3 text-left text-sm transition-colors";
  const warningClassName =
    surface === "page" ? "mt-3 text-xs text-amber-700" : "text-sm text-amber-700";

  return (
    <section className={sectionClassName}>
      <Heading className="font-semibold">Atendimento</Heading>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {availableFulfillmentModes.map((mode) => {
          const isSelected = fulfillmentMode === mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onFulfillmentModeChange(mode)}
              className={`${buttonClassName} ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : surface === "sheet"
                    ? "border-border hover:border-primary/30"
                    : "border-border"
              }`}
            >
              {fulfillmentModeLabel(mode)}
            </button>
          );
        })}
      </div>
      {availableFulfillmentModes.length === 0 && (
        <p className={warningClassName}>
          Esta loja ainda nao configurou entrega, retirada ou atendimento no local
          para pedido online.
        </p>
      )}
      {platformCourierUnavailable && (
        <p className={warningClassName}>
          Entrega por rede de motoboy ainda nao esta disponivel neste lancamento.
          Ajuste a loja para frota propria ou use retirada/no local.
        </p>
      )}
    </section>
  );
}

type CheckoutDeliveryAddressFieldsProps = {
  idPrefix: string;
  deliveryDestination: DeliveryDestination | null;
  streetNumber: string;
  complement: string;
  referencePoint: string;
  recipientName: string;
  recipientPhone: string;
  onStreetNumberChange: (value: string) => void;
  onComplementChange: (value: string) => void;
  onReferencePointChange: (value: string) => void;
  onRecipientNameChange: (value: string) => void;
  onRecipientPhoneChange: (value: string) => void;
};

export function CheckoutDeliveryAddressFields({
  idPrefix,
  deliveryDestination,
  streetNumber,
  complement,
  referencePoint,
  recipientName,
  recipientPhone,
  onStreetNumberChange,
  onComplementChange,
  onReferencePointChange,
  onRecipientNameChange,
  onRecipientPhoneChange,
}: CheckoutDeliveryAddressFieldsProps) {
  const fieldId = (field: string) => `${idPrefix}-delivery-${field}`;

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">
        Dados do endereco de entrega
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={fieldId("postal-code")}>CEP</Label>
          <Input
            id={fieldId("postal-code")}
            value={deliveryDestination?.postalCode ?? ""}
            readOnly
            placeholder="CEP"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId("street")}>Rua</Label>
          <Input
            id={fieldId("street")}
            value={deliveryDestination?.street ?? ""}
            readOnly
            placeholder="Rua"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId("number")}>Numero *</Label>
          <Input
            id={fieldId("number")}
            value={streetNumber}
            onChange={(event) => onStreetNumberChange(event.target.value)}
            placeholder="Numero"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId("complement")}>Complemento</Label>
          <Input
            id={fieldId("complement")}
            value={complement}
            onChange={(event) => onComplementChange(event.target.value)}
            placeholder="Complemento"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId("neighborhood")}>Bairro</Label>
          <Input
            id={fieldId("neighborhood")}
            value={deliveryDestination?.neighborhood ?? ""}
            readOnly
            placeholder="Bairro"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId("city")}>Cidade</Label>
          <Input
            id={fieldId("city")}
            value={deliveryDestination?.city ?? ""}
            readOnly
            placeholder="Cidade"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId("state")}>UF</Label>
          <Input
            id={fieldId("state")}
            value={deliveryDestination?.state ?? ""}
            readOnly
            placeholder="UF"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId("reference")}>Ponto de referencia</Label>
          <Input
            id={fieldId("reference")}
            value={referencePoint}
            onChange={(event) => onReferencePointChange(event.target.value)}
            placeholder="Ponto de referencia"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId("recipient-name")}>Quem recebe</Label>
          <Input
            id={fieldId("recipient-name")}
            value={recipientName}
            onChange={(event) => onRecipientNameChange(event.target.value)}
            placeholder="Nome de quem recebe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fieldId("recipient-phone")}>Telefone de contato</Label>
          <Input
            id={fieldId("recipient-phone")}
            value={recipientPhone}
            onChange={(event) => onRecipientPhoneChange(event.target.value)}
            placeholder="Telefone de contato"
          />
        </div>
      </div>
    </div>
  );
}

type CheckoutCartItemsSectionProps = {
  items: CartItem[];
  onRemoveItem: (lineId: string) => void;
  surface: CheckoutSurface;
};

export function CheckoutCartItemsSection({
  items,
  onRemoveItem,
  surface,
}: CheckoutCartItemsSectionProps) {
  const Heading = surface === "page" ? "h2" : "h3";
  const sectionClassName =
    surface === "page" ? "rounded-xl border bg-card p-4" : "space-y-3";
  const itemClassName =
    surface === "page"
      ? "rounded-lg border p-3"
      : "rounded-xl border bg-card p-4 shadow-sm";

  return (
    <section className={sectionClassName}>
      <div className="flex items-center justify-between">
        <Heading className="font-semibold">
          {surface === "page" ? "Itens do pedido" : "Itens"}
        </Heading>
        {surface === "sheet" && (
          <Badge variant="outline">{items.length} linhas</Badge>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {items.map((item) => {
          const summary = buildCartItemSummary(item);
          const lineId = item.line_id ?? "";

          return (
            <div key={lineId || item.item_id} className={itemClassName}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.quantity}x</span>
                    <p className="break-words font-semibold">{item.name}</p>
                  </div>
                  {summary.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {summary.map((entry) => (
                        <p
                          key={`${lineId || item.item_id}-${entry}`}
                          className={`break-words text-muted-foreground ${
                            surface === "page" ? "text-xs" : "text-sm"
                          }`}
                        >
                          {entry}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        surface === "sheet" ? "text-primary" : ""
                      }`}
                    >
                      {formatBrl(item.subtotal)}
                    </p>
                    {surface === "sheet" && (
                      <p className="text-xs text-muted-foreground">
                        Base {formatBrl(item.base_price)}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => lineId && onRemoveItem(lineId)}
                    disabled={!lineId}
                    aria-label={`Remover ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum item no carrinho.
          </div>
        )}
      </div>
    </section>
  );
}

type CheckoutPaymentSelectorProps = {
  paymentOptions: CheckoutPaymentOption[];
  paymentMethod: string;
  cashChangeFor: string;
  onPaymentMethodChange: (value: string) => void;
  onCashChangeForChange: (value: string) => void;
  surface: CheckoutSurface;
};

export function CheckoutPaymentSelector({
  paymentOptions,
  paymentMethod,
  cashChangeFor,
  onPaymentMethodChange,
  onCashChangeForChange,
  surface,
}: CheckoutPaymentSelectorProps) {
  const Heading = surface === "page" ? "h2" : "h3";
  const sectionClassName =
    surface === "page" ? "rounded-xl border bg-card p-4" : "space-y-3";
  const buttonClassName =
    surface === "page"
      ? "flex items-center justify-between rounded-lg border px-3 py-2 text-left"
      : "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors";
  const cashInputId =
    surface === "page" ? "checkout-cash-change" : "cash-change-for";

  return (
    <section className={sectionClassName}>
      <Heading className="font-semibold">
        {surface === "page" ? "Pagamento" : "Forma de pagamento"}
      </Heading>
      {surface === "sheet" && (
        <p className="text-sm text-muted-foreground">
          Pagamento realizado diretamente com o estabelecimento, no momento da
          entrega ou retirada.
        </p>
      )}
      <div className="mt-3 grid gap-2">
        {paymentOptions.map((option) => {
          const Icon = checkoutPaymentIcons[option.value];
          const isSelected = paymentMethod === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onPaymentMethodChange(option.value)}
              className={`${buttonClassName} ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : surface === "sheet"
                    ? "border-border hover:border-primary/30"
                    : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-primary" />
                <span className={surface === "page" ? "text-sm" : "font-medium"}>
                  {option.label}
                </span>
              </div>
              {isSelected && (
                <Badge>{surface === "page" ? "OK" : "Selecionado"}</Badge>
              )}
            </button>
          );
        })}
      </div>
      {paymentMethod === "cash" && (
        <div
          className={
            surface === "page" ? "mt-3 space-y-2" : "space-y-2 rounded-xl border bg-background p-3"
          }
        >
          <Label htmlFor={cashInputId}>Troco para (opcional)</Label>
          <Input
            id={cashInputId}
            inputMode="decimal"
            placeholder={surface === "page" ? "Troco para (opcional)" : "Ex.: 100,00"}
            value={cashChangeFor}
            onChange={(event) => onCashChangeForChange(event.target.value)}
          />
        </div>
      )}
    </section>
  );
}

type CheckoutOrderNotesFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

export function CheckoutOrderNotesField({
  id,
  value,
  onChange,
  placeholder,
  className = "space-y-2",
}: CheckoutOrderNotesFieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id}>Observações do pedido</Label>
      <Textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={280}
      />
    </div>
  );
}

type CheckoutTotalsSummaryProps = {
  cart: Cart;
  minimumOrderRemaining: number;
  requiresDeliveryDestination: boolean;
  hasDeliveryDestination: boolean;
  structuredDeliveryReady: boolean;
  hasActiveProfile?: boolean;
  surface: CheckoutSurface;
};

export function CheckoutTotalsSummary({
  cart,
  minimumOrderRemaining,
  requiresDeliveryDestination,
  hasDeliveryDestination,
  structuredDeliveryReady,
  hasActiveProfile = true,
  surface,
}: CheckoutTotalsSummaryProps) {
  const className =
    surface === "page"
      ? "rounded-xl border bg-card p-4"
      : "rounded-xl border bg-muted/30 p-4";
  const warningClassName =
    surface === "page" ? "mt-3 text-xs text-amber-700" : "mt-3 text-sm text-amber-700";

  return (
    <section className={className}>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatBrl(cart.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Entrega</span>
          <span>{formatBrl(cart.delivery_fee)}</span>
        </div>
        {surface === "page" && <Separator />}
        <div
          className={`flex items-center justify-between gap-4 ${
            surface === "page" ? "font-semibold" : "text-base font-semibold"
          }`}
        >
          <span>Total</span>
          <span className={surface === "sheet" ? "text-primary" : undefined}>
            {formatBrl(cart.total)}
          </span>
        </div>
      </div>

      {minimumOrderRemaining > 0 && (
        <p className={warningClassName}>
          Faltam {formatBrl(minimumOrderRemaining)} para o minimo.
        </p>
      )}
      {requiresDeliveryDestination && !hasDeliveryDestination && (
        <p className={warningClassName}>
          Informe o endereco completo de entrega para continuar.
        </p>
      )}
      {requiresDeliveryDestination &&
        hasDeliveryDestination &&
        !structuredDeliveryReady && (
          <p className={warningClassName}>
            Preencha CEP, rua, numero, bairro, cidade e UF para confirmar.
          </p>
        )}
      {!hasActiveProfile && (
        <p className={warningClassName}>
          Selecione um perfil ativo para concluir o pedido.
        </p>
      )}
    </section>
  );
}
