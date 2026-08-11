import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionContext } from "@/core/session";
import { ProtectedRoute } from "../ProtectedRoute";

vi.mock("@/core/session", () => ({
  useSessionContext: vi.fn(),
}));

const mockedUseSessionContext = vi.mocked(useSessionContext);

function LoginProbe() {
  const location = useLocation();
  const state = location.state as { redirectTo?: string } | null;

  return (
    <div>
      <span>login page</span>
      <span data-testid="login-location">
        {`${location.pathname}${location.search}${location.hash}`}
      </span>
      <span data-testid="login-redirect-state">{state?.redirectTo}</span>
    </div>
  );
}

function renderProtectedRoute(
  path = "/private?tab=security#section",
  options: { outlet?: boolean; loadingLabel?: string } = {},
) {
  const protectedElement = options.outlet ? (
    <ProtectedRoute loadingLabel={options.loadingLabel} />
  ) : (
    <ProtectedRoute loadingLabel={options.loadingLabel}>
      <div>private content</div>
    </ProtectedRoute>
  );

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/private" element={protectedElement}>
          {options.outlet && (
            <Route index element={<div>outlet content</div>} />
          )}
        </Route>
        <Route path="/login" element={<LoginProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("waits for the session and supports a contextual loading label", () => {
    mockedUseSessionContext.mockReturnValue({
      user: null,
      activeProfile: null,
      profiles: [],
      isLoading: true,
      error: null,
      switchProfile: vi.fn(),
      refreshSession: vi.fn(),
    });

    renderProtectedRoute(undefined, { loadingLabel: "Validando sessao..." });

    expect(screen.getByRole("status")).toHaveTextContent("Validando sessao...");
    expect(screen.queryByText("private content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users and preserves the complete return URL", () => {
    mockedUseSessionContext.mockReturnValue({
      user: null,
      activeProfile: null,
      profiles: [],
      isLoading: false,
      error: null,
      switchProfile: vi.fn(),
      refreshSession: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText("login page")).toBeInTheDocument();
    expect(screen.getByTestId("login-location")).toHaveTextContent(
      "/login?redirect=%2Fprivate%3Ftab%3Dsecurity%23section",
    );
    expect(screen.getByTestId("login-redirect-state")).toHaveTextContent(
      "/private?tab=security#section",
    );
  });

  it("renders explicit children for an authenticated user", () => {
    mockedUseSessionContext.mockReturnValue({
      user: {
        id: "user-1",
        email: "user@example.com",
        emailConfirmed: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      activeProfile: null,
      profiles: [],
      isLoading: false,
      error: null,
      switchProfile: vi.fn(),
      refreshSession: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText("private content")).toBeInTheDocument();
  });

  it("renders its nested outlet for an authenticated user", () => {
    mockedUseSessionContext.mockReturnValue({
      user: {
        id: "user-1",
        email: "user@example.com",
        emailConfirmed: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      activeProfile: null,
      profiles: [],
      isLoading: false,
      error: null,
      switchProfile: vi.fn(),
      refreshSession: vi.fn(),
    });

    renderProtectedRoute("/private", { outlet: true });

    expect(screen.getByText("outlet content")).toBeInTheDocument();
  });
});
