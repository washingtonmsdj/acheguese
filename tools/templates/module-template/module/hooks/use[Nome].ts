import { useQuery } from "@tanstack/react-query";
import type { [Nome]Filters, [Nome]Service } from "@/core/[nome]";

export interface Use[Nome]Options {
  service: [Nome]Service;
  filters?: [Nome]Filters;
  enabled?: boolean;
}

/**
 * Hook de aplicação/UI para [domínio].
 *
 * O service é recebido como dependência para manter a composição explícita.
 * Este arquivo não pode importar Supabase, tabelas ou @/integrations/*.
 */
export function use[Nome]({
  service,
  filters = {},
  enabled = true,
}: Use[Nome]Options) {
  return useQuery({
    queryKey: ["[nome]", filters],
    queryFn: () => service.list(filters),
    enabled,
  });
}
