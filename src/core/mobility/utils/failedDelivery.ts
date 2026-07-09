import type {
  FailedDeliveryMetadata,
  FailureReason,
  ItemDestination,
  ItemHolder,
  ResolutionStatus,
} from "@/core/mobility/types/FailedDeliveryMetadata";
import { VALID_FAILURE_REASONS } from "@/core/mobility/types/FailedDeliveryMetadata";

const DEFAULT_ITEM_DESTINATION: ItemDestination = "awaiting_manual_resolution";
const DEFAULT_ITEM_HOLDER: ItemHolder = "driver";
const DEFAULT_RESOLUTION_STATUS: ResolutionStatus = "pending";

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveFailureReason(reason: string): FailureReason {
  const normalized = normalizeText(reason);

  if (VALID_FAILURE_REASONS.includes(normalized as FailureReason)) {
    return normalized as FailureReason;
  }

  if (normalized.includes("destinat")) return "recipient_unavailable";
  if (normalized.includes("recus")) return "recipient_refused";

  if (normalized.includes("endere") || normalized.includes("address")) {
    if (normalized.includes("inacess") || normalized.includes("blocked")) {
      return "address_inaccessible";
    }
    return "address_not_found";
  }

  if (normalized.includes("veiculo") || normalized.includes("moto") || normalized.includes("vehicle")) {
    return "vehicle_issue";
  }

  if (normalized.includes("indispon") || normalized.includes("unavailable")) {
    return "driver_unavailable";
  }

  if (normalized.includes("segur") || normalized.includes("assalto") || normalized.includes("risk")) {
    return "safety_issue";
  }

  if (normalized.includes("danific") || normalized.includes("quebrad") || normalized.includes("amassad")) {
    return "package_damaged";
  }

  return "other";
}

export function buildFailedDeliveryMetadata(reason: string): FailedDeliveryMetadata {
  const trimmedReason = reason.trim();
  const failureReason = resolveFailureReason(trimmedReason);

  return {
    failure_reason: failureReason,
    item_destination: DEFAULT_ITEM_DESTINATION,
    item_current_holder: DEFAULT_ITEM_HOLDER,
    timestamp: new Date().toISOString(),
    resolution_status: DEFAULT_RESOLUTION_STATUS,
    resolution_notes: failureReason === "other" && trimmedReason.length > 0 ? trimmedReason : undefined,
  };
}
