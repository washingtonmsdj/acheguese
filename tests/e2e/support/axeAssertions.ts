import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, type Page } from "@playwright/test";

type AxeViolation = {
  id: string;
  impact?: string;
  help: string;
  nodes: Array<{ target: string[]; failureSummary?: string; html?: string }>;
};

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

export async function expectNoSeriousA11yViolations(
  page: Page,
  selector = "main",
) {
  await page
    .waitForFunction(
      () =>
        document
          .getAnimations({ subtree: true })
          .every(
            (animation) =>
              animation.playState === "finished" ||
              animation.playState === "idle",
          ),
      undefined,
      { timeout: 5_000 },
    )
    .catch(() => undefined);

  await page.addScriptTag({ content: axeSource });

  const violations = await page.evaluate(
    async ({ scopeSelector }) => {
      const axe = (
        window as typeof window & {
          axe?: {
            run: (
              context: Element,
              options: Record<string, unknown>,
            ) => Promise<{ violations: AxeViolation[] }>;
          };
        }
      ).axe;
      const scope = document.querySelector(scopeSelector);

      if (!axe || !scope) {
        return [
          {
            id: "axe-not-ready",
            impact: "critical",
            help: `Axe ou escopo ${scopeSelector} indisponivel`,
            nodes: [],
          },
        ];
      }

      const result = await axe.run(scope, {
        resultTypes: ["violations"],
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      });

      return result.violations
        .filter((violation) =>
          ["serious", "critical"].includes(String(violation.impact)),
        )
        .map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          nodes: violation.nodes.slice(0, 3).map((node) => ({
            target: node.target,
            failureSummary: node.failureSummary,
            html: node.html,
          })),
        }));
    },
    { scopeSelector: selector },
  );

  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}
