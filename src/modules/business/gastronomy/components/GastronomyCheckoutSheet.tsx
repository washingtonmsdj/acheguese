import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAppUrls } from "@/core/routing/hooks";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { useSessionContext } from "@/core/session";
import {
  useDeliveryDestination,
  useGastronomyCart,
  useGastronomyCheckout,
} from "../hooks";
import {
  applyFulfillmentToCart,
  buildCheckoutDeliveryAddress,
  buildCheckoutOrderNotes,
  getEnabledFulfillmentModes,
  isCheckoutSubmitDisabled,
  isPlatformCourierUnavailableForCheckout,
  isStructuredDeliveryDestinationReady,
  normalizeFulfillmentMode,
  requiresDeliveryDestination as requiresDeliveryAddressForFulfillment,
  resolveCheckoutPaymentOptions,
  type GastronomyFulfillmentMode,
} from "../checkout/checkoutRules";
import {
  CheckoutCartItemsSection,
  CheckoutDeliveryAddressFields,
  CheckoutFulfillmentSelector,
  CheckoutOrderNotesField,
  CheckoutPaymentSelector,
  CheckoutTotalsSummary,
} from "../checkout/CheckoutSections";
import type { OrderRecord } from "@/core/mobility/delivery/order/types";
import type { GastronomyBusiness } from "../types/gastronomy";
import { GastronomyDeliveryDestinationPanel } from "./GastronomyDeliveryDestinationPanel";

interface Props {
  business: GastronomyBusiness;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: (order: OrderRecord) => void;
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
  const [streetNumber, setStreetNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [fulfillmentMode, setFulfillmentMode] =
    useState<GastronomyFulfillmentMode>(() =>
      normalizeFulfillmentMode(business, cart.fulfillment_mode),
    );
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
  const effectiveDestinationSourceLabel = effectiveDeliveryDestination
    ? destinationSourceLabel
    : null;

  const availableFulfillmentModes = useMemo(
    () => getEnabledFulfillmentModes(business),
    [business],
  );
  useEffect(() => {
    setFulfillmentMode((current) =>
      normalizeFulfillmentMode(business, current),
    );
  }, [business]);
  const checkoutCart = useMemo(
    () => applyFulfillmentToCart(cart, business, fulfillmentMode),
    [business, cart, fulfillmentMode],
  );
  const requiresDeliveryDestination =
    requiresDeliveryAddressForFulfillment(fulfillmentMode);
  const hasDeliveryDestination = Boolean(effectiveDeliveryDestination);

  useEffect(() => {
    if (!effectiveDeliveryDestination) return;
    setStreetNumber(effectiveDeliveryDestination.number ?? "");
    setComplement(effectiveDeliveryDestination.complement ?? "");
    setReferencePoint(effectiveDeliveryDestination.reference ?? "");
  }, [effectiveDeliveryDestination]);

  useEffect(() => {
    if (!activeProfile) return;
    setRecipientName(
      (current) =>
        current || activeProfile.displayName || activeProfile.name || "",
    );
    setRecipientPhone((current) => current || activeProfile.phone || "");
  }, [activeProfile]);

  const structuredDeliveryReady = useMemo(
    () =>
      isStructuredDeliveryDestinationReady(
        effectiveDeliveryDestination,
        streetNumber,
      ),
    [effectiveDeliveryDestination, streetNumber],
  );

  const deliveryAddress = useMemo(() => {
    if (!requiresDeliveryDestination) return undefined;
    return buildCheckoutDeliveryAddress(effectiveDeliveryDestination, {
      streetNumber,
      complement,
      referencePoint,
      recipientName,
      recipientPhone,
    });
  }, [
    complement,
    effectiveDeliveryDestination,
    recipientName,
    recipientPhone,
    referencePoint,
    requiresDeliveryDestination,
    streetNumber,
  ]);

  const platformCourierUnavailable = isPlatformCourierUnavailableForCheckout(
    business,
    fulfillmentMode,
  );
  const paymentOptions = useMemo(
    () => resolveCheckoutPaymentOptions(business, fulfillmentMode),
    [business, fulfillmentMode],
  );
  const isCheckoutDisabled = isCheckoutSubmitDisabled({
    hasCart,
    minimumOrderReached,
    isSubmitting,
    hasActiveProfile,
    availableFulfillmentModes,
    platformCourierUnavailable,
    requiresDeliveryDestination,
    hasDeliveryDestination,
    structuredDeliveryReady,
  });

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
      const order = await checkout({
        business,
        cart: checkoutCart,
        fulfillment_mode: fulfillmentMode,
        payment_method: paymentMethod,
        notes: buildCheckoutOrderNotes({
          paymentMethod,
          cashChangeFor,
          customerNotes,
          deliveryDestination: requiresDeliveryDestination
            ? effectiveDeliveryDestination
            : null,
          streetNumber,
          complement,
          referencePoint,
        }),
        deliveryAddress,
      });

      onOrderCreated?.(order);
      onOpenChange(false);
      setCustomerNotes("");
      setCashChangeFor("");
      toast.success(`Pedido ${order.id.slice(0, 8)} criado com sucesso.`, {
        position: "top-center",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao concluir o pedido.";
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
            pedido e acompanha a operacao combinada com a loja.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <CheckoutFulfillmentSelector
            availableFulfillmentModes={availableFulfillmentModes}
            fulfillmentMode={fulfillmentMode}
            onFulfillmentModeChange={setFulfillmentMode}
            platformCourierUnavailable={platformCourierUnavailable}
            surface="sheet"
          />

          <CheckoutCartItemsSection
            items={checkoutCart.items}
            onRemoveItem={removeItem}
            surface="sheet"
          />

          <CheckoutPaymentSelector
            paymentOptions={paymentOptions}
            paymentMethod={paymentMethod}
            cashChangeFor={cashChangeFor}
            onPaymentMethodChange={setPaymentMethod}
            onCashChangeForChange={setCashChangeFor}
            surface="sheet"
          />

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

            {requiresDeliveryDestination && (
              <CheckoutDeliveryAddressFields
                idPrefix="sheet"
                deliveryDestination={effectiveDeliveryDestination}
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
            )}

            <CheckoutOrderNotesField
              id="sheet-order-notes"
              value={customerNotes}
              onChange={setCustomerNotes}
              placeholder="Ex.: interfone 12, troco para 100, entregar na portaria."
            />
          </section>

          <CheckoutTotalsSummary
            cart={checkoutCart}
            minimumOrderRemaining={minimumOrderRemaining}
            requiresDeliveryDestination={requiresDeliveryDestination}
            hasDeliveryDestination={hasDeliveryDestination}
            structuredDeliveryReady={structuredDeliveryReady}
            hasActiveProfile={hasActiveProfile}
            surface="sheet"
          />
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
