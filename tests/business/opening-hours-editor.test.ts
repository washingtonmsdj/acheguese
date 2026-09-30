import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OpeningHoursEditor } from "@/core/business/components/settings/OpeningHoursEditor";

describe("shared opening hours editor", () => {
  it("does not present missing schedules as open", () => {
    const markup = renderToStaticMarkup(
      createElement(OpeningHoursEditor, { hours: {}, onChange: () => {} }),
    );
    expect(markup.match(/value="unknown" selected/g)).toHaveLength(7);
    expect(markup).not.toContain('type="time"');
  });

  it("distinguishes a closed day from a scheduled day", () => {
    const markup = renderToStaticMarkup(
      createElement(OpeningHoursEditor, {
        hours: {
          segunda: { open: "09:00", close: "18:00", closed: false },
          domingo: { open: "00:00", close: "00:00", closed: true },
        },
        onChange: () => {},
      }),
    );
    expect(markup.match(/value="unknown" selected/g)).toHaveLength(5);
    expect(markup.match(/value="closed" selected/g)).toHaveLength(1);
    expect(markup.match(/value="hours" selected/g)).toHaveLength(1);
    expect(markup.match(/type="time"/g)).toHaveLength(2);
    expect(markup).toContain('value="09:00"');
    expect(markup).toContain('value="18:00"');
  });

  it("blocks copying an equal-time interval and marks its inputs invalid", () => {
    const markup = renderToStaticMarkup(
      createElement(OpeningHoursEditor, {
        hours: { segunda: { open: "09:00", close: "09:00", closed: false } },
        onChange: () => {},
      }),
    );
    expect(markup.match(/aria-invalid="true"/g)).toHaveLength(2);
    expect(markup).toContain("Abertura e fechamento precisam ser diferentes.");
    expect(markup).toMatch(/<button[^>]*disabled/);
  });
});
