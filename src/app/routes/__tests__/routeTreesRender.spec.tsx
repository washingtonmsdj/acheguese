import { Suspense, type ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "../AppRoutes";
import { AdminRoutes } from "../sections/AdminRoutes";
import { AppLayoutRoutes } from "../sections/AppLayoutRoutes";
import { CentralRoutes } from "../sections/CentralRoutes";

const originalConsoleError = console.error;

function renderRouteTree(path: string, element: ReactElement) {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <Suspense fallback={null}>{element}</Suspense>
    </MemoryRouter>,
  );
}

describe("route trees", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation((...args) => {
      if (String(args[0]).includes("useLayoutEffect does nothing on the server")) {
        return;
      }

      originalConsoleError(...args);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["root", "/", <AppRoutes />],
    ["app layout", "/", <AppLayoutRoutes />],
    ["admin", "/", <AdminRoutes />],
    ["central", "/", <CentralRoutes />],
  ])("renders %s route tree without invalid Route children", (_, path, element) => {
    expect(() => renderRouteTree(path, element)).not.toThrow();
  });
});
