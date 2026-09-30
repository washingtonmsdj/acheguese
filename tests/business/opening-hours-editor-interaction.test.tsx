// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { OpeningHoursEditor } from "@/core/business/components/settings/OpeningHoursEditor";
import { WEEK_DAYS } from "@/core/business/constants/weekDays";

afterEach(cleanup);

describe("copying weekly hours", () => {
  it("does not replace existing days until explicitly confirmed", () => {
    const onChange = vi.fn();
    render(
      createElement(OpeningHoursEditor, {
        hours: {
          segunda: { open: "09:00", close: "18:00" },
          domingo: { open: "00:00", close: "00:00", closed: true },
        },
        onChange,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Aplicar este horário/ }),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Manter horários" }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: /Aplicar este horário/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Aplicar a todos" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0];
    WEEK_DAYS.forEach((day) =>
      expect(next[day]).toEqual({ open: "09:00", close: "18:00" }),
    );
  });
});
