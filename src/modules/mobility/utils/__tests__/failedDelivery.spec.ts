import { describe, expect, it } from "vitest";
import { buildFailedDeliveryMetadata } from "@/modules/mobility/utils/failedDelivery";

describe("buildFailedDeliveryMetadata", () => {
  it("mapeia motivo textual conhecido para enum canônico", () => {
    const metadata = buildFailedDeliveryMetadata("destinatario ausente");

    expect(metadata.failure_reason).toBe("recipient_unavailable");
    expect(metadata.item_destination).toBe("awaiting_manual_resolution");
    expect(metadata.item_current_holder).toBe("driver");
    expect(metadata.resolution_status).toBe("pending");
    expect(metadata.resolution_notes).toBeUndefined();
  });

  it("usa fallback 'other' com resolution_notes para motivo livre", () => {
    const metadata = buildFailedDeliveryMetadata("cliente pediu nova tentativa sem categoria");

    expect(metadata.failure_reason).toBe("other");
    expect(metadata.resolution_notes).toBe("cliente pediu nova tentativa sem categoria");
  });
});

