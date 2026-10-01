import type { Page } from "@playwright/test";

interface RuntimeBootstrapDiagnostics {
  href: string;
  readyState: DocumentReadyState;
  rootPresent: boolean;
  rootHtmlLength: number;
  rootHtmlPreview: string;
  bodyTextPreview: string;
  passiveFallbackCount: number;
  passiveFallbackLabels: string[];
  moduleScripts: string[];
  resourceEntries: Array<{
    name: string;
    initiatorType: string;
    duration: number;
    transferSize: number;
  }>;
}

export async function readRuntimeBootstrapDiagnostics(
  page: Page,
): Promise<RuntimeBootstrapDiagnostics | { error: string }> {
  try {
    return await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>("#root");
      const passiveFallbacks = Array.from(
        document.querySelectorAll<HTMLElement>("[data-passive-page-fallback]"),
      );
      const resources = performance
        .getEntriesByType("resource")
        .filter((entry): entry is PerformanceResourceTiming =>
          entry instanceof PerformanceResourceTiming,
        )
        .filter((entry) =>
          ["script", "link", "fetch", "xmlhttprequest"].includes(
            entry.initiatorType,
          ),
        )
        .slice(-80)
        .map((entry) => ({
          name: entry.name,
          initiatorType: entry.initiatorType,
          duration: Math.round(entry.duration),
          transferSize: entry.transferSize,
        }));

      return {
        href: window.location.href,
        readyState: document.readyState,
        rootPresent: Boolean(root),
        rootHtmlLength: root?.innerHTML.length ?? 0,
        rootHtmlPreview: root?.innerHTML.slice(0, 4_000) ?? "",
        bodyTextPreview: document.body.innerText.slice(0, 2_000),
        passiveFallbackCount: passiveFallbacks.length,
        passiveFallbackLabels: passiveFallbacks.map(
          (element) => element.getAttribute("aria-label") ?? "",
        ),
        moduleScripts: Array.from(
          document.querySelectorAll<HTMLScriptElement>('script[type="module"]'),
        ).map((script) => script.src || "<inline>"),
        resourceEntries: resources,
      };
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function logRuntimeBootstrapDiagnostics(
  page: Page,
  label: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const diagnostics = await readRuntimeBootstrapDiagnostics(page);
  console.error(
    `[runtime-bootstrap-diagnostics:${label}]`,
    JSON.stringify({ diagnostics, ...extra }, null, 2),
  );
}
