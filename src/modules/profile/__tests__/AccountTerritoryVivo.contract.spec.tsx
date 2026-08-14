import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ProfilePublicPage } from "@/core/profiles/pages/ProfilePublicPage";
import type { ProfileRow } from "@/core/profiles/services/types";

vi.mock("@/core/routing/hooks/useAppUrls", () => ({
  useAppUrls: () => ({ home: "/ba/salvador" }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

const publicProfile: ProfileRow & {
  public_city: string;
  public_state: string;
  public_neighborhood: string;
} = {
  id: "profile-public",
  user_id: "user-private",
  profile_type: "personal",
  name: "Pessoa do território",
  display_name: "Pessoa do território",
  username: "pessoa_publica",
  bio: "Gosto de compartilhar informações úteis do bairro.",
  avatar_url: "",
  city: "Salvador",
  neighborhood: "Pituba",
  state: "BA",
  street: "Rua privada que não pode aparecer",
  phone: "71999999999",
  telefone: "71999999999",
  verified: true,
  reputation: 450,
  is_active: true,
  is_public: true,
  public_location_visibility: "district",
  public_city: "Salvador",
  public_state: "BA",
  public_neighborhood: "Pituba",
  created_at: "2026-03-01T12:00:00.000Z",
  updated_at: "2026-03-01T12:00:00.000Z",
};

describe("Perfil e Conta no Território Vivo", () => {
  it("mantém Conta e perfil público no shell global adaptativo", () => {
    const layout = read("src/app/components/AppLayoutSidebar.tsx");

    expect(layout).toContain('pathSegments[0] === "conta"');
    expect(layout).toContain('pathSegments[0] === "u"');
    expect(layout).toContain("isAccountRoute ||");
    expect(layout).toContain("isPublicPersonalProfileRoute");
    expect(layout).not.toContain('pathname.startsWith("/conta")');
  });

  it("preserva o profileId ao resolver o alias legado de edição", () => {
    const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");

    expect(routes).toContain("function LegacyProfileEditRedirect()");
    expect(routes).toContain("/conta/editar/${encodeURIComponent(profileId)}");
    expect(routes).toMatch(
      /path="\/perfil\/editar\/:profileId"[\s\S]*LegacyProfileEditRedirect/,
    );
  });

  it("não reabre a sidebar interna nem métricas decorativas no hub privado", () => {
    const hubLayout = read("src/modules/profile/pages/ContaHubLayout.tsx");
    const hubPage = read("src/modules/profile/pages/ContaHubPage.tsx");

    expect(hubLayout).not.toContain("ProfileSectionsNav");
    expect(hubLayout).not.toContain("<aside");
    expect(hubPage).not.toContain("DashboardMetricCard");
    expect(hubPage).toContain("Nenhuma empresa vinculada a esta conta.");
    expect(hubPage).toContain('title="Notificações"');
    expect(hubPage).toContain(': "Em dia"');
  });

  it("renderiza apenas os campos públicos autorizados", () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <ProfilePublicPage profile={publicProfile} />
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Pessoa do território" }),
    ).toBeInTheDocument();
    expect(screen.getByText("@pessoa_publica")).toBeInTheDocument();
    expect(screen.getByText("Pituba, Salvador / BA")).toBeInTheDocument();
    expect(
      screen.getByText("Gosto de compartilhar informações úteis do bairro."),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Rua privada que não pode aparecer"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("71999999999")).not.toBeInTheDocument();
    expect(screen.queryByText(/reputação/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /enviar mensagem/i }),
    ).not.toBeInTheDocument();
  });
});
