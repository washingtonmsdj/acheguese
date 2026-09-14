import { ConsentAwareVercelAnalytics } from "@/app/components/privacy/ConsentAwareVercelAnalytics";
import { ConsentBannerContent } from "@/app/components/privacy/ConsentBannerContent";

/**
 * Overlays mínimos da raiz pública.
 *
 * Este chunk só monta após load + idle e permanece independente do router.
 * A raiz navega por documentos/anchors, então o pathname atual do browser é o
 * contrato suficiente para posicionar/suprimir o banner de consentimento.
 */
export default function PublicRootOverlays() {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <>
      <ConsentBannerContent pathname={pathname} />
      <ConsentAwareVercelAnalytics />
    </>
  );
}
