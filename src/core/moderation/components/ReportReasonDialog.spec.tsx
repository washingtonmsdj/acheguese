import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReportReasonDialog } from "./ReportReasonDialog";
import { COMMUNITY_REPORT_REASON_OPTIONS } from "../reportReasons";

describe("ReportReasonDialog", () => {
  it("requires an explicit reason and submits only normalized optional details", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ReportReasonDialog
        open={true}
        onOpenChange={onOpenChange}
        contentLabel="publicacao"
        reasonOptions={COMMUNITY_REPORT_REASON_OPTIONS}
        onSubmit={onSubmit}
      />,
    );

    const submitButton = screen.getByRole("button", {
      name: "Enviar denuncia",
    });
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByLabelText("Spam ou propaganda abusiva"));
    await user.type(
      screen.getByLabelText("Detalhes adicionais (opcional)"),
      "  Publicacao repetida em varios grupos.  ",
    );
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        "spam",
        "Publicacao repetida em varios grupos.",
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("keeps the dialog open when the domain mutation rejects", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue(new Error("request failed"));

    render(
      <ReportReasonDialog
        open={true}
        onOpenChange={onOpenChange}
        contentLabel="comentario"
        reasonOptions={COMMUNITY_REPORT_REASON_OPTIONS}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByLabelText("Assedio ou ataque pessoal"));
    await user.click(screen.getByRole("button", { name: "Enviar denuncia" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith("harassment", undefined),
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeVisible();
  });
});
