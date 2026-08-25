import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PrivacySettingsService } from "@/core/privacy/services/PrivacySettingsService";
import { useSessionContext } from "@/core/session";
import { ProtectedRoute } from "../ProtectedRoute";

vi.mock("@/core/session", () => ({
  useSessionContext: vi.fn(),
}));

vi.mock("@/core/privacy/services/PrivacySettingsService", () => ({
  PrivacySettingsService: {
    getDeletionStatus: vi.fn(),
  },
}));

const mockedUseSessionContext = vi.mocked(useSessionContext);
const mockedGetDeletionStatus = vi.mocked(
  PrivacySettingsService.getDeletionStatus,
);

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

function mockAuthenticatedSession() {
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

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/private" element={protectedElement}>
            {options.outlet && (
              <Route index element={<div>outlet content</div>} />
            )}
          </Route>
          <Route
            path="/conta/privacidade"
            element={
              <ProtectedRoute>
                <div>privacy content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetDeletionStatus.mockResolvedValue(null);
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
    expect(mockedGetDeletionStatus).not.toHaveBeenCalled();
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
    expect(mockedGetDeletionStatus).not.toHaveBeenCalled();
  });

  it("renders explicit children after a clean deletion status check", async () => {
    mockAuthenticatedSession();

    renderProtectedRoute();

    expect(await screen.findByText("private content")).toBeInTheDocument();
    expect(mockedGetDeletionStatus).toHaveBeenCalledTimes(1);
  });

  it("renders its nested outlet after a clean deletion status check", async () => {
    mockAuthenticatedSession();

    renderProtectedRoute("/private", { outlet: true });

    expect(await screen.findByText("outlet content")).toBeInTheDocument();
  });

  it("redirects a scheduled deletion account to the privacy surface", async () => {
    mockAuthenticatedSession();
    mockedGetDeletionStatus.mockResolvedValue({
      status: "scheduled",
      scheduled_purge_at: "2026-09-20T00:00:00.000Z",
      days_remaining: 30,
    });

    renderProtectedRoute("/private");

    expect(await screen.findByText("privacy content")).toBeInTheDocument();
    expect(screen.queryByText("private content")).not.toBeInTheDocument();
  });

  it("keeps failed deletion accounts restricted until an explicit retry", async () => {
    mockAuthenticatedSession();
    mockedGetDeletionStatus.mockResolvedValue({
      status: "failed",
      scheduled_purge_at: "2026-09-20T00:00:00.000Z",
      days_remaining: 30,
    });

    renderProtectedRoute("/private");

    expect(await screen.findByText("privacy content")).toBeInTheDocument();
    expect(screen.queryByText("private content")).not.toBeInTheDocument();
  });

  it("does not render private content while deletion status is unresolved", () => {
    mockAuthenticatedSession();
    mockedGetDeletionStatus.mockReturnValue(new Promise(() => {}));

    renderProtectedRoute("/private");

    expect(screen.getByRole("status")).toHaveTextContent("Verificando acesso...");
    expect(screen.queryByText("private content")).not.toBeInTheDocument();
  });

  it("fails closed to privacy when deletion authority is unavailable", async () => {
    mockAuthenticatedSession();
    mockedGetDeletionStatus.mockRejectedValue(
      new Error("deletion authority unavailable"),
    );

    renderProtectedRoute("/private");

    expect(await screen.findByText("privacy content")).toBeInTheDocument();
    expect(screen.queryByText("private content")).not.toBeInTheDocument();
  });

  it("keeps the privacy recovery surface available without querying the gate", () => {
    mockAuthenticatedSession();
    mockedGetDeletionStatus.mockRejectedValue(
      new Error("deletion authority unavailable"),
    );

    renderProtectedRoute("/conta/privacidade");

    expect(screen.getByText("privacy content")).toBeInTheDocument();
    expect(mockedGetDeletionStatus).not.toHaveBeenCalled();
  });

  it("allows a cancelled deletion account back into protected routes", async () => {
    mockAuthenticatedSession();
    mockedGetDeletionStatus.mockResolvedValue({
      status: "cancelled",
      scheduled_purge_at: "2026-09-20T00:00:00.000Z",
      days_remaining: 30,
    });

    renderProtectedRoute("/private");

    expect(await screen.findByText("private content")).toBeInTheDocument();
  });
});
