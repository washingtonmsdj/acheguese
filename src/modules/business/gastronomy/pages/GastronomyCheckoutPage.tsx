import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useAppUrls } from "@/core/routing/hooks";
import { useSessionContext } from "@/core/session";
import { GastronomyUrlService } from "@/core/verticals/gastronomy/services/GastronomyUrlService";
import { Button } from "@/shared/components/ui/button";
import { GastronomyDeliveryDestinationPanel } from "../components/GastronomyDeliveryDestinationPanel";
import {
  useDeliveryDestination,
  useGastronomyCart,
  useGastronomyCheckout,
  useGastronomyDetail,
} from "../hooks";
import {
  applyFulfillmentToCart,
  buildCheckoutDeliveryAddress,
  buildCheckoutOrderNotes,
  formatDeliveryDestinationDisplayLabel,
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
import GastronomyCheckoutConceptSurface from "./GastronomyCheckoutConceptSurface";

export default function GastronomyCheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const params = useParams<{
    state?: string;
    city?: string;
    district?: string;
    slug?: string;
  }>();
  const stateBusiness = (state as { business?: GastronomyBusiness } | null)
    ?.business;
  const detailQuery = useGastronomyDetail(stateBusiness ? undefined : params);

  const business = stateBusiness ?? detailQuery.data ?? null;

  if (!business && detailQuery.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground">Carregando checkout...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground">
          Checkout inválido. Volte para a loja e reabra o pedido.
        </p>
        <Button
          className="mt-4"
          onClick={() => navigate(GastronomyUrlService.getHomeUrl())}
        >
          Voltar
        </Button>
      </div>
    );
  }

  if (params.slug === "sabores-da-ana") {
    return <GastronomyCheckoutConceptSurface business={business} />;
  }

  return <GastronomyCheckoutContent business={business} />;
}

type GastronomyCheckoutContentProps = {
  business: GastronomyBusiness;
};

function GastronomyCheckoutContent({
  business,
}: GastronomyCheckoutContentProps) {
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
  const [fulfillmentMode, setFulfillmentMode] =
    useState<GastronomyFulfillmentMode>(() =>
      normalizeFulfillmentMode(business, cart.fulfillment_mode),
    );
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
  const [deliveryAddressMode, setDeliveryAddressMode] = useState<
    "saved" | "other"
  >("saved");
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

  const deliveryDestinationDisplayLabel = useMemo(
    () => formatDeliveryDestinationDisplayLabel(effectiveDeliveryDestination),
    [effectiveDeliveryDestination],
  );

  const structuredDeliveryReady = useMemo(
    () =>
      isStructuredDeliveryDestinationReady(
        effectiveDeliveryDestination,
        streetNumber,
      ),
    [effectiveDeliveryDestination, streetNumber],
  );
  const deliveryAddress = useMemo(
    () =>
      requiresDeliveryDestination
        ? buildCheckoutDeliveryAddress(effectiveDeliveryDestination, {
            streetNumber,
            complement,
            referencePoint,
            recipientName,
            recipientPhone,
          })
        : undefined,
    [
      complement,
      effectiveDeliveryDestination,
      recipientName,
      recipientPhone,
      referencePoint,
      requiresDeliveryDestination,
      streetNumber,
    ],
  );

  const platformCourierUnavailable = isPlatformCourierUnavailableForCheckout(
    business,
    fulfillmentMode,
  );

  const paymentOptions = useMemo(
    () => resolveCheckoutPaymentOptions(business, fulfillmentMode),
    [business, fulfillmentMode],
  );

  useEffect(() => {
    if (!paymentOptions.some((option) => option.value === paymentMethod)) {
      setPaymentMethod(paymentOptions[0]?.value ?? "pix");
    }
  }, [paymentMethod, paymentOptions]);

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

  const handleSubmit = async () => {
    try {
      const order: OrderRecord = await checkout({
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
      toast.success(`Pedido ${order.id.slice(0, 8)} criado com sucesso.`, {
        position: "top-center",
      });
      navigate(businessManagementRoutes.gastronomyPedidoPublico(order.id));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao concluir o pedido.",
      );
    }
  };

  return (
    <>
      <Helmet>
        <title>Checkout | {business.name}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Link
            to={appUrls.auth.login}
            className="text-xs text-muted-foreground"
          >
            Trocar conta
          </Link>
        </div>
        <h1 className="text-2xl font-bold">Confirmar pedido</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atendimento e pagamento direto com a loja.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <CheckoutFulfillmentSelector
              availableFulfillmentModes={availableFulfillmentModes}
              fulfillmentMode={fulfillmentMode}
              onFulfillmentModeChange={setFulfillmentMode}
              platformCourierUnavailable={platformCourierUnavailable}
              surface="page"
            />

            {requiresDeliveryDestination && (
              <div className="space-y-3">
                <div className="rounded-xl border bg-card p-4">
                  <h3 className="mb-3 text-sm font-semibold">
                    Endereço de entrega
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      aria-pressed={deliveryAddressMode === "saved"}
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
                      aria-pressed={deliveryAddressMode === "other"}
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
                      Nenhum endereço salvo no perfil. Informe outro endereço
                      para esta entrega.
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
                <CheckoutDeliveryAddressFields
                  idPrefix="checkout"
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
              </div>
            )}

            <CheckoutCartItemsSection
              items={checkoutCart.items}
              onRemoveItem={removeItem}
              surface="page"
            />
          </div>

          <aside className="space-y-4">
            <CheckoutPaymentSelector
              paymentOptions={paymentOptions}
              paymentMethod={paymentMethod}
              cashChangeFor={cashChangeFor}
              onPaymentMethodChange={setPaymentMethod}
              onCashChangeForChange={setCashChangeFor}
              surface="page"
            />
            <CheckoutOrderNotesField
              id="checkout-order-notes"
              value={customerNotes}
              onChange={setCustomerNotes}
              placeholder="Observações do pedido"
              className="rounded-xl border bg-card p-4"
            />

            <section className="space-y-4">
              <CheckoutTotalsSummary
                cart={checkoutCart}
                minimumOrderRemaining={minimumOrderRemaining}
                requiresDeliveryDestination={requiresDeliveryDestination}
                hasDeliveryDestination={hasDeliveryDestination}
                structuredDeliveryReady={structuredDeliveryReady}
                surface="page"
              />
              <Button
                className="w-full"
                size="lg"
                disabled={isCheckoutDisabled}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Criando pedido..." : "Confirmar pedido"}
              </Button>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
