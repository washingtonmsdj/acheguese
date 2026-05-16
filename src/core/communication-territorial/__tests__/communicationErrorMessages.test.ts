import { describe, expect, it } from "vitest";
import { getCommunicationErrorMessage } from "../utils/communicationErrorMessages";

describe("communication error messages", () => {
  it("maps location authorization errors to clear UX text", () => {
    const message = getCommunicationErrorMessage(
      new Error("location_not_authorized_for_channel"),
      "fallback",
    );
    expect(message).toBe("Este canal nao possui permissao para publicar no territorio selecionado.");
  });

  it("returns fallback when error payload is unknown", () => {
    const message = getCommunicationErrorMessage({ anything: true }, "Erro generico");
    expect(message).toBe("Erro generico");
  });
});
