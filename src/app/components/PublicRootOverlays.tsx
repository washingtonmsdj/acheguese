import { QueryClientProvider } from "@tanstack/react-query";

import { GlobalOverlays } from "@/app/components/GlobalOverlays";
import { queryClient } from "@/shared/utils/queryClient";

/**
 * Overlays da raiz publica carregados fora do caminho critico.
 *
 * O banner de consentimento continua disponivel, mas React Query, dialog,
 * toasts, offline UI e analytics so entram depois da primeira pintura.
 */
export default function PublicRootOverlays() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalOverlays />
    </QueryClientProvider>
  );
}
