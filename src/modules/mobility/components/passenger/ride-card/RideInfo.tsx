import { Clock, DollarSign } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { getPaymentMethodLabel } from "@/shared/types/constants";
import { formatBrl } from "@/shared/utils/currency";

interface RideInfoProps {
  departureTime?: string | null;
  price?: number | null;
  paymentMethod?: string | null;
  observation?: string | null;
}

function formatTime(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const RideInfo = ({
  departureTime,
  price,
  paymentMethod,
  observation,
}: RideInfoProps) => {
  const departureTimeLabel = departureTime ? formatTime(departureTime) : null;
  const paymentMethodLabel = paymentMethod
    ? getPaymentMethodLabel(paymentMethod)
    : null;

  const hasSummary =
    departureTimeLabel !== null || price != null || paymentMethodLabel !== null;

  return (
    <>
      {hasSummary ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {departureTimeLabel ? (
            <div className="flex items-center gap-1.5">
              <Clock
                className="h-3.5 w-3.5 text-category-mobility"
                aria-hidden="true"
              />
              <span>{departureTimeLabel}</span>
            </div>
          ) : null}

          {price != null ? (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              <span className="text-sm font-bold text-success">
                {formatBrl(price)}
              </span>
            </div>
          ) : null}

          {paymentMethodLabel ? (
            <Badge
              variant="outline"
              className="rounded-full border-border bg-muted/30 px-2 text-[0.6rem] text-muted-foreground"
            >
              {paymentMethodLabel}
            </Badge>
          ) : null}
        </div>
      ) : null}

      {observation?.trim() ? (
        <div className="mb-4 rounded-xl border border-border bg-muted/30 px-3 py-2">
          <p className="text-xs italic text-muted-foreground">
            “{observation.trim()}”
          </p>
        </div>
      ) : null}
    </>
  );
};
